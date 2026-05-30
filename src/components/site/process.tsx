import { processSteps } from "@/lib/site";
import { Icon } from "./icons";
import { Reveal } from "./reveal";

export function Process() {
  return (
    <section
      id="proceso"
      className="relative overflow-hidden bg-gradient-to-b from-brand-900 to-brand-950 py-24 text-white sm:py-28"
    >
      <div
        aria-hidden
        className="absolute -right-24 top-1/3 size-96 rounded-full bg-brand-500/10 blur-3xl"
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="eyebrow text-brand-300">Cómo trabajamos</span>
            <h2 className="font-display mt-4 text-balance text-3xl font-semibold leading-tight sm:text-4xl">
              Simple, claro y sin compromiso
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-white/70">
              Tres pasos para dejar tu espacio impecable — empezando por una
              evaluación gratuita.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {processSteps.map((step, i) => (
            <Reveal key={step.step} delay={i * 100}>
              <div className="relative h-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-200">
                    <Icon name={step.icon} className="size-6" />
                  </span>
                  <span className="font-display text-4xl font-semibold text-white/15">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-display mt-5 text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2.5 leading-relaxed text-white/70">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
