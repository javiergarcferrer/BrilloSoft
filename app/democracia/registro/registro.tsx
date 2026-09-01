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

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!cedulaOk || !emailOk) return;
    setError(null);
    setCargando(true);
    const { error: err } = await supabase().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Si la plantilla del correo manda un enlace en vez del código, que
        // al menos aterrice aquí y no en la portada.
        emailRedirectTo: `${window.location.origin}/democracia/registro`,
      },
    });
    setCargando(false);
    if (err) {
      setError("No se pudo enviar el código. Revisa el correo e intenta de nuevo.");
      return;
    }
    setPaso("codigo");
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    const token = codigo.replace(/\D/g, "");
    if (token.length < 6) return;
    setError(null);
    setCargando(true);

    const { error: errOtp } = await supabase().auth.verifyOtp({ email, token, type: "email" });
    if (errOtp) {
      setCargando(false);
      setError("Código inválido o vencido. Revisa tu correo.");
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
          <p className="text-sm text-ink-soft">
            Escribe el código de 6 dígitos que enviamos a{" "}
            <span className="font-medium text-ink">{email}</span>. Si el correo
            trae un enlace en vez del código, púlsalo: vuelves aquí verificado.
          </p>
          <input
            inputMode="numeric"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            autoComplete="one-time-code"
            className="h-14 w-full rounded-lg border border-hairline bg-canvas text-center font-mono text-2xl tracking-[0.4em] tabular-nums text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          {error && <p className="text-xs font-medium text-alerta-700">{error}</p>}
          <button
            type="submit"
            disabled={codigo.length < 6 || paso === "registrando"}
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
