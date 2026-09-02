"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, db } from "@/lib/supabase";
import type { Agregado, Camara } from "@/lib/democracia";
import { cn } from "@/lib/cn";

/**
 * Widget de voto ciudadano (a favor / en contra) sobre una iniciativa, embebido en su ficha.
 *
 * Muestra el agregado en vivo (público) y, si hay sesión con votante
 * registrado, el voto propio, que puede cambiarse o quitarse. Sin registro,
 * invita a `/democracia/registro`. Toda la seguridad (un voto por cédula,
 * privacidad del voto) vive en la base; aquí solo se llama a los RPC.
 */

type Estado = "cargando" | "anon" | "sin-registro" | "listo";

export default function VotoWidget({
  camara,
  refIni: refId,
  numero,
  titulo,
  grupo,
  inicial,
}: {
  camara: Camara;
  refIni: string;
  numero?: string | null;
  titulo?: string | null;
  grupo?: string | null;
  inicial: Agregado;
}) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [agg, setAgg] = useState<Agregado>(inicial);
  const [miVoto, setMiVoto] = useState<-1 | 1 | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data: sesion } = await supabase().auth.getSession();
      if (!vivo) return;
      if (!sesion.session) {
        setEstado("anon");
        return;
      }
      // ¿Tiene registro de votante? (RLS: solo ve su propia fila.)
      const { data: votante } = await db().from("votantes").select("id").maybeSingle();
      if (!vivo) return;
      if (!votante) {
        setEstado("sin-registro");
        return;
      }
      const { data: voto } = await db()
        .from("votos")
        .select("valor")
        .eq("camara", camara)
        .eq("ref", refId)
        .maybeSingle();
      if (!vivo) return;
      setMiVoto((voto?.valor as -1 | 1 | undefined) ?? null);
      setEstado("listo");
    })();
    return () => {
      vivo = false;
    };
  }, [camara, refId]);

  async function refrescarAgregado() {
    const { data } = await db()
      .from("agregados_publicos")
      .select("*")
      .eq("camara", camara)
      .eq("ref", refId)
      .maybeSingle();
    if (data) setAgg(data as Agregado);
  }

  /** Solo quien tiene sesión y registro puede votar; el resto ni lo intenta. */
  const puedeVotar = estado === "listo";

  async function votar(valor: -1 | 1) {
    // Sin registro no se dispara nada: contar el voto de forma optimista y
    // luego culpar a la red de un fallo de permisos es mentirle al usuario.
    if (enviando || !puedeVotar) return;
    setError(null);
    setEnviando(true);
    const previo = miVoto;
    const quitar = previo === valor;

    // Optimista sobre el agregado.
    setAgg((a) => {
      const next = { ...a };
      if (previo === 1) next.a_favor -= 1;
      if (previo === -1) next.en_contra -= 1;
      if (previo != null) next.total -= 1;
      if (!quitar) {
        if (valor === 1) next.a_favor += 1;
        else next.en_contra += 1;
        next.total += 1;
      }
      return next;
    });
    setMiVoto(quitar ? null : valor);

    const rpc = quitar
      ? db().rpc("quitar_voto", { p_camara: camara, p_ref: refId })
      : db().rpc("emitir_voto", {
          p_camara: camara,
          p_ref: refId,
          p_valor: valor,
          p_numero: numero ?? null,
          p_titulo: titulo ?? null,
          p_grupo: grupo ?? null,
        });
    const { data, error: err } = await rpc;
    const ok = !err && (data as { ok?: boolean } | null)?.ok !== false;
    if (!ok) {
      setError("No se pudo registrar el voto. Vuelve a intentarlo en un momento.");
      setMiVoto(previo);
    }
    await refrescarAgregado();
    setEnviando(false);
  }

  const total = agg.total;
  const pctFavor = total > 0 ? Math.round((agg.a_favor / total) * 100) : 0;

  return (
    <section className="rounded-lg border border-brand-100 bg-brand-50/50 p-5 ">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-sans flex items-center gap-2 text-sm font-semibold text-ink">
            <span aria-hidden className="h-2 w-2 rounded-full bg-sello-600" />
            ¿Apoyas esta iniciativa?
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Voto ciudadano · piloto independiente, no oficial
          </p>
        </div>
        <span className="font-mono text-right text-xs tabular-nums text-ink-soft">
          {miVoto === null
            ? `${total.toLocaleString("es-DO")} ${total === 1 ? "persona ya opinó" : "personas ya opinaron"}`
            : `${total.toLocaleString("es-DO")} ${total === 1 ? "voto" : "votos"}`}
        </span>
      </div>

      {/*
        El agregado solo aparece después de votar. Enseñar «68% a favor» antes
        de preguntar ancla la respuesta —es el efecto mejor documentado en
        votación pública—, y esta plataforma dice que la conclusión la saca el
        lector. El ranking de /democracia sigue siendo el sitio del agregado.
      */}
      {total > 0 && miVoto !== null && (
        <div className="mt-4">
          <div className="flex h-2.5 overflow-hidden rounded-full ring-1 ring-inset ring-hairline">
            <div className="bg-brand-500" style={{ width: `${pctFavor}%` }} />
            <div className="flex-1 bg-ink-soft/30" />
          </div>
          <div className="font-mono mt-1.5 flex justify-between text-xs tabular-nums text-ink-soft">
            <span className="font-medium text-brand-600">{pctFavor}% a favor</span>
            <span className="font-medium text-sello-600">{100 - pctFavor}% en contra</span>
          </div>
          {/* Cuántos de esos votos vienen de una identidad verificada por Cuenta Única. */}
          {(agg.verificados ?? 0) > 0 && (
            <p className="font-mono mt-1 text-xs tabular-nums text-ink-soft">
              {agg.verificados.toLocaleString("es-DO")} con identidad verificada (Cuenta Única)
            </p>
          )}
        </div>
      )}

      {/*
        El motivo antes que el control: si los botones están apagados, el
        lector tiene que saber por qué **antes** de intentar pulsarlos, no
        después de un error.
      */}
      {(estado === "anon" || estado === "sin-registro") && (
        <p className="mt-4 rounded-lg border border-hairline bg-canvas px-3.5 py-2.5 text-xs leading-relaxed text-ink-soft">
          {estado === "anon" ? (
            <>
              Para votar hace falta{" "}
              <Link
                href="/democracia/registro"
                className="font-semibold text-brand-700 hover:underline"
              >
                registrarse con la cédula
              </Link>
              . Tu voto es privado: solo se publican los totales.
            </>
          ) : (
            <>
              Tu sesión no tiene una cédula registrada.{" "}
              <Link
                href="/democracia/registro"
                className="font-semibold text-brand-700 hover:underline"
              >
                Completa tu registro
              </Link>{" "}
              para votar.
            </>
          )}
        </p>
      )}

      {/* botones */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <BotonVoto
          activo={miVoto === 1}
          disabled={enviando || !puedeVotar}
          onClick={() => votar(1)}
          tono="favor"
          conteo={miVoto === null ? null : agg.a_favor}
        >
          A favor
        </BotonVoto>
        <BotonVoto
          activo={miVoto === -1}
          disabled={enviando || !puedeVotar}
          onClick={() => votar(-1)}
          tono="contra"
          conteo={miVoto === null ? null : agg.en_contra}
        >
          En contra
        </BotonVoto>
      </div>

      {error && <p className="mt-3 text-xs font-medium text-alerta-700">{error}</p>}
    </section>
  );
}

function BotonVoto({
  activo,
  tono,
  conteo,
  children,
  ...props
}: {
  activo: boolean;
  tono: "favor" | "contra";
  conteo: number | null;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const favor = tono === "favor";
  return (
    <button
      type="button"
      aria-pressed={activo}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors active:scale-95 disabled:opacity-60",
        activo && favor && "border-brand-500 bg-brand-500 text-white",
        activo && !favor && "border-ink bg-ink text-canvas",
        !activo && favor && "border-hairline bg-surface text-brand-600 hover:border-brand-400 hover:bg-brand-50",
        !activo && !favor && "border-hairline bg-surface text-ink hover:border-ink hover:bg-canvas",
      )}
      {...props}
    >
      <Pulgar arriba={favor} />
      {children}
      {conteo !== null && (
        <span className="font-mono tabular-nums opacity-80">
          {conteo.toLocaleString("es-DO")}
        </span>
      )}
    </button>
  );
}

function Pulgar({ arriba }: { arriba: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4", !arriba && "rotate-180")}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3z" />
      <path d="M7 11l4-8a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7" />
    </svg>
  );
}
