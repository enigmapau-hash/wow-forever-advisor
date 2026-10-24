"""Integridad de Race Advisor v43 sin cambiar el Excel histórico."""
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class RaceV43Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/"data/race-rankings-v43.json").read_text(encoding="utf-8"))
        cls.rows=cls.data["fichas"]

    def test_complete_eligibility_and_top_two(self):
        self.assertEqual(len(self.rows),54)
        self.assertEqual(sum(len(r["fullOrder"]) for r in self.rows),168)
        self.assertEqual(sum("Cielonato" in r["fullOrder"] for r in self.rows),30)
        self.assertEqual(sum(r["alternativa"]=="-" for r in self.rows),6)
        self.assertEqual(sum(r["empateTecnicoEditorial"] for r in self.rows),20)
        self.assertEqual(sum(r["segundaTerceraMuyProximas"] for r in self.rows),10)
        self.assertEqual(self.data["fuenteOriginal"]["sha256"],"410fb6580b3a3c6eaecc041c1b662a4ec7a038b344ff10baa683b55d24b34e04")
        keys=set()
        for r in self.rows:
            key=(r["faccion"],r["clase"],r["especializacion"])
            self.assertNotIn(key,keys)
            keys.add(key)
            self.assertEqual(len(r["fullOrder"]),len(set(r["fullOrder"])))
            self.assertEqual(set(r["puntuacionesEditoriales"]),set(r["fullOrder"]))
            scores=[r["puntuacionesEditoriales"][name] for name in r["fullOrder"]]
            self.assertEqual(scores,sorted(scores,reverse=True))
            self.assertEqual(r["empateTecnicoEditorial"],len(scores)>1 and scores[0]-scores[1]<2)
            self.assertEqual(r["segundaTerceraMuyProximas"],len(scores)>2 and scores[1]-scores[2]<2)
            self.assertEqual(r["razaRecomendada"],r["fullOrder"][0])
            self.assertEqual(r["alternativa"],r["fullOrder"][1] if len(r["fullOrder"])>1 else "-")

    def test_decisive_recalibrations_v2(self):
        by={(r["faccion"],r["clase"],r["especializacion"]):r for r in self.rows}
        for key,first,second in [
            (("Alianza","Mago","Escarcha"),"Humano","Gnomo"),
            (("Alianza","Pícaro","Combate"),"Enano","Humano"),
            (("Horda","Guerrero","Furia"),"Orco","Tauren"),
            (("Horda","Chamán","Mejora"),"Orco","Tauren"),
            (("Horda","Sacerdote","Disciplina"),"No-muerto","Troll"),
            (("Horda","Sacerdote","Sombras"),"No-muerto","Troll"),
            (("Horda","Sacerdote","Sagrado"),"Troll","No-muerto"),
        ]:
            self.assertEqual((by[key]["razaRecomendada"],by[key]["alternativa"]),(first,second))

    def test_versioned_cache_and_order(self):
        html=(ROOT/"index.html").read_text(encoding="utf-8")
        sw=(ROOT/"sw.js").read_text(encoding="utf-8")
        self.assertLess(html.index("./race-v43-content.js"),html.index("./app.js"))
        for path in ("./race-v43-content.js","./data/race-rankings-v43.json"):
            self.assertIn(path,sw)
        self.assertIn('self.WOW_PWA_VERSION = "v43"',(ROOT/"version.js").read_text(encoding="utf-8"))

if __name__=="__main__":
    unittest.main()
