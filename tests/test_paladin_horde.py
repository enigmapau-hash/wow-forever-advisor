"""Regresión v29: capa Paladín Horda independiente de las 51 fichas originales."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SHA = "ffb510a623c83fa440eb9612cc9b8ab7a02d67a036bbeab14c858e811ffab2ec"


def load(name):
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))


class PaladinHordeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = load("race-advisor.json")
        cls.added = load("race-advisor-additions.json")
        cls.profiles = load("racials.json")

    def test_excel_original_immutable_and_extension_separate(self):
        self.assertEqual(self.original["fuente"]["sha256"], BASE_SHA)
        self.assertEqual(len(self.original["fichas"]), 51)
        self.assertEqual(sum(r["faccion"] == "Alianza" for r in self.original["fichas"]), 27)
        self.assertEqual(sum(r["faccion"] == "Horda" for r in self.original["fichas"]), 24)
        self.assertFalse(any(r["faccion"] == "Horda" and r["clase"] == "Paladín"
                             for r in self.original["fichas"]))
        self.assertEqual(self.added["tipo"], "extension_editorial_no_modifica_excel")
        self.assertEqual(self.added["base"]["sha256"], BASE_SHA)
        self.assertEqual(self.added["base"]["fichas"], 51)
        self.assertEqual(len(self.added["fichas"]), 3)

    def test_all_three_specs_and_justified_single_race(self):
        rows = self.added["fichas"]
        self.assertEqual({r["especializacion"] for r in rows},
                         {"Sagrado", "Protección", "Reprensión"})
        original_keys = {(r["faccion"], r["clase"], r["especializacion"])
                         for r in self.original["fichas"]}
        new_keys = set()
        for r in rows:
            self.assertEqual((r["faccion"], r["clase"], r["razaRecomendada"], r["alternativa"]),
                             ("Horda", "Paladín", "No-muerto", "-"))
            self.assertTrue(r["motivoPrincipal"].strip())
            self.assertGreater(len(r["explicacion"]), 175)
            self.assertIn("Voluntad de los Renegados", r["explicacion"])
            self.assertNotIn("única raza", r["explicacion"])
            self.assertNotIn("segunda opción", r["explicacion"])
            self.assertNotIn("★", r["prioridad"])
            key = (r["faccion"], r["clase"], r["especializacion"])
            self.assertNotIn(key, original_keys)
            self.assertNotIn(key, new_keys)
            new_keys.add(key)
        self.assertIn("No-muerto", {p["raza"] for p in self.profiles["raciales"]})

    def test_other_unrated_options_remain_unchanged(self):
        original_missing = [r for r in self.original["fichas"] if r["alternativa"] == "-"]
        self.assertEqual(len(original_missing), 9)
        self.assertEqual(sum(r["clase"] == "Druida" for r in original_missing), 6)
        self.assertEqual(sum(r["clase"] == "Chamán" and r["faccion"] == "Alianza"
                             for r in original_missing), 3)
        self.assertEqual(len(self.original["fichas"]) + len(self.added["fichas"]), 54)

    def test_source_traceability_and_offline(self):
        sources = [s["url"] for s in self.added["fuentes"]]
        self.assertTrue(any("news.blizzard.com" in u for u in sources))
        self.assertTrue(any("us.forums.blizzard.com" in u for u in sources))
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn('"./data/race-advisor-additions.json"', sw)
        self.assertIn("${CACHE_PREFIX}v30", sw)
        assessment = (ROOT / "docs/druid-race-assessment-v29.md").read_text(encoding="utf-8")
        for spec in ("Equilibrio", "Feral", "Restauración"):
            self.assertIn(spec, assessment)
        self.assertIn("Decisión aprobada", assessment)


if __name__ == "__main__":
    unittest.main()
