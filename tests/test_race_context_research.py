"""Auditoría de evidencia de WoW Forever: cuatro raciales y sacerdote exclusivo.

No es un test de rankings: protege la separación entre evaluaciones aprobadas
y la capa contextual cuya publicación v40 ha aprobado el usuario.
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
        cls.bundle = read("race-contextual-comparisons-v40-draft.json")
        cls.priestfix = read("race-advisor-priest-horde-alternative.json")
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
            if key(row) == ("Horda", "Sacerdote", "Sagrado"):
                self.assertEqual(source["alternativa"], "Tauren")
                self.assertEqual(row["alternativa"], self.priestfix["alternativa"])
            else:
                self.assertEqual(row["alternativa"], expected["alternativa"])
            self.assertEqual(row["razaRecomendada"], source["razaRecomendada"])

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

    def test_approved_horde_priest_alternative_is_eligible(self):
        fixed = self.priestfix
        self.assertEqual(fixed["estado"], "aprobado_usuario")
        self.assertEqual(fixed["base"]["sha256"], self.original["fuente"]["sha256"])
        self.assertEqual(fixed["alternativaAnterior"], "Tauren")
        self.assertEqual(fixed["alternativa"], "No-muerto")
        self.assertNotIn("Sacerdote", self.evidence["elegibilidad"]["Horda"]["Tauren"])
        self.assertIn("Sacerdote", self.evidence["elegibilidad"]["Horda"]["No-muerto"])
        self.assertEqual([r for r in self.audit["fichas"]
                          if key(r) == ("Horda", "Sacerdote", "Sagrado")][0]["alternativa"],
                         fixed["alternativa"])
        self.assertEqual([r for r in self.audit["fichas"]
                          if r["estado"] == "bloqueada_elegibilidad"], [])

    def test_six_priest_analyses_are_distinct_and_sourced(self):
        drafted = [r for r in self.priest["fichas"] if r["estado"] == "analisis_fuentes_revisado"]
        self.assertEqual(len(drafted), 6)
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

    def test_all_48_playable_comparisons_are_contextual_and_sourced(self):
        self.assertEqual(len(self.bundle["fichas"]), 48)
        keys = [key(row) for row in self.bundle["fichas"]]
        self.assertEqual(len(keys), len(set(keys)))
        covered = {key(row) for row in self.audit["fichas"]
                   if row["estado"] == "analisis_revisado"}
        self.assertEqual(set(keys), covered)
        reviewed = [r for r in self.bundle["fichas"] if r["estado"] == "analisis_fuentes_revisado"]
        self.assertEqual(len(reviewed), 48)
        for row in reviewed:
            with self.subTest(key=key(row)):
                self.assertIn(row["clase"], ("Sacerdote", "Brujo", "Druida",
                    "Guerrero", "Paladín", "Chamán", "Cazador", "Pícaro", "Mago"))
                for side in ("principal", "alternativaAnalisis"):
                    self.assertGreater(len(row[side]["aFavor"]), 120)
                    self.assertGreater(len(row[side]["aTenerEnCuenta"]), 105)
                self.assertGreater(len(row["conclusionPrincipal"]), 145)
                self.assertGreater(len(row["conclusionAlternativa"]), 140)
                self.assertNotEqual(row["principal"]["aFavor"], row["alternativaAnalisis"]["aFavor"])
                self.assertTrue(all(src.startswith("https://worldofwarcraft.blizzard.com/")
                                    for src in row["fuentes"]))
                traits = row["racialesConsideradas"]
                for field in ("principal", "alternativa"):
                    self.assertEqual(len(traits[field]["activas"]), 2)
                    self.assertEqual(len(traits[field]["pasivas"]), 2)
                    if row["clase"] == "Sacerdote":
                        self.assertEqual(len(traits[field]["hechizosSacerdote"]), 2)
                    else:
                        self.assertNotIn("hechizosSacerdote", traits[field])

    def test_revised_priest_holy_has_racial_spell_specifics(self):
        matches = [r for r in self.bundle["fichas"]
                   if key(r) == ("Horda", "Sacerdote", "Sagrado")]
        self.assertEqual(len(matches), 1)
        row = matches[0]
        self.assertEqual(row["alternativa"], "No-muerto")
        self.assertIn("Berserking", row["principal"]["aFavor"])
        self.assertIn("Hex of Weakness", row["principal"]["aFavor"])
        for ability in ("Will of the Forsaken", "Dark Sacrifice", "Touch of Weakness"):
            self.assertIn(ability, row["alternativaAnalisis"]["aFavor"])
        self.assertIn("No-muerto", row["conclusionAlternativa"])
        self.assertEqual(len(row["racialesConsideradas"]["alternativa"]["hechizosSacerdote"]), 2)

    def test_approved_release_has_no_pending_or_ineligible_comparisons(self):
        self.assertEqual(self.audit["estado"], "publicacion_v40_aprobada_usuario")
        self.assertEqual(self.bundle["estado"], "publicacion_v40_aprobada_usuario")
        status = self.audit["resumen"]
        self.assertEqual(status["analisis_revisado"], 48)
        self.assertNotIn("pendiente_analisis_especifico", status)
        self.assertNotIn("bloqueada_elegibilidad", status)
        self.assertEqual(status["sin_alternativa"], 6)


if __name__ == "__main__":
    unittest.main()
