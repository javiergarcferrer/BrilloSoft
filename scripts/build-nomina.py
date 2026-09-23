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
UA = "Socratico-Inteligencia/1.0 (consolidacion de nominas publicas; herramienta independiente)"

MONTHS = {m: i + 1 for i, m in enumerate(
    ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
     "septiembre", "octubre", "noviembre", "diciembre"])}
MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
               "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

# codigo -> (nombre mostrable, URL oficial del CSV; None = solo archivo local)
MANIFEST = {
    "CESAC": ("Cuerpo Especializado en Seguridad Aeroportuaria (CESAC)", None),
    "MSP": ("Ministerio de Salud Pública",
            "https://www.msp.gob.do/web/Transparencia/documentos_oai/748/nomina-de-empleados-del-msp/34685/nomina-de-empleados-mispas-2017-2026-2.csv"),
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
    # Ampliación del 2026-09-23 (PLAN-ACCESO §4.3, AUDITORIA §A.8): enlaces
    # directos sacados de las fichas HTML de datos.gob.do (su /api/ lo veta el
    # robots), bajados con el UA de arriba. Probados y descartados ese día:
    # Migración y Ayuntamiento de Santiago (403), UNADE (202 con página HTML),
    # TSE (CSV sin cabecera), IDECOOP (sin mes ni año) y CDC (mes y año en una
    # sola columna «Mes / año»).
    "DGCP": ("Dirección General de Contrataciones Públicas",
             "https://www.dgcp.gob.do/new_dgcp/documentos/da/N%C3%B3mina%20de%20Empleados,%20DGCP,%202022%20-%202026.csv"),
    "IDEICE": ("Instituto Dominicano de Evaluación e Investigación de la Calidad Educativa",
               "https://ideice.gob.do/descargas/datos-abiertos/nomina-de-empleados.csv"),
    "IAD": ("Instituto Agrario Dominicano",
            "https://iad.gob.do/wp-content/uploads/2026/08/Nomina-de-Empleados-IAD-2020-2026-Formato-CSV.csv"),
    "CGR": ("Contraloría General de la República",
            "https://contraloria.gob.do/wp-content/uploads/2025/09/Nomina-empleados-fijos-y-contratados-CSV-2018-%E2%80%93-2026-9.csv"),
    "TSS": ("Tesorería de la Seguridad Social",
            "https://tss.gob.do/descargar/2046/nominas-de-empleados-2017-2026/17730/nominas-de-empleados-2017-2026-2.csv"),
    "MIREX": ("Ministerio de Relaciones Exteriores (personal pagado en pesos)",
              "https://mirex.gob.do/transparencia/descargar/335/2018-2026/19579/nomina-personal-mirex-2018-2026.csv"),
    "PJ": ("Poder Judicial (servidores fijos)",
           "https://transparencia.poderjudicial.gob.do/documentos/DatosAbiertos/DA_NominaServidoresFijos.csv"),
    "S911": ("Sistema Nacional de Atención a Emergencias y Seguridad 9-1-1",
             "https://911.gob.do/wp-content/uploads/2026/09/Nomina-de-Empleados-Sistema911-2017-2026.csv"),
    "INABIMA": ("Instituto Nacional de Bienestar Magisterial",
                "https://transparencia.inabima.gob.do/Descarga/Datos%20Abiertos/N%C3%B3mina%20de%20Empleados,%202018%20-%202025/N%C3%B3mina%20de%20Empleados,%20INABIMA,%202018%20-%202025.csv"),
    "SVSP": ("Superintendencia de Vigilancia y Seguridad Privada",
             "https://datos.gob.do/dataset/ffbef324-a8b7-4c4c-9455-94567087df79/resource/5e008605-81f8-4e9c-90e0-fd05cc6cc774/download/nomina-de-sueldo-por-cargo-2025-2026-act.csv"),
    "DIGEPRES": ("Dirección General de Presupuesto",
                 "https://digepres.gob.do/transparencia/wp-content/uploads/2026/09/NOMINA-DATOS-ABIERTOS-2018-2026.xlsxf_.csv"),
    "LOTERIA": ("Lotería Nacional",
                "https://loterianacional.gob.do/transparencia/archivos/datos-abiertos/archivo/Nomina%20de%20Empleados,%20Agosto%202026.csv"),
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
        # «FECHA DE INGRESO» (Poder Judicial) contiene «INGRESO» y va antes que
        # «SUELDO»: una fecha leída como sueldo daba 6.897 plazas en RD$0.
        if m["sueldo"] is None and "APORT" not in k and "FECHA" not in k and (
                "SUELDOBRUTO" in k or "INGRESOBRUTO" in k or "SUELDOFIJO" in k
                or "SUELDOBASE" in k or k in ("SUELDO", "SBASE")
                or k.startswith("SUELDO") or "INGRESO" in k
                or k in ("SALARIOBRUTO", "SALARIO")):
            m["sueldo"] = i
        # «PUESTO» / «NOMBRE DEL PUESTO»: DIGEPRES y Lotería Nacional (2026-09-23).
        # «LUGAR DE FUNCIONES» (Cultura) es un sitio, no un puesto.
        if m["cargo"] is None and "LUGAR" not in k and ("CARGO" in k or "FUNCI" in k or k == "RANGO"
                                   or k in ("PUESTO", "NOMBREDELPUESTO")):
            m["cargo"] = i
        if m["area"] is None and ("DEPARTAMENTO" in k or "OFICINA" in k
                or k == "AREA" or "NOMBREAREA" in k or "LUGAR" in k
                or k == "REGION" or "UNIDAD" in k or "DIRECCION" in k
                or k in ("DEPENDENCIA", "UBICACION")):
            m["area"] = i
        if m["mes"] is None and (k == "MES" or "PERIODOMES" in k or k.endswith("MES")):
            m["mes"] = i
        if m["anio"] is None and (k in ("ANO", "AO", "ANIO", "PERIODO") or "ANO" in k):
            m["anio"] = i
    # Una columna exacta de cargo gana a la primera que solo lo contenga.
    for i, h in enumerate(header):
        if hkey(h) in ("CARGO", "CARGOTITULAR"):
            m["cargo"] = i
            break
    # Una columna exacta de sueldo gana a la primera que solo lo contenga.
    for i, h in enumerate(header):
        if hkey(h) in ("SUELDO", "SUELDOBRUTO", "SALARIO", "SALARIOBRUTO"):
            m["sueldo"] = i
            break
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


# Qué parece el nombre de una dependencia y no el de un puesto.
DEPENDENCIA = re.compile(
    r"^(DIRECCI|SUB-?DIRECCI|DEPARTAMENTO|DEPTO|DIVISI|SECCI|OFICINA|UNIDAD|"
    r"GERENCIA|VICEMINISTERIO|DESPACHO|REGIONAL|CONSULTOR[IÍ]A)", re.I)
TOTAL = re.compile(r"^(MONTO\s+)?TOTAL\b", re.I)
SEXO = {"M", "F", "MASCULINO", "FEMENINO"}
# Instituciones donde un sueldo 0 no es un error del parser sino otra moneda.
# MIREX paga en US$ al personal en el exterior (columna «SUELDO BRUTO US$»):
# no se mezclan monedas, así que esas plazas se dejan fuera y se declara.
SOLO_PESOS = {"MIREX"}
# Fuentes que no se pueden leer sin adivinar, con el porqué. Quedan fuera de
# la instantánea y lo dice /fuentes.
EXCLUIDAS = {
    # Escribe unos sueldos con decimales («13500») y otros sin el punto
    # («1335219» por 13,352.19): no hay forma segura de saber cuál es cuál.
    "ICM": "sueldos sin separador decimal, ilegibles sin adivinar",
}


def sanear(code, rows):
    """Arregla lo que la fuente cambió a mitad del archivo y falla si queda
    algo imposible. Cada regla viene de un defecto visto el 2026-09-23."""
    # La fila de total que algunas fuentes cuelan como una plaza (SVSP).
    rows = [r for r in rows if not (TOTAL.match(r[3]) or TOTAL.match(r[2]))]
    if code in SOLO_PESOS:
        rows = [r for r in rows if r[4] > 0]
    n = len(rows) or 1
    # Cargo y área cambiados de columna en los meses recientes (IAD, CGR): la
    # cabecera no cambió, las filas sí.
    cargo_dep = sum(1 for r in rows if DEPENDENCIA.match(r[3])) / n
    area_dep = sum(1 for r in rows if DEPENDENCIA.match(r[2])) / n
    if cargo_dep > 0.5 and area_dep < 0.2:
        rows = [(a, m, cargo, area, s) for (a, m, area, cargo, s) in rows]
        print(f"  ~ {code}: cargo y área venían cambiados; se corrigen")
    # Una columna de área que en realidad trae el sexo (INABIMA): se vacía.
    con_area = [r for r in rows if r[2]]
    if con_area and sum(1 for r in con_area if r[2].upper() in SEXO) / len(con_area) > 0.8:
        rows = [(a, m, "", c, s) for (a, m, _, c, s) in rows]
        print(f"  ~ {code}: el área traía el sexo; se descarta")
    # Controles: si fallan, la instantánea no se escribe.
    ceros = sum(1 for r in rows if r[4] <= 0) / n
    if ceros > 0.05:
        raise SystemExit(f"{code}: {ceros:.0%} de las plazas del mes en RD$0 — ¿columna de sueldo equivocada?")
    total = sum(r[4] for r in rows) or 1
    mayor = max(rows, key=lambda r: r[4]) if rows else None
    if mayor and len(rows) > 5 and mayor[4] / total > 0.4:
        raise SystemExit(f"{code}: una fila ({mayor[3]}) es el {mayor[4] / total:.0%} de la masa — ¿un total colado?")
    if len(rows) > 5:
        sueldos = sorted(r[4] for r in rows)
        mediana = sueldos[len(sueldos) // 2] or 1
        if sueldos[-1] / mediana > 40:
            raise SystemExit(f"{code}: un sueldo es {sueldos[-1] / mediana:.0f} veces la mediana — ¿decimales perdidos?")
    if sum(1 for r in rows if DEPENDENCIA.match(r[3])) / n > 0.5:
        raise SystemExit(f"{code}: la mayoría de los «cargos» parecen dependencias")
    return rows


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
    """Baja cada CSV: UA identificable, un reintento, `content-type` validado
    (un 200 puede ser una página HTML) y, en datos.gob.do, la pausa de diez
    segundos que pide su `Crawl-Delay`."""
    import time
    os.makedirs(DIR, exist_ok=True)
    for code, (_, url) in MANIFEST.items():
        if not url:
            continue
        dest = os.path.join(DIR, f"{code}.csv")
        if "datos.gob.do" in url:
            time.sleep(10)
        print(f"  ↓ {code} ← {url[:80]}…")
        for intento in (1, 2):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=90) as r:
                    tipo = r.headers.get("Content-Type", "")
                    if "html" in tipo.lower():
                        raise ValueError(f"respondió {tipo}, no un CSV")
                    datos = r.read()
                with open(dest, "wb") as f:
                    f.write(datos)
                break
            except Exception as err:  # noqa: BLE001 — se reporta y se sigue
                if intento == 2:
                    print(f"  ! {code}: {err}")


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
        if code in EXCLUIDAS:
            print(f"  - {code}: fuera — {EXCLUIDAS[code]}")
            continue
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
        mrows = sanear(code, mrows)
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
