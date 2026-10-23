"""Regresión editorial v30: reducir duplicación visible conservando datos y accesibilidad."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HASH = "ffb510a623c83fa440eb9612cc9b8ab7a02d67a036bbeab14c858e811ffab2ec"


class EditorialCleanupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.styles = (ROOT / "styles.css").read_text(encoding="utf-8")
        cls.source = json.loads((ROOT / "data/race-advisor.json").read_text(encoding="utf-8"))
        cls.extra = json.loads((ROOT / "data/race-advisor-additions.json").read_text(encoding="utf-8"))
        cls.druid = json.loads((ROOT / "data/race-advisor-druid-alternatives.json").read_text(encoding="utf-8"))

    def test_records_and_classification_unmodified(self):
        self.assertEqual(self.source["fuente"]["sha256"], HASH)
        self.assertEqual(len(self.source["fichas"]), 51)
        self.assertEqual(len(self.extra["fichas"]), 3)
        self.assertEqual(len(self.druid["fichas"]), 6)
        self.assertEqual({row["alternativa"] for row in self.druid["fichas"]}, {"Cielonato"})
        self.assertEqual({row["razaRecomendada"] for row in self.druid["fichas"]},
                         {"Elfo", "Tauren"})
        for row in self.extra["fichas"]:
            self.assertEqual((row["clase"], row["faccion"], row["razaRecomendada"], row["alternativa"]),
                             ("Paladín", "Horda", "No-muerto", "-"))
            self.assertNotIn("única raza", row["explicacion"])
            self.assertIn("Voluntad de los Renegados", row["explicacion"])

    def test_single_alternative_message_and_optional_comparison(self):
        self.assertNotIn('id="no-alternative"', self.html)
        self.assertNotIn('id="race-addition-note"', self.html)
        self.assertIn('id="race-druid-details"', self.html)
        self.assertIn('summary>¿Por qué estas dos razas?</summary>', self.html)
        self.assertIn('id="race-druid-note"', self.html)
        self.assertIn('record.usoAlternativa', self.app)
        self.assertNotIn("sin estrellas nuevas", self.app)
        self.assertIn("Sin alternativa: No-muerto es la única raza", self.app)
        self.assertIn("Sin alternativa: Enano es la única raza", self.app)

    def test_technical_notices_outside_initial_explorer(self):
        self.assertNotIn('id="skyborne-icon-note"', self.html)
        self.assertNotIn('getElementById("skyborne-icon-note")', self.app)
        self.assertIn('<summary>Fuentes y notas de beta</summary>', self.html)
        self.assertIn('id="skyborne-verification"', self.html)
        self.assertIn('id="skyborne-sources"', self.html)
        self.assertIn('id="skyborne-alternatives"', self.html)
        self.assertIn('<summary>Cambios oficiales de la beta', self.html)
        self.assertIn('id="race-beta-updates"', self.html)
        self.assertIn('id="racial-beta-updates"', self.html)

    def test_statuses_are_accessible_and_precache_updated(self):
        self.assertIn('id="selection-status" role="status"', self.html)
        self.assertIn('id="racial-status" role="status"', self.html)
        self.assertIn('id="skyborne-status" class="selection-status" role="status"', self.html)
        self.assertIn('.visually-hidden {', self.styles)
        self.assertIn('classList.add("visually-hidden")', self.app)
        self.assertIn('classList.remove("visually-hidden")', self.app)
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn("${CACHE_PREFIX}v30", sw)
        self.assertIn('"./data/race-advisor-druid-alternatives.json"', sw)
        self.assertIn('"./data/race-advisor-additions.json"', sw)


if __name__ == "__main__":
    unittest.main()
