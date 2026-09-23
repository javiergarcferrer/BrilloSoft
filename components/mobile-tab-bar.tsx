"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SECCIONES, seccionDe } from "@/lib/secciones";
import { MENU, puntoDe } from "@/lib/menu";
import {
  IconChartBar,
  IconCheck,
  IconChevronRight,
  IconCoins,
  IconDoc,
  IconGrid,
  IconLayers,
  IconMenu,
  IconTrendingUp,
} from "./icons";
import { cn } from "@/lib/cn";
import type { SeccionId } from "@/lib/secciones";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Navegación inferior móvil (oculta en lg+, donde navega el nav del header).
 *
 * Mismo modelo mental que el megamenú de escritorio: panorama + verticales, derivadas de
 * `lib/secciones`. Las vistas internas de cada vertical viven en la barra de
 * sección, no aquí: la tab bar cambia de vertical, no de vista.
 *
 * **Por qué cinco casillas y no siete.** Con el panorama y las seis verticales
 * la fila medía 504 px contra los 390 px de un iPhone, así que se dejó
 * deslizable — y el precio era el peor posible: en `/democracia` la pestaña
 * activa quedaba a 432 px, fuera de pantalla, o sea que la barra dejaba de
 * responder «¿dónde estoy?», que es lo único que tiene que hacer. Medido a
 * 390 px, siete casillas dan 55 px cada una y «Licitaciones» necesita 68 px:
 * no caben con dignidad. Cinco dan 78 px, que sí sostienen la etiqueta entera
 * a 11 px sin recortes ni desplazamiento lateral.
 *
 * Las cuatro verticales que quedan fijas son las que la plataforma nombra en
 * su propia descripción —qué compra, qué legisla y a quién paga— más el
 * panorama; las demás viven en la hoja de «Más», que se compone también desde
 * `lib/secciones` para que no haya dos listas que mantener. Cuando el
 * visitante está en una de ellas, la casilla de «Más» lleva su nombre y su
 * matiz: la barra sigue diciendo dónde está, sin mentir sobre qué abre.
 */

const ICONOS: Record<SeccionId, (p: { className?: string }) => React.ReactElement> = {
  licitaciones: IconCoins,
  finanzas: IconTrendingUp,
  congreso: IconLayers,
  normativa: IconDoc,
  nomina: IconChartBar,
  democracia: IconCheck,
};

/** Las que ocupan casilla fija, en orden. El resto va a la hoja. */
const FIJAS: SeccionId[] = ["licitaciones", "congreso", "nomina"];

export default function MobileTabBar() {
  const pathname = usePathname();
  const actual = seccionDe(pathname);
  const [hojaAbierta, setHojaAbierta] = useState(false);

  const fijas = FIJAS.map(
    (id) => SECCIONES.find((s) => s.id === id)!,
  ).filter(Boolean);
  const restantes = SECCIONES.filter((s) => !FIJAS.includes(s.id));

  const enHoja = restantes.find((s) => s.id === actual?.id) ?? null;

  const tabs = [
    {
      href: "/",
      label: "Panorama",
      Icon: IconGrid,
      activa: pathname === "/",
      barra: "bg-ink",
      texto: "text-ink",
    },
    ...fijas.map((s) => ({
      href: s.href,
      label: s.nombre,
      Icon: ICONOS[s.id],
      activa: actual?.id === s.id,
      barra: s.hue.barra,
      texto: s.hue.activo,
    })),
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      <div className="flex">
        {tabs.map(({ href, label, Icon, activa, barra, texto }) => (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 pb-1.5 pt-2 text-[11px] font-medium leading-tight transition-colors active:scale-95",
              activa ? texto : "text-ink-soft",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-0.5 w-8 transition-opacity",
                barra,
                activa ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon className="h-6 w-6" />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        ))}

        <Sheet open={hojaAbierta} onOpenChange={setHojaAbierta}>
          <SheetTrigger
            // `aria-current` va también aquí: cuando el visitante está en una
            // sección de la hoja, esta casilla **es** la que representa la
            // página actual en la navegación, y quien no ve el matiz tiene
            // derecho a saberlo igual.
            aria-current={enHoja ? "page" : undefined}
            aria-label={
              enHoja
                ? `${enHoja.nombre} — ver las demás secciones`
                : "Ver las demás secciones"
            }
            className={cn(
              "group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 pb-1.5 pt-2 text-[11px] font-medium leading-tight transition-colors active:scale-95",
              enHoja ? enHoja.hue.activo : "text-ink-soft",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-0.5 w-8 transition-opacity",
                enHoja ? enHoja.hue.barra : "bg-ink",
                enHoja ? "opacity-100" : "opacity-0",
              )}
            />
            <IconMenu className="h-6 w-6" />
            <span className="max-w-full truncate">{enHoja?.nombre ?? "Más"}</span>
          </SheetTrigger>

          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Toda la plataforma</SheetTitle>
              <SheetDescription>
                Lo mismo que el menú de escritorio: el dinero, las leyes y el
                Estado, cada destino con una línea que dice qué hay.
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="px-2 py-2">
              {/*
                El mismo `lib/menu` que el megamenú de escritorio: en el teléfono
                no hay panel ancho, así que los tres grupos se apilan y cada
                destino es una fila de 48 px con su línea de explicación.
              */}
              {MENU.map((grupo) => (
                <section key={grupo.id} aria-label={grupo.label} className="mb-3">
                  <h2 className="rotulo px-3 pb-1 pt-2 text-ink-soft">{grupo.label}</h2>
                  <ul>
                    {grupo.columnas.flatMap((col) =>
                      col.enlaces.map((e) => (
                        <li key={e.href}>
                          <Link
                            href={e.href}
                            onClick={() => setHojaAbierta(false)}
                            aria-current={pathname === e.href ? "page" : undefined}
                            className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-canvas/70 active:bg-canvas/70 aria-[current=page]:bg-canvas"
                          >
                            <span
                              aria-hidden
                              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", puntoDe(col))}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-ink">{e.label}</span>
                              <span className="block truncate text-xs text-ink-soft">{e.nota}</span>
                            </span>
                            <IconChevronRight className="h-4 w-4 shrink-0 text-ink-soft" />
                          </Link>
                        </li>
                      )),
                    )}
                  </ul>
                </section>
              ))}
            </SheetBody>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
