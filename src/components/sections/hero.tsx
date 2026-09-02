import { ShieldCheck, Sparkles, MapPin, ArrowRight, Leaf } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { SITE, whatsappUrl } from "@/lib/site";

const badges = [
  { icon: ShieldCheck, label: "+15 años de experiencia" },
  { icon: Sparkles, label: "Productos Ecolab" },
  { icon: MapPin, label: "Cobertura nacional" },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background layers */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-canvas to-canvas"
      />
      <div
        aria-hidden
        className="vv-glow absolute -top-32 -right-24 -z-10 h-[32rem] w-[32rem] [--vv-glow:var(--color-brand-200)] [--vv-glow-alpha:55%]"
      />
      <div
        aria-hidden
        className="vv-glow absolute top-40 -left-24 -z-10 h-[28rem] w-[28rem] [--vv-glow:var(--color-brand-300)] [--vv-glow-alpha:35%]"
      />
      <div aria-hidden className="vv-grain absolute inset-0 -z-10 opacity-60" />
      <Leaf
        aria-hidden
        className="pointer-events-none absolute -right-8 -bottom-10 -z-10 h-80 w-80 rotate-12 text-brand-200/40"
        strokeWidth={1}
      />

      <Container className="flex flex-col items-center pt-32 pb-20 text-center sm:pt-40 sm:pb-28">
        <Reveal eager>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/15 bg-white/80 px-4 py-1.5 text-sm font-medium text-brand-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-brand-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            Limpieza y mantenimiento profesional
          </span>
        </Reveal>

        <Reveal eager delay={0.06}>
          <h1 className="mt-6 max-w-4xl text-display-xl font-semibold text-balance text-ink">
            {SITE.tagline}
          </h1>
        </Reveal>

        <Reveal eager delay={0.12}>
          <p className="mt-6 max-w-2xl text-lead text-pretty text-ink-soft">
            {SITE.intro}
          </p>
        </Reveal>

        <Reveal eager delay={0.18}>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
            >
              Solicitar evaluación gratuita
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="#servicios" variant="secondary" size="lg">
              Ver servicios
            </Button>
          </div>
        </Reveal>

        <Reveal eager delay={0.24}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {badges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft"
              >
                <b.icon className="h-4 w-4 text-brand-600" />
                {b.label}
              </span>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
