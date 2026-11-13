"""Tests of stack_question.py without Maxima: run from tools/workbench with
python -m unittest discover -s tests"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import stack_question as sq  # noqa: E402


class MissingSemicolons(unittest.TestCase):
    """maxima.semicolon: a line break ends a statement only before a new assignment or call,
    not before else/then/... and not after an operator or such a keyword (TM1 09 03)."""

    def places(self, src):
        return [k for k, _l, _c in sq.missing_semicolons(src)]

    def test_new_statement(self):
        self.assertEqual(self.places("a: 1\nb: 2;"), [4])
        self.assertEqual(self.places("a: 3\nf(2);"), [4])

    def test_else_paren(self):
        src = ("M: if x < L1 then -x^2/2 \n  else ( if x<(L1+L2) then 1 \n"
               "            else 2);\nymin: 3;")
        self.assertEqual(self.places(src), [])
        self.assertEqual(sq.insert_missing_semicolons(src)[0], src)

    def test_open_end(self):
        self.assertEqual(self.places("a: if b then\n f(x) else 2;"), [])
        self.assertEqual(self.places("a: 1+\nf(2);"), [])
        self.assertEqual(self.places("for i:1 thru 3 do\n print(i);"), [])


class IncludePlan(unittest.TestCase):
    """Includes are loaded once per session, again when the file changed or the question assigns
    a name the include defines."""

    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.inc = Path(self.dir.name) / "lib.mac"
        self.inc.write_text("f(x) := x^2$\nlibval: 3$\n", encoding="utf-8")
        inc = self.inc

        class Resolver:
            def local_file(self, url):
                return inc
        self.resolver = Resolver()
        self.session = type("S", (), {})()

    def tearDown(self):
        self.dir.cleanup()

    def plan(self, qv, previous=()):
        return sq.include_plan(self.session, {"questionvariables": qv}, self.resolver, previous)

    def test_once(self):
        qv = 'stack_include("https://x/lib.mac");\na: f(2);'
        skip, sig = self.plan(qv)
        self.assertFalse(skip)
        sq.mark_includes(self.session, sig)
        self.assertTrue(self.plan(qv)[0])

    def test_changed_file(self):
        """The content counts, not the time (a file fetched again from GitHub is newer, but the same)."""
        qv = 'stack_include("https://x/lib.mac");\na: f(2);'
        sq.mark_includes(self.session, self.plan(qv)[1])
        import os
        st = os.stat(self.inc)
        os.utime(self.inc, (st.st_atime, st.st_mtime + 10))
        self.assertTrue(self.plan(qv)[0])
        self.assertIn("reused", self.session.include_note)
        self.inc.write_text("f(x) := x^3$\nlibval: 3$\n", encoding="utf-8")
        self.assertFalse(self.plan(qv)[0])
        self.assertIn("lib.mac changed", self.session.include_note)

    def test_clash(self):
        qv = 'stack_include("https://x/lib.mac");\nlibval: 4;'
        sq.mark_includes(self.session, self.plan(qv)[1])
        self.assertFalse(self.plan(qv)[0])
        qv2 = 'stack_include("https://x/lib.mac");\na: 1;'
        self.assertFalse(self.plan(qv2, previous=["libval"])[0])
        self.assertTrue(self.plan(qv2, previous=["a"])[0])

    def test_no_include(self):
        self.assertEqual(self.plan("a: 1;"), (False, None))


if __name__ == "__main__":
    unittest.main()
