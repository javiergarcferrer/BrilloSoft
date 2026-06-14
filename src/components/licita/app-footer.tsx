import Link from "next/link";
import { PLATFORM } from "@/lib/licitaciones/data";
import { BrandMark } from "./brand";

export function AppFooter() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-8 w-8" />
              <span className="text-base font-semibold tracking-tight text-ink">
                Licita<span className="text-brand-600">RD</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {PLATFORM.descripcion}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterCol
              title="Plataforma"
              links={[
                { label: "Panel", href: "/" },
                { label: "Explorar", href: "/buscar" },
                { label: "Seguimiento", href: "/seguimiento" },
                { label: "Analítica", href: "/analitica" },
              ]}
            />
            <FooterCol
              title="Fuentes"
              links={[
                { label: "Portal Transaccional", href: "/buscar" },
                { label: "DGCP", href: "/buscar" },
                { label: "Registro de proveedores", href: "/buscar" },
              ]}
            />
            <FooterCol
              title="Recursos"
              links={[
                { label: "Ley 340-06", href: "/buscar" },
                { label: "Guía de la plataforma", href: "/" },
                { label: "Contacto", href: "/" },
              ]}
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-hairline pt-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {PLATFORM.name}. Inteligencia de
            contrataciones públicas · {PLATFORM.pais}.
          </p>
          <p>
            Datos ilustrativos basados en la estructura del Portal Transaccional
            de la DGCP.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
        {title}
      </h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-ink-soft transition-colors hover:text-brand-700"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
