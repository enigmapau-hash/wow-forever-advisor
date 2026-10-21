"""Controles de integridad y rechazo de maestros alterados en copias temporales."""

import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("export_excel", ROOT / "tools/export_excel.py")
exporter = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(exporter)
SOURCE = ROOT / "Clases WoW Forever v5.xlsx"


class ExportTests(unittest.TestCase):
    def altered_book(self, member, edit):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        output = Path(directory.name) / SOURCE.name
        with ZipFile(SOURCE) as original, ZipFile(output, "w") as changed:
            for entry in original.infolist():
                content = original.read(entry.filename)
                if entry.filename == member:
                    document = ET.fromstring(content)
                    edit(document)
                    content = ET.tostring(document, encoding="utf-8")
                changed.writestr(entry, content)
        return output

    @staticmethod
    def set_text(document, address, value):
        cell = document.find(f".//m:c[@r='{address}']", exporter.NS)
        for child in list(cell):
            cell.remove(child)
        cell.set("t", "inlineStr")
        inline = ET.SubElement(cell, f"{{{exporter.MAIN}}}is")
        ET.SubElement(inline, f"{{{exporter.MAIN}}}t").text = value

    def test_all_records_and_deterministic_output(self):
        first = exporter.build_export(SOURCE)
        second = exporter.build_export(SOURCE)
        self.assertEqual(first, second)
        report = first["export-report.json"]
        self.assertEqual(report["porFaccion"], {"Alianza": 27, "Horda": 24})
        self.assertEqual(report["perfilesRaciales"], 8)
        self.assertEqual(report["celdasValidadas"], 627)
        self.assertEqual(report["formulasConservadas"], 22)
        self.assertEqual(report["alternativasNoFacilitadas"], 9)
        for name, document in first.items():
            self.assertEqual(json.loads((ROOT / "data" / name).read_text(encoding="utf-8")), document)

    def test_duplicate_combination_is_rejected(self):
        source = self.altered_book("xl/worksheets/sheet3.xml",
                                   lambda doc: self.set_text(doc, "C7", "Armas"))
        with self.assertRaisesRegex(ValueError, "duplicadas"):
            exporter.build_export(source)

    def test_blank_required_field_is_rejected(self):
        source = self.altered_book("xl/worksheets/sheet3.xml",
                                   lambda doc: self.set_text(doc, "F6", ""))
        with self.assertRaisesRegex(ValueError, "Campo vacío"):
            exporter.build_export(source)

    def test_missing_racial_reference_is_rejected(self):
        source = self.altered_book("xl/worksheets/sheet3.xml",
                                   lambda doc: self.set_text(doc, "D6", "Raza de prueba inexistente"))
        with self.assertRaisesRegex(ValueError, "Raza sin perfil"):
            exporter.build_export(source)

    def test_changed_columns_are_rejected(self):
        def change(document):
            document.find("m:tableColumns/m:tableColumn", exporter.NS).set("name", "Clase cambiada")
        source = self.altered_book("xl/tables/table1.xml", change)
        with self.assertRaisesRegex(ValueError, "Columnas cambiadas"):
            exporter.build_export(source)

    def test_missing_formula_cache_is_rejected(self):
        def change(document):
            cell = document.find(".//m:c[@r='B19']", exporter.NS)
            cell.remove(cell.find("m:v", exporter.NS))
        source = self.altered_book("xl/worksheets/sheet1.xml", change)
        with self.assertRaisesRegex(ValueError, "Fórmula sin valor guardado"):
            exporter.build_export(source)

    def test_incomplete_table_is_rejected(self):
        def change(document):
            document.set("ref", "B5:H31")
        source = self.altered_book("xl/tables/table1.xml", change)
        with self.assertRaisesRegex(ValueError, "27 filas"):
            exporter.build_export(source)

    def test_check_detects_changed_or_missing_json(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            command = [sys.executable, str(ROOT / "tools/export_excel.py"), "--output", str(output)]
            self.assertEqual(subprocess.run(command, capture_output=True).returncode, 0)
            self.assertEqual(subprocess.run(command + ["--check"], capture_output=True).returncode, 0)
            (output / "racials.json").write_text("{}\n", encoding="utf-8")
            self.assertNotEqual(subprocess.run(command + ["--check"], capture_output=True).returncode, 0)
            (output / "racials.json").unlink()
            self.assertNotEqual(subprocess.run(command + ["--check"], capture_output=True).returncode, 0)


if __name__ == "__main__":
    unittest.main()
