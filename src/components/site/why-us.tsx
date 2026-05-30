import { values } from "@/lib/site";
import { Icon } from "./icons";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function WhyUs() {
  return (
    <section id="nosotros" className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Por qué Vista Verde"
            title={
              <>
                Profesionales que cuidan{" "}
                <span className="italic text-brand-600">los detalles</span>
              </>
            }
            lead="Comprometidos con la excelencia, la puntualidad y el cuidado de cada espacio como si fuera propio."
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 70}>
              <div className="flex h-full gap-4 rounded-2xl border border-hairline bg-surface p-6 shadow-soft transition-colors duration-300 hover:border-brand-200">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name={value.icon} className="size-5" />
                </span>
                <div>
                  <h3 className="font-medium text-ink">{value.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {value.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
