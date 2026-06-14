import type { Metadata } from "next";
import { TrackingBoard } from "@/components/licita/tracking-board";

export const metadata: Metadata = {
  title: "Seguimiento",
  description:
    "Organiza las licitaciones que te interesan en un tablero por etapas: interés, evaluación, preparación, presentación y resultado.",
};

export default function SeguimientoPage() {
  return (
    <div>
      <div className="border-b border-hairline bg-surface">
        <div className="mx-auto w-full max-w-7xl px-5 pb-8 pt-8 sm:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Tablero de seguimiento
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Mueve cada proceso por sus etapas y mantén tus notas y plazos a la
            vista.
          </p>
        </div>
      </div>
      <TrackingBoard />
    </div>
  );
}
