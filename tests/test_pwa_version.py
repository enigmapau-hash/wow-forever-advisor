"""La versión visible y el nombre de caché usan la misma fuente offline."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class PwaVersionTests(unittest.TestCase):
    def test_shared_version_is_loaded_before_app_and_precached(self):
        version = (ROOT / "version.js").read_text(encoding="utf-8")
        self.assertRegex(version, r'self.WOW_PWA_VERSION = "v\d+";')
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertLess(html.index('src="./version.js"'), html.index('src="./app.js"'))
        self.assertIn('id="pwa-version"', html)
        worker = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn('importScripts("./version.js")', worker)
        self.assertIn('"./version.js",', worker)
        self.assertIn('${CACHE_PREFIX}${self.WOW_PWA_VERSION}', worker)
        self.assertNotRegex(worker, r'\$\{CACHE_PREFIX\}v\d+')


if __name__ == "__main__":
    unittest.main()
