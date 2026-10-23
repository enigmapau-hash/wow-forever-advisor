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
        self.assertNotIn("monturaPorcentaje", variants["Horda"]["habilidad"])
        self.assertNotIn("montura", variants["Horda"]["habilidad"]["descripcion"])
        self.assertEqual(variants["Alianza"]["habilidad"]["nombre"], "Read Ley Line")
        secondary = self.data["contrasteSecundario"]
        self.assertEqual(secondary["skysight"]["monturaPorcentaje"], 10)
        self.assertEqual(secondary["skysight"]["estado"], "pendiente_contraste_cliente")
        self.assertEqual(secondary["url"], "https://www.wowhead.com/forever/guide/skyborne-race-overview")
        self.assertTrue(all(v["habilidad"]["lanzableEnMovimiento"] for v in variants.values()))

    def test_traceability_and_no_fabricated_ranking_or_icon(self):
        from urllib.parse import urlparse
        self.assertEqual(self.data["revision"]["estado"], "verificado")
        self.assertEqual(self.data["estado"], "beta")
        self.assertEqual(self.data["evaluacion"]["estado"], "pendiente")
        ids = {s["id"] for s in self.data["fuentes"]}
        for source in self.data["fuentes"]:
            self.assertEqual(source["consulta"]["http"], 200)
            self.assertRegex(source["consulta"]["sha256"], r"^[0-9a-f]{64}$")
            self.assertIn(urlparse(source["url"]).hostname, ("news.blizzard.com", "us.forums.blizzard.com"))
        for ability in self.data["comunes"] + [v["habilidad"] for v in self.data["variantes"]]:
            self.assertTrue(set(ability["fuentes"]) <= ids)
        self.assertEqual(self.data["icono"]["url"],
                         "https://wow.zamimg.com/images/wow/icons/large/race_skyborne_male.jpg")
        self.assertEqual(self.data["icono"]["estado"], "enlace_cdn")
        self.assertIn("Enlace remoto", self.data["icono"]["criterioUso"])
        self.assertEqual(len(self.data["icono"]["candidatos"]), 2)
        for candidate in self.data["icono"]["candidatos"]:
            self.assertEqual(candidate["http"], 200)
            self.assertEqual(candidate["estadoUso"], "pendiente_autorizacion")
            self.assertRegex(candidate["sha256"], r"^[0-9a-f]{64}$")
        text = json.dumps(self.data, ensure_ascii=False)
        self.assertNotIn("★", text)
        for field in ("prioridad", "escalaUtilidad", "puntuacion", "razaRecomendada"):
            self.assertNotIn('"' + field + '"', text)
        self.assertIn('"./data/skyborne.json"', (ROOT / "sw.js").read_text())
        self.assertIn("${CACHE_PREFIX}v29", (ROOT / "sw.js").read_text())
