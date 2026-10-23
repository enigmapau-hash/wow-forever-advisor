"""v31: el orden visual compartido no cambia las clases ni las recomendaciones.

Estas comprobaciones complementan las pruebas de navegador. Nunca ordenan ni
modifican los datos originales: solo contrastan la cobertura entre módulos.
"""
import json
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_CLASSES = (
    "Brujo", "Cazador", "Chamán", "Druida", "Guerrero",
    "Mago", "Paladín", "Pícaro", "Sacerdote",
)
ORIGINAL_WORKBOOK_SHA256 = "ffb510a623c83fa440eb9612cc9b8ab7a02d67a036bbeab14c858e811ffab2ec"


def read_data(filename):
    return json.loads((ROOT / "data" / filename).read_text(encoding="utf-8"))


class ConsistentClassOrderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.advisor = read_data("race-advisor.json")
        cls.additions = read_data("race-advisor-additions.json")
        cls.druid = read_data("race-advisor-druid-alternatives.json")
        cls.professions = read_data("profession-advisor.json")
        cls.talents = read_data("talent-advisor-catalog.json")
        cls.records = cls.advisor["fichas"] + cls.additions["fichas"]

    def test_nine_classes_each_faction_with_no_lost_specs(self):
        self.assertEqual(len(self.advisor["fichas"]), 51)
        self.assertEqual(len(self.additions["fichas"]), 3)
        self.assertEqual(len(self.records), 54)
        self.assertEqual(self.advisor["fuente"]["sha256"], ORIGINAL_WORKBOOK_SHA256)
        self.assertEqual(self.additions["base"]["sha256"], ORIGINAL_WORKBOOK_SHA256)
        expected_set = set(EXPECTED_CLASSES)
        seen = set()
        for faction in ("Alianza", "Horda"):
            rows = [r for r in self.records if r["faccion"] == faction]
            self.assertEqual(len(rows), 27, faction)
            self.assertEqual({r["clase"] for r in rows}, expected_set, faction)
            by_class = Counter(r["clase"] for r in rows)
            self.assertTrue(all(by_class[c] == 3 for c in EXPECTED_CLASSES), faction)
            for row in rows:
                key = (row["faccion"], row["clase"], row["especializacion"])
                self.assertNotIn(key, seen, "Ficha de clase/especialización duplicada")
                seen.add(key)
        self.assertEqual(len(seen), 54)

    def test_two_modules_match_the_same_nine_class_labels(self):
        class_set = set(EXPECTED_CLASSES)
        professions = self.professions["fichas"]
        self.assertEqual(len(professions), 27)
        self.assertEqual({r["clase"] for r in professions}, class_set)
        self.assertTrue(all(v == 3 for v in Counter(
            r["clase"] for r in professions).values()))
        catalog = self.talents["clases"]
        self.assertEqual(len(catalog), 9)
        self.assertEqual({c["nombre"] for c in catalog}, class_set)

    def test_order_changes_are_presentation_only(self):
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn('function alphabeticalClassNames(names)', app)
        self.assertIn('a.localeCompare(b, "es", { sensitivity: "base" })', app)
        self.assertIn('setOptions(characterClass, alphabeticalClassNames(', app)
        self.assertIn('setOptions(professionClass, alphabeticalClassNames(', app)
        self.assertIn('setOptions(talentClass, alphabeticalClassNames(', app)
        self.assertEqual(len(self.druid["fichas"]), 6)
        self.assertEqual({r["alternativa"] for r in self.druid["fichas"]},
                         {"Cielonato"})
        self.assertEqual({r["razaRecomendada"] for r in self.druid["fichas"]},
                         {"Elfo", "Tauren"})
        self.assertEqual({r["razaRecomendada"] for r in self.additions["fichas"]},
                         {"No-muerto"})

    def test_documented_order_and_offline_cache(self):
        docs = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("Brujo, Cazador, Chamán, Druida, Guerrero, Mago,", docs)
        self.assertIn("Paladín, Pícaro, Sacerdote", docs)
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn("${CACHE_PREFIX}v31", sw)


if __name__ == "__main__":
    unittest.main()
