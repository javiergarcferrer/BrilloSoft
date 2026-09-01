import Link from "next/link";
import type { Metadata } from "next";
import { IconArrowLeft, IconCheck, IconShield } from "@/components/icons";

export const metadata: Metadata = {
  title: "Seguridad y privacidad",
  description:
    "Cómo Democracia Legislativa protege la identidad y el voto: cédula cifrada con clave que no sale de la base, voto privado a nivel de base de datos, minimización de datos según la Ley 172-13.",
};

export const revalidate = 3600;

export default function SeguridadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/democracia"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <IconArrowLeft className="h-3.5 w-3.5" />
        Democracia Legislativa
      </Link>

      <header className="mb-6 mt-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
          <IconShield className="h-4 w-4" />
          Dossier de seguridad y privacidad
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Cómo protegemos tu identidad y tu voto
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Un voto ciudadano solo vale si la gente confía en él. Estas son las
          medidas concretas, en lenguaje llano y verificables en el código. El
          principio rector es de la Ley 172-13 de protección de datos:
          recolectar lo mínimo, protegerlo bien y dejarte el control.
        </p>
      </header>

      <div className="space-y-4">
        <Medida titulo="Tu cédula nunca se guarda en claro">
          Al registrarte, tu cédula se convierte en un código irreversible
          (HMAC-SHA256) usando una clave secreta que <strong>vive solo dentro de
          la base de datos</strong> y que ninguna parte de la aplicación puede
          leer. Guardamos ese código, no tu cédula. Aunque alguien obtuviera la
          tabla de registros, no podría recuperar ninguna cédula ni probarlas por
          fuerza bruta sin esa clave.
        </Medida>

        <Medida titulo="No pedimos tu nombre ni datos personales">
          El registro necesita tu cédula (para un voto por persona) y un correo
          (para enviarte un código de un solo uso que confirma que el correo es
          tuyo). Nada más. No hay nombres, ni teléfono, ni dirección: minimización
          de datos por diseño.
        </Medida>

        <Medida titulo="Tu voto es privado a nivel de base de datos">
          Quién votó qué no lo puede leer nadie más que tú, y esa regla la impone
          la base de datos (Row Level Security), no solo la interfaz. Lo único
          público son los <strong>totales agregados</strong> —cuántos a favor,
          cuántos en contra— que salen de una vista que solo expone conteos y
          jamás filas individuales.
        </Medida>

        <Medida titulo="Un voto por cédula, verificado en el servidor">
          El dígito verificador de la cédula (algoritmo público de la JCE) y la
          unicidad se comprueban en el servidor, no en tu navegador. Una misma
          cédula no puede registrarse dos veces, y cada iniciativa admite un solo
          voto por persona, cambiable pero no acumulable.
        </Medida>

        <Medida titulo="Puedes borrar todo cuando quieras">
          Un botón elimina tu registro y, en cascada, todos tus votos, sin dejar
          rastro reversible a tu cédula. Es el derecho al olvido de la Ley 172-13,
          implementado como una función de la base.
        </Medida>

        <Medida titulo="La aplicación no guarda secretos">
          El sitio solo lleva claves publicables, pensadas para viajar en el
          navegador; la protección real vive en la base de datos. El material
          sensible (la clave del cifrado de cédula) nunca sale de Postgres ni pasa
          por el código del sitio.
        </Medida>
      </div>

      <section className="mt-8 rounded-2xl border border-amber-300/50 bg-amber-50/60 p-5">
        <h2 className="text-sm font-semibold text-ink">Lo que este piloto todavía no hace</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Honestidad sobre los límites: hoy verificamos que la cédula sea{" "}
          <strong>válida</strong> y que controles un correo, pero no que la cédula
          sea <strong>tuya</strong> ni que estés habilitado en el padrón. Esa
          verificación exige un acuerdo con la Junta Central Electoral, que no
          expone un servicio público para ello. Este piloto —con su seguridad ya
          construida— es precisamente el argumento para solicitar ese acceso y
          convertir el ejercicio en un canal formal.
        </p>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-ink-soft">
        Herramienta independiente y no oficial, sin afiliación con el Estado
        dominicano. Marco normativo de referencia: Ley 172-13 (protección de
        datos personales) y las normas NORTIC de la OGTIC sobre seguridad web y
        datos abiertos.{" "}
        <Link href="/democracia" className="font-medium text-amber-700 hover:underline">
          Volver a Democracia Legislativa
        </Link>
        .
      </p>
    </div>
  );
}

function Medida({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
      <h2 className="flex items-start gap-2.5 text-base font-semibold text-ink">
        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
          <IconCheck className="h-3.5 w-3.5" />
        </span>
        {titulo}
      </h2>
      <p className="mt-2 pl-7 text-sm leading-relaxed text-ink-soft">{children}</p>
    </section>
  );
}
