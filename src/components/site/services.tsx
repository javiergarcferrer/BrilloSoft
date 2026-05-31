import { Check } from "lucide-react";
import Image from "next/image";
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
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-hairline bg-surface shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/35 to-transparent" />
                  <span className="absolute bottom-3 left-3 inline-flex size-11 items-center justify-center rounded-2xl bg-white/95 text-brand-600 shadow-sm backdrop-blur">
                    <Icon name={service.icon} className="size-5" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="font-display text-xl font-semibold text-ink">
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
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
