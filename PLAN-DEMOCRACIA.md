# PLAN — Democracia Legislativa

Plan de implementación del piloto de **voto ciudadano sobre legislación**:
la ciudadanía marca 👍/👎 sobre las iniciativas de Diputados y Senado que la
plataforma ya integra, con registro por cédula y medidas de seguridad de nivel
institucional. Producto de la fase QRSPI (Questions → Recon → Spike → Plan →
Implementación); las tres primeras fases ya corrieron y sus hallazgos están
abajo.

> **Marco, sin ambigüedad.** Esto es un **piloto ciudadano independiente y no
> oficial**. No es un canal formal de participación del Estado, sus resultados
> no obligan a nadie, y la UI lo dice en cada superficie. La credibilidad ante
> OGTIC/gobierno se construye demostrando estándares de seguridad y minimización
> de datos — nunca aparentando ser el Estado.

---

## 0. Decisiones tomadas (fase Q)

| Pregunta | Decisión |
|---|---|
| Persistencia | **Supabase**, proyecto existente `Transac` (`amuyclnyjyhigeyhuufs`) |
| Identidad v1 | **Cédula válida (Luhn) + OTP a email**; un voto por cédula |
| Ubicación | **Vertical `/democracia`** dentro de Socrático.do |

Esto **rompe deliberadamente** las dos reglas fundacionales de la plataforma
(«sin base de datos, sin variables de entorno»). La excepción queda acotada,
documentada aquí y enmendada en `CLAUDE.md`: solo este vertical toca la BD, y el
resto de la plataforma sigue siendo lectura en vivo sin estado.

---

## 1. Hallazgos de Recon / Spike

- **Supabase `Transac`**: Postgres 17, us-east-1, `ACTIVE_HEALTHY`. ⚠️ Comparte
  el pool de **Auth con otra app** (27 usuarios) y ya tiene `public.profiles`.
  **Implicación de diseño:** todo lo nuestro va a un **schema `democracia`**
  aislado, y **votar exige un registro `democracia.votantes`** creado solo por
  el flujo de cédula — un usuario ajeno autenticado no puede votar sin
  registrarse. Recomendación para producción: proyecto dedicado (el dossier lo
  dirá).
- **Cédula dominicana**: 11 dígitos, verificador **Luhn** (pesos 1,2 alternos,
  restar 9 si el producto supera 9, mód-10). Verificado: auto-consistente al
  100% y detecta el 100% de los errores de un dígito. Algoritmo público — sirve
  para rechazar tipeos y cédulas inventadas, **no** para probar identidad real
  (eso exige el padrón JCE; ver §6).
- **Deuda — Crédito Público** (Auditoría Fase 1): el XLSX
  `08Saldo Evolución Deuda del Sector Público No Financiero.xlsx` tiene la hoja
  `Saldo-Evolución {Mes-AA}`; la fila **«Deuda Pública Total del …»** trae en
  la columna C el saldo (millones US$) y el desglose Externa/Interna en las dos
  filas siguientes. URL:
  `/Content/estadisticas/anual/{año}/{NN}{Mes}/08Saldo…xlsx`. Sin clave.
- **Normativa — Consultoría Jurídica** (Auditoría Fase 2): `GET /consulta/` da
  el token antiforgery; `POST /Consulta/Home/Search` con `DocumentTypeCode`
  (3=Decretos, 1=Leyes, 1014=Gaceta) + campos de
  `/Consulta/Home/LoadForms?formType=` devuelve una **tabla HTML** (Tipo·
  Número· Título· Gaceta· Fecha) en ~2 s **si la consulta va acotada**; sin
  filtro cuelga (renderiza todo el histórico 1926–2026 sin paginar).

---

## 2. Arquitectura

```
Next.js (Vercel)                         Supabase (proyecto Transac)
┌───────────────────────────┐            ┌────────────────────────────────┐
│ /democracia  (server)     │            │ schema  democracia             │
│ /democracia/registro (cli)│  anon key  │  · votantes  (cedula_hash)     │
│ widget de voto (cliente)  │──────────▶ │  · votos     (RLS por dueño)   │
│ lib/supabase.ts (browser) │  auth OTP  │  · iniciativas (denormalizado) │
│ lib/democracia.ts (server)│            │  vista agregados_publicos      │
└───────────────────────────┘            │  RPC registrar_votante() SECDEF│
        │  solo claves publicables               · secretos.pepper (locked)│
        ▼                                └────────────────────────────────┘
  El app NUNCA guarda la cédula ni el pepper: la cédula es argumento
  transitorio de un RPC; el pepper vive en una tabla que solo el
  SECURITY DEFINER puede leer. El navegador solo lleva URL + anon key.
```

### Variables de entorno (la excepción, mínima)
- `NEXT_PUBLIC_SUPABASE_URL` — público.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clave **publicable**) — público por diseño;
  RLS protege los datos.
- **No hay secreto de aplicación.** El material sensible (pepper del hash de
  cédula) vive dentro de Postgres, no en el entorno del app. Es el punto fuerte
  del dossier.

---

## 3. Modelo de datos (schema `democracia`)

```sql
-- votante: una fila por cédula registrada. NO guarda la cédula, solo su hash.
votantes(
  id          uuid primary key references auth.users,   -- identidad = sesión
  cedula_hash text unique not null,                      -- HMAC-SHA256(cédula, pepper)
  creado      timestamptz default now()
)

-- iniciativa: espejo denormalizado para que el ranking no reconsulte el SIL.
iniciativas(
  camara      text check (camara in ('diputados','senado')),
  ref         text not null,             -- id Diputados | "{cuatrienio}:{id}" Senado
  numero      text, titulo text, grupo text,
  primary key (camara, ref)
)

-- voto: uno por votante × iniciativa, cambiable (upsert).
votos(
  votante_id  uuid references votantes on delete cascade,
  camara text, ref text,
  valor       smallint check (valor in (-1, 1)),  -- 👎 / 👍
  creado timestamptz default now(), actualizado timestamptz default now(),
  primary key (votante_id, camara, ref),
  foreign key (camara, ref) references iniciativas
)
```

**Vista pública de agregados** (`agregados_publicos`): `(camara, ref, a_favor,
en_contra, total)` — solo conteos, jamás quién votó. Es lo único que `anon`
puede leer de la cadena de votos.

---

## 4. Seguridad — medidas de nivel institucional

Inspiradas en el dossier de `proveedores` y en NORTIC A2 (seguridad web) / E1
(datos abiertos), y en la Ley 172-13 de protección de datos:

1. **Minimización de datos.** Se guarda el *hash* de la cédula, nunca la cédula;
   ningún nombre; el email solo lo administra Supabase Auth para el OTP.
2. **Cédula con pepper server-side.** `cedula_hash = HMAC-SHA256(cédula,
   pepper)`. El pepper vive en `democracia.secretos`, sin `GRANT` a
   `anon`/`authenticated`; solo lo lee la función `registrar_votante`
   (`SECURITY DEFINER`). Un volcado de la tabla `votantes` no revela cédulas ni
   permite fuerza bruta sin el pepper.
3. **RLS en cada tabla.** `votantes` y `votos`: el usuario ve y modifica **solo
   lo suyo** (`auth.uid()`). `iniciativas`: lectura pública, escritura solo por
   el flujo de voto. Nada expone el voto individual de otro.
4. **Privacidad del voto.** El agregado es público; el voto nominal es privado y
   protegido a nivel de base de datos, no de aplicación.
5. **Un voto por cédula.** Garantizado por `cedula_hash unique` + PK de `votos`
   por votante.
6. **Validación server-side.** El Luhn y la unicidad se comprueban en el RPC;
   el cliente valida solo para dar feedback, nunca como control.
7. **Rate limiting.** OTP y registro limitados (Auth de Supabase + guardas del
   app) para frenar enumeración de cédulas.
8. **Derecho al olvido (172-13).** RPC `eliminar_votante()` borra el votante y
   sus votos en cascada.
9. **Trazabilidad.** `creado`/`actualizado` en cada fila; sin PII en logs.
10. **Superficie mínima del app.** El front solo porta claves publicables;
    ninguna operación sensible ocurre fuera de Postgres.
11. **Marco no oficial** visible en cada vista; enlace a `/fuentes` y al aviso
    legal.

El **dossier de seguridad** (`/democracia/seguridad`, página pública) explica
todo esto en lenguaje llano — es el artefacto que construye credibilidad para
trabajo futuro con el gobierno.

---

## 5. UI

- **`/democracia`** — landing del piloto + **ranking**: iniciativas por apoyo
  ciudadano (más votadas, más a favor, más divididas). Explica qué es y enlaza
  al registro y al dossier.
- **`/democracia/registro`** — cédula + email → OTP → alta de votante.
- **`/democracia/seguridad`** — el dossier (medidas §4 en llano).
- **Widget de voto** 👍/👎 embebido en las fichas de iniciativa
  (`/congreso/[id]` y `/congreso/senado/[cuatrienio]/[id]`): muestra el agregado
  en vivo y, si hay sesión, el voto propio; si no, invita a registrarse.
- Nueva sección en `lib/secciones.ts` (matiz propio) → nav, barra, tab bar, pie.

---

## 6. Fuera del v1 (va al pitch, no al código)

- **Verificación contra el padrón JCE.** Prueba identidad real (que la cédula
  sea tuya y estés vivo/habilitado). Hoy imposible sin acuerdo: la JCE no tiene
  API pública y la DGII responde 403. Es exactamente la clase de integración que
  este piloto **justifica solicitar**: un dossier de seguridad ya construido +
  un piloto funcionando es el argumento para pedir acceso al padrón.
- Firma digital / cédula electrónica, verificación biométrica, apelación de
  votos, delegación temática.

---

## 7. Fases de implementación

1. **Esquema + RLS + RPC** (migraciones Supabase): tablas, vista de agregados,
   `registrar_votante`, `emitir_voto`, `eliminar_votante`, pepper. Probar RLS.
2. **Capa de datos** `lib/supabase.ts` (cliente navegador) + `lib/democracia.ts`
   (helpers server: agregados, ranking) + `lib/cedula.ts` (Luhn compartido).
3. **Auth + registro**: `/democracia/registro` con OTP email y el RPC de alta.
4. **Voto**: widget en las fichas, con estado optimista y agregados en vivo.
5. **Ranking + landing + dossier**: `/democracia`, `/democracia/seguridad`;
   sección en la IA.
6. **Config**: `@supabase/supabase-js`, env en Vercel, `CLAUDE.md` enmendado.

---

## 8. En paralelo — lo que salió de la auditoría del Estado

Pedido junto a Democracia; se integran con el patrón de siempre (lib + vista):

- **Fase 1 — Deuda pública** (`lib/deuda.ts` + tarjeta en el panorama y
  `/fuentes`): saldo del SPNF desde el XLSX de Crédito Público (§1).
- **Fase 2 — Normativa del Ejecutivo** (`lib/normativa.ts` + vertical
  `/normativa`): decretos, leyes y Gaceta vía el token+POST de la Consultoría
  (§1), con consultas acotadas.

Estas dos **no tocan la BD** ni la excepción de secretos: siguen siendo lectura
en vivo con caché.
