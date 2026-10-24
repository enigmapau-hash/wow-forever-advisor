"""Comprobaciones editoriales de Talent Advisor tras la auditoría de beta."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class TalentV42AuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        catalog = json.loads((ROOT / "data/talent-advisor-catalog.json").read_text(encoding="utf-8"))
        cls.rows = []
        cls.repeat_count = 0
        for entry in catalog["clases"]:
            data = json.loads((ROOT / entry["ruta"]).read_text(encoding="utf-8"))
            for spec in data["especializaciones"]:
                cases = [r for r in data["fichas"] if r["especializacion"] == spec]
                cls.rows.extend(cases)
                if all(r["talentos"] == cases[0]["talentos"] for r in cases):
                    cls.repeat_count += 1

    def test_eighty_one_fichas_and_eighteen_specs_repeating(self):
        self.assertEqual(len(self.rows), 81)
        self.assertEqual(self.repeat_count, 18)

    def test_historical_sources_are_preserved_but_not_displayed_as_current(self):
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('talentData.aviso', app)
        self.assertIn('id="talent-original-detail"', html)
        self.assertIn('textos originales de la beta', html)
        self.assertIn('23/10/2026', app)
        self.assertIn('04/11/2026', app)
        self.assertIn('thank-you-for-testing-the-wow-forever-beta', app)

    def test_legado_and_transparency_are_explicit(self):
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('id="talent-priorities-note"', html)
        self.assertIn('la misma para subir al 60, PvP y mazmorras', app)
        self.assertIn('id="talent-legacy-heading"', html)
        self.assertIn('común a las nueve clases', html)
        self.assertIn('id="talent-source-panel"', html)
        self.assertIn('<summary>Ver fuentes y referencias</summary>', html)
        self.assertIn('entries.findIndex((entry) => entry.url === source.url)', app)

    def test_no_final_builds_created_from_unverified_trees(self):
        for row in self.rows:
            self.assertNotIn("puntosAsignados", row)
            self.assertNotIn("rutaCompra", row)
            self.assertGreater(len(row["talentos"]), 0)


if __name__ == "__main__":
    unittest.main()
