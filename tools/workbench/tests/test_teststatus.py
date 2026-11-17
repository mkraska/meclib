"""Test status kept across question changes and restarts (Tests column): per file and question the
results of the question tests per variant and engine (Maxima, STACK API) in
.cache/test_status.json, with the fingerprint of the approval (rules.test_fingerprint): when it
changes, the stored results are "not current" - the page then ignores them, as it treats an
approval, if "approval lapses when the question changes" is on. No Maxima needed."""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402

Q = """<question type="stack">
  <name><text>q1</text></name>
  <questionvariables><text>a: 1;</text></questionvariables>
  <input><name>ans1</name><type>algebraic</type><tans>a</tans></input>
  <qtest>
    <testcase>1</testcase>
    <description>x</description>
    <testinput><name>ans1</name><value>a</value></testinput>
    <expected><name>prt1</name><expectedscore>1</expectedscore><expectedpenalty>0</expectedpenalty><expectedanswernote>prt1-1-T</expectedanswernote></expected>
  </qtest>
  <qtest>
    <testcase>2</testcase>
    <description>y</description>
    <testinput><name>ans1</name><value>0</value></testinput>
    <expected><name>prt1</name><expectedscore>0</expectedscore><expectedpenalty>0</expectedpenalty><expectedanswernote>prt1-1-F</expectedanswernote></expected>
  </qtest>
</question>"""


class TestStatus(unittest.TestCase):

    def setUp(self):
        self.old = server.TESTSTATUS_FILE
        server.TESTSTATUS_FILE = Path(tempfile.mkdtemp()) / "test_status.json"
        server._teststatus = None
        self.target = Path("C:/x/q.xml")

    def tearDown(self):
        server.TESTSTATUS_FILE = self.old
        server._teststatus = None

    def test_save_and_load(self):
        server.test_status_save(self.target, Q, {"1": {"m": {"5": True, "7": False}, "a": {"5": True}}})
        server._teststatus = None                     # as after a restart
        st = server.test_status_load(self.target, Q)
        self.assertEqual(st["1"]["m"], {"5": True, "7": False})
        self.assertEqual(st["1"]["a"], {"5": True})
        self.assertTrue(st["1"]["current"])
        self.assertNotIn("2", st)

    def test_merge(self):
        """a later run overwrites its cells only"""
        server.test_status_save(self.target, Q, {"1": {"m": {"5": True, "7": False}}})
        server.test_status_save(self.target, Q, {"1": {"m": {"7": True}}, "2": {"m": {"5": False}}})
        st = server.test_status_load(self.target, Q)
        self.assertEqual(st["1"]["m"], {"5": True, "7": True})
        self.assertEqual(st["2"]["m"], {"5": False})

    def test_question_changed(self):
        server.test_status_save(self.target, Q, {"1": {"m": {"5": True}}})
        st = server.test_status_load(self.target, Q.replace("a: 1;", "a: 2;"))
        self.assertFalse(st["1"]["current"])
        self.assertEqual(st["1"]["m"], {"5": True})

    def test_new_run_after_change_starts_over(self):
        """results stored for an older version are dropped when a run of the new version is saved"""
        server.test_status_save(self.target, Q, {"1": {"m": {"5": True, "7": True}}})
        q2 = Q.replace("a: 1;", "a: 2;")
        server.test_status_save(self.target, q2, {"1": {"m": {"5": False}}})
        st = server.test_status_load(self.target, q2)
        self.assertEqual(st["1"]["m"], {"5": False})
        self.assertTrue(st["1"]["current"])

    def test_deleted_test_and_other_question(self):
        server.test_status_save(self.target, Q, {"2": {"m": {"5": True}}})
        self.assertEqual(server.test_status_load(self.target, Q.replace("<testcase>2</testcase>", "<testcase>9</testcase>")), {})
        self.assertEqual(server.test_status_load(self.target, Q.replace("<text>q1</text>", "<text>q2</text>")), {})
        self.assertEqual(server.test_status_load(Path("C:/x/other.xml"), Q), {})


if __name__ == "__main__":
    unittest.main()
