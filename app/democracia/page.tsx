import Link from "next/link";
import type { Metadata } from "next";
import { getRanking, type RankingItem } from "@/lib/democracia";
import { IconArrowRight, IconShield, IconSparkles } from "@/components/icons";

export const metadata: Metadata = {
  title: "Democracia Legislativa",
  description:
    "Vota 👍 o 👎 sobre las iniciativas del Congreso Nacional dominicano y mira el apoyo ciudadano en tiempo real. Piloto independiente, registro por cédula, voto privado.",
};

export const revalidate = 60;

export default async function DemocraciaPage() {
  const ranking = await getRanking(40);
  const conVotos = ranking.filter((r) => r.total > 0);
  const totalVotos = conVotos.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-ink text-white">
        <div className="absolute inset-0 app-grid-dark" aria-hidden />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-alerta-500/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" aria-hidden />
        <div className="relative p-6 sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-inset ring-white/15">
            <IconSparkles className="h-3.5 w-3.5" />
            Piloto ciudadano · independiente y no oficial
          </div>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Tu voz sobre lo que se legisla
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            Vota a favor o en contra de las iniciativas reales que se discuten en
            la Cámara de Diputados y el Senado, y mira cómo opina la ciudadanía. Un
            registro por cédula para que cada voto cuente una vez; tu voto es
            secreto y solo se publican los totales.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/democracia/registro"
              className="inline-flex items-center gap-2 rounded-full bg-alerta-500 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-alerta-500 active:scale-95"
            >
              Regístrate para votar
            </Link>
            <Link
              href="/congreso"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/15 active:scale-95"
            >
              Ver iniciativas
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona / seguridad */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Paso n={1} titulo="Regístrate">
          Con tu cédula y tu correo. La cédula se guarda cifrada, nunca en claro, y
          no pedimos tu nombre.
        </Paso>
        <Paso n={2} titulo="Vota">
          👍 o 👎 en la ficha de cada iniciativa. Puedes cambiar tu voto cuando
          quieras; solo cuenta el último.
        </Paso>
        <Paso n={3} titulo="Mira el consenso">
          Los totales son públicos y en vivo. Quién votó qué, nunca: tu voto es
          privado por diseño.
        </Paso>
      </section>

      {/* Ranking */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Lo que dice la ciudadanía
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              {totalVotos > 0
                ? `${totalVotos.toLocaleString("es-DO")} votos sobre ${conVotos.length} iniciativas`
                : "Aún no hay votos — sé quien empiece"}
            </p>
          </div>
          <Link href="/congreso" className="shrink-0 text-xs font-medium text-alerta-600 hover:underline">
            Buscar iniciativas →
          </Link>
        </div>

        {conVotos.length > 0 ? (
          <ul className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
            {conVotos.map((r) => (
              <FilaRanking key={`${r.camara}:${r.ref}`} item={r} />
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-hairline bg-surface px-5 py-14 text-center shadow-card">
            <p className="text-sm font-medium text-ink">El tablero está en blanco</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
              Cuando la gente empiece a votar en las fichas de las iniciativas, aquí
              aparecerá el ranking de apoyo ciudadano.
            </p>
          </div>
        )}
      </section>

      {/* franja de seguridad */}
      <Link
        href="/democracia/seguridad"
        className="flex items-center gap-4 rounded-2xl border border-hairline bg-surface px-5 py-4 shadow-soft transition-shadow hover:shadow-card"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-alerta-50 text-alerta-600">
          <IconShield className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Cómo protegemos tu identidad y tu voto</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Cédula cifrada con clave que no sale de la base, voto privado a nivel de
            base de datos, minimización de datos según la Ley 172-13.
          </p>
        </div>
        <IconArrowRight className="h-4 w-4 shrink-0 text-ink-soft" />
      </Link>

      <p className="px-1 text-xs leading-relaxed text-ink-soft">
        Herramienta independiente y no oficial. Este piloto no es un canal formal
        de participación del Estado y sus resultados no obligan a ninguna
        institución; mide y muestra la opinión de quienes participan.{" "}
        <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
          Estado y límites de las fuentes
        </Link>
        .
      </p>
    </div>
  );
}

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-soft">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-alerta-100 text-xs font-bold text-alerta-600">
        {n}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-ink">{titulo}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

function FilaRanking({ item }: { item: RankingItem }) {
  const pct = Math.round(item.apoyo * 100);
  const href =
    item.camara === "senado"
      ? `/congreso/senado/${item.ref.replace(":", "/")}`
      : `/congreso/${item.ref}`;
  return (
    <li className="border-b border-hairline last:border-0">
      <Link href={href} className="block px-4 py-3.5 transition-colors hover:bg-canvas/60 sm:px-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-semibold tabular-nums text-alerta-600">
            {item.numero ?? `${item.camara}·${item.ref}`}
          </span>
          <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-soft ring-1 ring-inset ring-hairline">
            {item.camara === "senado" ? "Senado" : "Diputados"}
          </span>
          {item.grupo && <span className="text-ink-soft">{item.grupo}</span>}
        </div>
        <p className="mt-1.5 line-clamp-2 text-[15px] leading-snug text-ink">
          {item.titulo ?? "(iniciativa)"}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-2 flex-1 overflow-hidden rounded-full ring-1 ring-inset ring-hairline">
            <div className="bg-brand-500" style={{ width: `${pct}%` }} />
            <div className="flex-1 bg-sello-400" />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-ink-soft">
            <span className="font-semibold text-brand-600">{pct}%</span> · {item.total.toLocaleString("es-DO")} votos
          </span>
        </div>
      </Link>
    </li>
  );
}
