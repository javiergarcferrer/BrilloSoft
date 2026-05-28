import { BadgeCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { STATS, whatsappUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const values = [
  "Puntualidad en cada visita",
  "Cuidado de cada espacio como si fuera propio",
  "Atención personalizada a tus necesidades",
];

export function Nosotros() {
  return (
    <section id="nosotros" className="scroll-mt-24 py-20 sm:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <span className="text-sm font-semibold tracking-wide text-brand-600 uppercase">
            Nosotros
          </span>
          <h2 className="mt-3 text-3xl font-semibold text-balance text-ink sm:text-4xl lg:text-5xl">
            Un equipo que cuida cada detalle
          </h2>
          <p className="mt-5 text-lg text-pretty text-ink-soft">
            En Vista Verde contamos con un equipo de profesionales con más de 15
            años de experiencia. Nos comprometemos con la excelencia, la
            puntualidad y el cuidado de cada espacio como si fuera propio, con
            soluciones adaptadas a las necesidades de cada cliente.
          </p>
          <ul className="mt-7 space-y-3">
            {values.map((v) => (
              <li key={v} className="flex items-start gap-3 text-ink">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <span>{v}</span>
              </li>
            ))}
          </ul>
          <Button
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8"
          >
            Conversemos sobre tu espacio
          </Button>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="grid gap-5 sm:grid-cols-2">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  "rounded-2xl border border-hairline bg-surface p-7 shadow-soft",
                  i === 0 && "sm:col-span-2",
                )}
              >
                <div className="font-display text-4xl font-semibold text-brand-600 sm:text-5xl">
                  {s.value}
                </div>
                <div className="mt-1 text-ink-soft">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
