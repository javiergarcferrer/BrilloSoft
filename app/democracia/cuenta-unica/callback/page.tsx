import type { Metadata } from "next";
import { Suspense } from "react";
import Callback from "./callback";

export const metadata: Metadata = {
  title: "Verificación con Cuenta Única",
  description: "Vuelta de Cuenta Única: vinculamos tu identidad verificada a tu registro de votante.",
  robots: { index: false, follow: false },
};

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <Callback />
    </Suspense>
  );
}
