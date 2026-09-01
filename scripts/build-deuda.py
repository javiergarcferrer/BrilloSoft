#!/usr/bin/env python3
"""Genera public/data/deuda.json: instantánea del saldo de deuda del SPNF.

Crédito Público publica la serie como XLSX mensual, pero su servidor
(on-premise en RD) no responde al egreso de Vercel, así que lib/deuda.ts
intenta la lectura en vivo y cae a esta instantánea. Regenerar cuando haya un
mes nuevo:

    python3 scripts/build-deuda.py

Requiere red con acceso a creditopublico.gob.do (p. ej. una máquina local).
"""
import datetime
import io
import json
import re
import urllib.parse
import urllib.request
import zipfile

BASE = "https://www.creditopublico.gob.do"
UA = "GobiernoRD-Inteligencia/1.0 (instantanea de deuda; herramienta independiente)"
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def desentificar(s: str) -> str:
    s = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), s)
    return s.replace("&amp;", "&")


def main() -> None:
    html = get(f"{BASE}/inicio/estadisticas").decode("utf-8", "replace")
    enlaces = [desentificar(h) for h in
               re.findall(r'href="(/Content/estadisticas/[^"]+\.xlsx)"', html)]
    enlaces = [h for h in enlaces if re.search(r"Saldo\s+Evoluci", h, re.I)]

    def rango(ruta: str) -> int:
        m = re.search(r"/anual/(\d{4})/(\d{1,2})([A-Za-zÁÉÍÓÚáéíóú]+)/", ruta)
        if not m:
            return 0
        mes = MESES.index(m.group(3).lower()) + 1 if m.group(3).lower() in MESES else 0
        return int(m.group(1)) * 100 + mes

    enlaces.sort(key=rango, reverse=True)
    url = BASE + urllib.parse.quote(enlaces[0])
    z = zipfile.ZipFile(io.BytesIO(get(url)))

    shared = z.read("xl/sharedStrings.xml").decode("utf-8", "replace")
    strs = [re.sub(r"<[^>]+>", "", t)
            for t in re.findall(r"<si>(.*?)</si>", shared, re.S)]
    wb = z.read("xl/workbook.xml").decode("utf-8", "replace")
    periodo = re.sub(r"^Saldo-Evoluci[oó]n\s*", "",
                     re.search(r'<sheet name="([^"]+)"', wb).group(1)).strip()
    sxml = z.read("xl/worksheets/sheet1.xml").decode("utf-8", "replace")

    def celdas(rxml: str) -> dict:
        out = {}
        for c in re.finditer(
            r'<c r="([A-Z]+)\d+"(?:[^>]* t="([a-z]+)")?[^>]*>'
            r"(?:<f>[^<]*</f>)?(?:<v>([^<]*)</v>)?", rxml):
            col, t, v = c.group(1), c.group(2), c.group(3)
            if v is None:
                continue
            if t == "s":
                v = strs[int(v)] if int(v) < len(strs) else v
            out[col] = v
        return out

    saldo_total = saldo_ext = saldo_int = None
    filas = re.findall(r'<row[^>]*r="\d+"[^>]*>(.*?)</row>', sxml, re.S)
    for rxml in filas:
        c = celdas(rxml)
        et = c.get("B", "")
        if re.match(r"^Deuda\s+P[uú]blica\s+Total", et):
            saldo_total = float(c["C"])
        elif re.search(r"Deuda\s+Externa\s+Total", et):
            saldo_ext = float(c["C"])
        elif re.search(r"Deuda\s+Interna\s+Total", et):
            saldo_int = float(c["C"])

    assert saldo_total, "no se encontró la fila de Deuda Pública Total"
    data = {
        "generadoEn": datetime.date.today().isoformat(),
        "periodo": periodo,
        "saldoTotal": round(saldo_total, 2),
        "saldoExterna": round(saldo_ext or 0, 2),
        "saldoInterna": round(saldo_int or 0, 2),
        "fuente": url,
    }
    with open("public/data/deuda.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f"{periodo}: total US${saldo_total:,.1f}M "
          f"(ext {saldo_ext:,.1f} / int {saldo_int:,.1f}) -> public/data/deuda.json")


if __name__ == "__main__":
    main()
