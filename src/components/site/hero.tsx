import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import {
  DEFAULT_WHATSAPP_MESSAGE,
  site,
  whatsappUrl,
} from "@/lib/site";
import { Button } from "./button";
import { WhatsappIcon } from "./brand-icons";

const stats = [
  { value: "+15", label: "Años de experiencia" },
  { value: "Todo el país", label: "Cobertura nacional" },
  { value: "Ecolab", label: "Productos eco-conscientes" },
];

const floatingChips = [
  { label: "Tapicería", className: "left-[-6%] top-[18%]", rot: "-6deg", delay: "0s" },
  { label: "Cocinas", className: "right-[-4%] top-[32%]", rot: "5deg", delay: "1.1s" },
  { label: "Oficinas", className: "left-[6%] bottom-[10%]", rot: "4deg", delay: "2.2s" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Background washes */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-canvas to-canvas" />
      <div
        aria-hidden
        className="absolute -top-40 right-[-10%] -z-10 size-[40rem] rounded-full bg-brand-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -left-32 top-40 -z-10 size-[28rem] rounded-full bg-sand-200/30 blur-3xl"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-40">
        {/* Copy */}
        <div className="max-w-xl">
          <span className="eyebrow">
            <Sparkles className="size-3.5" />
            Limpieza profesional · {site.serviceArea}
          </span>

          <h1 className="font-display mt-5 text-balance text-[2.85rem] font-semibold leading-[1.04] text-ink sm:text-6xl">
            Cuidamos{" "}
            <span className="italic text-brand-600">tus espacios</span>
          </h1>

          <p className="mt-6 text-pretty text-lg leading-relaxed text-ink-soft">
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
            <Button href="#servicios" variant="secondary" size="lg">
              Ver servicios
              <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </Button>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-x-6 gap-y-2 border-t border-hairline pt-7">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-2xl font-semibold text-brand-700 sm:text-3xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-xs leading-snug text-ink-soft sm:text-sm">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-0 rotate-3 rounded-[2.25rem] bg-gradient-to-br from-brand-100 to-sand-100" />
            <div className="absolute inset-0 overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 shadow-pop">
              {/* Decorative leaf field */}
              <svg
                viewBox="0 0 400 400"
                className="absolute inset-0 h-full w-full opacity-[0.16]"
                aria-hidden
              >
                <defs>
                  <pattern
                    id="leaves"
                    width="80"
                    height="80"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(12)"
                  >
                    <path
                      d="M20 56C20 36 35 24 56 24c.8 20-14 32-36 32Z"
                      fill="#ffffff"
                    />
                  </pattern>
                </defs>
                <rect width="400" height="400" fill="url(#leaves)" />
              </svg>

              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-brand-950/70 to-transparent" />

              {/* Seal */}
              <div className="absolute bottom-7 left-7 right-7">
                <p className="font-display text-2xl font-medium italic leading-snug text-white">
                  “Cada espacio, como si fuera nuestro.”
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                  <ShieldCheck className="size-4" />
                  Equipo profesional certificado
                </div>
              </div>
            </div>

            {/* Floating capability chips */}
            {floatingChips.map((chip) => (
              <span
                key={chip.label}
                className={`vv-float absolute ${chip.className} rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-card ring-1 ring-black/5`}
                style={
                  {
                    "--vv-rot": chip.rot,
                    animationDelay: chip.delay,
                  } as React.CSSProperties
                }
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
