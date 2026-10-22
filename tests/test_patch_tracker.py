"""Tests aislados: no requieren red ni acceso a una cuenta GitHub."""
import copy
import importlib.util
from pathlib import Path
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "tools" / "patch_tracker.py"
spec = importlib.util.spec_from_file_location("patch_tracker", SCRIPT)
tracker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tracker)

TOKENS = ["warrior", "paladin", "hunter", "rogue", "priest", "shaman",
          "mage", "warlock", "druid"]


def fixture(build="1.60.1.70450"):
    return {
        "format": "zephras-talents/1", "build": build,
        "classes": [
            {"id": i + 1, "token": token, "name": token.capitalize(),
             "trees": [{"index": 0, "name": "A", "icon": 1}],
             "talents": [{
                 "id": i + 100, "name": "Talent " + token, "tree": 0,
                 "row": 1, "column": 1, "maxRank": 1, "ranks": ["Text A"],
                 "pointsInTreeRequired": 0,
             }],
             "arrows": [{"from": i + 100, "to": i + 100, "required": False}]}
            for i, token in enumerate(TOKENS)
        ],
        "legacy": {
            "seasonalCap": 16,
            "currency": "Legacy Points",
            "trees": [
                {"id": tree, "name": "Tree " + str(tree),
                 "perks": [{"id": tree + 500, "name": "Perk", "ranks": ["A"],
                            "maxRank": 1, "row": 1, "column": 1}],
                 "arrows": []}
                for tree in [1187, 1188, 1189]
            ],
            "earnedBy": [{"text": "Reach level 25", "group": "Classes", "points": 1}],
        },
        "pointsByLevel": [{"level": 10, "points": 1}],
        "talentedPerk": [{"rank": 1, "firstPointLevel": 9, "points": 1}],
    }


class PatchTrackerTests(unittest.TestCase):
    def test_first_run_creates_baseline_without_issue(self):
        first = tracker.snapshot(fixture())
        status, changes, previous = tracker.compare(None, first)
        self.assertEqual((status, changes, previous), ("baseline", [], None))
        self.assertTrue(len(first["records"]) > 20)
        self.assertNotIn("Text A", str(first))  # solo huellas, no texto de Blizzard

    def test_unchanged_does_not_reopen_an_issue(self):
        a = tracker.snapshot(fixture())
        status, changes, _ = tracker.compare(a, tracker.snapshot(fixture()))
        self.assertEqual(status, "unchanged")
        self.assertEqual(changes, [])

    def test_version_only(self):
        before = tracker.snapshot(fixture())
        after = tracker.snapshot(fixture("1.60.1.70451"))
        status, changes, previous = tracker.compare(before, after)
        self.assertEqual(status, "version_only")
        self.assertEqual(changes, [])
        self.assertEqual(previous, "1.60.1.70450")

    def test_modified_talent_and_legacy_and_earned_points(self):
        old = fixture()
        new = copy.deepcopy(old)
        new["classes"][0]["talents"][0]["ranks"] = ["Text B"]
        new["classes"][0]["talents"][0]["pointsInTreeRequired"] = 5
        new["legacy"]["trees"][1]["perks"][0]["maxRank"] = 3
        new["legacy"]["earnedBy"].append({"text": "Defeat boss", "group": "Dungeons", "points": 1})
        new["pointsByLevel"][0]["points"] = 2
        status, changes, _ = tracker.compare(tracker.snapshot(old), tracker.snapshot(new))
        self.assertEqual(status, "changed")
        keys = {c["key"] for c in changes}
        self.assertIn("talent/warrior/100", keys)
        self.assertIn("legacy/perk/1188/1688", keys)
        self.assertIn("legacy/earnedBy", keys)
        self.assertIn("progress/pointsByLevel", keys)
        fields = next(c["fields"] for c in changes if c["key"] == "talent/warrior/100")
        self.assertEqual(fields, ["pointsInTreeRequired", "ranks"])
        report = tracker.make_report(None, tracker.snapshot(new), status, changes, "1.60.1.70450",
                                     tracker.BASE_URL + "1.60.1.70451.json")
        self.assertIn("nueve fichas piloto", report["report"])
        self.assertIn("tres perfiles de Legado", report["report"])
        self.assertIn("Subir al 60", report["report"])

    def test_paladin_changes_are_reported_for_review(self):
        before = fixture()
        after = copy.deepcopy(before)
        after["classes"][1]["talents"][0]["ranks"] = ["Updated paladin talent"]
        state_a, state_b = tracker.snapshot(before), tracker.snapshot(after)
        status, changes, previous = tracker.compare(state_a, state_b)
        self.assertEqual(status, "changed")
        report = tracker.make_report(state_a, state_b, status, changes, previous,
                                     tracker.BASE_URL + before["build"] + ".json")
        self.assertIn("nueve fichas piloto del Paladín", report["report"])
        self.assertNotIn("nueve fichas piloto del Guerrero", report["report"])

    def test_shaman_changes_are_reported_for_review(self):
        before = fixture()
        after = copy.deepcopy(before)
        after["classes"][5]["talents"][0]["ranks"] = ["Changed shaman talent"]
        left, right = tracker.snapshot(before), tracker.snapshot(after)
        status, changes, previous = tracker.compare(left, right)
        self.assertEqual(status, "changed")
        report = tracker.make_report(left, right, status, changes, previous,
                                     tracker.BASE_URL + before["build"] + ".json")
        self.assertIn("nueve fichas piloto del Chamán", report["report"])
        self.assertNotIn("nueve fichas piloto del Guerrero", report["report"])
        self.assertNotIn("nueve fichas piloto del Paladín", report["report"])

    def test_added_and_removed_talents(self):
        old = fixture()
        old["classes"][0]["talents"].append({
            "id": 200, "name": "Another warrior talent",
            "tree": 0, "row": 2, "ranks": ["Text C"], "maxRank": 1,
        })
        new = copy.deepcopy(old)
        new["classes"][0]["talents"].pop(0)
        new["classes"][1]["talents"].append({"id": 999, "name": "New",
                                               "tree": 0, "row": 3, "ranks": ["x"]})
        _, changes, _ = tracker.compare(tracker.snapshot(old), tracker.snapshot(new))
        by_id = {c["key"]: c["kind"] for c in changes}
        self.assertEqual(by_id["talent/warrior/100"], "eliminado")
        self.assertEqual(by_id["talent/paladin/999"], "añadido")

    def test_reordered_lists_do_not_trigger_false_changes(self):
        old = fixture()
        new = copy.deepcopy(old)
        new["classes"].reverse()
        new["legacy"]["trees"].reverse()
        new["legacy"]["earnedBy"].reverse()
        status, changes, _ = tracker.compare(tracker.snapshot(old), tracker.snapshot(new))
        self.assertEqual((status, changes), ("unchanged", []))

    def test_missing_data_and_corrupt_old_state_fail_closed(self):
        broken = fixture()
        broken["legacy"].pop("earnedBy")
        with self.assertRaises(ValueError):
            tracker.snapshot(broken)
        with self.assertRaises(ValueError):
            tracker.compare({"schemaVersion": 8, "records": {}}, tracker.snapshot(fixture()))

    def test_index_validation_rejects_unexpected_url(self):
        builds = "1.60.1.70450"
        index = {"format": "zephras-talents-index/1", "latest": builds,
                 "files": [{"build": builds, "url": "https://evil.example/wow.json"}]}
        def fetch(url):
            return index
        with self.assertRaises(ValueError):
            tracker.latest(fetch)

    def test_valid_index_and_data(self):
        data = fixture()
        index = {"format": "zephras-talents-index/1",
                 "latest": data["build"],
                 "files": [{"build": data["build"],
                            "url": tracker.BASE_URL + data["build"] + ".json"}]}
        urls = []
        def fetch(url):
            urls.append(url)
            return index if url == tracker.INDEX_URL else data
        result, url = tracker.latest(fetch)
        self.assertEqual(result["build"], data["build"])
        self.assertEqual(len(urls), 2)
        self.assertTrue(url.startswith(tracker.BASE_URL))


if __name__ == "__main__":
    unittest.main()
