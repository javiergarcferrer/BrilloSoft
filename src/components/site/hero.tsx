import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import {
  assets,
  DEFAULT_WHATSAPP_MESSAGE,
  site,
  whatsappUrl,
} from "@/lib/site";
import { WhatsappIcon } from "./brand-icons";
import { Button } from "./button";

const stats = [
  { value: "+15", label: "Años de experiencia" },
  { value: "Todo el país", label: "Cobertura nacional" },
  { value: "Ecolab", label: "Productos eco-conscientes" },
];

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-[92vh] items-center overflow-hidden"
    >
      {/* Real hero photo — the Vista Verde team arriving at a job */}
      <Image
        src={assets.hero}
        alt="El equipo de Vista Verde llegando a un servicio"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      {/* Legibility overlays */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/92 via-brand-950/70 to-brand-900/35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-950/80 via-transparent to-brand-950/20" />

      <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-28 sm:px-8 lg:pb-24">
        <div className="max-w-2xl text-white">
          <span className="eyebrow text-brand-200">
            <Sparkles className="size-3.5" />
            Limpieza profesional · {site.serviceArea}
          </span>

          <h1 className="font-display mt-5 text-balance text-[2.85rem] font-semibold leading-[1.04] sm:text-6xl">
            Cuidamos{" "}
            <span className="italic text-brand-200">tus espacios</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/85">
            {site.pitch}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              href={whatsappUrl(DEFAULT_WHATSAPP_MESSAGE)}
              external
              size="lg"
            >
              <WhatsappIcon className="size-5" />
              Evaluación gratuita
            </Button>
            <Button href="#servicios" variant="outlineLight" size="lg">
              Ver servicios
              <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </Button>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-x-6 gap-y-2 border-t border-white/20 pt-7">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-2xl font-semibold text-white sm:text-3xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-xs leading-snug text-white/70 sm:text-sm">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
