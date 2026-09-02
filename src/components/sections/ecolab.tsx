import { Sparkles, ShieldCheck, Leaf } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/reveal";

const points = [
  {
    icon: ShieldCheck,
    title: "Seguros y certificados",
    text: "Fórmulas profesionales que cuidan a las personas y al medioambiente.",
  },
  {
    icon: Sparkles,
    title: "Resultados superiores",
    text: "Tecnología de limpieza líder a nivel mundial para un acabado impecable.",
  },
  {
    icon: Leaf,
    title: "Uso responsable",
    text: "Dosificación precisa que reduce el desperdicio y los residuos.",
  },
];

export function Ecolab() {
  return (
    <section className="vv-lazy-section py-20 sm:py-28">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-6 py-14 text-white sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="vv-glow absolute -top-16 -right-10 h-96 w-96 [--vv-glow:var(--color-brand-400)] [--vv-glow-alpha:28%]"
          />
          <Leaf
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -left-8 h-64 w-64 rotate-[-18deg] text-white/5"
            strokeWidth={1}
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-brand-100">
                <Sparkles className="h-4 w-4" /> Aliados de Ecolab
              </span>
              <h2 className="mt-5 text-display-lg font-semibold text-balance">
                Elegir Ecolab es elegir excelencia
              </h2>
              <p className="mt-4 text-lg text-pretty text-brand-100">
                Trabajamos con productos profesionales Ecolab, líderes mundiales en
                higiene y limpieza, para garantizar resultados seguros, efectivos y
                duraderos.
              </p>
            </Reveal>
          </div>

          <div className="relative mt-12 grid gap-6 sm:grid-cols-3">
            {points.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-inset ring-white/10">
                  <p.icon className="h-7 w-7 text-brand-200" strokeWidth={1.75} />
                  <h3 className="mt-4 font-sans text-lg font-semibold text-white">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-brand-100/90">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
