"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, db } from "@/lib/supabase";
import { cedulaValida, formatearCedula, limpiarCedula } from "@/lib/cedula";
import { IconArrowLeft, IconCheck, IconShield } from "@/components/icons";
import { cn } from "@/lib/cn";

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

export default function Registro() {
  const [paso, setPaso] = useState<Paso>("datos");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Si ya hay sesión con votante, saltar directo al estado final.
  useEffect(() => {
    (async () => {
      const { data } = await supabase().auth.getSession();
      if (!data.session) return;
      const { data: votante } = await db().from("votantes").select("id").maybeSingle();
      // Con sesión pero sin votante, el registro quedó a medias: falta la cédula.
      setPaso(votante ? "sesion" : "cedula-pendiente");
      if (data.session.user.email) setEmail(data.session.user.email);
    })();
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
      Sin `emailRedirectTo`: el dominio de producción no está en la lista de
      redirecciones permitidas del proyecto, así que pedirlo no aporta nada
      —el enlace acaba en el Site URL igual— y algunos despliegues de GoTrue
      rechazan la petición entera por una redirección no permitida. La vía del
      enlace ya funciona pegándolo en el campo de verificación.
    */
    const { error: err } = await supabase().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
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

  /**
   * El correo puede traer dos cosas y las dos sirven.
   *
   * Supabase decide qué manda según su plantilla: si lleva `{{ .Token }}`
   * envía seis dígitos; si lleva `{{ .ConfirmationURL }}`, un enlace. Pero ese
   * enlace **contiene el mismo token** en su parámetro `token`, así que pegarlo
   * verifica igual de bien que teclear el código —y sin depender de que la
   * redirección del enlace esté permitida, que es un ajuste aparte del
   * proyecto—. Aquí se acepta cualquiera de las dos formas.
   */
  function leerEntrada(bruto: string): { token: string } | { hash: string } | null {
    const limpio = bruto.trim();
    const digitos = limpio.replace(/\D/g, "");
    if (/^\d{6}$/.test(limpio) || (digitos.length === 6 && !/[a-z]/i.test(limpio))) {
      return { token: digitos };
    }
    // Un enlace de verificación: el token viaja como `token` o `token_hash`.
    const m = /[?&](?:token_hash|token)=([^&\s]+)/.exec(limpio);
    if (m) return { hash: decodeURIComponent(m[1]) };
    return null;
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    const entrada = leerEntrada(codigo);
    if (!entrada) return;
    setError(null);
    setCargando(true);

    const errOtp =
      "token" in entrada
        ? (await supabase().auth.verifyOtp({ email, token: entrada.token, type: "email" })).error
        : ((await supabase().auth.verifyOtp({ token_hash: entrada.hash, type: "email" })).error &&
           (await supabase().auth.verifyOtp({ token_hash: entrada.hash, type: "magiclink" })).error);

    if (errOtp) {
      setCargando(false);
      setError(
        "token" in entrada
          ? "Código inválido o vencido. Pide uno nuevo."
          : "Ese enlace ya se usó o venció. Pide un correo nuevo.",
      );
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
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-500 text-white">
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
          <Link
            href="/congreso"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brand-600"
          >
            Ir a las iniciativas
          </Link>
        </div>
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
            className="h-11 w-full rounded-lg bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-600 active:scale-95 disabled:opacity-50"
          >
            {cargando ? "Enviando…" : "Enviar código"}
          </button>
        </form>
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
              value={cedula}
              onChange={(e) => setCedula(formatearCedula(e.target.value))}
              placeholder="000-0000000-0"
              className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-canvas px-3 font-mono text-sm tabular-nums text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          {error && <p className="text-xs font-medium text-alerta-700">{error}</p>}
          <button
            type="submit"
            disabled={!cedulaOk || cargando}
            className="h-11 w-full rounded-lg bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:scale-95 disabled:opacity-50"
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
                Si trae un <strong className="font-medium text-ink">enlace</strong>, mantén
                pulsado, copia la dirección y pégala aquí. Sirve igual.
              </span>
            </li>
          </ul>
          <textarea
            rows={codigo.length > 40 ? 3 : 1}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="000000 — o pega aquí el enlace del correo"
            autoComplete="one-time-code"
            className="w-full resize-none rounded-lg border border-hairline bg-canvas px-3 py-3 font-mono text-sm tabular-nums text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          {error && <p className="text-xs font-medium text-alerta-700">{error}</p>}
          <button
            type="submit"
            disabled={!leerEntrada(codigo) || paso === "registrando"}
            className="h-11 w-full rounded-lg bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-600 active:scale-95 disabled:opacity-50"
          >
            {paso === "registrando" ? "Registrando…" : "Verificar y registrar"}
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
