#!/usr/bin/env python3
"""Controles que prometen respuesta y no la dan.

Dos defectos que ninguna expresión regular de una línea distingue, porque hay
que comparar cada `hover:` contra el resto de **su propia** línea:

  1. Un `hover:` cuyo valor repite el que el elemento ya tiene
     (`hover:bg-canvas` sobre `bg-canvas`): el puntero pasa por encima y no
     cambia nada.
  2. Un color de anillo sin ancho de anillo (`hover:ring-brand-500/30` sin
     `ring-1`): Tailwind solo fija la variable del color, la sombra del anillo
     no se emite y el anillo no se pinta nunca.

No es una cuestión de estilo. El elemento *parece* interactivo y no responde,
que es la regla «un control apagado explica por qué» fallando en silencio —
solo que aquí ni siquiera está apagado: está mudo. La pasada de integridad que
añadió esta comprobación encontró tres, uno de ellos la llamada a la acción
principal del panorama.

Imprime una línea por hallazgo y sale con 1 si hay alguno.
"""

import pathlib
import re
import sys

COMENTARIO = re.compile(r"\s*(//|\*|/\*)")
TOKEN = re.compile(r"[\w:/\[\].-]+")
RING_SIN_ANCHO = re.compile(r"hover:ring-[a-z]+-\d+(/\d+)?$")


def hallazgos(raiz: pathlib.Path):
    for carpeta in ("app", "components"):
        for f in sorted((raiz / carpeta).rglob("*.tsx")):
            try:
                lineas = f.read_text().split("\n")
            except OSError:
                continue
            for n, linea in enumerate(lineas, 1):
                if COMENTARIO.match(linea):
                    continue
                for tok in TOKEN.findall(linea):
                    if not tok.startswith("hover:"):
                        continue
                    base = tok[len("hover:") :]
                    resto = linea.replace(tok, "")
                    if re.search(r"(?<![\w:-])" + re.escape(base) + r"(?![\w/-])", resto):
                        yield f"{f}:{n}: hover:{base} repite {base} — no cambia nada"
                    elif RING_SIN_ANCHO.match(tok) and not re.search(r"(?<![\w-])ring-\d", linea):
                        yield f"{f}:{n}: {tok} sin ancho de anillo — nunca se pinta"


def main() -> int:
    raiz = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    encontrados = sorted(set(hallazgos(raiz)))
    for h in encontrados[:8]:
        print(h)
    return 1 if encontrados else 0


if __name__ == "__main__":
    raise SystemExit(main())
