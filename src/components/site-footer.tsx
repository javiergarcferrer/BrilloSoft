import { cacheLife } from "next/cache";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { Container } from "./ui/container";
import { Logo } from "./ui/logo";
import { InstagramGlyph } from "./ui/instagram-glyph";
import { NAV_LINKS, SITE, whatsappUrl } from "@/lib/site";

/**
 * The copyright year is the one value on the site that is not deterministic.
 * Caching it with a daily lifetime keeps the page a static shell (Cache
 * Components) while guaranteeing it rolls over without a redeploy.
 */
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-brand-950 text-brand-100">
      {/* Decorative layered peaks rising along the top edge */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="h-16 w-full text-brand-900/70"
        >
          <path
            fill="currentColor"
            d="M0 120 L240 40 L480 96 L720 24 L960 88 L1200 36 L1440 100 L1440 0 L0 0 Z"
            transform="translate(0,-1)"
            opacity="0"
          />
          <path
            fill="currentColor"
            d="M0 120 L360 56 L720 104 L1080 48 L1440 110 L1440 120 Z"
          />
        </svg>
      </div>

      <Container className="relative grid gap-12 pt-24 pb-12 md:grid-cols-[1.5fr_1fr_1.2fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-balance text-brand-200">
            {SITE.tagline}. {SITE.intro}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <InstagramGlyph className="h-5 w-5" />
            </a>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href={`mailto:${SITE.email}`}
              aria-label="Correo electrónico"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-sans text-sm font-semibold tracking-wide text-white/90 uppercase">
            Navegación
          </h3>
          <ul className="mt-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-brand-200 transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-sans text-sm font-semibold tracking-wide text-white/90 uppercase">
            Contacto
          </h3>
          <ul className="mt-4 space-y-3">
            <li>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-2.5 text-brand-200 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {SITE.email}
              </a>
            </li>
            <li>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-brand-200 transition-colors hover:text-white"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                {SITE.phoneDisplay}
              </a>
            </li>
            <li className="inline-flex items-center gap-2.5 text-brand-200">
              <MapPin className="h-4 w-4 shrink-0" />
              {SITE.coverage}
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-sm text-brand-200 sm:flex-row">
          <p>
            © <CurrentYear /> {SITE.name}. Todos los derechos reservados.
          </p>
          <p>Hecho con cuidado en República Dominicana.</p>
        </Container>
      </div>
    </footer>
  );
}
