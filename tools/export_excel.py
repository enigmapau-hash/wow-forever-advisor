"""Exporta el maestro v5 sin recalcular fórmulas ni modificar el libro. Solo Python 3."""

import argparse
import hashlib
import json
from pathlib import Path
import posixpath
import re
import sys
import xml.etree.ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"m": MAIN}
RACE_FIELDS = {
    "Clase": "clase",
    "Especialización": "especializacion",
    "Raza recomendada": "razaRecomendada",
    "Alternativa": "alternativa",
    "Explicación": "explicacion",
    "Prioridad": "prioridad",
    "Motivo principal": "motivoPrincipal",
}
RACIAL_FIELDS = {
    "Raza": "raza",
    "Fortaleza principal": "fortalezas",
    "Debilidad": "debilidades",
    "Escala de utilidad": "escalaUtilidad",
    "Comentarios": "comentarios",
    "Uso principal": "usoPrincipal",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def text(element):
    if element is None:
        return ""
    return "".join(node.text or "" for node in element.iter() if node.tag.endswith("}t"))


def relationships(archive, owner):
    folder, name = posixpath.split(owner)
    relpath = posixpath.join(folder, "_rels", name + ".rels")
    if relpath not in archive.namelist():
        return {}
    result = {}
    for rel in ET.fromstring(archive.read(relpath)):
        item = dict(rel.attrib)
        if item.get("TargetMode") != "External":
            item["Target"] = posixpath.normpath(
                posixpath.join(folder, item["Target"])).lstrip("/")
        result[item["Id"]] = item
    return result


def read_workbook(path):
    """Lee valores y anotaciones OOXML; no necesita Excel ni librerías externas."""
    with ZipFile(path) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = [text(item) for item in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        workbook_rels = relationships(archive, "xl/workbook.xml")
        sheets = []
        for sheet in workbook.find("m:sheets", NS):
            name = sheet.get("name")
            location = workbook_rels[sheet.get(f"{{{REL}}}id")]["Target"]
            document = ET.fromstring(archive.read(location))
            rels = relationships(archive, location)
            cells = {}
            for cell in document.findall("m:sheetData/m:row/m:c", NS):
                value_node = cell.find("m:v", NS)
                formula = cell.find("m:f", NS)
                inline = cell.find("m:is", NS)
                if value_node is None and formula is None and inline is None:
                    continue
                kind = cell.get("t", "n")
                value = value_node.text if value_node is not None else None
                if kind == "s":
                    value = shared[int(value)]
                elif kind == "inlineStr":
                    value = text(inline)
                elif kind == "b":
                    value = value == "1"
                elif kind == "n" and value is not None:
                    value = float(value) if any(c in value.lower() for c in ".e") else int(value)
                require(kind != "e", f"Error de Excel en {name}!{cell.get('r')}: {value}")
                item = {"valor": value}
                if formula is not None:
                    item["formula"] = "=" + (formula.text or "")
                    item["atributosFormula"] = dict(formula.attrib)
                    require(value is not None, f"Fórmula sin valor guardado: {name}!{cell.get('r')}")
                cells[cell.get("r")] = item
            tables, comments, links = [], [], []
            for rel in rels.values():
                kind = rel["Type"].rsplit("/", 1)[-1]
                if kind == "table":
                    table = ET.fromstring(archive.read(rel["Target"]))
                    tables.append({"nombre": table.get("name"), "rango": table.get("ref"),
                                   "columnas": [c.get("name") for c in table.find("m:tableColumns", NS)]})
                elif kind in ("comments", "threadedComment"):
                    root = ET.fromstring(archive.read(rel["Target"]))
                    for node in root.iter():
                        if node.tag.rsplit("}", 1)[-1] in ("comment", "threadedComment"):
                            # Se conserva el contenido; las identidades de autores no son datos del Advisor.
                            content = ("".join(node.itertext()) if kind == "threadedComment" else text(node))
                            comments.append({"celda": node.get("ref"), "tipo": kind, "texto": content})
            for link in document.findall("m:hyperlinks/m:hyperlink", NS):
                item = {"celda": link.get("ref")}
                if link.get("location") is not None:
                    item["ubicacion"] = link.get("location")
                if link.get(f"{{{REL}}}id") is not None:
                    item["destino"] = rels[link.get(f"{{{REL}}}id")]["Target"]
                links.append(item)
            sheets.append({"nombre": name, "celdas": cells, "tablas": tables,
                           "comentarios": comments, "hipervinculos": links})
        defined = workbook.find("m:definedNames", NS)
        return sheets, [{"nombre": node.get("name"), "formula": node.text}
                        for node in defined] if defined is not None else []


def column_number(letters):
    result = 0
    for letter in letters:
        result = result * 26 + ord(letter) - ord("A") + 1
    return result


def column_name(number):
    result = ""
    while number:
        number, remainder = divmod(number - 1, 26)
        result = chr(65 + remainder) + result
    return result


def extract_table(sheet, table_name, fields, expected_count):
    tables = [t for t in sheet["tablas"] if t["nombre"] == table_name]
    require(len(tables) == 1, f"Tabla ausente o ambigua: {table_name}")
    table = tables[0]
    require(table["columnas"] == list(fields), f"Columnas cambiadas en {table_name}")
    match = re.fullmatch(r"([A-Z]+)(\d+):([A-Z]+)(\d+)", table["rango"])
    require(match is not None, f"Rango no compatible: {table['rango']}")
    first_col, first_row, last_col, last_row = match.groups()
    columns = range(column_number(first_col), column_number(last_col) + 1)
    first_row, last_row = int(first_row), int(last_row)
    require(len(columns) == len(fields), f"Anchura inesperada en {table_name}")
    require(last_row - first_row == expected_count, f"Se esperaban {expected_count} filas en {table_name}")
    for column, header in zip(columns, fields):
        require(sheet["celdas"][f"{column_name(column)}{first_row}"]["valor"] == header,
                f"Cabecera inconsistente en {table_name}: {header}")
    records, consumed = [], set()
    for row in range(first_row + 1, last_row + 1):
        record = {"origen": {"hoja": sheet["nombre"], "fila": row}}
        for column, field in zip(columns, fields.values()):
            address = f"{column_name(column)}{row}"
            cell = sheet["celdas"].get(address, {})
            value = cell.get("valor")
            require(isinstance(value, str) and bool(value.strip()),
                    f"Campo vacío o de tipo inesperado: {sheet['nombre']}!{address}")
            require("formula" not in cell, f"Se esperaba dato literal: {sheet['nombre']}!{address}")
            record[field] = value
            consumed.add(address)
        records.append(record)
    return records, consumed


def build_export(source):
    sheets, names = read_workbook(source)
    by_name = {sheet["nombre"]: sheet for sheet in sheets}
    require(set(by_name) == {"Inicio", "Selector", "Alianza", "Horda", "Raciales", "Metodología"},
            "Han cambiado las hojas del maestro; revisar el exportador")
    records, used = [], {}
    for faction, count in (("Alianza", 27), ("Horda", 24)):
        rows, used[faction] = extract_table(by_name[faction], "tbl" + faction, RACE_FIELDS, count)
        records.extend({"faccion": faction, **row} for row in rows)
    racials, used["Raciales"] = extract_table(by_name["Raciales"], "tblRaciales", RACIAL_FIELDS, 8)
    keys = [(r["faccion"], r["clase"], r["especializacion"]) for r in records]
    require(len(keys) == len(set(keys)) == 51, "Hay combinaciones duplicadas o faltan fichas")
    require(len({tuple(part.strip().casefold() for part in key) for key in keys}) == 51,
            "Hay claves ambiguas por espacios o mayúsculas; no se han normalizado los datos")
    races = [r["raza"] for r in racials]
    require(len(races) == len(set(races)), "Hay perfiles raciales duplicados")
    for record in records:
        require(record["razaRecomendada"] in races, f"Raza sin perfil: {record['origen']}")
        require(record["alternativa"] == "-" or record["alternativa"] in races,
                f"Alternativa sin perfil: {record['origen']}")

    # Reconstrucción exacta de las celdas exportadas: no se normalizan textos ni estrellas.
    reconstructed = {sheet["nombre"]: {} for sheet in sheets}
    for record in records + racials:
        origin = record["origen"]
        fields = RACIAL_FIELDS if origin["hoja"] == "Raciales" else RACE_FIELDS
        for column, field in enumerate(fields.values(), 2):
            reconstructed[origin["hoja"]][f"{column_name(column)}{origin['fila']}"] = {"valor": record[field]}
    context_sheets = []
    for sheet in sheets:
        remaining = {cell: value for cell, value in sheet["celdas"].items()
                     if cell not in used.get(sheet["nombre"], set())}
        reconstructed[sheet["nombre"]].update(remaining)
        require(reconstructed[sheet["nombre"]] == sheet["celdas"],
                f"Pérdida de celdas en {sheet['nombre']}")
        context_sheets.append({**sheet, "celdas": remaining})
    controls = {"C38": len(records), "C39": 0, "C40": 0, "C41": 0}
    for address, value in controls.items():
        require(by_name["Metodología"]["celdas"][address]["valor"] == value,
                f"El control guardado Metodología!{address} no coincide con la exportación")
    source_info = {"archivo": source.name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                   "versionInterna": by_name["Inicio"]["celdas"]["B5"]["valor"]}
    metadata = {"schemaVersion": 1, "fuente": source_info}
    issues = [{"origen": "Inicio!B5", "detalle": source_info["versionInterna"],
               "nota": "Se conserva la versión interna del libro, aunque el archivo se denomine v5."}]
    for address, cell in by_name["Metodología"]["celdas"].items():
        if address in ("C54", "C61"):
            issues.append({"origen": f"Metodología!{address}", "detalle": cell["valor"],
                           "nota": "Observación editorial conservada; no aplicada a las recomendaciones."})
    report = {
        "fichas": len(records), "porFaccion": {f: sum(r["faccion"] == f for r in records) for f in ("Alianza", "Horda")},
        "perfilesRaciales": len(racials), "duplicados": 0, "camposObligatoriosVacios": 0,
        "recomendacionesSinPerfil": 0, "alternativasSinPerfil": 0,
        "alternativasNoFacilitadas": sum(r["alternativa"] == "-" for r in records),
        "celdasValidadas": sum(len(s["celdas"]) for s in sheets),
        "formulasConservadas": sum("formula" in c for s in sheets for c in s["celdas"].values()),
        "comentariosConservados": sum(len(s["comentarios"]) for s in sheets),
        "hipervinculosConservados": sum(len(s["hipervinculos"]) for s in sheets),
        "fichasValidadasCeldaACelda": len(records), "perfilesValidadosCeldaACelda": len(racials),
        "controlesExcelCoincidentes": controls, "incidenciasOrigen": issues,
    }
    return {
        "race-advisor.json": {**metadata, "fichas": records},
        "racials.json": {**metadata, "raciales": racials},
        "workbook-context.json": {**metadata, "columnasFichas": RACE_FIELDS,
                                  "columnasRaciales": RACIAL_FIELDS,
                                  "hojas": context_sheets, "nombresDefinidos": names},
        "export-report.json": {**metadata, **report},
    }


def serialize(document):
    return json.dumps(document, ensure_ascii=False, indent=2, allow_nan=False) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", nargs="?", type=Path, default=ROOT / "Clases WoW Forever v5.xlsx")
    parser.add_argument("--output", type=Path, default=ROOT / "data")
    parser.add_argument("--check", action="store_true", help="Verificar los JSON existentes sin escribirlos")
    args = parser.parse_args()
    try:
        documents = build_export(args.source)
        rendered = {name: serialize(document) for name, document in documents.items()}
        if args.check:
            for name, content in rendered.items():
                require((args.output / name).read_bytes() == content.encode("utf-8"),
                        f"JSON desactualizado o modificado: {name}")
        else:
            args.output.mkdir(parents=True, exist_ok=True)
            for name, content in rendered.items():
                (args.output / name).write_bytes(content.encode("utf-8"))
        print("OK: 51 fichas, 8 perfiles raciales; celdas y controles originales coincidentes.")
    except (ValueError, OSError, KeyError, ET.ParseError) as error:
        print(f"Exportación rechazada: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
