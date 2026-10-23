"""Expansion regressions: offline completeness, preserved originals and patch review."""
import hashlib
import json
from pathlib import Path
import unittest
from test_patch_tracker import tracker, fixture
import copy

ROOT = Path(__file__).resolve().parents[1]

class TalentExpansionTests(unittest.TestCase):
    def test_original_files_are_byte_identical(self):
        hashes = json.loads((ROOT/'tests/original-talent-hashes.json').read_text())
        for token, expected in hashes.items():
            self.assertEqual(hashlib.sha256((ROOT/f'data/talent-advisor-{token}.json').read_bytes()).hexdigest(), expected)

    def test_every_catalog_file_is_precached(self):
        catalog = json.loads((ROOT/'data/talent-advisor-catalog.json').read_text(encoding='utf-8'))
        sw = (ROOT/'sw.js').read_text(encoding='utf-8')
        self.assertIn('${CACHE_PREFIX}v24', sw)
        for entry in catalog['clases']:
            self.assertIn('"'+entry['ruta']+'"', sw)
            data=json.loads((ROOT/entry['ruta']).read_text(encoding='utf-8'))
            self.assertIn(entry['nombre'], data['obtenerPuntosLegado'][0])
            if entry['nombre'] != catalog['fuenteLegado']:
                self.assertNotIn('legado', data)

    def test_tracker_review_targets_all_nine_classes_without_false_matches(self):
        for index, cls in enumerate(fixture()['classes']):
            with self.subTest(token=cls['token']):
                a=fixture(); b=copy.deepcopy(a)
                b['classes'][index]['talents'][0]['ranks']=['changed']
                left,right=tracker.snapshot(a),tracker.snapshot(b)
                status,changes,previous=tracker.compare(left,right)
                report=tracker.make_report(left,right,status,changes,previous,'https://example.com')['report']
                self.assertEqual(report.count('nueve fichas piloto'),1)

    def test_new_classes_use_current_patch_and_mark_editorial_limits(self):
        expected={'hunter':{'Summon Hawk','Resourcefulness'},'rogue':{'Mutilate','Venom'},
                  'priest':{'Dark Inspiration'},'mage':{'Arcane Wrath','Improved Fire Blast'},
                  'warlock':{'Wrack','Demonic Pact'},'druid':{'Shifting Power','Primal Bite'}}
        for token, names in expected.items():
            data=json.loads((ROOT/f'data/talent-advisor-{token}.json').read_text(encoding='utf-8'))
            self.assertTrue(names <= {t for row in data['fichas'] for t in row['talentos']})
            self.assertIn('ingleses',data['notaFuentes'])
            self.assertIn('15/10',data['notaFuentes'])
            self.assertTrue(any('2360696/6' in s['url'] for s in data['fuentes']))
            self.assertEqual(len({row['resumen'] for row in data['fichas']}),9)

    def test_repeated_talent_lists_are_disclosed_and_retired_names_excluded(self):
        catalog = json.loads((ROOT/'data/talent-advisor-catalog.json').read_text(encoding='utf-8'))
        total = 0
        repeated = 0
        discontinued = {'Call of Thunder', 'Llamada del trueno', 'Malediction', 'Mangle'}
        for cls in catalog['clases']:
            data = json.loads((ROOT/cls['ruta']).read_text(encoding='utf-8'))
            self.assertEqual(len(data['fichas']), 9)
            self.assertEqual(data['estado'], 'borrador_beta')
            self.assertEqual(data['versionCliente'], '1.60.1.70450')
            for spec in data['especializaciones']:
                rows = [f for f in data['fichas'] if f['especializacion'] == spec]
                self.assertEqual({row['objetivo'] for row in rows}, set(catalog['objetivos']))
                all_talents = {talent for row in rows for talent in row['talentos']}
                self.assertFalse(all_talents & discontinued, (data['clase'], spec))
                if all(row['talentos'] == rows[0]['talentos'] for row in rows):
                    repeated += 1
                    self.assertIn('Los talentos destacados se repiten para los tres objetivos', data['aviso'])
                total += len(rows)
        self.assertEqual(total, 81)
        self.assertEqual(repeated, 18)
