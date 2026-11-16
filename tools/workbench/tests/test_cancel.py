"""Stopping a test run (button "Stop" of the Tests column): the server notes the run's token as
cancelled (POST /api/q/cancel), run_tests() asks before each test and ends early; the reply says
that the run was cancelled. No Maxima needed."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
import stack_question as sq  # noqa: E402


class FakeSession:
    def __init__(self):
        self.runs = 0

    def run_with_results(self, code):
        self.runs += 1
        return "", {}


class Resolver:
    def local_file(self, url):
        return None


class RunTestsStop(unittest.TestCase):

    def setUp(self):
        demo = Path(__file__).resolve().parents[3] / "demo_questions" / "contact_demo_01.xml"
        self.data = sq.question_data(sq.question_element(demo.read_text(encoding="utf-8"), 0))
        self.data["questionvariables"] = "a: 1;"
        self.data["qtests"] = [{"testcase": k, "inputs": {}} for k in (1, 2, 3)]

    def test_all_without_stop(self):
        r, _ = sq.run_tests(FakeSession(), self.data, 1, Resolver())
        self.assertEqual(sorted(r["tests"]), [1, 2, 3])
        self.assertFalse(r.get("cancelled"))

    def test_stop_after_first(self):
        done = []
        r, kill = sq.run_tests(FakeSession(), self.data, 1, Resolver(), on_test=lambda tc, c, e: done.append(tc),
                               stop=lambda: len(done) >= 1)
        self.assertEqual(list(r["tests"]), [1])
        self.assertTrue(r["cancelled"])
        self.assertIn("a", kill)          # the question variables are still removed next time

    def test_stop_before_first(self):
        r, _ = sq.run_tests(FakeSession(), self.data, 1, Resolver(), stop=lambda: True)
        self.assertEqual(r["tests"], {})
        self.assertTrue(r["cancelled"])


class CancelToken(unittest.TestCase):

    def test_cancel(self):
        server.progress_start_tests("t1")
        self.assertFalse(server.run_cancelled("t1"))
        server.cancel_run("t1")
        self.assertTrue(server.run_cancelled("t1"))

    def test_other_token_not_cancelled(self):
        server.cancel_run("t2")
        self.assertFalse(server.run_cancelled("t3"))
        self.assertFalse(server.run_cancelled(None))

    def test_new_run_clears(self):
        server.cancel_run("t4")
        server.progress_start_tests("t4")
        self.assertFalse(server.run_cancelled("t4"))


if __name__ == "__main__":
    unittest.main()
