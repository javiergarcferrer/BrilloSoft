# Socrático.do

Plataforma de inteligencia sobre el Estado dominicano: **qué compra, qué legisla
y a quién paga**. El nombre es el método: preguntarle al Estado con sus propios
datos, y dejar que las respuestas se lean enteras. Reúne fuentes oficiales en un
solo lugar, leídas en vivo y cacheadas — sin base de datos intermedia, sin
credenciales, salvo la vertical de voto ciudadano, que las necesita y las
declara.

| Dominio | Ruta | Fuente |
|---|---|---|
| Compras públicas | `/licitaciones` | [API de datos abiertos de la DGCP](https://datosabiertos.dgcp.gob.do/api-dgcp/docs/index.html) |
| Congreso Nacional | `/congreso` | SIL de la Cámara de Diputados |
| Nómina estatal | `/nomina` | Nómina de empleados fijos 2023–2026 |
| Democracia | `/democracia` | Piloto de voto ciudadano (Supabase, schema aislado) con identidad verificable por Cuenta Única (OGTIC), prevista: construida y a la espera del cliente OAuth2 |

`/` es el **panorama**: indicadores de los tres dominios y las señales que
exigen atención ahora — procesos que cierran esta semana e iniciativas por
perimir. `/fuentes` documenta con qué cobertura cuenta cada fuente y cuáles
están bloqueadas; el reconocimiento técnico completo está en `RECON.md`.

Herramienta independiente y no oficial.

## Congreso

- Búsqueda por texto sobre las iniciativas, con la consulta en la URL.
- Ficha por iniciativa: trámites, proponentes con partido y provincia, y la
  cadena documental marcando qué versiones traen articulado.
- Separa el título reformulado durante el trámite, que el SIL guarda dentro de
  la misma descripción.
- **Alerta de perención**: cada legislatura ordinaria dura 150 días (abren el 27
  de febrero y el 16 de agosto) y las piezas pendientes al cierre se perimen; la
  vista avisa con 30 días de anticipación.

## Compras públicas


**Encontrar**

- Buscador en vivo con búsqueda por palabra clave insensible a acentos y
  mayúsculas (título, descripción, institución, código).
- Filtros: estado, modalidad, institución (autocompletado sobre las ~705
  unidades de compra activas), rango de fechas y dirigidos a MIPYMES; presets de
  un toque (Abiertas ahora, Cierran pronto, Mayor monto, Para MIPYMES).
- Los filtros viven en la URL: cualquier búsqueda se puede compartir o guardar.
- Panel `/estadisticas`: panorama del mercado de los últimos 30 días.

**Decidir**

- Detalle por proceso: cronograma, monto, artículos con precios estimados y
  total, documentos con el pliego/fichas destacados como "Empieza por aquí".
- **Precios históricos de adjudicación** por subclase UNSPSC (mín/mediana/máx
  realmente contratados + ejemplos enlazados) para cotizar con datos.
- **Adjudicación — quién ganó**: proveedor, RPE, monto y enlace al contrato.

**Proceder**

- Checklist "Cómo participar" según el estado del proceso (pliego → RPE →
  preparar oferta → presentar a tiempo), con enlaces a la DGCP y al Portal
  Transaccional.
- `/guia`: guía completa para nuevos proveedores (RPE, modalidades, documentos
  habituales, glosario de estados, consejos).

**Seguir**

- Seguimiento ★ (localStorage) con la vista `/seguimiento` ordenada por cierre.
- Exportar resultados a CSV.
- **RSS por búsqueda** (`/api/feed?q=…`): suscríbete a una palabra clave desde
  cualquier lector RSS/Zapier/Slack y entérate de los procesos nuevos.
- Compartir cualquier proceso por WhatsApp o copiar enlace.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4.
- Sin base de datos ni variables de entorno: las rutas API hacen proxy a la DGCP
  con caché (5 min listados, 1 h precios, 24 h instituciones), timeout de 25 s y
  un reintento.
- La búsqueda por texto escanea hasta 6,000 registros del rango de fechas y
  filtra en el servidor.

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue

Pensada para Vercel: push a `main` y se despliega sola. Producción: https://brillo-soft.vercel.app
