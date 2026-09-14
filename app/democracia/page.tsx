import Link from "next/link";
import type { Metadata } from "next";
import { getRanking, type RankingItem } from "@/lib/democracia";
import { IconArrowRight, IconShield } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Portada } from "@/components/portada";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EstadoVacio } from "@/components/estado-vacio";

export const metadata: Metadata = {
  title: "Democracia Legislativa",
  description:
    "Vota a favor o en contra sobre las iniciativas del Congreso Nacional dominicano y mira el apoyo ciudadano en tiempo real. Piloto independiente, registro por cédula, voto privado.",
};

export const revalidate = 60;

export default async function DemocraciaPage() {
  const ranking = await getRanking(40);
  const conVotos = ranking.filter((r) => r.total > 0);
  const totalVotos = conVotos.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      {/*
        La portada de Democracia decía lo mismo que las demás y se pintaba de
        otra manera: su rótulo era una plaquita con icono en vez del epígrafe
        con el punto de sello, y su pregunta iba en sans. Ahora usa la misma
        pieza que el resto — la excepción de esta vertical es la base de datos,
        no la identidad.
      */}
      <Portada
        principal
        rotulo="Piloto ciudadano · independiente y no oficial"
        titulo="¿Qué opinas de lo que se legisla?"
        descripcion={
          <p className="sm:text-base">
            Vota a favor o en contra de las iniciativas reales que se discuten en
            la Cámara de Diputados y el Senado, y mira cómo opina la ciudadanía. Un
            registro por cédula para que cada voto cuente una vez; tu voto es
            secreto y solo se publican los totales.
          </p>
        }
      >
        <div className="flex flex-wrap gap-2.5">
          <Button asChild size="lg" className="bg-brand-600 hover:bg-brand-700">
            <Link href="/democracia/registro">Regístrate para votar</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="tinta"
            className="bg-canvas/10 text-canvas ring-1 ring-inset ring-canvas/20 hover:bg-canvas/20"
          >
            <Link href="/congreso">Ver iniciativas</Link>
          </Button>
        </div>
      </Portada>

      {/* Cómo funciona / seguridad */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Paso n={1} titulo="Regístrate">
          Con tu cédula y tu correo. La cédula se guarda cifrada, nunca en claro, y
          no pedimos tu nombre.
        </Paso>
        <Paso n={2} titulo="Vota">
          A favor o en contra en la ficha de cada iniciativa. Puedes cambiar tu voto cuando
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
            <h2 className="font-sans text-lg font-semibold tracking-tight text-ink">
              ¿Qué dice la ciudadanía?
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              {totalVotos > 0
                ? `${totalVotos.toLocaleString("es-DO")} votos sobre ${conVotos.length} iniciativas`
                : "Aún no hay votos — sé quien empiece"}
            </p>
          </div>
          <Link href="/congreso" className="shrink-0 text-xs font-medium text-brand-700 hover:underline">
            Buscar iniciativas →
          </Link>
        </div>

        {conVotos.length > 0 ? (
          <Card>
            <ul>
              {conVotos.map((r) => (
                <FilaRanking key={`${r.camara}:${r.ref}`} item={r} />
              ))}
            </ul>
          </Card>
        ) : (
          <EstadoVacio titulo="El tablero está en blanco">
            Cuando la gente empiece a votar en las fichas de las iniciativas, aquí
            aparecerá el ranking de apoyo ciudadano.
          </EstadoVacio>
        )}
      </section>

      {/* franja de seguridad */}
      <Card asChild className="transition-colors hover:bg-canvas/60">
        <Link
          href="/democracia/seguridad"
          className="flex items-center gap-4 px-5 py-4"
        >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
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
      </Card>

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
    <Card className="p-5">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-alerta-100 text-xs font-bold text-alerta-600">
        {n}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-ink">{titulo}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{children}</p>
    </Card>
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
          <span className="font-mono font-semibold tabular-nums text-brand-700">
            {item.numero ?? `${item.camara}·${item.ref}`}
          </span>
          <Badge forma="etiqueta" variant="contorno" className="bg-canvas font-medium">
            {item.camara === "senado" ? "Senado" : "Diputados"}
          </Badge>
          {item.grupo && <span className="text-ink-soft">{item.grupo}</span>}
        </div>
        <p className="mt-1.5 line-clamp-2 text-[15px] leading-snug text-ink">
          {item.titulo ?? "(iniciativa)"}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Progress
            value={pct}
            aria-label={`${pct} % a favor`}
            className="flex-1 bg-ink-soft/30 ring-1 ring-inset ring-hairline"
          />
          <span className="font-mono shrink-0 text-xs tabular-nums text-ink-soft">
            <span className="font-semibold text-brand-600">{pct}%</span> · {item.total.toLocaleString("es-DO")} votos
          </span>
        </div>
      </Link>
    </li>
  );
}
