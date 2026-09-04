"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, db } from "@/lib/supabase";
import { cedulaValida, formatearCedula, limpiarCedula } from "@/lib/cedula";
import { IconArrowLeft, IconCheck, IconShield } from "@/components/icons";
import { cn } from "@/lib/cn";
import { cuentaUnicaHabilitada, iniciarFlujo } from "@/app/democracia/cuenta-unica/cliente";

/**
 * `cedula-pendiente` cubre el caso del **enlace**: quien pulsa el enlace del
 * correo en vez de teclear el código vuelve con sesión abierta, pero en otra
 * pestaña, sin la cédula que escribió. En vez de dejarlo en un callejón, se le
 * pide solo la cédula y se completa el registro. La cédula nunca se guarda en
 * el navegador para «recordarla»: se vuelve a pedir.
 */
type Paso =
  | "datos"
  | "codigo"
  | "cedula-pendiente"
  | "registrando"
  | "listo"
  | "sesion";

/**
 * Lo que el visitante puede pegar en el campo de verificación. Son cinco cosas
 * distintas y **ninguna es opcional**, porque el proyecto de Supabase todavía
 * tiene el Site URL en `http://localhost:3000` (decisión abierta del dueño):
 *
 * - `codigo`  — los seis dígitos, si la plantilla lleva `{{ .Token }}`.
 * - `enlace`  — la dirección del correo *sin pulsar*: lleva `token`/`token_hash`.
 * - `sesion`  — la barra de direcciones **después** de pulsar el enlace. GoTrue
 *   ya gastó el token y devolvió la sesión hecha en el fragmento
 *   (`#access_token=…&refresh_token=…`). El token del correo ya no sirve, pero
 *   esto sí: es la sesión misma. Éste es el caso real de quien pulsa desde el
 *   móvil y acaba en una página que no carga.
 * - `canje`   — `?code=…` del flujo PKCE, por si el proyecto se cambia a él.
 * - `fallo`   — `#error_code=otp_expired&…`: el enlace ya se usó o venció.
 *   Decirlo con precisión evita mandar a nadie a mirar una bandeja vacía.
 *
 * Verificado contra el proyecto el 2026-09-04:
 * `GET /auth/v1/verify?token=…&redirect_to=https://brillo-soft.vercel.app/…`
 * responde `303` a `http://localhost:3000#error=access_denied&
 * error_code=otp_expired&…` — o sea: GoTrue **no rechaza** una redirección
 * fuera de la lista, la sustituye por el Site URL, y el resultado siempre
 * viaja en el **fragmento**.
 */
type Entrada =
  | { via: "codigo"; token: string }
  | { via: "enlace"; hash: string; clase: string | null }
  | { via: "sesion"; access: string; refresh: string }
  | { via: "canje"; code: string }
  | { via: "fallo"; codigo: string; descripcion: string };

/** Tipos de token que acepta `verifyOtp` con `token_hash`. */
const CLASES_ENLACE = [
  "email",
  "magiclink",
  "signup",
  "recovery",
  "invite",
  "email_change",
] as const;

/**
 * Todos los parámetros de un pegado, vengan en la query o en el fragmento y
 * traiga o no el correo entero alrededor. Gana la primera aparición: la query
 * real manda sobre lo que venga detrás de un `redirect_to` sin codificar.
 */
function parametrosDe(bruto: string): URLSearchParams {
  const texto = bruto.trim().replace(/&amp;/gi, "&");
  const url = /https?:\/\/\S+/.exec(texto)?.[0] ?? texto;
  const params = new URLSearchParams();
  for (const trozo of url.split(/[?#]/).slice(1)) {
    for (const [clave, valor] of new URLSearchParams(trozo)) {
      if (!params.has(clave)) params.set(clave, valor);
    }
  }
  return params;
}

function leerEntrada(bruto: string): Entrada | null {
  const limpio = bruto.trim();
  if (!limpio) return null;

  const digitos = limpio.replace(/\D/g, "");
  if (digitos.length === 6 && !/[a-z]/i.test(limpio)) {
    return { via: "codigo", token: digitos };
  }

  const p = parametrosDe(limpio);

  const codigoError = p.get("error_code") ?? p.get("error");
  if (codigoError) {
    return { via: "fallo", codigo: codigoError, descripcion: p.get("error_description") ?? "" };
  }

  const access = p.get("access_token");
  const refresh = p.get("refresh_token");
  if (access && refresh) return { via: "sesion", access, refresh };

  const code = p.get("code");
  if (code) return { via: "canje", code };

  const hash = p.get("token_hash") ?? p.get("token");
  if (hash) return { via: "enlace", hash, clase: p.get("type") };

  // Un token pegado a secas, sin la dirección alrededor.
  if (/^[A-Za-z0-9_-]{20,}$/.test(limpio)) return { via: "enlace", hash: limpio, clase: null };

  return null;
}

function mensajeDeFallo(codigo: string, descripcion: string): string {
  if (codigo === "otp_expired") {
    return "Ese enlace ya se usó o venció: valen una sola vez y por unos minutos. Pide un correo nuevo y, en vez de pulsarlo, copia su dirección y pégala aquí.";
  }
  if (codigo === "access_denied") {
    return "El servidor rechazó ese enlace. Pide un correo nuevo y pega su dirección aquí sin pulsarlo.";
  }
  return `El enlace no sirvió${descripcion ? `: ${descripcion}` : ""}. Pide un correo nuevo.`;
}

export default function Registro() {
  const [paso, setPaso] = useState<Paso>("datos");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  /** De dónde viene la identidad del votante: cédula tecleada o Cuenta Única. */
  const [origen, setOrigen] = useState<"declarada" | "cuenta_unica" | null>(null);

  /**
   * Abre sesión con lo que sea que haya llegado. Devuelve el mensaje del fallo,
   * o `null` si quedó sesión. Es el mismo camino para lo pegado a mano y para
   * lo que traiga la URL al cargar la página.
   */
  async function abrirSesion(entrada: Entrada): Promise<string | null> {
    const auth = supabase().auth;

    if (entrada.via === "fallo") return mensajeDeFallo(entrada.codigo, entrada.descripcion);

    if (entrada.via === "codigo") {
      const { error: err } = await auth.verifyOtp({ email, token: entrada.token, type: "email" });
      return err ? "El código no es válido o ya venció. Pide uno nuevo." : null;
    }

    if (entrada.via === "sesion") {
      const { error: err } = await auth.setSession({
        access_token: entrada.access,
        refresh_token: entrada.refresh,
      });
      return err
        ? "Esa dirección ya no sirve: la sesión que traía venció o se usó en otro navegador. Pide un correo nuevo."
        : null;
    }

    if (entrada.via === "canje") {
      const { error: err } = await auth.exchangeCodeForSession(entrada.code);
      return err
        ? "Ese enlace hay que abrirlo en el mismo navegador donde pediste el código. Pide uno nuevo desde aquí."
        : null;
    }

    // Enlace: el `type` de la dirección manda, pero si falta o miente se prueban
    // los demás. Un tipo equivocado no gasta el token, solo no encaja.
    const declarada = CLASES_ENLACE.find((c) => c === entrada.clase);
    const orden = declarada
      ? [declarada, ...CLASES_ENLACE.filter((c) => c !== declarada)]
      : [...CLASES_ENLACE];
    for (const type of orden) {
      const { error: err } = await auth.verifyOtp({ token_hash: entrada.hash, type });
      if (!err) return null;
    }
    return "Ese enlace ya se usó o venció. Pide un correo nuevo y pega su dirección sin pulsarla.";
  }

  // Si ya hay sesión con votante, saltar directo al estado final. Y si la URL
  // trae la respuesta del enlace, consumirla antes de nada.
  useEffect(() => {
    // Leído antes de tocar el cliente: supabase-js limpia el fragmento en
    // cuanto se inicializa, así que después ya no estaría.
    const llegada = leerEntrada(window.location.href);
    (async () => {
      // `getSession()` espera a la inicialización, que es la que consume el
      // fragmento cuando trae una sesión válida.
      let sesion = (await supabase().auth.getSession()).data.session;
      if (llegada) {
        if (!sesion) {
          const fallo = await abrirSesion(llegada);
          if (fallo) setError(fallo);
          sesion = (await supabase().auth.getSession()).data.session;
        }
        // Que un recargado no reintente un token ya gastado.
        window.history.replaceState(null, "", window.location.pathname);
      }
      if (!sesion) return;
      // `*` y no `id, origen`: hasta que se aplique la migración 20260902 la
      // columna no existe, y pedirla por nombre haría fallar la consulta y
      // mandaría a quien ya está registrado a teclear la cédula otra vez.
      const { data: votante } = await db().from("votantes").select("*").maybeSingle();
      // Con sesión pero sin votante, el registro quedó a medias: falta la cédula.
      setPaso(votante ? "sesion" : "cedula-pendiente");
      const v = votante as { origen?: "declarada" | "cuenta_unica" } | null;
      setOrigen(v?.origen ?? null);
      if (sesion.user.email) setEmail(sesion.user.email);
    })();
    // Solo al montar: es el rescate de la vuelta del correo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cedulaOk = cedulaValida(cedula);
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  /**
   * Traduce el fallo real de Supabase. Cada uno pide una acción distinta y
   * decirle «revisa el correo» a los tres es mandar al usuario a mirar una
   * bandeja vacía y a reintentar lo que ya falló.
   */
  function mensajeDeEnvio(err: { message?: string; code?: string; status?: number }): string {
    const codigo = err.code ?? "";
    const texto = (err.message ?? "").toLowerCase();

    if (codigo === "over_email_send_rate_limit" || texto.includes("rate limit") || err.status === 429) {
      return "Se agotó el límite de correos por ahora. Espera unos minutos antes de pedir otro código; no hace falta que cambies nada.";
    }
    if (codigo === "email_address_invalid" || texto.includes("invalid")) {
      return "Ese correo no lo acepta el servicio de verificación. Prueba con otra dirección.";
    }
    if (texto.includes("redirect")) {
      return "El servidor rechazó la dirección de retorno. Es un ajuste del proyecto, no de tu correo.";
    }
    if (texto.includes("signup") && texto.includes("disabled")) {
      return "El registro está desactivado en el proyecto ahora mismo.";
    }
    return `No se pudo enviar el código${err.message ? `: ${err.message}` : ""}.`;
  }

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!cedulaOk || !emailOk) return;
    setError(null);
    setCargando(true);
    /*
      Se pide la vuelta a esta misma página aunque hoy no esté en la lista de
      redirecciones del proyecto. Comprobado el 2026-09-04 contra este GoTrue:
      `POST /auth/v1/otp?redirect_to=https://brillo-soft.vercel.app/…` pasa la
      validación (falla después, por política de altas), y `/auth/v1/verify` con
      esa misma redirección responde 303 al Site URL. Es decir: pedirla no
      rompe nada hoy —el enlace sigue aterrizando en el Site URL— y el día que
      el dominio entre en la lista, el enlace vuelve aquí y el registro se
      completa solo, sin pegar nada.
    */
    const { error: err } = await supabase().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/democracia/registro`,
      },
    });
    setCargando(false);
    if (err) {
      // Decir qué pasó de verdad. «Revisa el correo» ante un límite de envío
      // manda al usuario a mirar una bandeja donde no hay nada, y a reintentar
      // justo lo que agotó la cuota.
      setError(mensajeDeEnvio(err));
      return;
    }
    setPaso("codigo");
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    const entrada = leerEntrada(codigo);
    if (!entrada) {
      // El callejón sin salida era un botón apagado sin explicación.
      setError(
        "Eso no parece ni un código de seis dígitos ni una dirección de verificación. Pega la dirección completa, la que empieza por «http».",
      );
      return;
    }
    setError(null);
    setCargando(true);
    const fallo = await abrirSesion(entrada);
    setCargando(false);
    if (fallo) {
      setError(fallo);
      return;
    }
    await completarRegistro("codigo");
  }

  /**
   * Cierra el registro con la sesión ya abierta. `volverA` es el paso al que
   * regresar si la cédula no pasa: el que la pidió.
   */
  async function completarRegistro(volverA: Paso) {
    setPaso("registrando");
    setCargando(true);
    const { data, error: errReg } = await db().rpc("registrar_votante", {
      p_cedula: limpiarCedula(cedula),
    });
    setCargando(false);
    const r = data as { ok?: boolean; error?: string } | null;
    if (errReg || r?.ok === false) {
      const mapa: Record<string, string> = {
        cedula_invalida: "La cédula no es válida.",
        cedula_en_uso: "Esa cédula ya tiene un registro. Cada cédula vota una sola vez.",
        sesion_requerida: "Sesión no encontrada. Reinicia el registro.",
      };
      setError(mapa[r?.error ?? ""] ?? "No se pudo completar el registro.");
      setPaso(volverA);
      return;
    }
    setPaso("listo");
  }

  /**
   * Identidad v2: Cuenta Única verifica quién eres; Supabase sigue siendo la
   * sesión. Por eso solo se ofrece con sesión abierta. La vuelta la atiende
   * `/democracia/cuenta-unica/callback`.
   */
  async function irACuentaUnica() {
    setError(null);
    setCargando(true);
    try {
      const { data } = await supabase().auth.getSession();
      window.location.assign(await iniciarFlujo(data.session?.user.id ?? ""));
    } catch {
      setCargando(false);
      setError("No se pudo iniciar la verificación con Cuenta Única. Vuelve a intentarlo.");
    }
  }

  async function registrarConSesion(e: React.FormEvent) {
    e.preventDefault();
    if (!cedulaOk) return;
    setError(null);
    await completarRegistro("cedula-pendiente");
  }

  if (paso === "sesion" || paso === "listo") {
    return (
      <div className="mx-auto max-w-lg">
        <VolverCongreso />
        <div className="mt-4 rounded-lg border border-brand-200/60 bg-brand-50/70 p-6 text-center ">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-500 text-canvas">
            <IconCheck className="h-6 w-6" />
          </span>
          <h1 className="font-display mt-3 text-lg text-ink">
            {paso === "listo" ? "Registro completo" : "Ya estás registrado"}
          </h1>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
            Tu cédula quedó vinculada a tu sesión de forma privada. Ya puedes votar
            sobre cualquier iniciativa; tu voto es secreto y solo se publican los
            totales.
          </p>
          {/* Solo cuando la vía existe: un déficit sin remedio no se enseña. */}
          {cuentaUnicaHabilitada() && (
            <p className="rotulo mt-3 text-ink-soft">
              {origen === "cuenta_unica"
                ? "Identidad verificada · Cuenta Única"
                : "Registro por cédula y correo · sin verificar"}
            </p>
          )}
          <Link
            href="/congreso"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-brand-700"
          >
            Ir a las iniciativas
          </Link>
        </div>
        {cuentaUnicaHabilitada() && origen !== "cuenta_unica" && (
          <CuentaUnica onClick={irACuentaUnica} cargando={cargando} error={error} />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <VolverCongreso />
      <header className="mb-5 mt-4">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          Regístrate para votar
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Un registro por cédula para que cada voto cuente una vez. Tu cédula se
          guarda cifrada, nunca en claro, y tu voto es privado.{" "}
          <Link href="/democracia/seguridad" className="font-medium text-brand-700 hover:underline">
            Cómo protegemos tus datos
          </Link>
          .
        </p>
      </header>

      {paso === "datos" && (
        <form onSubmit={enviarCodigo} className="space-y-4 rounded-lg border border-hairline bg-surface p-5 ">
          <Campo
            etiqueta="Cédula"
            hint={cedula && !cedulaOk ? "Cédula inválida" : "11 dígitos"}
            hintError={!!cedula && !cedulaOk}
          >
            <input
              inputMode="numeric"
              value={formatearCedula(cedula)}
              onChange={(e) => setCedula(limpiarCedula(e.target.value).slice(0, 11))}
              placeholder="001-0000000-0"
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-hairline bg-canvas px-3 font-mono text-sm tabular-nums text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </Campo>
          <Campo etiqueta="Correo electrónico" hint="Te enviaremos un código de un solo uso">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.do"
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </Campo>
          {error && <p className="text-xs font-medium text-alerta-700">{error}</p>}
          <button
            type="submit"
            disabled={!cedulaOk || !emailOk || cargando}
            className="h-11 w-full rounded-lg bg-brand-600 text-sm font-semibold text-canvas transition-colors hover:bg-brand-700 active:scale-95 disabled:opacity-50"
          >
            {cargando ? "Enviando…" : "Enviar código"}
          </button>
        </form>
      )}

      {paso === "cedula-pendiente" && cuentaUnicaHabilitada() && (
        <CuentaUnica onClick={irACuentaUnica} cargando={cargando} error={null} className="mb-4" />
      )}

      {paso === "cedula-pendiente" && (
        <form
          onSubmit={registrarConSesion}
          className="space-y-4 rounded-lg border border-hairline bg-surface p-5"
        >
          <p className="text-sm text-ink-soft">
            Tu correo ya está verificado
            {email && (
              <>
                {" "}
                (<span className="font-medium text-ink">{email}</span>)
              </>
            )}
            . Falta la cédula para completar el registro.
          </p>
          <div>
            <label htmlFor="cedula-pendiente" className="rotulo text-ink-soft">
              Cédula
            </label>
            <input
              id="cedula-pendiente"
              inputMode="numeric"
              value={formatearCedula(cedula)}
              onChange={(e) => setCedula(limpiarCedula(e.target.value).slice(0, 11))}
              placeholder="000-0000000-0"
              className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-canvas px-3 font-mono text-sm tabular-nums text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          {error && <p className="text-xs font-medium text-alerta-700">{error}</p>}
          <button
            type="submit"
            disabled={!cedulaOk || cargando}
            className="h-11 w-full rounded-lg bg-brand-600 text-sm font-semibold text-canvas transition-colors hover:bg-brand-700 active:scale-95 disabled:opacity-50"
          >
            Completar el registro
          </button>
        </form>
      )}

      {(paso === "codigo" || paso === "registrando") && (
        <form onSubmit={verificar} className="space-y-4 rounded-lg border border-hairline bg-surface p-5 ">
          <p className="text-sm leading-relaxed text-ink-soft">
            Revisa el correo que enviamos a{" "}
            <span className="font-medium text-ink">{email}</span>.
          </p>
          <ul className="space-y-1.5 text-xs leading-relaxed text-ink-soft">
            <li className="flex gap-2">
              <span aria-hidden className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-sello-600" />
              <span>
                Si trae un <strong className="font-medium text-ink">código de 6 dígitos</strong>,
                escríbelo aquí.
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-sello-600" />
              <span>
                Si trae un <strong className="font-medium text-ink">enlace</strong>, no lo
                pulses: mantén pulsado (o clic derecho), «Copiar dirección», y pégala aquí.
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-sello-600" />
              <span>
                <strong className="font-medium text-ink">¿Ya lo pulsaste</strong> y quedaste
                en una página que no carga (<span className="font-mono">localhost:3000</span>)?
                Copia la dirección de la barra del navegador y pégala aquí: esa
                dirección ya trae tu sesión y sirve igual.
              </span>
            </li>
          </ul>
          <textarea
            rows={codigo.length > 40 ? 3 : 1}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="000000 — o pega aquí la dirección del correo"
            autoComplete="one-time-code"
            className="w-full resize-none rounded-lg border border-hairline bg-canvas px-3 py-3 font-mono text-sm tabular-nums text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          {error && <p className="text-xs font-medium text-alerta-700">{error}</p>}
          <button
            type="submit"
            disabled={!codigo.trim() || cargando || paso === "registrando"}
            className="h-11 w-full rounded-lg bg-brand-600 text-sm font-semibold text-canvas transition-colors hover:bg-brand-700 active:scale-95 disabled:opacity-50"
          >
            {paso === "registrando"
              ? "Registrando…"
              : cargando
                ? "Verificando…"
                : "Verificar y registrar"}
          </button>
          <button
            type="button"
            onClick={() => { setPaso("datos"); setCodigo(""); setError(null); }}
            className="w-full text-center text-xs font-medium text-ink-soft hover:text-ink"
          >
            Cambiar cédula o correo
          </button>
        </form>
      )}

      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-hairline bg-canvas/60 p-3.5">
        <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-alerta-600" />
        <p className="text-xs leading-relaxed text-ink-soft">
          No guardamos tu cédula en claro: se convierte en un código irreversible
          con una clave que vive solo en la base de datos. Tampoco guardamos tu
          nombre. Puedes borrar tu registro y tus votos cuando quieras.
        </p>
      </div>
    </div>
  );
}

/**
 * La vía verificada. Solo aparece cuando el cliente OAuth existe
 * (`cuentaUnicaHabilitada`): un botón que no puede llevar a ningún sitio no
 * se muestra apagado, se omite.
 */
function CuentaUnica({
  onClick,
  cargando,
  error,
  className,
}: {
  onClick: () => void;
  cargando: boolean;
  error: string | null;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-hairline bg-surface p-5", className)}>
      <p className="rotulo text-ink-soft">Cuenta Única · OGTIC</p>
      <h2 className="font-sans mt-1.5 text-sm font-semibold text-ink">
        ¿Tienes Cuenta Única?
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Es la identidad digital ciudadana del Estado: ya comprobó tu cédula contra
        el padrón y que eres tú. Al verificar, este sitio no guarda tu cédula ni
        tu nombre: si Cuenta Única incluye la cédula, se convierte en el mismo
        código irreversible que en el registro por correo; si no, guardamos el
        código de tu identificador. Tu voto cuenta como identidad verificada. Te
        lleva a cuentaunica.gob.do y vuelves aquí.
      </p>
      {error && <p className="mt-2 text-xs font-medium text-alerta-700">{error}</p>}
      <button
        type="button"
        onClick={onClick}
        disabled={cargando}
        className="mt-3 h-11 w-full rounded-lg border border-brand-500 bg-surface text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 active:scale-95 disabled:opacity-50"
      >
        {cargando ? "Abriendo Cuenta Única…" : "Verificar con Cuenta Única"}
      </button>
    </div>
  );
}

function VolverCongreso() {
  return (
    <Link
      href="/democracia"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
    >
      <IconArrowLeft className="h-3.5 w-3.5" />
      Democracia Legislativa
    </Link>
  );
}

function Campo({
  etiqueta,
  hint,
  hintError,
  children,
}: {
  etiqueta: string;
  hint?: string;
  hintError?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-ink">{etiqueta}</span>
        {hint && (
          <span className={cn("text-xs", hintError ? "text-alerta-700" : "text-ink-soft")}>{hint}</span>
        )}
      </div>
      {children}
    </label>
  );
}
