"""Regresión de las seis fichas de raza única aprobadas en v41."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def data(name):
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))


def combo(row):
    return row["faccion"], row["clase"], row["especializacion"]


class RaceSingleEvaluationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.singles = data("race-single-race-evaluations.json")
        cls.original = data("race-advisor.json")
        cls.additions = data("race-advisor-additions.json")
        cls.racials = data("race-full-racials-draft.json")

    def test_six_unique_races_match_approved_records(self):
        actual = self.singles["fichas"]
        expected = {combo(r): r for r in self.original["fichas"] + self.additions["fichas"]
                    if r["alternativa"] == "-"}
        self.assertEqual(len(actual), 6)
        self.assertEqual(len(expected), 6)
        self.assertEqual({combo(r) for r in actual}, set(expected))
        for record in actual:
            with self.subTest(key=combo(record)):
                self.assertEqual(record["razaRecomendada"],
                                 expected[combo(record)]["razaRecomendada"])
                self.assertIn(record["clase"],
                              self.racials["elegibilidad"][record["faccion"]]
                              [record["razaRecomendada"]])

    def test_contents_are_substantial_and_source_backed(self):
        conclusions = []
        for record in self.singles["fichas"]:
            with self.subTest(key=combo(record)):
                for field in ("aFavor", "aTenerEnCuenta", "conclusion"):
                    self.assertGreater(len(record[field]), 145)
                self.assertGreaterEqual(len(record["fuentes"]), 2)
                self.assertTrue(all(url.startswith(
                    "https://worldofwarcraft.blizzard.com/")
                    for url in record["fuentes"]))
                conclusions.append(record["conclusion"])
        self.assertEqual(len(set(conclusions)), 6)

    def test_specific_class_tools_and_all_four_racials_weighed(self):
        for record in self.singles["fichas"]:
            body = " ".join(record[field] for field in
                            ("aFavor", "aTenerEnCuenta", "conclusion"))
            for ability in ("Stoneform", "Buscar tesoros", "Caza mayor"):
                if record["clase"] == "Chamán":
                    self.assertIn(ability, body)
            if record["clase"] == "Paladín":
                for ability in ("Will of the Forsaken", "Cannibalize",
                                "Touch of the Grave", "Underwater Breathing"):
                    self.assertIn(ability, body)

    def test_existing_comparisons_unchanged(self):
        context = data("race-contextual-comparisons-v40-draft.json")
        self.assertEqual(len(context["fichas"]), 48)
        self.assertEqual(sum(r["estado"] == "analisis_fuentes_revisado"
                             for r in context["fichas"]), 48)

    def test_sources_and_addons_are_secondary_cards(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "app.js").read_text(encoding="utf-8")
        css = (ROOT / "styles.css").read_text(encoding="utf-8")
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn('id="race-single-evaluation"', html)
        self.assertIn('id="race-official-sources"', html)
        self.assertIn("<summary>Ver fuentes oficiales</summary>", html)
        self.assertNotIn('id="alternative-scope"', html)
        self.assertIn("validateSingleRaceEvaluations", js)
        self.assertIn("#race-addons {", css)
        self.assertIn("#race-beta-updates {", css)
        self.assertIn('"./data/race-single-race-evaluations.json"', sw)


if __name__ == "__main__":
    unittest.main()
