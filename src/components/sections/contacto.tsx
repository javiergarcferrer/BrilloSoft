import { ArrowRight, Mail, MessageCircle, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { InstagramGlyph } from "@/components/ui/instagram-glyph";
import { SITE, whatsappUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

type Method = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
};

const methods: Method[] = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: SITE.phoneDisplay,
    href: whatsappUrl(),
    external: true,
  },
  {
    icon: Mail,
    label: "Correo",
    value: SITE.email,
    href: `mailto:${SITE.email}`,
  },
  {
    icon: InstagramGlyph,
    label: "Instagram",
    value: SITE.instagramHandle,
    href: SITE.instagramUrl,
    external: true,
  },
  {
    icon: MapPin,
    label: "Cobertura",
    value: SITE.coverage,
  },
];

export function Contacto() {
  return (
    <section id="contacto" className="scroll-mt-24 pb-24 sm:pb-28">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white px-6 py-14 text-center shadow-card sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl"
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-semibold text-balance text-ink sm:text-4xl lg:text-5xl">
                ¿Listo para cuidar tu espacio?
              </h2>
              <p className="mt-4 text-lg text-pretty text-ink-soft">
                Solicita tu evaluación gratuita hoy. Te respondemos rápido y
                diseñamos una solución a la medida de tu hogar o negocio.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                >
                  Hablemos por WhatsApp <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  href={`mailto:${SITE.email}`}
                  variant="secondary"
                  size="lg"
                >
                  Escríbenos
                </Button>
              </div>
            </div>

            <div className="relative mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {methods.map((m) => {
                const inner = (
                  <>
                    <m.icon className="h-5 w-5 text-brand-600" />
                    <div className="text-left">
                      <div className="text-xs font-medium tracking-wide text-ink-soft uppercase">
                        {m.label}
                      </div>
                      <div className="text-sm font-semibold text-ink">
                        {m.value}
                      </div>
                    </div>
                  </>
                );
                const base =
                  "flex items-center gap-3 rounded-2xl border border-hairline bg-white/70 px-4 py-3.5 backdrop-blur transition-colors";
                return m.href ? (
                  <a
                    key={m.label}
                    href={m.href}
                    target={m.external ? "_blank" : undefined}
                    rel={m.external ? "noopener noreferrer" : undefined}
                    className={cn(base, "hover:border-brand-200 hover:bg-white")}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={m.label} className={base}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
