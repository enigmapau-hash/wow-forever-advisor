"""Auditoría de evidencia de WoW Forever: cuatro raciales y sacerdote exclusivo.

No es un test de rankings: protege la separación entre evaluaciones aprobadas
y la investigación nueva todavía no publicable.
"""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))


def key(record):
    return record["faccion"], record["clase"], record["especializacion"]


class RaceContextAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.evidence = read("race-full-racials-draft.json")
        cls.audit = read("race-context-audit-draft.json")
        cls.priest = read("race-priest-context-draft.json")
        cls.warlock = read("race-warlock-context-draft.json")
        cls.original = read("race-advisor.json")
        cls.additions = read("race-advisor-additions.json")
        cls.druid = read("race-advisor-druid-alternatives.json")

    def test_every_race_has_two_active_and_two_passive_racials(self):
        self.assertEqual(len(self.evidence["razas"]), 10)
        for race, record in self.evidence["razas"].items():
            with self.subTest(race=race):
                self.assertEqual(len(record["activas"]), 2)
                self.assertEqual(len(record["pasivas"]), 2)
                self.assertEqual(len(set(record["activas"] + record["pasivas"])), 4)

    def test_priest_has_two_additional_spells_per_eligible_race(self):
        for race in ("Humano", "Enano", "Gnomo", "Elfo", "Troll", "No-muerto"):
            with self.subTest(race=race):
                self.assertEqual(len(self.evidence["razas"][race]["hechizosSacerdote"]), 2)
        for race in ("Orco", "Tauren", "Cielonato Alianza", "Cielonato Horda"):
            self.assertIsNone(self.evidence["razas"][race]["hechizosSacerdote"])

    def test_fear_ward_and_devouring_plague_are_not_exclusive(self):
        for name in ("Fear Ward", "Devouring Plague"):
            self.assertIn(name, self.evidence["sacerdoteBase"])
            for race in self.evidence["razas"].values():
                self.assertNotIn(name, race["hechizosSacerdote"] or [])

    def test_all_54_rankings_accounted_for_without_mutation(self):
        source_keys = {key(r) for r in self.original["fichas"] + self.additions["fichas"]}
        audit_keys = [key(row) for row in self.audit["fichas"]]
        self.assertEqual(len(source_keys), 54)
        self.assertEqual(len(audit_keys), 54)
        self.assertEqual(set(audit_keys), source_keys)
        druid_overlay = {key(r): r for r in self.druid["fichas"]}
        originals = {key(r): r for r in self.original["fichas"] + self.additions["fichas"]}
        for row in self.audit["fichas"]:
            source = originals[key(row)]
            expected = druid_overlay.get(key(row), source)
            self.assertEqual(row["razaRecomendada"], source["razaRecomendada"])
            self.assertEqual(row["alternativa"], expected["alternativa"])

    def test_six_without_alternative_are_not_forced_to_compare(self):
        blank = [r for r in self.audit["fichas"] if r["estado"] == "sin_alternativa"]
        self.assertEqual(len(blank), 6)
        self.assertTrue(all(r["alternativa"] == "-" and not r["comparacion"] for r in blank))

    def test_non_priests_keep_only_four_common_traits(self):
        for row in self.audit["fichas"]:
            if row["estado"] in ("sin_alternativa", "bloqueada_elegibilidad"):
                continue
            for kind in ("racialesPrincipal", "racialesAlternativa"):
                traits = row["evaluacion"][kind]
                self.assertEqual(len(traits["activas"]), 2)
                self.assertEqual(len(traits["pasivas"]), 2)
                if row["clase"] == "Sacerdote":
                    self.assertEqual(len(traits["hechizosSacerdote"]), 2)
                else:
                    self.assertNotIn("hechizosSacerdote", traits)

    def test_sole_blocked_race_class_is_priest_tauren(self):
        blocked = [r for r in self.audit["fichas"] if r["estado"] == "bloqueada_elegibilidad"]
        self.assertEqual(len(blocked), 1)
        self.assertEqual(key(blocked[0]), ("Horda", "Sacerdote", "Sagrado"))
        self.assertEqual(blocked[0]["alternativa"], "Tauren")
        self.assertNotIn("Sacerdote", self.evidence["elegibilidad"]["Horda"]["Tauren"])

    def test_five_priest_analyses_are_distinct_and_sourced(self):
        drafted = [r for r in self.priest["fichas"] if r["estado"] == "analisis_fuentes_revisado"]
        self.assertEqual(len(drafted), 5)
        self.assertEqual(len(self.priest["fichas"]), 6)
        for row in drafted:
            for side in ("principal", "alternativaAnalisis"):
                self.assertGreater(len(row[side]["aFavor"]), 120)
                self.assertGreater(len(row[side]["aTenerEnCuenta"]), 85)
            self.assertIn("worldofwarcraft.blizzard.com", row["fuentes"][0])
            self.assertGreater(len(row["conclusionPrincipal"]), 160)
            self.assertGreater(len(row["conclusionAlternativa"]), 155)
            self.assertNotEqual(row["principal"]["aFavor"], row["alternativaAnalisis"]["aFavor"])

    def test_six_warlock_analyses_use_spec_specific_abilities(self):
        self.assertEqual(len(self.warlock["fichas"]), 6)
        self.assertEqual({r["especializacion"] for r in self.warlock["fichas"]},
                         {"Aflicción", "Demonología", "Destrucción"})
        self.assertEqual({r["faccion"] for r in self.warlock["fichas"]}, {"Alianza", "Horda"})
        for row in self.warlock["fichas"]:
            self.assertEqual(row["clase"], "Brujo")
            self.assertEqual(row["estado"], "analisis_fuentes_revisado")
            for side in ("principal", "alternativaAnalisis"):
                self.assertGreater(len(row[side]["aFavor"]), 170)
                self.assertGreater(len(row[side]["aTenerEnCuenta"]), 120)
            self.assertIn(row["especializacion"], ("Aflicción", "Demonología", "Destrucción"))
            self.assertGreater(len(row["conclusionPrincipal"]), 170)
            self.assertGreater(len(row["conclusionAlternativa"]), 160)

    def test_research_must_not_be_marked_ready_to_publish(self):
        self.assertEqual(self.audit["estado"], "auditoria_editorial_abierta_no_publicado")
        status = self.audit["resumen"]
        self.assertEqual(status["analisis_revisado"], 11)
        self.assertEqual(status["pendiente_analisis_especifico"], 36)
        self.assertEqual(status["bloqueada_elegibilidad"], 1)
        self.assertEqual(status["sin_alternativa"], 6)


if __name__ == "__main__":
    unittest.main()
