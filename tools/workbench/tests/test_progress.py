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


if __name__ == "__main__":
    unittest.main()
