"""v29: Druida es alternativa evaluada, no candidato por mera compatibilidad."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SHA = "ffb510a623c83fa440eb9612cc9b8ab7a02d67a036bbeab14c858e811ffab2ec"


def read(name):
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))


class DruidEvaluationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = read("race-advisor.json")
        cls.evaluation = read("race-advisor-druid-alternatives.json")
        cls.skyborne = read("skyborne.json")

    def test_originals_remain_immutable_and_six_alternatives_approved(self):
        self.assertEqual(self.original["fuente"]["sha256"], BASE_SHA)
        self.assertEqual(self.evaluation["base"]["sha256"], BASE_SHA)
        self.assertEqual(self.evaluation["base"]["fichas"], 51)
        self.assertEqual(len(self.original["fichas"]), 51)
        self.assertEqual(self.evaluation["estado"], "aprobado_usuario")
        originals = [r for r in self.original["fichas"] if r["clase"] == "Druida"]
        self.assertEqual(len(originals), 6)
        self.assertTrue(all(row["alternativa"] == "-" for row in originals))
        self.assertEqual(len(self.evaluation["fichas"]), 6)
        all_pairs = set()
        for row in self.evaluation["fichas"]:
            pair = (row["faccion"], row["especializacion"])
            self.assertNotIn(pair, all_pairs)
            all_pairs.add(pair)
            self.assertEqual(row["clase"], "Druida")
            self.assertEqual(row["alternativa"], "Cielonato")
            expected = "Elfo" if row["faccion"] == "Alianza" else "Tauren"
            self.assertEqual(row["razaRecomendada"], expected)
            self.assertGreater(len(row["usoAlternativa"].strip()), 45)
            self.assertGreater(len(row["motivoComparacion"].strip()), 80)
            original = next(r for r in originals if r["faccion"] == row["faccion"]
                            and r["especializacion"] == row["especializacion"])
            self.assertEqual(original["razaRecomendada"], row["razaRecomendada"])
            self.assertIn("Druida", next(v["clases"] for v in self.skyborne["variantes"]
                                         if v["faccion"] == row["faccion"]))
        self.assertEqual({s for f, s in all_pairs}, {"Equilibrio", "Feral", "Restauración"})
        self.assertEqual({f for f, s in all_pairs}, {"Horda", "Alianza"})

    def test_no_other_recommendations_or_alternatives_affected(self):
        originals = self.original["fichas"]
        extra = self.evaluation["fichas"]
        self.assertEqual(len([r for r in originals if r["alternativa"] == "-"]), 9)
        self.assertEqual(len([r for r in originals if r["clase"] == "Chamán" and
                              r["faccion"] == "Alianza" and r["alternativa"] == "-"]), 3)
        self.assertEqual(len([r for r in originals if r["clase"] == "Druida"]), 6)
        self.assertEqual(len([r for r in extra if r["razaRecomendada"] == "Cielonato"]), 0)
        self.assertNotIn("★", json.dumps(extra, ensure_ascii=False))

    def test_cache_and_documentation(self):
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn('"./data/race-advisor-druid-alternatives.json"', sw)
        self.assertIn("${CACHE_PREFIX}v31", sw)
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("validateDruidAlternatives", app)
        self.assertIn("skyborne-alternatives", app)
        docs = (ROOT / "docs/druid-race-assessment-v29.md").read_text(encoding="utf-8")
        self.assertIn("Decisión aprobada", docs)
        self.assertIn("no se modifica", docs.lower())
        for word in ("Read Ley Line", "Skysight", "War Stomp"):
            self.assertIn(word, docs)


if __name__ == "__main__":
    unittest.main()
