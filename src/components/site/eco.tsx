import { ArrowRight, Leaf, Recycle, ShieldCheck } from "lucide-react";
import { DEFAULT_WHATSAPP_MESSAGE, whatsappUrl } from "@/lib/site";
import { WhatsappIcon } from "./brand-icons";
import { Button } from "./button";
import { Reveal } from "./reveal";

const points = [
  {
    icon: Leaf,
    text: "Productos Ecolab, referencia mundial en limpieza profesional.",
  },
  {
    icon: ShieldCheck,
    text: "Seguros para tu familia, tu equipo de trabajo y tus mascotas.",
  },
  {
    icon: Recycle,
    text: "Menor impacto ambiental, con los mismos resultados impecables.",
  },
];

export function Eco() {
  return (
    <section className="relative overflow-hidden bg-brand-50 py-20 sm:py-24">
      <div
        aria-hidden
        className="absolute -bottom-24 -left-20 size-80 rounded-full bg-brand-200/40 blur-3xl"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <div className="max-w-xl">
            <span className="eyebrow">
              <Leaf className="size-3.5" />
              Compromiso eco
            </span>
            <h2 className="font-display mt-4 text-balance text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Limpieza profunda,{" "}
              <span className="italic text-brand-600">conciencia verde</span>
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-ink-soft">
              No es solo el nombre. Cuidamos tu espacio y también el entorno,
              trabajando con productos profesionales de bajo impacto.
            </p>

            <ul className="mt-7 space-y-4">
              {points.map(({ icon: PointIcon, text }) => (
                <li key={text} className="flex items-start gap-3.5">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-soft">
                    <PointIcon className="size-5" strokeWidth={1.7} />
                  </span>
                  <span className="text-ink">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Button
                href={whatsappUrl(DEFAULT_WHATSAPP_MESSAGE)}
                external
                size="lg"
              >
                <WhatsappIcon className="size-5" />
                Agenda tu evaluación
                <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-100 to-brand-200/40" />
            <div className="absolute inset-7 rounded-full border border-brand-200" />
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <span className="vv-float mx-auto inline-flex size-24 items-center justify-center rounded-full bg-brand-600 text-white shadow-brand">
                  <Leaf className="size-11" strokeWidth={1.5} />
                </span>
                <p className="font-display mt-5 text-2xl font-semibold leading-tight text-brand-800">
                  Limpieza
                  <br />
                  eco-consciente
                </p>
              </div>
            </div>
            <span className="absolute right-2 top-8 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-card ring-1 ring-black/5">
              Productos Ecolab
            </span>
            <span className="absolute bottom-10 left-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-card ring-1 ring-black/5">
              100% seguro
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
