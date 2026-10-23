"""The ninth race is independent from the original Excel export and rankings."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class SkyborneTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / "data/skyborne.json").read_text())

    def test_independent_originals_preserved_byte_for_byte(self):
        preserved = json.loads((ROOT / "tests/v17-preserved-hashes.json").read_text())
        for path in ("data/race-advisor.json", "data/racials.json", "data/workbook-context.json",
                     "data/export-report.json", "Clases WoW Forever v5.xlsx"):
            with self.subTest(path=path):
                self.assertEqual(hashlib.sha256((ROOT / path).read_bytes()).hexdigest(), preserved[path])
        self.assertEqual(len(json.loads((ROOT / "data/race-advisor.json").read_text())["fichas"]), 51)
        self.assertEqual(len(json.loads((ROOT / "data/racials.json").read_text())["raciales"]), 8)

    def test_variants_and_latest_beta_values(self):
        self.assertEqual(self.data["schemaVersion"], 1)
        self.assertEqual(self.data["raza"], "Cielonato")
        variants = {v["faccion"]: v for v in self.data["variantes"]}
        common = {a["id"]: a for a in self.data["comunes"]}
        shared = {"Guerrero", "Cazador", "Pícaro", "Druida"}
        self.assertEqual(set(variants["Alianza"]["clases"]), shared | {"Mago"})
        self.assertEqual(set(variants["Horda"]["clases"]), shared | {"Chamán"})
        self.assertEqual(variants["Alianza"]["nombre"], "High Order")
        self.assertEqual(variants["Horda"]["nombre"], "Windshaper")
        self.assertEqual(common["wind-blessed"]["celeridadPorcentaje"], 3)
        self.assertIn("+3 %", common["wind-blessed"]["descripcion"])
        self.assertEqual(common["walk-on-air"]["reutilizacionSegundos"], 90)
        self.assertEqual(common["walk-on-air"]["duracionSegundos"], 10)
        self.assertEqual(common["elemental-insight"]["danoContraElementalesPorcentaje"], 5)
        self.assertEqual(variants["Alianza"]["habilidad"]["duracionMinimaSegundos"], 30)
        self.assertEqual(variants["Alianza"]["habilidad"]["regeneracionPorcentaje"], 100)
        self.assertEqual(variants["Horda"]["habilidad"]["movimientoPorcentaje"], 10)
        self.assertEqual(variants["Horda"]["habilidad"]["monturaPorcentaje"], 10)
        self.assertTrue(all(v["habilidad"]["lanzableEnMovimiento"] for v in variants.values()))

    def test_traceability_and_no_fabricated_ranking_or_icon(self):
        from urllib.parse import urlparse
        self.assertIn(self.data["revision"]["estado"], ("pendiente", "verificado"))
        self.assertEqual(self.data["estado"], "beta")
        self.assertEqual(self.data["evaluacion"]["estado"], "pendiente")
        ids = {s["id"] for s in self.data["fuentes"]}
        for source in self.data["fuentes"]:
            self.assertIn(urlparse(source["url"]).hostname, ("news.blizzard.com", "us.forums.blizzard.com"))
        for ability in self.data["comunes"] + [v["habilidad"] for v in self.data["variantes"]]:
            self.assertTrue(set(ability["fuentes"]) <= ids)
        self.assertIsNone(self.data["icono"]["url"])
        self.assertEqual(self.data["icono"]["estado"], "pendiente_verificacion")
        text = json.dumps(self.data, ensure_ascii=False)
        self.assertNotIn("★", text)
        for field in ("prioridad", "escalaUtilidad", "puntuacion", "razaRecomendada"):
            self.assertNotIn('"' + field + '"', text)
        self.assertIn('"./data/skyborne.json"', (ROOT / "sw.js").read_text())
        self.assertIn("${CACHE_PREFIX}v26", (ROOT / "sw.js").read_text())
