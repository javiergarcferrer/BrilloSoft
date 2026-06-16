#!/usr/bin/env python3
"""Transform the raw "Nómina de Empleados Fijos" CSV into a compact, encoded
JSON consumed by the /nomina explorer.

Usage:
    python3 scripts/build-nomina.py path/to/nomina.csv

The raw CSV columns are: LOCALIDAD, CARGO, ESTATUD, SUELDO, MES, AÑO (+2 empty).
It contains 35 monthly snapshots and has dirty MES/LOCALIDAD values (trailing
spaces, mixed case, accents). This script normalizes months to 1–12, trims and
de-duplicates localidad/cargo, dictionary-encodes them, and emits
public/data/nomina.json as {localidades, cargos, monthNames, rows:[[loc, cargo,
sueldo, mes(1-12), anio]]}.
"""
import csv
import json
import os
import sys
import unicodedata
import datetime

MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "octubre": 10, "noviembre": 11,
    "diciembre": 12,
}
MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
               "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]


def norm_month(s: str):
    s = s.strip().lower()
    s = "".join(c for c in unicodedata.normalize("NFD", s)
                if unicodedata.category(c) != "Mn")
    return MONTHS.get(s)


def clean(s: str) -> str:
    return " ".join(s.split()).strip()


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "nomina.csv"
    out = "public/data/nomina.json"

    idx_loc, locs = {}, []
    idx_car, cars = {}, []

    def get(d, arr, v):
        if v not in d:
            d[v] = len(arr)
            arr.append(v)
        return d[v]

    rows = []
    with open(src, newline="", encoding="utf-8") as f:
        r = csv.reader(f)
        next(r)  # header
        for x in r:
            if len(x) < 6:
                continue
            loc, car = clean(x[0]), clean(x[1])
            try:
                sal = int(round(float(x[3].strip().replace(",", ""))))
            except ValueError:
                sal = 0
            m, y = norm_month(x[4]), int(x[5].strip())
            if m is None:
                continue
            rows.append([get(idx_loc, locs, loc),
                         get(idx_car, cars, car), sal, m, y])

    data = {
        "generatedAt": datetime.date.today().isoformat(),
        "source": "Nómina de Empleados Fijos (EMPLEADO FIJO) · 2023–2026",
        "currency": "DOP",
        "columns": ["localidad", "cargo", "sueldo", "mes", "anio"],
        "monthNames": MONTH_NAMES,
        "localidades": locs,
        "cargos": cars,
        "rows": rows,
    }
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(rows)} rows · {len(locs)} localidades · {len(cars)} cargos "
          f"-> {out} ({os.path.getsize(out)/1e6:.2f} MB)")


if __name__ == "__main__":
    main()
