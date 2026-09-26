#!/usr/bin/env python3
"""Genera public/data/busqueda/{corpus.json,vectores.bin}: el índice del
buscador de toda la plataforma (`/buscar`, la paleta ⌘K, `/api/buscar`).

No lee ninguna fuente: junta en un solo corpus lo que ya traen las
instantáneas —instituciones, normativa, obras, documentos, datos abiertos y
cargos de nómina— y calcula para cada entrada su vector semántico con el
modelo podado de `scripts/build-modelo-semantico.py`. El servidor construye
sobre esto un índice de texto (Orama: BM25, raíces del español, tolerancia a
erratas) y compara vectores por coseno; `lib/busqueda.ts` funde las dos
listas. Nada de esto es una base de datos: es un archivo versionado más.

Se corre **después** de regenerar cualquiera de esas instantáneas (el orden
semanal: normativa → instituciones → este). Si no se corre, el buscador
sigue funcionando con el corpus anterior y dice su fecha.

Los vectores se calculan con el tokenizador de Rust (`tokenizers`); el del
servidor es `@huggingface/tokenizers` (JS). Dan exactamente los mismos ids
(verificado sobre 6 000 títulos), así que consulta y documento viven en el
mismo espacio.

Requiere: pip install numpy tokenizers

Uso:
    python3 scripts/build-busqueda.py
"""
import datetime
import json
import pathlib
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from urllib.parse import quote, unquote

import numpy as np
from tokenizers import Tokenizer

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DATOS = RAIZ / "public" / "data"
SALIDA = DATOS / "busqueda"

TIPO_NORMA = {1: "Ley", 3: "Decreto", 4: "Reglamento", 7: "Resolución"}
RUTA_NORMA = {"Ley": "ley", "Decreto": "decreto", "Reglamento": "reglamento", "Resolución": "resolucion"}


def plano(s: str) -> str:
    """Sin tildes ni mayúsculas: la misma `normalize` de lib/dgcp.ts."""
    return "".join(c for c in unicodedata.normalize("NFD", s or "") if unicodedata.category(c) != "Mn").lower()


# Quién publica o ejecuta: se repite miles de veces, así que viaja una vez
# en `origenes` y cada entrada lleva su índice.
ORIGENES: list[str] = []
_POS: dict[str, int] = {}


def origen(nombre: str) -> int:
    if nombre not in _POS:
        _POS[nombre] = len(ORIGENES)
        ORIGENES.append(nombre)
    return _POS[nombre]


def slug_institucion(i: dict) -> str:
    """El mismo tramo que `slugInstitucion` en lib/instituciones.ts."""
    base = re.sub(r"[^a-z0-9]+", "-", plano(i["acronimo"] or i["nombre"])).strip("-")[:40]
    return f"{i['id']}-{base}" if base else str(i["id"])


def instituciones() -> list[dict]:
    datos = json.loads((DATOS / "instituciones.json").read_text())["instituciones"]
    return [
        {
            "t": "institucion",
            "ti": i["nombre"],
            "x": i["acronimo"],
            "d": " · ".join(v for v in (i["acronimo"], i["tipo"]) if v),
            "h": f"/instituciones/{slug_institucion(i)}",
            # Un ministerio pesa más que un hospital o un ayuntamiento que se
            # llaman parecido (el mismo criterio que `buscarInstituciones`).
            "p": 0 if i["tipo"] == "Institución" else 1 if i["tipo"] != "Gobierno local" else 2,
        }
        for i in datos
    ]


def normas() -> tuple[list[dict], str]:
    crudo = json.loads((DATOS / "normativa.json").read_text())
    vistas: set[str] = set()
    out = []
    for filas in crudo["busquedas"].values():
        for f in filas:
            if not f.get("Titulo"):
                continue
            tipo = TIPO_NORMA.get(f.get("TipoDocumento") or 0, "Norma")
            numero = (f.get("Numero") or "").strip()
            fecha = (f.get("FechaPromulgacion") or "")[:10] or None
            # El origen repite algunas normas: una norma es tipo, número y fecha.
            clave = f"{tipo}|{numero}|{fecha or ''}"
            if clave in vistas:
                continue
            vistas.add(clave)
            ruta = RUTA_NORMA.get(tipo)
            out.append(
                {
                    "t": "norma",
                    "ti": f["Titulo"],
                    "x": f"{tipo} {numero}",
                    "d": f"{tipo} {numero}".strip(),
                    "h": f"/normativa/{ruta}/{numero}" if ruta and re.fullmatch(r"\d{1,4}-\d{2,4}", numero) else None,
                    "f": fecha,
                }
            )
    return out, crudo["generadoEn"]


def obras() -> tuple[list[dict], str]:
    crudo = json.loads((DATOS / "obras.json").read_text())
    return [
        {
            "t": "obra",
            "ti": p["nombre"],
            "x": f"{p['snip']} {' '.join(p['provincias'])}",
            "d": f"SNIP {p['snip']} · {p['estado']}",
            "o": origen(p["entidad"]),
            "h": f"/obras/{p['snip']}",
            "v": p["valor"],
            "f": p.get("inicio"),
        }
        for p in crudo["proyectos"]
    ], crudo["generado"]


def documentos() -> tuple[list[dict], str]:
    filas = json.loads((DATOS / "documentos" / "filas.json").read_text())
    indice = json.loads((DATOS / "documentos" / "indice.json").read_text())
    nombre = {f["host"]: f["nombre"] for f in indice["fuentes"]}
    out = []
    for titulo, fecha, tipo, url, h in filas["filas"]:
        host = filas["hosts"][h]
        # Un título que es el nombre del archivo («Decreto-403-2026-Establece…»)
        # se lee con espacios.
        if " " not in titulo and re.search(r"[-_]", titulo):
            titulo = re.sub(r"[-_]+", " ", titulo).strip()
        # Del nombre del archivo solo lo que el título no dice ya.
        ya = set(plano(titulo).split())
        archivo = re.sub(r"[-_.]+", " ", unquote(url.rsplit("/", 1)[-1]).rsplit(".", 1)[0])
        # Sin restos de sufijo: «2», «adm» o «v1» no ayudan a encontrar nada.
        resto = " ".join(w for w in archivo.split() if plano(w) not in ya and len(w) > 3 and not w.isdigit())
        out.append(
            {
                "t": "documento",
                "ti": titulo,
                "x": resto,
                "d": tipo.upper(),
                "o": origen(nombre.get(host, host)),
                "h": url,
                "f": fecha,
                "e": 1,
            }
        )
    return out, indice["generado"]


def datos_abiertos() -> tuple[list[dict], str]:
    crudo = json.loads((DATOS / "catalogo.json").read_text())
    return [
        {
            "t": "dato",
            "ti": c["titulo"],
            "x": " ".join(c["grupos"]),
            "d": ", ".join(c["formatos"][:3]),
            "o": origen(c["org"]),
            "h": f"https://datos.gob.do/dataset/{quote(c['slug'], safe='')}",
            "e": 1,
        }
        for c in crudo["conjuntos"]
    ], crudo["generado"]


def cargos() -> tuple[list[dict], str]:
    """Un cargo es su nombre sin tildes, mayúsculas ni espacios de más:
    «CHOFER», «Chofer» y «chofer» son la misma plaza escrita por tres
    instituciones. Se muestra la grafía más frecuente."""
    crudo = json.loads((DATOS / "nomina.json").read_text())
    clave = [re.sub(r"\s+", " ", plano(c)).strip() for c in crudo["cargos"]]
    plazas: Counter = Counter()
    grafias: dict[str, Counter] = defaultdict(Counter)
    inst: dict[str, set] = defaultdict(set)
    for fila in crudo["rows"]:
        i, c = fila[0], fila[2]
        k = clave[c]
        plazas[k] += 1
        grafias[k][crudo["cargos"][c]] += 1
        inst[k].add(i)
    out = []
    for k, n in plazas.items():
        nombre = grafias[k].most_common(1)[0][0].strip()
        out.append(
            {
                "t": "cargo",
                "ti": nombre,
                "d": "",
                "h": f"/nomina?q={quote(nombre, safe='')}",
                "n": n,
                "m": len(inst[k]),
                # Una plaza pesa menos que una institución, una norma o una
                # obra que se llaman igual: «escuelas» busca escuelas antes
                # que al vigilante de una.
                "p": 1,
            }
        )
    return out, crudo["generatedAt"][:10]


def main() -> None:
    tok = Tokenizer.from_file(str(SALIDA / "tokenizer.json"))
    tok.no_padding()
    tok.no_truncation()
    meta = json.loads((SALIDA / "modelo.json").read_text())
    dim, especiales = meta["dimensiones"], set(meta["especiales"])
    crudo = np.frombuffer((SALIDA / "modelo.bin").read_bytes(), dtype=np.int8)
    n = meta["piezas"]
    tabla = crudo[: n * dim].reshape(n, dim).astype(np.float32)
    tabla *= np.frombuffer(crudo[n * dim :].tobytes(), dtype="<f4")[:, None]

    docs: list[dict] = []
    fechas: dict[str, str] = {}
    docs += instituciones()
    for tipo, (lista, fecha) in {
        "norma": normas(),
        "obra": obras(),
        "documento": documentos(),
        "dato": datos_abiertos(),
        "cargo": cargos(),
    }.items():
        docs += lista
        fechas[tipo] = fecha

    # El vector es el del título en minúsculas —la consulta también se
    # embebe en minúsculas: un título en MAYÚSCULAS se trocea en piezas
    # raras y cae lejos de su tema—.
    textos = [d["ti"].lower() for d in docs]
    vec = np.zeros((len(docs), dim), dtype=np.float32)
    for inicio in range(0, len(textos), 5000):
        for j, e in enumerate(tok.encode_batch(textos[inicio : inicio + 5000], add_special_tokens=False)):
            ids = [i for i in e.ids if i not in especiales]
            if ids:
                v = tabla[ids].mean(0)
                norma = np.linalg.norm(v)
                if norma:
                    vec[inicio + j] = v / norma
    escala = np.abs(vec).max(1, keepdims=True) / 127
    escala[escala == 0] = 1
    cuant = np.round(vec / escala).astype(np.int8)
    (SALIDA / "vectores.bin").write_bytes(cuant.tobytes() + escala.astype("<f4").tobytes())

    # Sin claves vacías: el archivo viaja entero en cada arranque en frío.
    limpios = [{k: v for k, v in d.items() if v not in (None, "")} for d in docs]
    corpus = {
        "generado": datetime.date.today().isoformat(),
        "instantaneas": fechas,
        "dimensiones": dim,
        "piezas": n,
        "origenes": ORIGENES,
        "docs": limpios,
    }
    (SALIDA / "corpus.json").write_text(json.dumps(corpus, ensure_ascii=False, separators=(",", ":")))
    cuenta = Counter(d["t"] for d in docs)
    print(f"{len(docs)} entradas: {dict(cuenta)}", file=sys.stderr)


if __name__ == "__main__":
    main()
