"""v33: proteger claridad visual/editorial y preservar las recomendaciones de origen."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA = "ffb510a623c83fa440eb9612cc9b8ab7a02d67a036bbeab14c858e811ffab2ec"


def load(name):
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))


class EditorialV33Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.css = (ROOT / "styles.css").read_text(encoding="utf-8")

    def test_counts_and_original_source_stay_unchanged(self):
        master = load("race-advisor.json")
        additions = load("race-advisor-additions.json")
        druid = load("race-advisor-druid-alternatives.json")
        self.assertEqual(master["fuente"]["sha256"], SOURCE_SHA)
        self.assertEqual(len(master["fichas"]), 51)
        self.assertEqual(len(additions["fichas"]), 3)
        self.assertEqual(len(druid["fichas"]), 6)
        self.assertEqual(sum(r["alternativa"] != "-" for r in master["fichas"]), 42)
        self.assertEqual(len(master["fichas"]) + len(additions["fichas"]), 54)
        self.assertTrue(all(r["alternativa"] == "Cielonato" for r in druid["fichas"]))
        self.assertTrue(all(r["alternativa"] == "-" for r in additions["fichas"]))

    def test_primary_visible_once_and_absence_near_header(self):
        html = self.html
        self.assertIn('id="primary-reason-label"', html)
        self.assertIn('<span data-field="explicacion" hidden></span>', html)
        self.assertIn('id="primary-analysis"', html)
        self.assertIn('id="race-comparison"', html)
        self.assertNotIn('class="race-reason" data-field="motivoPrincipal"', html)
        self.assertIn('<span data-field="motivoPrincipal" hidden></span>', html)
        before = html.index('id="result-race"')
        absent = html.index('id="alternative-empty"')
        reason = html.index('id="primary-reason-label"')
        self.assertLess(before, absent)
        self.assertLess(absent, reason)
        self.assertIn('.race-no-alternative {', self.css)
        self.assertIn('result.scrollIntoView({ block: "start", behavior: "auto" })', self.app)
        self.assertIn('document.getElementById("result-race").focus({ preventScroll: true })', self.app)

    def test_alternatives_identify_scope_and_source(self):
        self.assertNotIn('id="alternative-scope"', self.html)
        self.assertIn('id="alternative-race-link"', self.html)
        self.assertNotIn('"Ventaja racial general"', self.app)
        self.assertNotIn('"En esta especialización"', self.app)
        self.assertNotIn('id="alternative-details"', self.html)
        self.assertIn('id="primary-profile-link"', self.html)
        self.assertIn('druidAlternativePresentation(record)?.use', self.app)
        self.assertIn('alternative?.usoPrincipal || ""', self.app)
        self.assertIn('alternativeRacialExplanation(record)', self.app)
        self.assertNotIn('alternative?.comentarios || ""', self.app)

    def test_label_prose_separate_and_racial_links_accessible(self):
        self.assertIn('function raceDisplayName(name)', self.app)
        self.assertIn('name === "Elfo" ? "Elfo de la noche" : name', self.app)
        self.assertIn('function raceProse(text)', self.app)
        self.assertNotIn('function raceLabel(text)', self.app)
        self.assertIn('replace(/, denominado Elfo en la base/g, "")', self.app)
        self.assertIn('link.setAttribute("aria-label"', self.app)
        self.assertIn('heading.textContent = factionName;', self.app)
        self.assertIn('class="racial-matches"', self.html)
        self.assertIn('.racial-match-links {', self.css)

    def test_secondary_modules_and_version(self):
        self.assertIn('class="profession-choice-main"', self.html)
        self.assertIn('class="profession-choice-alternative"', self.html)
        self.assertIn('id="profession-result"', self.html)
        self.assertIn('Compatibilidad y consulta sin conexión', self.html)
        self.assertIn('Retail o Classic no acredita compatibilidad', self.html)
        addons = (ROOT / "addon-advisor.js").read_text(encoding="utf-8")
        self.assertIn('element("p", "Revisado: " + a.fechaRevision, "field-note")', addons)
        version = (ROOT / "version.js").read_text(encoding="utf-8")
        self.assertIn('self.WOW_PWA_VERSION = "v42"', version)
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn('importScripts("./version.js")', sw)
        self.assertIn('${CACHE_PREFIX}${self.WOW_PWA_VERSION}', sw)


if __name__ == "__main__":
    unittest.main()
