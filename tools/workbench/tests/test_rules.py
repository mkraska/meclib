"""Regression tests of the review rules (rules.py).

Run from tools/workbench:  python -m unittest discover -s tests -v
(or tests/run_tests.bat). Needs no Maxima and no running workbench: the rules read the
meclib Maxima files of the working copy only to know which names each file defines.

Each case is a small STACK question with just what triggers the rule under test.
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import rules  # noqa: E402

# main: an include from a branch would add the finding include.branch, whose fix changes the URL
MAIN = "https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/"


def question(qvars, inputs="", prts="", text="<p>[[input:ans1]] [[validation:ans1]]</p>"):
    """A minimal STACK question in a quiz file."""
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n<question type="stack">\n'
            "<name><text>test</text></name>\n"
            '<questiontext format="html"><text><![CDATA[%s]]></text></questiontext>\n'
            "<questionvariables><text><![CDATA[%s]]></text></questionvariables>\n"
            "%s%s</question>\n</quiz>\n" % (text, qvars, inputs, prts))


def algebraic_input(name="ans1", tans="ta", hint=""):
    return ("<input><name>%s</name><type>algebraic</type><tans>%s</tans>"
            "<syntaxhint>%s</syntaxhint></input>\n" % (name, tans, hint))


def block(text):
    a, b, _ = rules.qfile.question_span(text, 0)
    return text[a:b]


def keys(text):
    return {f["key"] for f in rules.findings(block(text))}


def apply_all(text):
    """The file text with all fixable findings applied (as "apply all" in the review)."""
    fs = rules.findings(block(text))
    new, _applied = rules.apply(text, 0, [f["key"] for f in fs if f["fixable"]], [])
    return new


def qvars_of(text):
    return rules.Q(block(text)).qvars


class IncludeUnused(unittest.TestCase):
    """include.unused must not report a file that another proposed fix of the same review needs
    (TM1 08 11b, 11c before the edit of 2026-11-02)."""

    def test_syntaxhint_needs_fb_value(self):
        # "Ausdruck" becomes {@meclib_h_alg@}, a variable of fb_value.mac
        q = question('stack_include("%sfb_value.mac");\nta: x^2;' % MAIN, algebraic_input(hint="Ausdruck"))
        k = keys(q)
        self.assertIn("inputs.syntaxhint[ans1]", k)
        self.assertNotIn("include.unused[fb_value.mac]", k)

    def test_local_copy_needs_its_file(self):
        # the fix of functions.legacy deletes the local copy, then the include is needed
        q = question('stack_include("%sfb_spline.mac");\nfb_spline(a, b, c) := a + b + c;\nta: fb_spline(1, 2, 3);'
                     % MAIN, algebraic_input(hint="x^2"))
        k = keys(q)
        self.assertIn("functions.legacy[fb_spline]", k)
        self.assertNotIn("include.unused[fb_spline.mac]", k)

    def test_apply_all_keeps_include_in_place(self):
        # applying everything keeps the include where it was, exactly once (not removed and added again at the end)
        for qv, inp, mac in (
                ('stack_include("%sfb_value.mac");\nta: x^2;' % MAIN, algebraic_input(hint="Ausdruck"), "fb_value.mac"),
                ('stack_include("%sfb_spline.mac");\nfb_spline(a, b, c) := a + b + c;\nta: fb_spline(1, 2, 3);' % MAIN,
                 algebraic_input(hint="x^2"), "fb_spline.mac")):
            with self.subTest(mac=mac):
                out = qvars_of(apply_all(question(qv, inp)))
                self.assertEqual(out.count("stack_include("), 1, out)
                self.assertTrue(out.lstrip().startswith('stack_include("%s%s")' % (MAIN, mac)), out)

    def test_really_unused_is_reported(self):
        # counter-check: a file of which nothing is used is still reported
        q = question('stack_include("%sfb_spline.mac");\nta: x^2;' % MAIN, algebraic_input(hint="{@meclib_h_alg@}"))
        self.assertIn("include.unused[fb_spline.mac]", keys(q))


class Multsgn(unittest.TestCase):
    """maxima.multsgn: make_multsgn() with an option STACK no longer knows ("blank" until STACK
    2025033100) makes STACK refuse the question (TM1 03 05, TM3 10 T04)."""

    def test_blank_in_text_and_variables(self):
        q = question('ta: 2*x;\nd: (make_multsgn("blank"), 3*a);',
                     algebraic_input(hint="x^2"),
                     text='<p>{@(make_multsgn("blank"), 2*g)@} [[input:ans1]] [[validation:ans1]]</p>')
        fs = {f["key"]: f for f in rules.findings(block(q))}
        self.assertIn("maxima.multsgn[blank]", fs)
        self.assertEqual(fs["maxima.multsgn[blank]"]["level"], "required")
        out = rules.apply(q, 0, ["maxima.multsgn[blank]"], [])[0]
        self.assertNotIn('"blank"', out)
        self.assertEqual(out.count('make_multsgn("onum")'), 2, out)
        self.assertNotIn("maxima.multsgn[blank]", keys(out))

    def test_unknown_option_without_fix(self):
        q = question('ta: 2*x;\nd: (make_multsgn("kreuz"), 3*a);', algebraic_input(hint="x^2"))
        fs = {f["key"]: f for f in rules.findings(block(q))}
        self.assertIn("maxima.multsgn[kreuz]", fs)
        self.assertFalse(fs["maxima.multsgn[kreuz]"]["fixable"])

    def test_valid_options_not_reported(self):
        q = question('ta: 2*x;\nd: (make_multsgn("onum"), make_multsgn("space"), make_multsgn(OPT), 3*a);',
                     algebraic_input(hint="x^2"))
        self.assertFalse(any(k.startswith("maxima.multsgn") for k in keys(q)))


if __name__ == "__main__":
    unittest.main()
