/**
 * La marca: el contrasello.
 *
 * Un contrasello es el sello que valida a otro sello. Este no certifica
 * aprobación —certifica que se preguntó—: el aro lleva el registro y el centro,
 * la «¿», que en español anuncia que la pregunta apenas empieza.
 *
 * Dos formas, un solo glifo:
 *  - `Sello` — la circular completa, con el aro de texto. Es la marca de
 *    verdad: pie de página, tarjeta social, momentos de firma.
 *  - `SelloCompacto` — el mismo glifo en una plaquita, para tamaños donde el
 *    aro de texto sería ilegible (cabecera, favicon, avatar).
 *
 * Regla invariable: **el punto es el sello**. El punto de la «¿» va siempre en
 * rojo, en las dos formas y sobre cualquier fondo.
 */

const PAPEL = "#f7f3ea";
const TINTA = "#171d2e";
const SELLO = "#a63a2a";

/** La «¿»: el signo de cierre girado media vuelta. */
function Interrogacion({ trazo, grosor = 13 }: { trazo: string; grosor?: number }) {
  return (
    <g transform="rotate(180 100 96)">
      <path
        d="M 74 72 C 74 42 126 42 126 72 C 126 94 103 93 103 114"
        fill="none"
        stroke={trazo}
        strokeWidth={grosor}
        strokeLinecap="round"
      />
      <circle cx="103" cy="143" r="9" fill={SELLO} />
    </g>
  );
}

export function Sello({
  className = "h-20 w-20",
  trazo = TINTA,
  /** El aro de texto se omite por debajo de ~72px: no se leería. */
  conAro = true,
  id = "aro",
}: {
  className?: string;
  trazo?: string;
  conAro?: boolean;
  id?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Socrático.do"
    >
      <circle cx="100" cy="100" r="96" fill="none" stroke={trazo} strokeWidth="3" />
      <circle cx="100" cy="100" r="84" fill="none" stroke={trazo} strokeWidth="1" />
      <circle cx="100" cy="100" r="56" fill="none" stroke={trazo} strokeWidth="1" />
      {conAro && (
        <>
          <defs>
            <path
              id={id}
              d="M 100,100 m 0,-70 a 70,70 0 1,1 0,140 a 70,70 0 1,1 0,-140"
            />
          </defs>
          <text
            fontFamily="var(--font-plex-mono), ui-monospace, monospace"
            fontSize="11"
            letterSpacing="2.6"
            fill={trazo}
          >
            <textPath href={`#${id}`}>
              SOCRÁTICO.DO · REPÚBLICA DOMINICANA · MMXXVI{" "}
            </textPath>
          </text>
        </>
      )}
      <g transform="translate(100 100) scale(0.62) translate(-100 -96)">
        <Interrogacion trazo={trazo} />
      </g>
    </svg>
  );
}

export function SelloCompacto({
  className = "h-9 w-9",
  fondo = TINTA,
  trazo = PAPEL,
}: {
  className?: string;
  fondo?: string;
  trazo?: string;
}) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-label="Socrático.do">
      <rect width="96" height="96" rx="20" fill={fondo} />
      <g transform="translate(48 50) scale(0.5) translate(-100 -96)">
        <Interrogacion trazo={trazo} grosor={15} />
      </g>
    </svg>
  );
}

/**
 * El logotipo. El «.do» es el mismo punto del sello: va siempre en rojo, salvo
 * sobre fondo tinta, donde se aclara para no perderse.
 */
export function Logotipo({
  className = "text-[19px]",
  sobreTinta = false,
}: {
  className?: string;
  sobreTinta?: boolean;
}) {
  return (
    <span className={`font-display leading-none ${className}`}>
      Socrático
      <span className={sobreTinta ? "text-sello-400" : "text-sello-600"}>.do</span>
    </span>
  );
}
