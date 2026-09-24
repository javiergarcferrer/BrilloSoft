import Link from "next/link";
import { IconArrowLeft } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/estado-vacio";

export default function NotFound() {
  return (
    <EstadoVacio
      como="h1"
      titulo="¿Y este proceso?"
      accion={
        <Button asChild>
          <Link href="/licitaciones">
            <IconArrowLeft className="h-4 w-4" />
            Volver al buscador
          </Link>
        </Button>
      }
    >
      La API de la DGCP no devolvió datos para este código de proceso.
    </EstadoVacio>
  );
}
