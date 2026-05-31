import Image from "next/image";
import { galleryPhotos, values } from "@/lib/site";
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

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Real work photos */}
          <Reveal className="order-last lg:order-first">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-3xl shadow-card">
                <Image
                  src={galleryPhotos[0].src}
                  alt={galleryPhotos[0].alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              {galleryPhotos.slice(1).map((photo) => (
                <div
                  key={photo.src}
                  className="relative aspect-square overflow-hidden rounded-2xl shadow-soft"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </Reveal>

          {/* Values */}
          <Reveal>
            <ul className="space-y-4">
              {values.map((value) => (
                <li
                  key={value.title}
                  className="flex gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-soft transition-colors duration-300 hover:border-brand-200"
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon name={value.icon} className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-medium text-ink">{value.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                      {value.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
