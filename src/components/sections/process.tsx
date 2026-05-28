import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/reveal";
import { ICONS } from "@/components/ui/icon";
import { PROCESS } from "@/lib/site";

export function Process() {
  return (
    <section id="proceso" className="scroll-mt-24 bg-surface-soft py-20 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-brand-600 uppercase">
            Nuestro proceso
          </span>
          <h2 className="mt-3 text-3xl font-semibold text-balance text-ink sm:text-4xl lg:text-5xl">
            Tu espacio impecable en tres pasos
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Un método claro y sin sorpresas, desde la primera visita hasta el
            resultado final.
          </p>
        </Reveal>

        <div className="relative mt-16 grid gap-10 md:grid-cols-3">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className="absolute top-8 right-[16%] left-[16%] hidden border-t-2 border-dashed border-brand-200 md:block"
          />
          {PROCESS.map((p, i) => {
            const Icon = ICONS[p.icon] ?? ICONS.Sparkles;
            return (
              <Reveal key={p.step} delay={i * 0.1} className="relative text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-card">
                  <Icon className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <div className="mt-5 text-sm font-semibold tracking-widest text-brand-500">
                  {p.step}
                </div>
                <h3 className="mt-1 text-xl font-semibold text-ink">{p.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-pretty text-ink-soft">
                  {p.description}
                </p>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
