import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/reveal";
import { ICONS } from "@/components/ui/icon";
import { SERVICES } from "@/lib/site";

export function Services() {
  return (
    <section id="servicios" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-brand-600 uppercase">
            Servicios
          </span>
          <h2 className="mt-3 text-display-lg font-semibold text-balance text-ink">
            Especialistas en materiales delicados
          </h2>
          <p className="mt-4 text-lg text-pretty text-ink-soft">
            Cuidamos tapizados, cortinas, alfombras, muebles y madera con técnicas
            y productos profesionales que protegen cada superficie.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => {
            const Icon = ICONS[s.icon] ?? ICONS.Sparkles;
            return (
              <Reveal key={s.title} delay={i * 0.06}>
                <article className="group h-full rounded-2xl border border-hairline bg-surface p-7 shadow-soft transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-pretty text-ink-soft">{s.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
