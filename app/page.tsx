import { Suspense } from "react";
import Buscador from "./buscador";

function Esqueleto() {
  return (
    <div className="space-y-4">
      <div className="h-14 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-200" />
      <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-200" />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Buscador />
    </Suspense>
  );
}
