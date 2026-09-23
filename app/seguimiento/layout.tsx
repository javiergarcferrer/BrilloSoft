import type { Metadata } from "next";

/**
 * El seguimiento vive en el navegador de cada quien (`localStorage`): para un
 * buscador es una página vacía, así que no se indexa.
 */
export const metadata: Metadata = {
  title: "Mi seguimiento",
  description: "Lo que sigues en la plataforma y qué cambió desde tu última visita.",
  robots: { index: false, follow: true },
};

export default function SeguimientoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
