import type { Metadata } from "next";
import Registro from "./registro";

export const metadata: Metadata = {
  title: "Registro",
  description:
    "Regístrate con tu cédula para votar sobre las iniciativas legislativas. Un registro por cédula, voto privado, datos cifrados.",
  robots: { index: false, follow: false },
};

export default function RegistroPage() {
  return <Registro />;
}
