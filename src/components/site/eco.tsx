/* eslint-disable @next/next/no-img-element */
import { ArrowRight, Leaf, Recycle, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { assets, DEFAULT_WHATSAPP_MESSAGE, whatsappUrl } from "@/lib/site";
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
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-pop">
              <Image
                src={assets.eco}
                alt="Limpieza eco-consciente con productos Ecolab"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">
                Trabajamos con
              </p>
              <img
                src={assets.ecolabLogo}
                alt="Ecolab"
                className="mt-1.5 h-7 w-auto"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
