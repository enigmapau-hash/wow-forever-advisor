"""Publication evidence is distinct from an in-game test; preserve v17 data."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AddonAdvisorTests(unittest.TestCase):
    def test_v17_data_and_tracker_preserved(self):
        hashes = json.loads((ROOT / 'tests/v17-preserved-hashes.json').read_text())
        notice = (' Los talentos destacados se repiten para los tres objetivos de cada '
                  'especialización; no son builds diferenciadas ni probadas al nivel 60.').encode()
        disclosed = {f'data/talent-advisor-{token}.json' for token in
                     ('hunter', 'rogue', 'priest', 'mage', 'warlock', 'druid')}
        for path, expected in hashes.items():
            with self.subTest(path=path):
                content = (ROOT / path).read_bytes()
                if path in disclosed:
                    # En v21 sólo se permite cambiar el aviso editorial, no las recomendaciones.
                    self.assertEqual(content.count(notice), 1)
                    content = content.replace(notice, b'', 1)
                if not path.endswith('.xlsx'):
                    content = content.replace(b'\r\n', b'\n')
                self.assertEqual(hashlib.sha256(content).hexdigest(), expected)

    def test_publication_not_confused_with_testing(self):
        catalog = json.loads((ROOT / 'data/addon-advisor.json').read_text(encoding='utf-8'))
        self.assertEqual(len(catalog['addons']), 11)
        for addon in catalog['addons']:
            self.assertIsNone(addon['pruebaForever'])
            self.assertNotEqual(addon['estado'], 'probado_forever')
        expected = {'ellesmereui', 'procdoc', 'craftprofit-forever', 'itemrack-universal', 'dialogue-ui', 'openmap'}
        self.assertTrue(expected.issubset({a['id'] for a in catalog['addons']}))
        for addon in catalog['addons']:
            if addon['id'] in expected:
                self.assertEqual(addon['estado'], 'publicado_forever')
                self.assertEqual(addon['versionCliente'], '1.60.1')
                self.assertTrue(addon['fuentes'][0]['url'].startswith('https://www.curseforge.com/wow/addons/'))
        openmap = next(a for a in catalog['addons'] if a['id'] == 'openmap')
        self.assertEqual(openmap['version'], 'v0.7.2-beta-forever')
        pending = next(a for a in catalog['addons'] if a['id'] == 'gathermate2')
        self.assertEqual(pending['estado'], 'pendiente_verificar')
        self.assertIsNone(pending['version'])

    def test_offline_assets_and_small_payload(self):
        worker = (ROOT / 'sw.js').read_text(encoding='utf-8')
        for path in ['addon-advisor.js', 'data/addon-advisor.json']:
            self.assertIn('"./' + path + '"', worker)
        self.assertLess(sum((ROOT / p).stat().st_size for p in
                            ['addon-advisor.js', 'data/addon-advisor.json']), 35_000)
        self.assertIn('${CACHE_PREFIX}v26', worker)
