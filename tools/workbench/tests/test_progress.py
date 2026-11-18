"""Progress of a test run (GET /api/q/progress with a token): the results of the tests done so
far, so that the page colours the matrix while the run goes on. No Maxima needed."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402


class TestRunProgress(unittest.TestCase):

    def setUp(self):
        server.progress_start_tests("abc")
        server.progress_add_test(3, 1, {"prts": {}}, "")
        server.progress_add_test(3, 2, {"prts": {}}, "")

    def test_results_after(self):
        r = server.progress_reply({"token": ["abc"], "after": ["1"]})
        self.assertEqual(r["count"], 2)
        self.assertEqual([(x["seed"], x["testcase"]) for x in r["results"]], [(3, 2)])

    def test_all_results(self):
        r = server.progress_reply({"token": ["abc"]})
        self.assertEqual(len(r["results"]), 2)

    def test_other_token(self):
        """an old page or another run sees no results (a reply before the run began)"""
        self.assertNotIn("results", server.progress_reply({"token": ["old"]}))
        self.assertNotIn("results", server.progress_reply({}))

    def test_new_run_starts_empty(self):
        server.progress_start_tests("def")
        self.assertEqual(server.progress_reply({"token": ["def"]})["results"], [])

    def test_bad_after(self):
        self.assertEqual(server.progress_reply({"token": ["abc"], "after": ["x"]})["count"], 2)



class SurveySeeds(unittest.TestCase):
    """Survey of variants from a start seed (2026-11-18): seeds start .. end and the deployed ones
    outside that range, so that a second survey (21 .. 30) adds to a first one (1 .. 20)."""

    def test_default(self):
        self.assertEqual(server.survey_seeds(None, 5, [12]), [1, 2, 3, 4, 5, 12])

    def test_start(self):
        self.assertEqual(server.survey_seeds(21, 25, [3, 22]), [21, 22, 23, 24, 25, 3])

    def test_bounds(self):
        self.assertEqual(server.survey_seeds(0, 2, []), [1, 2])          # seeds from 1
        self.assertEqual(server.survey_seeds(30, 20, []), [30])            # end below start: only start
        self.assertEqual(len(server.survey_seeds(1, 2000, [])), 500)       # at most 500 at a time


if __name__ == "__main__":
    unittest.main()
