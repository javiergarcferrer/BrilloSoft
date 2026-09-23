#!/usr/bin/env python3
"""Genera public/data/instituciones.json: el cruce que convierte cuatro
catálogos del Estado en una sola entidad «institución».

La institución es la **unidad de compra** de la DGCP —la unidad más fina que
tiene código estable— y se ata a:

- su **capítulo presupuestario** (SIGEF), por el campo `codigo_capitulo` que la
  propia DGCP publica (`{año}{capítulo}{…}`): el cruce no es un emparejamiento
  de nombres, lo declara el Estado;
- su **nómina**, por la tabla `NOMINA` de abajo, curada a mano contra el
  catálogo (solo cuando la correspondencia es inequívoca);
- sus **decretos**, por la etiqueta `Institucion` de la Consultoría Jurídica,
  emparejada por nombre normalizado. La etiqueta «Cámara de Cuentas» se
  excluye: la Consultoría la pone en todo nombramiento (el designado declara
  patrimonio ante la Cámara), no en lo que atañe a la Cámara.

Es un archivo versionado, no una base de datos. Regenerar cuando cambie el
catálogo de unidades de compra (raro) o la instantánea de normativa:

    python3 scripts/build-instituciones.py
"""
import json
import pathlib
import re
import unicodedata
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "public" / "data" / "instituciones.json"
DGCP = "https://datosabiertos.dgcp.gob.do/api-dgcp/v1/unidades_compra?limit=1000"
UA = "Socratico-Inteligencia/1.0 (cruce de instituciones; herramienta independiente)"

# Código de nómina (lib/nomina.ts) → código de unidad de compra (DGCP).
# El Consejo del Café (CCDF) queda fuera: el catálogo solo tiene INDOCAFE, que
# es otra entidad.
NOMINA = {
    "CESAC": 811, "MSP": 240, "MESCYT": 264, "MINC": 259, "MEM": 916,
    "DIGEIG": 720, "CND": 893, "DEFCIVIL": 904, "JAC": 554, "ICM": 158,
}

ETIQUETA_NOMBRAMIENTOS = "camara de cuentas"


def normalizar(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\([^)]*\)", " ", s)          # acrónimos entre paréntesis
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\b(dir|dir\.)\b", "direccion", s)
    s = re.sub(r"\bgral\b", "general", s)
    s = re.sub(r"\b(de|del|la|las|los|el|y|e|para)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def main() -> None:
    req = urllib.request.Request(DGCP, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        unidades = [u for u in json.load(r)["payload"]["content"] if u.get("estado") == "ACTIVA"]

    fiscal = json.loads((RAIZ / "public" / "data" / "fiscal.json").read_text())
    capitulos = {i["codigo"]: i["nombre"] for i in fiscal["instituciones"]}

    normativa = json.loads((RAIZ / "public" / "data" / "normativa.json").read_text())
    etiquetas = set()
    for filas in normativa["busquedas"].values():
        for f in filas:
            if f.get("Institucion"):
                etiquetas.add(f["Institucion"].strip())
    por_nombre = {}
    for e in etiquetas:
        clave = normalizar(e)
        if clave and ETIQUETA_NOMBRAMIENTOS not in clave:
            por_nombre.setdefault(clave, []).append(e)

    nomina_por_uc = {uc: cod for cod, uc in NOMINA.items()}
    salida = []
    for u in unidades:
        cod = u["codigo_unidad_compra"]
        cap = (u.get("codigo_capitulo") or "")[4:8]
        salida.append({
            "id": cod,
            "nombre": u["unidad_compra"].strip(),
            "acronimo": (u.get("acronimo") or "").strip(),
            "tipo": u.get("tipo") or "",
            "capitulo": cap if cap in capitulos else None,
            "nomina": nomina_por_uc.get(cod),
            "consultoria": sorted(por_nombre.get(normalizar(u["unidad_compra"]), [])),
        })
    salida.sort(key=lambda x: x["id"])

    SALIDA.write_text(json.dumps({"instituciones": salida}, ensure_ascii=False, separators=(",", ":")))
    con_cap = sum(1 for x in salida if x["capitulo"])
    con_dec = sum(1 for x in salida if x["consultoria"])
    print(f"{len(salida)} unidades · {con_cap} con capítulo · "
          f"{sum(1 for x in salida if x['nomina'])} con nómina · {con_dec} con decretos")
    print(f"→ {SALIDA} ({SALIDA.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
