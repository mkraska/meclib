"""Question tests in STACK itself (Tests column, engine "API"): the question goes to the STACK API's
/test route with only the chosen variant as deployed seed and only the chosen tests, so that STACK
runs them as in Moodle (test inputs as expressions with that variant's question variables).
No Docker needed: only the XML sent and the reading of the reply."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402

Q = """<question type="stack">
  <name><text>q</text></name>
  <questionvariables><text>stack_include("https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/fb_value.mac");</text></questionvariables>
  <deployedseed>11</deployedseed>
  <deployedseed>22</deployedseed>
  <qtest>
    <testcase>1</testcase>
    <description>a</description>
  </qtest>
  <qtest>
    <testcase>2</testcase>
    <description>b</description>
  </qtest>
  <qtest>
    <testcase>3</testcase>
    <description>c</description>
  </qtest>
</question>"""
CFG = {"branches": {"main": "main", "dev": "dev2026"}}


class TestXml(unittest.TestCase):

    def test_seed_and_tests(self):
        x = server.stack_test_question(Q, 33, [1, 3], "local", CFG)
        self.assertEqual(x.count("<deployedseed>"), 1)
        self.assertIn("<deployedseed>33</deployedseed>", x)
        self.assertIn("<testcase>1</testcase>", x)
        self.assertNotIn("<testcase>2</testcase>", x)
        self.assertIn("<testcase>3</testcase>", x)

    def test_all_tests(self):
        x = server.stack_test_question(Q, 11, None, "local", CFG)
        self.assertEqual(x.count("<qtest>"), 3)
        self.assertEqual(x.count("<deployedseed>"), 1)

    def test_includes(self):
        """includes follow the source selector, as for /grade"""
        x = server.stack_test_question(Q, 11, None, "local", CFG)
        self.assertNotIn("raw.githubusercontent.com", x)
        x = server.stack_test_question(Q, 11, None, "dev", CFG)
        self.assertIn("mkraska/meclib/dev2026/Maxima/fb_value.mac", x)


class TestLangWarning(unittest.TestCase):
    """STACK's API refuses to run the tests when the question has warnings (validate_for_bulk), e.g.
    "language tag de missing in general feedback, Theta-2-T, ..." (TM3 08 07, 2026-11-17); Moodle's
    bulk test only reports them. The workbench then sends the question again without the [[lang]]
    markers (their contents stay; grading does not depend on feedback texts). meclib questions always
    have this warning (empty [[lang]] blocks in the question text, needed for German feedback), so it
    is not shown; a warning that remains is reported."""

    def test_strip_lang(self):
        q = Q.replace("<name><text>q</text></name>",
                      "<name><text>q</text></name><questiontext><text>[[lang code=\"de\"]]Hallo[[/lang]][[lang code='other']]Hello[[/lang]]</text></questiontext>")
        x = server.stack_test_question(q, 1, None, "local", CFG, strip_lang=True)
        self.assertNotIn("[[lang", x)
        self.assertNotIn("[[/lang]]", x)
        self.assertIn("Hallo", x)
        self.assertIn("Hello", x)

    def test_plain_message(self):
        m = '<i class="icon fa" title="x"></i>Ihre Frage enth\u00e4lt <b>Probleme</b>.'
        self.assertEqual(server.plain_text(m), "Ihre Frage enth\u00e4lt Probleme.")


class TestReply(unittest.TestCase):

    def test_outcomes(self):
        r = {"results": {"33": {"passes": 1, "fails": 1, "messages": "", "outcomes": {
            "1": {"passed": True, "reason": ""}, "3": {"passed": False, "reason": "PRT p: note x expected y"}}}}}
        out = server.stack_test_outcomes(r, 33)
        self.assertEqual(out, {"1": {"pass": True, "reason": ""}, "3": {"pass": False, "reason": "PRT p: note x expected y"}})

    def test_error_of_seed(self):
        r = {"results": {"33": {"passes": None, "fails": None, "messages": "Errors : boom", "outcomes": None}}}
        with self.assertRaises(RuntimeError) as cm:
            server.stack_test_outcomes(r, 33)
        self.assertIn("boom", str(cm.exception))

    def test_upgrade_error(self):
        r = {"isupgradeerror": True, "messages": "old syntax", "results": []}
        with self.assertRaises(RuntimeError):
            server.stack_test_outcomes(r, 33)


if __name__ == "__main__":
    unittest.main()
