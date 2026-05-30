import { Mail, MapPin } from "lucide-react";
import {
  DEFAULT_WHATSAPP_MESSAGE,
  navLinks,
  site,
  whatsappUrl,
} from "@/lib/site";
import { InstagramIcon, WhatsappIcon } from "./brand-icons";
import { Logo } from "./logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-950 text-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-12 py-16 md:grid-cols-[1.6fr_1fr_1.2fr]">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-5 text-pretty leading-relaxed text-white/60">
              {site.tagline}. Limpieza y mantenimiento profesional para hogares
              y empresas en {site.country}.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={whatsappUrl(DEFAULT_WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-500"
              >
                <WhatsappIcon className="size-5" />
              </a>
              <a
                href={site.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-500"
              >
                <InstagramIcon className="size-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Navegación
            </h3>
            <ul className="mt-4 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Contacto
            </h3>
            <ul className="mt-4 space-y-3.5 text-white/70">
              <li>
                <a
                  href={whatsappUrl(DEFAULT_WHATSAPP_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-colors hover:text-white"
                >
                  <WhatsappIcon className="size-5 shrink-0 text-brand-300" />
                  {site.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-3 break-all transition-colors hover:text-white"
                >
                  <Mail className="size-5 shrink-0 text-brand-300" />
                  {site.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="size-5 shrink-0 text-brand-300" />
                {site.serviceArea}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-white/50 sm:flex-row">
          <p>
            © {year} {site.name}. Todos los derechos reservados.
          </p>
          <p>
            {site.serviceArea} · {site.country}
          </p>
        </div>
      </div>
    </footer>
  );
}
