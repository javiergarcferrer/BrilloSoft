import Link from "next/link";
import type { Metadata } from "next";
import { IconArrowRight, IconCheck, IconShield } from "@/components/icons";

export const metadata: Metadata = {
  title: "Seguridad y cumplimiento",
  description:
    "Postura de seguridad, privacidad y cumplimiento normativo de Socrático.do: minimización de datos según la Ley 172-13, acceso a información pública bajo la Ley 200-04 y estándares NORTIC de la OGTIC.",
};

export const revalidate = 3600;

export default function SeguridadPlataformaPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
          <IconShield className="h-4 w-4" />
          Seguridad y cumplimiento
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Cómo cuidamos los datos y a quién le rendimos cuentas
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Socrático.do es una herramienta independiente y no oficial, pero se
          construye con los estándares que una institución del Estado exigiría.
          Esta página declara la postura de seguridad, privacidad y cumplimiento
          de toda la plataforma, con el marco normativo dominicano como
          referencia.
        </p>
      </header>

      {/* Los tres marcos */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Marco norma="Ley 172-13" titulo="Protección de datos personales">
          Minimización, cifrado y derecho al olvido.
        </Marco>
        <Marco norma="Ley 200-04" titulo="Acceso a la información pública">
          Fuentes oficiales, sin evadir bloqueos.
        </Marco>
        <Marco norma="NORTIC (OGTIC)" titulo="Estándares web del Estado">
          A2 de seguridad y E1 de datos abiertos.
        </Marco>
      </div>

      <div className="mt-6 space-y-4">
        <Medida titulo="Las superficies de inteligencia no guardan datos personales">
          Licitaciones, Congreso, Normativa, Nómina y los indicadores del panorama
          se leen <strong>en vivo</strong> de fuentes oficiales y se cachean unos
          minutos; no hay base de datos, ni cuentas, ni rastreo de quién consulta.
          La forma más fuerte de proteger un dato personal es no recolectarlo, y
          en toda esta parte de la plataforma sencillamente no existe.
        </Medida>

        <Medida titulo="La nómina se publica sin nombres ni identificadores">
          El explorador de nómina estatal trabaja con plaza, cargo, área y sueldo
          por institución — nunca con el nombre del servidor público. Es
          información de gasto público, no de personas.
        </Medida>

        <Medida titulo="En Democracia, la cédula se cifra y el voto es privado">
          El único vertical con datos ciudadanos aplica minimización estricta: la
          cédula se convierte en un código irreversible con una clave que{" "}
          <strong>vive solo dentro de la base de datos</strong>, el voto es
          privado a nivel de base de datos (no solo de interfaz), y solo se
          publican los totales agregados. Cada persona puede borrar su registro y
          sus votos cuando quiera (derecho al olvido de la Ley 172-13).{" "}
          <Link href="/democracia/seguridad" className="font-medium text-brand-700 hover:underline">
            Ver el dossier completo del voto
          </Link>
          .
        </Medida>

        <Medida titulo="Leemos las fuentes con respeto y de forma identificable">
          Toda petición lleva un agente identificable, respeta el{" "}
          <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[0.85em]">robots.txt</code>{" "}
          de cada sitio, no evade bloqueos ni challenges, y jamás toca rutas de
          autenticación ajena. Cuando una fuente nos bloquea, lo declaramos en{" "}
          <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
            el estado de las fuentes
          </Link>{" "}
          en vez de forzarla. El acceso se apoya en la Ley 200-04 de libre acceso
          a la información pública.
        </Medida>

        <Medida titulo="La aplicación no guarda secretos">
          El sitio solo porta claves publicables, pensadas para viajar en el
          navegador; la protección real vive en la base de datos y en la
          configuración del servidor. El material sensible nunca pasa por el
          código del sitio ni por el repositorio.
        </Medida>

        <Medida titulo="Transporte cifrado y despliegue reproducible">
          HTTPS de extremo a extremo, sin contenido mixto. Todo el código es
          auditable en el repositorio, incluidas las migraciones de base de datos
          y las reglas de acceso, de modo que cualquiera puede verificar estas
          afirmaciones en lugar de creerlas.
        </Medida>
      </div>

      <Link
        href="/democracia/seguridad"
        className="mt-6 flex items-center gap-4 rounded-2xl border border-hairline bg-surface px-5 py-4 shadow-soft transition-shadow hover:shadow-card"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <IconShield className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">
            Dossier de seguridad del voto ciudadano
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            El detalle técnico de cómo se protege la identidad y el voto en
            Democracia Legislativa.
          </p>
        </div>
        <IconArrowRight className="h-4 w-4 shrink-0 text-ink-soft" />
      </Link>

      <p className="mt-6 text-xs leading-relaxed text-ink-soft">
        Herramienta independiente y no oficial, sin afiliación con el Estado
        dominicano. Marco normativo de referencia: Ley 172-13 (protección de
        datos personales), Ley 200-04 (libre acceso a la información pública) y
        las normas NORTIC de la OGTIC sobre seguridad web (A2) y datos abiertos
        (E1). Para reportar una vulnerabilidad, abre un issue en el repositorio.
      </p>
    </div>
  );
}

function Marco({
  norma,
  titulo,
  children,
}: {
  norma: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-soft">
      <div className="font-mono text-xs font-semibold text-brand-700">{norma}</div>
      <div className="mt-1.5 text-sm font-semibold text-ink">{titulo}</div>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

function Medida({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
      <h2 className="flex items-start gap-2.5 text-base font-semibold text-ink">
        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
          <IconCheck className="h-3.5 w-3.5" />
        </span>
        {titulo}
      </h2>
      <p className="mt-2 pl-7 text-sm leading-relaxed text-ink-soft">{children}</p>
    </section>
  );
}
