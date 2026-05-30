import { Check } from "lucide-react";
import { services } from "@/lib/site";
import { Icon } from "./icons";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Services() {
  return (
    <section id="servicios" className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Servicios"
            title={
              <>
                Limpieza experta para{" "}
                <span className="italic text-brand-600">cada superficie</span>
              </>
            }
            lead="Desde los materiales más delicados hasta las superficies más difíciles, lo dejamos impecable."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={i * 90}>
              <article className="group flex h-full flex-col rounded-3xl border border-hairline bg-surface p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                  <Icon name={service.icon} className="size-6" />
                </span>
                <h3 className="font-display mt-5 text-xl font-semibold text-ink">
                  {service.name}
                </h3>
                <p className="mt-2.5 text-ink-soft">{service.summary}</p>
                <ul className="mt-5 space-y-2.5 border-t border-hairline pt-5">
                  {service.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm text-ink"
                    >
                      <Check className="size-4 shrink-0 text-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
