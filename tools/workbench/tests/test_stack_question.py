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


class KillKeepsOptionVariables(unittest.TestCase):
    """A new run removes the names of the previous one with meclib_kill(), not kill(): kill(simp)
    unbinds Maxima's simplifier switch, which Maxima 5.48.1 does not survive ("The variable $SIMP
    is unbound", the run never ends; TM3 09 02 assigns simp in its question variables, so its Check
    hung after the first evaluation, 2026-11-18). meclib_kill.lisp skips Maxima's option variables."""

    def test_variant_uses_meclib_kill(self):
        s = VariantLoadsIncludes.Session()
        t = VariantLoadsIncludes("test_include_loaded")
        t.setUp()
        sq.variant(s, dict(t.data, questionvariables="simp: false;\na: 1;\nsimp: true;"), 1,
                   VariantLoadsIncludes.Resolver(t.inc), ("a", "simp"), None)
        self.assertNotIn("kill(a", s.code)
        self.assertIn("meclib_kill('[a,simp])$", s.code)

    def test_prt_code_uses_meclib_kill(self):
        prt = {"name": "p", "autosimplify": "1", "feedbackvariables": "", "nodes": []}
        code = "\n".join(sq.prt_code(prt, {}, "0.1", "de", "en", lambda s: s, others=("simp", "x")))
        self.assertNotIn("kill(simp", code)
        self.assertIn("meclib_kill('[simp,x])$", code)

    def test_lisp_file_exists(self):
        lisp = Path(sq.__file__).resolve().parent / "meclib_kill.lisp"
        self.assertIn("$meclib_kill", lisp.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()


class VariantLoadsIncludes(unittest.TestCase):
    """variant() (survey, question tests on deployed variants) loads stack_include files: the
    check for forbidden functions looks at the question's statement, not at the load() that
    replaces stack_include - load is forbidden in questions, so the include was dropped while
    the session recorded it as loaded; a test run as the first job of a session then ran without
    the meclib functions (2026-11-15, TM3 08 06)."""

    class Session:
        def __init__(self):
            self.code = ""

        def run_with_results(self, code):
            self.code = code
            return "", {}

    class Resolver:
        def __init__(self, path):
            self.path = path

        def local_file(self, url):
            return self.path

    def setUp(self):
        d = tempfile.mkdtemp()
        self.inc = Path(d) / "fb_value.mac"
        self.inc.write_text("f(x) := x;\n", encoding="utf-8")
        demo = Path(__file__).resolve().parents[3] / "demo_questions" / "contact_demo_01.xml"
        self.data = sq.question_data(sq.question_element(demo.read_text(encoding="utf-8"), 0))
        self.data["questionvariables"] = 'a: 1;\nstack_include("https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/fb_value.mac");'
        self.data["questionnote"] = ""

    def test_include_loaded(self):
        s = self.Session()
        sq.variant(s, dict(self.data), 1, self.Resolver(self.inc), (), None)
        self.assertIn("load(", s.code)
        self.assertIn("fb_value.mac", s.code)

    def test_forbidden_statement_still_dropped(self):
        s = self.Session()
        data = dict(self.data, questionvariables="a: 1;\nb: concat(x, y);")
        sq.variant(s, data, 1, self.Resolver(self.inc), (), None)
        self.assertNotIn("concat(x", s.code)


class StudentWords(unittest.TestCase):
    """Names in a student's answer as STACK checks them (stack_cas_security::is_allowed_to_read and
    is_allowed_to_call for students, 998_security.filter.php): allowed words, forbidden words
    (TM1 10 01, 2026-11-18: F in forbidwords was accepted by the workbench), question variables,
    names STACK knows, at most two characters or a digit at the end, names with underscores part by
    part. Function calls: forbidden words, then STACK's list, question variables, allowed words."""

    def check(self, value, forbid="", allow="", qv=(), units=False):
        return sq.student_word_errors({"forbidwords": forbid, "allowwords": allow}, value, set(qv), units)

    def test_forbidden_word(self):
        self.assertEqual(self.check("3*F*a", forbid="F"), ["Forbidden variable or constant: F."])

    def test_forbidden_word_list(self):
        self.assertEqual(self.check("F+G", forbid="F, G"), ["Forbidden variable or constant: F.",
                                                           "Forbidden variable or constant: G."])

    def test_digit_end_not_split(self):
        """F_1 ends in a digit: allowed as a whole, its part F is not checked (as STACK)"""
        self.assertEqual(self.check("F_1*a", forbid="F"), [])

    def test_allowed_beats_forbidden(self):
        self.assertEqual(self.check("F*a", forbid="F", allow="F"), [])

    def test_long_unknown_name(self):
        self.assertEqual(self.check("2*Fhat/m"), ["Forbidden variable or constant: Fhat."])
        self.assertEqual(self.check("2*Fhat/m", allow="Fhat"), [])

    def test_underscore_parts(self):
        self.assertEqual(self.check("Delta_p+A_h+omega_S"), [])
        self.assertEqual(self.check("phi_dot"), ["Forbidden variable or constant: dot."])

    def test_question_variable(self):
        self.assertEqual(self.check("vS*m", qv={"vS"}), ["Forbidden variable or constant: vS."])
        self.assertEqual(self.check("vS*m", qv={"vS"}, allow="vS"), [])

    def test_units(self):
        """kN has two characters: allowed anyway; kPa only in units mode"""
        self.assertEqual(self.check("3*kN"), [])
        self.assertEqual(self.check("3*kPa"), ["Forbidden variable or constant: kPa."])
        self.assertEqual(self.check("3*kPa", units=True), [])

    def test_functions(self):
        self.assertEqual(self.check("solve(x^2=1, x)", forbid="solve"), ["Forbidden function: solve."])
        self.assertEqual(self.check("sqrt(2)*sin(x)"), [])
        self.assertEqual(self.check("foo(x)"), ["Forbidden function: foo."])
        self.assertEqual(self.check("foo(x)", allow="foo"), [])

    def test_strings_and_numbers(self):
        self.assertEqual(self.check('[0;"alpha";Fhat]'.replace(";", ","), allow="Fhat"), [])
        self.assertEqual(self.check("1.5e3*a"), [])


class SyntaxErrorsCaught(unittest.TestCase):
    """A syntax error in a test input or a model answer must not stop the whole Maxima run (TM3 09 02
    test 4, 2026-11-18: c/2(2*sin(phi_2)*l-b)^2 left the preview empty): errcatch() does not catch
    parse errors, so the expressions go to Maxima as strings, read with eval_string() inside
    errcatch(); a failing one counts as not evaluable (invalid), as in Moodle."""

    BAD = "c/2(2*sin(phi_2)*l-b)^2"

    class Session:
        def __init__(self):
            self.code = []

        def run_with_results(self, code):
            self.code.append(code)
            return "", {}

    class Resolver:
        def local_file(self, url):
            return None

    def data(self):
        demo = Path(__file__).resolve().parents[3] / "demo_questions" / "contact_demo_01.xml"
        d = sq.question_data(sq.question_element(demo.read_text(encoding="utf-8"), 0))
        d["questionvariables"] = "a: 1;"
        name = d["inputs"][0]["name"]
        d["inputs"] = [dict(d["inputs"][0], tans=self.BAD, type="algebraic")]
        d["qtests"] = [{"testcase": 1, "inputs": {name: self.BAD}, "expected": {}}]
        d["questionnote"] = ""
        return d, name

    def assert_quoted(self, code):
        self.assertNotIn("errcatch(" + self.BAD, code)
        self.assertIn('eval_string("%s")' % self.BAD, code)

    def test_evaluate(self):
        d, name = self.data()
        s = self.Session()
        try:
            sq.evaluate(s, d, 1, self.Resolver())
        except Exception:        # the stub returns no results; only the code sent matters
            pass
        self.assert_quoted("\n".join(s.code))

    def test_test_mode(self):
        d, name = self.data()
        s = self.Session()
        try:
            sq.evaluate(s, d, 1, self.Resolver(), answers={}, test_exprs={name: self.BAD})
        except Exception:
            pass
        self.assert_quoted("\n".join(s.code))

    def test_run_tests(self):
        d, name = self.data()
        s = self.Session()
        try:
            sq.run_tests(s, d, 1, self.Resolver())
        except Exception:
            pass
        self.assert_quoted("\n".join(s.code))
