"""Comprobación del catálogo y de las dos clases en Talent Advisor."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"


def load(name):
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


class TalentAdvisorCatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load("talent-advisor-catalog.json")
        cls.classes = {
            entry["nombre"]: load(Path(entry["ruta"]).name)
            for entry in cls.catalog["clases"]
        }

    def test_catalog_references_valid_files(self):
        catalog = self.catalog
        self.assertEqual(catalog["schemaVersion"], 1)
        self.assertEqual(catalog["objetivos"], ["Subir al 60", "PvP", "Mazmorras"])
        self.assertEqual([e["nombre"] for e in catalog["clases"]],
                         ["Guerrero", "Paladín"])
        self.assertEqual(catalog["fuenteLegado"], "Guerrero")
        for entry in catalog["clases"]:
            self.assertTrue(entry["ruta"].startswith("./data/talent-advisor-"))
            self.assertEqual(self.classes[entry["nombre"]]["clase"], entry["nombre"])

    def test_eighteen_unique_advisory_records(self):
        seen = set()
        for name, data in self.classes.items():
            self.assertEqual(data["schemaVersion"], 1)
            self.assertTrue(data["piloto"])
            self.assertEqual(data["estado"], "borrador_beta")
            self.assertEqual(data["versionCliente"], "1.60.1.70450")
            self.assertTrue(data["fechaRevision"])
            self.assertIn("51 puntos", data["aviso"])
            self.assertEqual(len(data["especializaciones"]), 3)
            self.assertEqual(len(data["fichas"]), 9)
            expected = {(name, spec, goal) for spec in data["especializaciones"]
                        for goal in self.catalog["objetivos"]}
            actual = {(name, r["especializacion"], r["objetivo"]) for r in data["fichas"]}
            self.assertEqual(actual, expected)
            seen.update(actual)
            for record in data["fichas"]:
                self.assertGreaterEqual(len(record["talentos"]), 3)
                for field in ("resumen", "motivo", "limitacion", "progreso"):
                    self.assertTrue(record[field].strip())
                self.assertNotIn("puntosAsignados", record)
        self.assertEqual(len(seen), 18)

    def test_legacy_is_reusable_and_points_are_class_specific(self):
        warrior = self.classes["Guerrero"]
        paladin = self.classes["Paladín"]
        self.assertEqual(set(warrior["legado"]), set(self.catalog["objetivos"]))
        self.assertNotIn("legado", paladin, "Paladín debe reutilizar Legado común")
        self.assertIn("Guerrero", warrior["obtenerPuntosLegado"][0])
        self.assertIn("Paladín", paladin["obtenerPuntosLegado"][0])
        self.assertNotIn("Guerrero", " ".join(paladin["obtenerPuntosLegado"]))
        for data in self.classes.values():
            self.assertEqual(len(data["obtenerPuntosLegado"]), 3)

    def test_sourced_talent_names_for_paladin(self):
        talents = {name for row in self.classes["Paladín"]["fichas"]
                   for name in row["talentos"]}
        expected = {"Vigilia de la Luz", "Juicio presto", "Baluarte de templario",
                    "Enjuiciador Sagrado", "Giro de la Luz", "Choque Sagrado",
                    "Sello de furia mejorado", "Reverencia"}
        self.assertTrue(expected.issubset(talents))
        urls = {entry["url"] for entry in self.classes["Paladín"]["fuentes"]}
        self.assertIn("https://news.blizzard.com/es-es/article/24302099/"
                      "world-of-warcraft-forever-repaso-a-fondo-de-la-clase-paladin", urls)

    def test_no_recommendation_files_are_modified(self):
        self.assertTrue((DATA_DIR / "race-advisor.json").exists())
        self.assertTrue((DATA_DIR / "profession-advisor.json").exists())


if __name__ == "__main__":
    unittest.main()
