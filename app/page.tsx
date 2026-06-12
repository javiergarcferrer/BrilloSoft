import { Suspense } from "react";
import Buscador from "./buscador";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Buscador />
    </Suspense>
  );
}
