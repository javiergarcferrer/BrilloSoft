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
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {clients.map((client) => (
              <li
                key={client}
                className="flex items-center justify-center rounded-2xl border border-hairline bg-surface px-6 py-9 text-center shadow-soft transition-colors duration-300 hover:border-brand-200"
              >
                <span className="font-display text-lg font-semibold text-ink/75">
                  {client}
                </span>
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
