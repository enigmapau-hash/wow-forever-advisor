"""Cobertura y consistencia del piloto Guerrero (sin bibliotecas externas)."""
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "talent-advisor-warrior.json"


class TalentAdvisorWarriorDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(DATA.read_text(encoding="utf-8"))

    def test_schema_and_beta_status(self):
        self.assertEqual(self.data["schemaVersion"], 1)
        self.assertTrue(self.data["piloto"])
        self.assertEqual(self.data["clase"], "Guerrero")
        self.assertEqual(self.data["estado"], "borrador_beta")
        self.assertTrue(self.data["versionCliente"])
        self.assertTrue(self.data["fechaRevision"])
        self.assertIn("provisionales", self.data["aviso"].lower())

    def test_nine_distinct_combinations(self):
        specs = {"Armas", "Furia", "Protección"}
        goals = {"Subir al 60", "PvP", "Mazmorras"}
        rows = self.data["fichas"]
        self.assertEqual(len(rows), 9)
        self.assertEqual({(r["especializacion"], r["objetivo"]) for r in rows},
                         {(spec, goal) for spec in specs for goal in goals})
        for row in rows:
            for key in ("resumen", "motivo", "limitacion", "progreso"):
                self.assertTrue(isinstance(row[key], str) and row[key].strip())
            self.assertTrue(row["talentos"])
            self.assertTrue(all(isinstance(x, str) and x.strip() for x in row["talentos"]))
            self.assertNotIn("puntosAsignados", row)

    def test_legacy_profiles_are_separate(self):
        goals = {"Subir al 60", "PvP", "Mazmorras"}
        self.assertEqual(set(self.data["legado"]), goals)
        for record in self.data["legado"].values():
            self.assertTrue(record["ventajas"])
            for key in ("descripcion", "advertencia", "consejo"):
                self.assertTrue(record[key].strip())
        self.assertGreaterEqual(len(self.data["obtenerPuntosLegado"]), 2)

    def test_source_metadata(self):
        self.assertGreaterEqual(len(self.data["fuentes"]), 2)
        for ref in self.data["fuentes"]:
            self.assertTrue(ref["nombre"].strip())
            self.assertTrue(ref["url"].startswith("https://"))
        self.assertTrue(self.data["notaFuentes"].strip())


if __name__ == "__main__":
    unittest.main()
