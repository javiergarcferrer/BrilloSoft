/* eslint-disable @next/next/no-img-element */
import { clients } from "@/lib/site";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Clients() {
  return (
    <section id="clientes" className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Clientes"
            title={
              <>
                Empresas que{" "}
                <span className="italic text-brand-600">confían</span> en
                nosotros
              </>
            }
            lead="Marcas y espacios que elegimos cuidar con el mismo estándar de siempre."
          />
        </Reveal>

        <Reveal className="mt-12">
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-3">
            {clients.map((client) => (
              <li
                key={client.logo}
                className="group flex items-center justify-center bg-surface px-6 py-10 sm:py-12"
              >
                <img
                  src={client.logo}
                  alt={client.name}
                  loading="lazy"
                  className="max-h-12 w-auto max-w-[72%] object-contain opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
                />
              </li>
            ))}
          </ul>
        </Reveal>

        <p className="mt-8 text-center text-sm text-ink-soft">
          Y muchos hogares y empresas más, en todo el país.
        </p>
      </div>
    </section>
  );
}
