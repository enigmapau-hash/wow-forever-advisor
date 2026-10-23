"""Auditoría de los cambios raciales oficiales sin alterar el Excel maestro."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ("https://us.forums.blizzard.com/en/wow/t/"
          "wow-forever-beta-development-notes-%E2%80%93-updated-october-15/2360696/6")


class RacialBetaUpdatesTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / "data/racial-beta-updates.json").read_text(encoding="utf-8"))
        self.profiles = json.loads((ROOT / "data/racials.json").read_text(encoding="utf-8"))
        self.advisor = json.loads((ROOT / "data/race-advisor.json").read_text(encoding="utf-8"))

    def test_only_the_original_eight_races_are_annotated(self):
        self.assertEqual(self.data["schemaVersion"], 1)
        self.assertEqual(self.data["fechaRevision"], "2026-10-22")
        self.assertEqual(self.data["fuente"]["url"], SOURCE)
        rows = self.data["razas"]
        original = [p["raza"] for p in self.profiles["raciales"]]
        self.assertEqual([r["raza"] for r in rows], original)
        self.assertEqual(len(rows), len(set(original)), 8)
        self.assertEqual(len(self.advisor["fichas"]), 51)
        self.assertIn("Cielonatos", self.data["alcance"])
        for row in rows:
            with self.subTest(race=row["raza"]):
                self.assertTrue(row["cambios"])
                self.assertTrue(all(isinstance(x, str) and x.strip() for x in row["cambios"]))

    def test_official_october_15_changes_are_specific(self):
        rows = {r["raza"]: " ".join(r["cambios"]) for r in self.data["razas"]}
        for race, expected in {
            "Gnomo": ("Eureka!", "8 segundos", "Palabra de poder"),
            "Humano": ("Ruthless", "+2 %"),
            "Enano": ("Earth Fury", "+2 %", "Find Treasure"),
            "Elfo": ("Quickness", "acumula"),
            "Orco": ("Savage", "+1 %", "3 minutos", "Shatter Curse", "5 %"),
            "Tauren": ("Endurance", "+2 %", "Plainsrunning", "15 minutos", "90 segundos"),
            "Troll": ("Regeneration", "20 %"),
            "No-muerto": ("Touch of the Dead", "30 %", "20 %", "25 segundos", "Scatter Shot"),
        }.items():
            with self.subTest(race=race):
                for value in expected:
                    self.assertIn(value, rows[race])

    def test_updates_are_precached_and_original_exports_still_used(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('"./data/racial-beta-updates.json"', sw)
        self.assertIn("${CACHE_PREFIX}v25", sw)
        self.assertIn('readJson("./data/racial-beta-updates.json").catch(() => null)', script)
        self.assertIn('readJson("./data/race-advisor.json")', script)
        self.assertIn('readJson("./data/racials.json")', script)
        self.assertIn('id="race-beta-updates"', html)
        self.assertIn('id="racial-beta-updates"', html)
        self.assertIn("Cielonatos no incluidos", html)
