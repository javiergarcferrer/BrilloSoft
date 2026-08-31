#!/usr/bin/env python3
"""Consolida la nómina pública en una foto transversal por institución.

Cada institución del Estado publica su nómina bajo el estándar de transparencia
(Ley 200-04) en formatos que solo coinciden en el concepto: cambian el
delimitador (`,`/`;`), la codificación (UTF-8/cp1252/cp850), y los nombres de
columna (CARGO/FUNCIÓN/RANGO, DEPARTAMENTO/OFICINA/ÁREA/LUGAR, SUELDO
BRUTO/INGRESO BRUTO/SUELDO BASE…). Este script normaliza todo eso y emite
`public/data/nomina.json` con **el último mes publicado por cada institución**
(no meses futuros: hay filas mal fechadas), que es lo que mantiene el archivo
acotado: cobertura ancha en instituciones, un mes de profundidad.

No se ingieren nombres de personas ni género: cada fila queda como
(institución, área, cargo, sueldo bruto).

Uso:
    python3 scripts/build-nomina.py --descargar   # baja las fuentes del manifiesto
    python3 scripts/build-nomina.py               # usa scripts/fuentes-nomina/*.csv

Para sumar una institución: añadirla a MANIFEST con la URL de su CSV de nómina
(la mayoría aparece buscando su dataset en datos.gob.do) y regenerar. El parser
tolera los formatos conocidos; si uno nuevo no mapea, lo dirá.
"""
import csv
import datetime
import json
import os
import re
import sys
import unicodedata
import urllib.request

DIR = os.path.join(os.path.dirname(__file__), "fuentes-nomina")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data", "nomina.json")
UA = "GobiernoRD-Inteligencia/1.0 (consolidacion de nominas publicas; herramienta independiente)"

MONTHS = {m: i + 1 for i, m in enumerate(
    ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
     "septiembre", "octubre", "noviembre", "diciembre"])}
MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
               "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

# codigo -> (nombre mostrable, URL oficial del CSV; None = solo archivo local)
MANIFEST = {
    "CESAC": ("Cuerpo Especializado en Seguridad Aeroportuaria (CESAC)", None),
    "MSP": ("Ministerio de Salud Pública",
            "https://www.msp.gob.do/web/Transparencia/documentos_oai/748/nomina-de-empleados-del-msp/34592/nomina-de-empleados-mispas-2017-2026-6.csv"),
    "MESCYT": ("Ministerio de Educación Superior, Ciencia y Tecnología",
               "https://mescyt.gob.do/transparencia/download/3954/nomina-de-empleados-fijos/15746/da-nomina-de-empleados-fijos-mescyt-2018-2025-en-cvs.csv"),
    "MINC": ("Ministerio de Cultura",
             "https://cultura.gob.do/wp-content/uploads/2026/08/Nomina-de-Empleados-MINC-2019-2026.csv"),
    "MEM": ("Ministerio de Energía y Minas",
            "https://mem.gob.do/datosabiertos/nomina/NOMINA-DATOS-ABIERTOS-JULIO-2026.csv"),
    "DIGEIG": ("Dir. Gral. de Ética e Integridad Gubernamental",
               "https://digeig.gob.do/wp-content/uploads/2026/08/Nomina-Empleados-Fijos-Contratados-2017-2026.csv"),
    "CND": ("Consejo Nacional de Drogas",
            "https://consejodedrogasrd.gob.do/wp-content/uploads/2023/06/Nomina-personal-civil-anos-2017-2026-6.csv"),
    "DEFCIVIL": ("Defensa Civil",
                 "https://defensacivil.gob.do/transparencia/images/docs/datos-abiertos/2026/Actualizado%20j/NewFolder/NOMINA-de-Empleados-Fijo-DC-2018-2026_1NOMINA-de-Empleados-Fijo_1.csv"),
    "CCDF": ("Consejo del Café Dominicano (CCDF)",
             "https://ccdf.gob.do/wp-content/uploads/2024/09/Nomina-de-empleados-CCDF-2020-%E2%80%93-2026.CSV-6.csv"),
    "JAC": ("Junta de Aviación Civil",
            "https://jac.gob.do/wp-content/uploads/2026/04/Nomina-personal-fijo-y-contratado-2026.csv"),
    "ICM": ("Instituto Cartográfico Militar",
            "https://datos.gob.do/dataset/de850f20-9770-4409-88d6-32d78fe1098b/resource/9847ec68-e7c4-40af-acbf-2c95206eabec/download/nomina-fija-icm-202"),
}


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")


def hkey(h: str) -> str:
    """Clave de cabecera tolerante a mojibake: solo letras/dígitos ASCII."""
    return re.sub(r"[^A-Z0-9]", "", strip_accents(h).upper())


def decode_best(raw: bytes) -> str:
    """La codificación que produzca el español más sano (ñ/acentos)."""
    best, score = "latin-1", -1
    for enc in ("utf-8-sig", "cp1252", "cp850", "latin-1"):
        try:
            t = raw.decode(enc)
        except Exception:
            continue
        s = sum(t.count(c) for c in "áéíóúñÁÉÍÓÚÑ") - t.count("�") * 5
        if s > score:
            best, score = enc, s
    return best


def parse_money(v: str) -> int:
    v = re.sub(r"[^\d.,-]", "", v or "").strip()
    if not v:
        return 0
    if "," in v and "." in v:
        dec = "," if v.rfind(",") > v.rfind(".") else "."
        v = v.replace("." if dec == "," else ",", "").replace(dec, ".")
    elif "," in v:
        v = v.replace(",", "." if re.search(r",\d{1,2}$", v) else "")
    try:
        return int(round(float(v)))
    except ValueError:
        return 0


def parse_month(v: str):
    v = strip_accents((v or "").strip().lower())
    if v in MONTHS:
        return MONTHS[v]
    if v.isdigit() and 1 <= int(v) <= 12:
        return int(v)
    return None


def col_map(header):
    m = dict.fromkeys(("sueldo", "cargo", "area", "mes", "anio"), None)
    for i, h in enumerate(header):
        k = hkey(h)
        if m["sueldo"] is None and "APORT" not in k and (
                "SUELDOBRUTO" in k or "INGRESOBRUTO" in k or "SUELDOFIJO" in k
                or "SUELDOBASE" in k or k in ("SUELDO", "SBASE")
                or k.startswith("SUELDO") or "INGRESO" in k):
            m["sueldo"] = i
        if m["cargo"] is None and ("CARGO" in k or "FUNCI" in k or k == "RANGO"):
            m["cargo"] = i
        if m["area"] is None and ("DEPARTAMENTO" in k or "OFICINA" in k
                or k == "AREA" or "NOMBREAREA" in k or "LUGAR" in k
                or k == "REGION" or "UNIDAD" in k or "DIRECCION" in k):
            m["area"] = i
        if m["mes"] is None and (k == "MES" or "PERIODOMES" in k or k.endswith("MES")):
            m["mes"] = i
        if m["anio"] is None and (k in ("ANO", "AO", "ANIO", "PERIODO") or "ANO" in k):
            m["anio"] = i
    return m


def read_rows(path):
    raw = open(path, "rb").read()
    enc = decode_best(raw)
    lines = raw.decode(enc, errors="replace").splitlines()
    if not lines:
        return [], enc
    delim = ";" if lines[0].count(";") > lines[0].count(",") else ","
    reader = csv.reader(lines, delimiter=delim)
    header = next(reader, [])
    cm = col_map(header)
    faltan = [k for k in ("sueldo", "cargo", "mes", "anio") if cm[k] is None]
    if faltan:
        raise SystemExit(f"{path}: sin columnas {faltan} · header={header}")
    need = max(x for x in cm.values() if x is not None)
    rows = []
    for r in reader:
        if len(r) <= need:
            continue
        mes = parse_month(r[cm["mes"]])
        try:
            anio = int(re.sub(r"\D", "", r[cm["anio"]])[:4])
        except ValueError:
            anio = 0
        if not mes or anio < 2015 or anio > 2030:
            continue
        cargo = " ".join(r[cm["cargo"]].split()).strip() or "(sin cargo)"
        area = (" ".join(r[cm["area"]].split()).strip()
                if cm["area"] is not None else "")
        rows.append((anio, mes, area, cargo, parse_money(r[cm["sueldo"]])))
    return rows, enc


def ultimo_mes(rows):
    """El período más reciente que no esté en el futuro (hay filas mal fechadas)."""
    hoy = datetime.date.today()
    tope = hoy.year * 100 + hoy.month
    claves = [a * 100 + m for a, m, *_ in rows if a * 100 + m <= tope]
    if not claves:
        return None
    key = max(claves)
    return key // 100, key % 100, [r for r in rows if r[0] * 100 + r[1] == key]


def descargar():
    os.makedirs(DIR, exist_ok=True)
    for code, (_, url) in MANIFEST.items():
        if not url:
            continue
        dest = os.path.join(DIR, f"{code}.csv")
        print(f"  ↓ {code} ← {url[:80]}…")
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=90) as r, open(dest, "wb") as f:
            f.write(r.read())


def main():
    if "--descargar" in sys.argv:
        descargar()

    inst_meta, ai, ci = [], [], []
    di_a, di_c = {}, {}
    rows_out = []

    def idx(d, arr, v):
        if v not in d:
            d[v] = len(arr)
            arr.append(v)
        return d[v]

    for code, (nombre, _) in MANIFEST.items():
        path = os.path.join(DIR, f"{code}.csv")
        if not os.path.exists(path):
            print(f"  ! {code}: falta {path} (correr con --descargar)")
            continue
        rows, enc = read_rows(path)
        lt = ultimo_mes(rows)
        if not lt:
            print(f"  ! {code}: sin filas válidas")
            continue
        a, m, mrows = lt
        ii = len(inst_meta)
        masa = sum(r[4] for r in mrows)
        inst_meta.append({"codigo": code, "nombre": nombre, "anio": a, "mes": m,
                          "plazas": len(mrows), "masa": masa})
        for (_, _, area, cargo, sueldo) in mrows:
            rows_out.append([ii, idx(di_a, ai, area or "(sin área)"),
                             idx(di_c, ci, cargo), sueldo])
        print(f"  {code:9s} {nombre[:40]:42s} {a}-{m:02d} · {len(mrows):6,} plazas · {enc}")

    data = {
        "generatedAt": datetime.date.today().isoformat(),
        "esquema": "transversal-ultimo-mes",
        "currency": "DOP",
        "monthNames": MONTH_NAMES,
        "instituciones": inst_meta,
        "areas": ai,
        "cargos": ci,
        "rows": rows_out,
    }
    out = os.path.normpath(OUT)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(data, open(out, "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    tot = sum(i["plazas"] for i in inst_meta)
    masa = sum(i["masa"] for i in inst_meta)
    print(f"\n{len(inst_meta)} instituciones · {tot:,} plazas · masa mensual "
          f"RD${masa:,.0f} · {len(ai)} áreas · {len(ci)} cargos "
          f"-> {out} ({os.path.getsize(out) / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
