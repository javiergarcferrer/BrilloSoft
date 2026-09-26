#!/usr/bin/env python3
"""Genera public/data/busqueda/{tokenizer.json,modelo.bin,modelo.json}: el
modelo con el que `/buscar` entiende **de qué trata** lo tecleado, no solo
qué letras lleva.

El modelo es `minishlab/potion-multilingual-128M` (Model2Vec, licencia MIT):
un embedding **estático** —una tabla de vectores por pieza de texto, sin red
neuronal que ejecutar—. Embeber una consulta es tokenizarla y promediar filas
de la tabla: microsegundos en el servidor, sin GPU, sin API, sin clave. Es lo
que permite búsqueda semántica sin romper la invariante (CLAUDE.md): no hay
base de datos ni secreto, solo un archivo versionado como cualquier
instantánea.

El original pesa 512 MB (500 353 piezas × 256 dimensiones en float32, en
decenas de alfabetos). Este script lo poda a lo que el español necesita:

1. **Piezas**: las que usan las 200 000 palabras más frecuentes del español
   (`wordfreq`), más las que usan los títulos de todas las instantáneas, más
   cada carácter latino suelto —para que cualquier palabra nueva se pueda
   segmentar—. Unas 73 000. La segmentación del tokenizador podado es
   idéntica a la del original sobre el corpus (verificado: 0 diferencias en
   5 000 títulos, y el tokenizador JS coincide con el de Rust en 6 000).
2. **Dimensiones**: PCA de 256 a 128 (conserva ~79 % de la varianza; el
   solapamiento de los 10 primeros resultados con el modelo completo ronda
   el 77 %).
3. **Precisión**: int8 por fila con su escala en float32.

Resultado: ~12 MB. Se regenera solo si cambia el modelo o se quiere podar
distinto; las instantáneas nuevas no lo exigen, porque cualquier palabra se
segmenta con las piezas conservadas. Tras regenerarlo hay que volver a correr
`scripts/build-busqueda.py`: los vectores de los documentos viven en este
espacio.

Requiere: pip install numpy safetensors tokenizers wordfreq
Descarga ~530 MB de huggingface.co (público, sin credenciales).

Uso:
    python3 scripts/build-modelo-semantico.py
"""
import json
import pathlib
import re
import sys
import tempfile
import urllib.request

import numpy as np
from safetensors.numpy import load_file
from tokenizers import Tokenizer
from wordfreq import top_n_list

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DATOS = RAIZ / "public" / "data"
SALIDA = DATOS / "busqueda"
MODELO = "minishlab/potion-multilingual-128M"
REVISION = "main"
UA = "Socratico-Inteligencia/1.0 (modelo de busqueda; herramienta independiente)"
DIM = 128
PALABRAS = 200_000


def bajar(nombre: str, destino: pathlib.Path) -> None:
    url = f"https://huggingface.co/{MODELO}/resolve/{REVISION}/{nombre}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=600) as r, open(destino, "wb") as f:
        while bloque := r.read(1 << 20):
            f.write(bloque)


def textos_del_corpus() -> list[str]:
    """Los títulos de las instantáneas que alimentan el buscador."""
    t: list[str] = []
    t += json.loads((DATOS / "nomina.json").read_text())["cargos"]
    t += [f"{c['titulo']} {c['org']}" for c in json.loads((DATOS / "catalogo.json").read_text())["conjuntos"]]
    t += [f"{p['nombre']} {p['entidad']}" for p in json.loads((DATOS / "obras.json").read_text())["proyectos"]]
    t += [
        f["Titulo"]
        for filas in json.loads((DATOS / "normativa.json").read_text())["busquedas"].values()
        for f in filas
        if f.get("Titulo")
    ]
    t += [f[0] for f in json.loads((DATOS / "documentos" / "filas.json").read_text())["filas"]]
    t += [i["nombre"] for i in json.loads((DATOS / "instituciones.json").read_text())["instituciones"]]
    return t


def main() -> None:
    SALIDA.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        d = pathlib.Path(tmp)
        for nombre in ("tokenizer.json", "model.safetensors"):
            print(f"bajando {nombre}…", file=sys.stderr)
            bajar(nombre, d / nombre)
        tj = json.loads((d / "tokenizer.json").read_text())
        vocab = tj["model"]["vocab"]
        E = load_file(str(d / "model.safetensors"))["embeddings"].astype(np.float32)
        tok = Tokenizer.from_file(str(d / "tokenizer.json"))
    tok.no_padding()
    tok.no_truncation()

    textos = top_n_list("es", PALABRAS) + textos_del_corpus()
    usadas: set[int] = set()
    for i in range(0, len(textos), 5000):
        for e in tok.encode_batch(textos[i : i + 5000], add_special_tokens=False):
            usadas.update(e.ids)
    latino = re.compile(r"^▁?[\x20-\x7eÀ-ÿ]?$")
    usadas |= {i for i, (p, _) in enumerate(vocab) if latino.match(p)}
    usadas |= {a["id"] for a in tj.get("added_tokens", [])}
    usadas.add(tj["model"]["unk_id"])
    conservar = sorted(usadas)

    sub = E[conservar]
    media = sub.mean(0)
    _, S, Vt = np.linalg.svd(sub - media, full_matrices=False)
    varianza = float((S[:DIM] ** 2).sum() / (S**2).sum())
    proy = (sub - media) @ Vt[:DIM].T
    escala = np.abs(proy).max(1, keepdims=True) / 127
    escala[escala == 0] = 1
    cuant = np.round(proy / escala).astype(np.int8)

    nuevo = {viejo: n for n, viejo in enumerate(conservar)}
    tj["model"]["vocab"] = [vocab[i] for i in conservar]
    tj["model"]["unk_id"] = nuevo[tj["model"]["unk_id"]]
    for a in tj.get("added_tokens", []):
        a["id"] = nuevo[a["id"]]
    (SALIDA / "tokenizer.json").write_text(json.dumps(tj, ensure_ascii=False, separators=(",", ":")))
    # Filas int8 (N × DIM) y, detrás, una escala float32 por fila.
    (SALIDA / "modelo.bin").write_bytes(cuant.tobytes() + escala.astype("<f4").tobytes())
    meta = {
        "modelo": MODELO,
        "licencia": "MIT",
        "piezas": len(conservar),
        "dimensiones": DIM,
        "varianza": round(varianza, 4),
        # [PAD] y [UNK]: no dicen nada del texto y no entran en el promedio.
        "especiales": sorted(a["id"] for a in tj.get("added_tokens", [])),
    }
    (SALIDA / "modelo.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1) + "\n")
    print(json.dumps(meta, ensure_ascii=False), file=sys.stderr)


if __name__ == "__main__":
    main()
