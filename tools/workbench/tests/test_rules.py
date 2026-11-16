"""Regression tests of the review rules (rules.py).

Run from tools/workbench:  python -m unittest discover -s tests -v
(or tests/run_tests.bat). Needs no Maxima and no running workbench: the rules read the
meclib Maxima files of the working copy only to know which names each file defines.

Each case is a small STACK question with just what triggers the rule under test.
"""
import re
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


def prt(name, nodes, fv=""):
    """A PRT; nodes: [(sans, tans, falsefeedback, quiet)]."""
    out = "<prt><name>%s</name><value>1.0000000</value><autosimplify>1</autosimplify><feedbackstyle>2</feedbackstyle>" % name
    out += "<feedbackvariables><text><![CDATA[%s]]></text></feedbackvariables>" % fv
    for k, (sans, tans, fb, quiet) in enumerate(nodes):
        out += ("<node><name>%d</name><answertest>AlgEquiv</answertest><sans>%s</sans><tans>%s</tans><testoptions></testoptions>"
                "<quiet>%s</quiet><truescoremode>=</truescoremode><truescore>1</truescore><truepenalty></truepenalty>"
                "<truenextnode>-1</truenextnode><trueanswernote>%s-%d-T</trueanswernote>"
                '<truefeedback format="html"><text></text></truefeedback>'
                "<falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty>"
                "<falsenextnode>-1</falsenextnode><falseanswernote>%s-%d-F</falseanswernote>"
                '<falsefeedback format="html"><text><![CDATA[%s]]></text></falsefeedback></node>'
                % (k, sans, tans, quiet, name, k, name, k, fb))
    return out + "</prt>\n"


def prt_of(text, name):
    return next(p for p in rules.Q(block(text)).prts if p["name"] == name)


FBV_QV = 'stack_include("%sfb_value.mac");\nA: 2*F;\nB: 3*F;' % MAIN


class FbVars(unittest.TestCase):
    """prt.fb-floats, part 1: {@fb_vars(...)@} in node feedback becomes fb_floats() in the feedback
    variables (the conversion of TM1 08 11c, decided 2026-11-06). The inputs of these cases are
    not the nodes' SAns, so that part 2 (adding feedback) stays out."""

    def convert(self, q):
        self.assertIn("prt.fb-floats[prt]", keys(q))
        return rules.apply(q, 0, ["prt.fb-floats[prt]"], [])[0]

    def test_simple(self):
        q = question(FBV_QV, algebraic_input(tans="A", hint="x^2"),
                     prt("A", [("S_A", "A", "{@fb_vars(S_A, A, [F])@}", "0")]))
        out = self.convert(q)
        p = prt_of(out, "A")
        self.assertEqual(p["feedbackvariables"].strip(), "[txt, ok]: fb_floats(S_A, A, 0);")
        self.assertEqual(p["nodes"][0]["falsefeedback"], "{@txt@}")
        self.assertEqual(p["nodes"][0]["quiet"], "1")
        self.assertEqual((p["nodes"][0]["answertest"], p["nodes"][0]["sans"], p["nodes"][0]["tans"]), ("AlgEquiv", "S_A", "A"))
        self.assertTrue(qvars_of(out).startswith("fb_dims: [];\n"), qvars_of(out))
        k = keys(out)
        self.assertNotIn("prt.fb-floats[prt]", k)
        self.assertIn("qv.fb-dims[fb_dims]", k)          # empty fb_dims: hint to fill in

    def test_several_calls_and_existing_variables(self):
        q = question(FBV_QV, algebraic_input(tans="A", hint="x^2"),
                     prt("A", [("S_A", "A", "{@fb_vars(S_A, A)@}", "0"),
                               ("S_A", "B", "Text {@fb_vars(S_A, B, [])@}", "1")], fv="d: 1\n/* note */"))
        p = prt_of(self.convert(q), "A")
        self.assertEqual(p["feedbackvariables"],
                         "d: 1\n/* note */;\n[txt1, ok1]: fb_floats(S_A, A, 0);\n[txt2, ok2]: fb_floats(S_A, B, 0);")
        self.assertEqual([n["falsefeedback"] for n in p["nodes"]], ["{@txt1@}", "Text {@txt2@}"])

    def test_same_call_in_both_branches(self):
        """fb_vars in the true and the false branch (TM1 09 05, 06, 2026-11-13): one fb_floats call,
        {@txt@} in the false branch, the true branch's fb_vars dropped (its feedback is empty)."""
        p0 = prt("A", [("S_A", "A", "{@fb_vars(S_A, A, [])@}", "0")]).replace(
            '<truefeedback format="html"><text></text></truefeedback>',
            '<truefeedback format="html"><text><![CDATA[{@fb_vars(S_A, A, [])@}]]></text></truefeedback>')
        p = prt_of(self.convert(question(FBV_QV, algebraic_input(tans="A", hint="x^2"), p0)), "A")
        self.assertEqual(p["feedbackvariables"].strip(), "[txt, ok]: fb_floats(S_A, A, 0);")
        self.assertEqual(p["nodes"][0]["falsefeedback"], "{@txt@}")
        self.assertEqual(p["nodes"][0]["truefeedback"], "")

    def test_existing_call_other_names(self):
        """A PRT with [text, ok]: fb_floats(S_A, A, ...) and {@text@} gets no second call (TM1 05 01,
        2026-11-13), and a comment-only feedback variables text gets no stray ;."""
        q = question(FBV_QV, algebraic_input(tans="A", hint="x^2"),
                     prt("A", [("S_A", "A", "{@text@}", "1")], fv="[text, ok]: fb_floats(S_A, A, 0);"))
        self.assertNotIn("prt.fb-floats[prt]", keys(q))
        q = question(FBV_QV, algebraic_input(tans="A", hint="x^2"),
                     prt("A", [("S_A", "A", "{@fb_vars(S_A, A, [])@}", "0")], fv="/* note */"))
        p = prt_of(self.convert(q), "A")
        self.assertEqual(p["feedbackvariables"], "/* note */\n[txt, ok]: fb_floats(S_A, A, 0);")

    def test_names_taken(self):
        q = question(FBV_QV, algebraic_input(tans="A", hint="x^2"),
                     prt("A", [("S_A", "A", "{@fb_vars(S_A, A)@}", "0")], fv="ok: true;"))
        p = prt_of(self.convert(q), "A")
        self.assertIn("[txt1, ok1]: fb_floats(S_A, A, 0);", p["feedbackvariables"])
        self.assertEqual(p["nodes"][0]["falsefeedback"], "{@txt1@}")

    def test_label_reported_not_converted(self):
        q = question(FBV_QV, algebraic_input(tans="A", hint="x^2"),
                     prt("A", [("S_A", "A", r'{@fb_vars(S_A, A, [], "\\(F_x\\):")@}', "0")]))
        k = keys(q)
        self.assertIn("prt.fb-vars-label[fb_vars]", k)
        self.assertNotIn("prt.fb-floats[prt]", k)

    def test_fb_dims_kept(self):
        q = question('fb_dims: [F = "N"];\n' + FBV_QV, algebraic_input(tans="A", hint="x^2"),
                     prt("A", [("S_A", "A", "{@fb_vars(S_A, A)@}", "0")]))
        out = self.convert(q)
        self.assertEqual(qvars_of(out).count("fb_dims"), 1)
        self.assertNotIn("qv.fb-dims[fb_dims]", keys(out))


def input_of(name, typ, tans):
    return ("<input><name>%s</name><type>%s</type><tans>%s</tans><syntaxhint>x</syntaxhint></input>\n" % (name, typ, tans))


def prt_test(name, nodes, fv=""):
    """A PRT with answer tests of its own: nodes [(answertest, sans, tans, testoptions, falsefeedback, falsenextnode)]."""
    out = prt(name, [(n[1], n[2], n[4], "0") for n in nodes], fv)
    for k, n in enumerate(nodes):
        out = out.replace("<name>%d</name><answertest>AlgEquiv</answertest>" % k, "<name>%d</name><answertest>%s</answertest>" % (k, n[0]), 1)
        node = re.search(r"<node><name>%d</name>.*?</node>" % k, out, re.S).group(0)
        new = node.replace("<testoptions></testoptions>", "<testoptions>%s</testoptions>" % n[3]).replace(
            "<falsenextnode>-1</falsenextnode>", "<falsenextnode>%s</falsenextnode>" % n[5])
        out = out.replace(node, new)
    return out


class FbFloatsAdd(unittest.TestCase):
    """prt.fb-floats, parts 2 and 3: nodes that compare an algebraic input (AlgEquiv) or a numerical
    input with its model answer get fb_floats() / fb_unit() (decided 2026-11-06)."""

    def apply(self, q):
        self.assertIn("prt.fb-floats[prt]", keys(q))
        return rules.apply(q, 0, ["prt.fb-floats[prt]"], [])[0]

    def test_algebraic_first_node_only(self):
        # node 1 compares with the model answer, node 2 checks a typical error (-A): only node 1
        q = question(FBV_QV, input_of("S_A", "algebraic", "A"),
                     prt_test("A", [("AlgEquiv", "S_A", "A", "", "<p>Typischer Fehler?</p>", "1"),
                                    ("AlgEquiv", "S_A", "-A", "", "Vorzeichen!", "-1")]),
                     text="<p>[[input:S_A]] [[validation:S_A]]</p>")
        out = self.apply(q)
        p = prt_of(out, "A")
        self.assertEqual(p["feedbackvariables"].strip(), "[txt, ok]: fb_floats(S_A, A, 0);")
        self.assertEqual(p["nodes"][0]["falsefeedback"], "{@txt@}<p>Typischer Fehler?</p>")   # before the rest
        self.assertEqual(p["nodes"][0]["quiet"], "1")
        self.assertEqual(p["nodes"][1]["falsefeedback"], "Vorzeichen!")
        self.assertEqual(p["nodes"][1]["quiet"], "0")
        self.assertTrue(qvars_of(out).startswith("fb_dims: [];"))
        self.assertNotIn("prt.fb-floats[prt]", keys(out))

    def test_markdown_branch_becomes_html(self):
        # TM1 08 02a: false branch in Markdown, STACK escaped the [[lang]] blocks of {@txt@}
        q = question(FBV_QV, input_of("S_A", "algebraic", "A"),
                     prt_test("A", [("AlgEquiv", "S_A", "A", "", "", "-1")]).replace(
                         '<falsefeedback format="html">', '<falsefeedback format="markdown">'),
                     text="<p>[[input:S_A]] [[validation:S_A]]</p>")
        n = prt_of(self.apply(q), "A")["nodes"][0]
        self.assertEqual((n["falsefeedback"], n["falseformat"]), ("{@txt@}", "html"))

    def test_all_nodes_of_the_prt_become_html(self):
        # one format per PRT: the untouched node 2 and the true branches become html, too
        q = question(FBV_QV, input_of("S_A", "algebraic", "A"),
                     prt_test("A", [("AlgEquiv", "S_A", "A", "", "", "1"),
                                    ("AlgEquiv", "S_A", "-A", "", "Vorzeichen!", "-1")]).replace(
                         'feedback format="html">', 'feedback format="markdown">'),
                     text="<p>[[input:S_A]] [[validation:S_A]]</p>")
        p = prt_of(self.apply(q), "A")
        self.assertEqual({n[br + "format"] for n in p["nodes"] for br in ("true", "false")}, {"html"})
        self.assertEqual(p["nodes"][1]["falsefeedback"], "Vorzeichen!")

    def test_numerical_gets_fb_unit(self):
        q = question(FBV_QV, input_of("S_A", "numerical", "A") + input_of("S_B", "numerical", "B"),
                     prt_test("A", [("AlgEquiv", "S_A", "A", "", "", "-1")]) +
                     prt_test("B", [("NumRelative", "S_B", "B", "0.01", "", "-1")]),
                     text="<p>[[input:S_A]] [[validation:S_A]] [[input:S_B]] [[validation:S_B]]</p>")
        out = self.apply(q)
        self.assertEqual(prt_of(out, "A")["nodes"][0]["falsefeedback"], "{@fb_unit(S_A, A, 0.005)@}")
        self.assertEqual(prt_of(out, "B")["nodes"][0]["falsefeedback"], "{@fb_unit(S_B, B, 0.01)@}")
        self.assertEqual(prt_of(out, "A")["feedbackvariables"], "")
        self.assertNotIn("fb_dims", qvars_of(out))       # fb_unit needs no fb_dims

    def test_replace_and_add_in_one_prt(self):
        q = question(FBV_QV, input_of("S_A", "algebraic", "A") + input_of("S_B", "algebraic", "B"),
                     prt_test("A", [("AlgEquiv", "S_A", "A", "", "{@fb_vars(S_A, A)@}", "1"),
                                    ("AlgEquiv", "S_B", "B", "", "", "-1")]),
                     text="<p>[[input:S_A]] [[validation:S_A]] [[input:S_B]] [[validation:S_B]]</p>")
        p = prt_of(self.apply(q), "A")
        self.assertEqual(p["feedbackvariables"],
                         "[txt1, ok1]: fb_floats(S_A, A, 0);\n[txt2, ok2]: fb_floats(S_B, B, 0);")
        self.assertEqual([n["falsefeedback"] for n in p["nodes"]], ["{@txt1@}", "{@txt2@}"])

    def test_not_touched(self):
        # meclib feedback already there, another answer test on an algebraic input, SAns not an input
        q = question(FBV_QV, input_of("S_A", "algebraic", "A"),
                     prt_test("A", [("AlgEquiv", "S_A", "A", "", "{@fb_floats(S_A, A, 0)[1]@}", "-1")]) +
                     prt_test("B", [("EqualComAss", "S_A", "A", "", "", "-1")]) +
                     prt_test("C", [("AlgEquiv", "ratsimp(S_A)", "A", "", "", "-1")]),
                     text="<p>[[input:S_A]] [[validation:S_A]]</p>")
        self.assertNotIn("prt.fb-floats[prt]", keys(q))



class FeedbackFormat(unittest.TestCase):
    """prt.feedbackformat: one finding per PRT, the fix sets all branches to html (STACK wants one
    format for all nodes of a PRT)."""

    def test_whole_prt(self):
        q = question(FBV_QV, input_of("S_A", "algebraic", "A"),
                     prt_test("A", [("AlgEquiv", "S_A", "A", "", "Falsch.", "1"),
                                    ("AlgEquiv", "S_A", "-A", "", "", "-1")]).replace(
                         '<falsefeedback format="html"><text><![CDATA[Falsch.', '<falsefeedback format="markdown"><text><![CDATA[Falsch.'),
                     text="<p>[[input:S_A]] [[validation:S_A]]</p>")
        k = keys(q)
        self.assertIn("prt.feedbackformat[A]", k)
        out = rules.apply(q, 0, ["prt.feedbackformat[A]"], [])[0]
        p = prt_of(out, "A")
        self.assertEqual({n[br + "format"] for n in p["nodes"] for br in ("true", "false")}, {"html"})
        self.assertNotIn("prt.feedbackformat[A]", keys(out))

    def test_empty_markdown_branches_reported(self):
        # Marklar writes format markdown into every branch, also the empty ones
        q = question(FBV_QV, input_of("S_A", "algebraic", "A"),
                     prt_test("A", [("AlgEquiv", "S_A", "A", "", "", "-1")]).replace('format="html"', 'format="markdown"'),
                     text="<p>[[input:S_A]] [[validation:S_A]]</p>")
        self.assertIn("prt.feedbackformat[A]", keys(q))

    def test_all_html_not_reported(self):
        q = question(FBV_QV, input_of("S_A", "algebraic", "A"),
                     prt_test("A", [("AlgEquiv", "S_A", "A", "", "Falsch.", "-1")]),
                     text="<p>[[input:S_A]] [[validation:S_A]]</p>")
        self.assertFalse(any(x.startswith("prt.feedbackformat") for x in keys(q)))


class FbDims(unittest.TestCase):
    """qv.fb-dims: fb_floats() without the units of the variables."""

    def case(self, qv):
        return keys(question(qv + "\n" + FBV_QV, algebraic_input(tans="A", hint="x^2"),
                             prt("A", [("S_A", "A", "{@fb_floats(S_A, A, 0)[1]@}", "1")])))

    def test_missing_empty_filled(self):
        self.assertIn("qv.fb-dims[fb_dims]", self.case(""))
        self.assertIn("qv.fb-dims[fb_dims]", self.case("fb_dims: [];"))
        self.assertNotIn("qv.fb-dims[fb_dims]", self.case('fb_dims: [F = "N"];'))

    def test_without_fb_floats(self):
        q = question(FBV_QV, algebraic_input(tans="A", hint="x^2"))
        self.assertNotIn("qv.fb-dims[fb_dims]", keys(q))


def with_note(text, note):
    return text.replace("<questionvariables>", "<questionnote><text><![CDATA[%s]]></text></questionnote>\n<questionvariables>" % note, 1)


def with_seeds(text, seeds):
    return text.replace("</question>", "".join("<deployedseed>%d</deployedseed>\n" % s for s in seeds) + "</question>", 1)


class Variants(unittest.TestCase):
    """variants.*: randomised questions need deployed variants and a question note
    (agents/stack_essentials.md of STACK, read 2026-11-11)."""

    QV = "a: rand([2, 3, 5]);\nta: a*x;"

    def test_random_without_seeds_and_note(self):
        k = keys(question(self.QV, algebraic_input(hint="x^2")))
        self.assertIn("variants.none", k)
        self.assertIn("variants.note", k)

    def test_random_with_seeds_and_note(self):
        q = with_seeds(with_note(question(self.QV, algebraic_input(hint="x^2")), "{@a@}"), [1, 2])
        k = keys(q)
        self.assertFalse(any(x.startswith("variants.") for x in k), k)

    def test_not_random(self):
        k = keys(question("a: 3;\nta: a*x;", algebraic_input(hint="x^2")))
        self.assertFalse(any(x.startswith("variants.") for x in k), k)

    def test_variable_named_rand(self):
        # a variable named rand... makes the question random for STACK, so all three findings
        k = keys(question("randval: 3;\nta: randval*x;", algebraic_input(hint="x^2")))
        self.assertIn("variants.rand-name[randval]", k)
        self.assertIn("variants.none", k)

    def test_rand_in_string_or_comment(self):
        k = keys(question('/* rand(3) */ s: "rand";\nta: x;', algebraic_input(hint="x^2")))
        self.assertNotIn("variants.none", k)


def with_test(text, tc=1, note="A-1-T"):
    return text.replace("</question>", "<qtest><testcase>%d</testcase><description>d</description>"
                        "<testinput><name>S_A</name><value>A</value></testinput>"
                        "<expected><name>A</name><expectedscore>1</expectedscore><expectedpenalty>0</expectedpenalty>"
                        "<expectedanswernote>%s</expectedanswernote></expected></qtest>\n</question>" % (tc, note), 1)


class Approval(unittest.TestCase):
    """Approval of question tests (Tests column, 2026-11-11): recorded in the question description
    with a fingerprint; stale when variables, inputs, PRTs or the test change, not for feedback texts."""

    def base(self):
        return with_test(question("A: 2*F;\nta: A;", input_of("S_A", "algebraic", "A"),
                                  prt_test("A", [("AlgEquiv", "S_A", "A", "", "Falsch.", "-1")]),
                                  text="<p>[[input:S_A]] [[validation:S_A]]</p>"))

    def test_approve_and_stale(self):
        q, label = rules.approve(self.base(), 0, 1)
        self.assertEqual(label, "test 1 approved")
        self.assertIn("Tests approved: 1 [", rules.Q(block(q)).data.get("questiondescription", "") or q)
        self.assertEqual(rules.approvals(block(q)), {"1": {"date": rules.time.strftime("%Y-%m-%d"), "current": True}})
        # a feedback text does not matter
        q2 = q.replace("Falsch.", "Leider falsch.")
        self.assertTrue(rules.approvals(block(q2))["1"]["current"])
        # the question variables do
        q3 = q.replace("A: 2*F;", "A: 3*F;")
        self.assertFalse(rules.approvals(block(q3))["1"]["current"])

    def test_approve_with_expected(self):
        exp = {"A": {"score": "1", "penalty": "0", "note": "A-0-T"}}
        q, label = rules.approve(self.base(), 0, 1, exp)
        self.assertIn("replaced", label)
        t = rules.qfile.qtests(block(q))[0]
        e = t["expected"]["A"]
        self.assertEqual((float(e["score"]), float(e["penalty"]), e["note"]), (1.0, 0.0, "A-0-T"))
        # approving again with the same values changes nothing but the approval
        _q, label2 = rules.approve(q, 0, 1, exp)
        self.assertEqual(label2, "test 1 approved")
        self.assertEqual(t["inputs"], {"S_A": "A"})
        self.assertTrue(rules.approvals(block(q))["1"]["current"])

    def test_review_keeps_approval(self):
        q, _ = rules.approve(self.base(), 0, 1)
        fs = [f["key"] for f in rules.findings(block(q)) if f["fixable"]]
        out, _ = rules.apply(q, 0, fs[:1], [])
        self.assertIn("1", rules.approvals(block(out)))


class Locked(unittest.TestCase):
    """state.locked: the legacy state "locked"; for a spline it is a state of its own (TM1 09 05, 2026-11-11)."""

    def test_spline_not_reported(self):
        q = question('initdata: [["spline","",[0,0],[0,1],[2,1],[0.6,1],[1.5,1],"b-","locked"]];\nta: x;', algebraic_input(hint="x^2"))
        self.assertFalse(any(k.startswith("state.locked") for k in keys(q)), keys(q))

    def test_beam_still_reported(self):
        q = question('initdata: [["beam","",[0,0],[2,0],0.13,"locked"], ["spline","",[0,0],[0,1],[2,1],[0.6,1],[1.5,1],"b-","locked"]];\nta: x;',
                     algebraic_input(hint="x^2"))
        k = keys(q)
        self.assertIn("state.locked[beam]", k)
        self.assertNotIn("state.locked[untested]", k)



def prt_ab(name, sans, tans="ta", nodes=None):
    nodes = nodes or [("0", sans, tans, "-1", "-1")]
    body = "".join("<node><name>%s</name><answertest>AlgEquiv</answertest><sans>%s</sans><tans>%s</tans>"
                   "<truescore>1</truescore><truenextnode>%s</truenextnode><trueanswernote>%s-%d-T</trueanswernote>"
                   "<falsescore>0</falsescore><falsenextnode>%s</falsenextnode><falseanswernote>%s-%d-F</falseanswernote></node>"
                   % (n, sa, ta, tn, name, k + 1, fn, name, k + 1) for k, (n, sa, ta, tn, fn) in enumerate(nodes))
    return "<prt><name>%s</name><value>1</value><feedbackvariables><text></text></feedbackvariables>%s</prt>\n" % (name, body)


class InputPrt(unittest.TestCase):
    """inputs.no-prt, prt.no-input (2026-11-12, idea from the STACK editor of T. Bock)."""

    def test_both_used(self):
        k = keys(question("ta: x;", algebraic_input(hint="x"), prt_ab("prt1", "ans1")))
        self.assertFalse({x for x in k if x.startswith(("inputs.no-prt", "prt.no-input"))}, k)

    def test_input_without_prt(self):
        q = question("ta: x;", algebraic_input(hint="x") + algebraic_input("ans2", hint="x"), prt_ab("prt1", "ans1"),
                     text="<p>[[input:ans1]] [[validation:ans1]] [[input:ans2]] [[validation:ans2]]</p>")
        self.assertIn("inputs.no-prt[ans2]", keys(q))

    def test_prt_without_input(self):
        k = keys(question("ta: x;", algebraic_input(hint="x"), prt_ab("prt1", "ans1") + prt_ab("prt2", "ta")))
        self.assertIn("prt.no-input[PRT prt2]", k)
        self.assertNotIn("prt.no-input[PRT prt1]", k)

    def test_graphic_input_left_to_graphic_rules(self):
        q = question("ta: x;", algebraic_input("objects", hint="x"), prt_ab("prt1", "ta"),
                     text="<p>[[input:objects]]</p>")
        self.assertNotIn("inputs.no-prt[objects]", keys(q))


class TestsNone(unittest.TestCase):
    """tests.none: a question with inputs and no tests gets test "TAns" (2026-11-12)."""

    def test_adds_tans_test(self):
        q = question("ta: x;", algebraic_input(hint="x"),
                     prt_ab("prt1", "ans1", nodes=[("0", "ans1", "ta", "1", "-1"), ("1", "ans1", "ta", "-1", "-1")]))
        self.assertIn("tests.none", keys(q))
        f = next(f for f in rules.findings(block(q)) if f["rule"] == "tests.none")
        t = rules.qfile.qtests(f["fix"](block(q)))
        self.assertEqual(len(t), 1)
        self.assertEqual(t[0]["description"], "TAns")
        self.assertEqual(t[0]["inputs"], {"ans1": "ta"})
        self.assertEqual(t[0]["expected"], {})       # filled by running and approving the test on the page
        self.assertNotIn("tests.none", {f2["key"] for f2 in rules.findings(f["fix"](block(q)))})

    def test_choice_input(self):
        inp = "<input><name>ans1</name><type>radio</type><tans>mc</tans></input>\n"
        f = next(f for f in rules.findings(block(question("mc: [[1,true],[2,false]];", inp, prt_ab("prt1", "ans1"))))
                 if f["rule"] == "tests.none")
        self.assertIn("first(mcq_correct(mc))", f["message"])



class TestsGraphicInputEmpty(unittest.TestCase):
    """tests.graphic-input-empty: a test whose graphic input is [] (TM1 09 T03, 2026-11-13)."""

    def test_empty_names(self):
        qt = ("<qtest><testcase>1</testcase><testinput><name>names</name><value>[]</value></testinput>"
              "<expected><name>prt1</name><expectedanswernote>prt1-1-T</expectedanswernote></expected></qtest>\n")
        text = '<p>[[jsxgraph input-ref-names="fbd_names"]] [[/jsxgraph]] [[input:names]] [[validation:names]]</p>'
        q = question("ta: x;", algebraic_input("names", hint="x"), prt_ab("prt1", "names") + qt, text=text)
        self.assertIn("tests.graphic-input-empty[test 1]", keys(q))
        self.assertNotIn("tests.graphic-input-empty[test 1]", keys(q.replace("<value>[]</value>", "<value>[1,2]</value>")))


class TestsMissingVar(unittest.TestCase):
    """tests.missing-var: a test input naming a qt<n>_ variable that is not there (2026-11-12, TM1 09 06)."""

    def test_missing_and_present(self):
        qt = ("<qtest><testcase>1</testcase><testinput><name>ans1</name><value>qt1_ans1</value></testinput>"
              "<expected><name>prt1</name><expectedanswernote>prt1-1-T</expectedanswernote></expected></qtest>\n")
        q = question("ta: x;", algebraic_input(hint="x"), prt_ab("prt1", "ans1") + qt)
        self.assertIn("tests.missing-var[test 1]", keys(q))
        q = question("ta: x;\nqt1_ans1: x;", algebraic_input(hint="x"), prt_ab("prt1", "ans1") + qt)
        self.assertNotIn("tests.missing-var[test 1]", keys(q))



class FbFloatsTol(unittest.TestCase):
    """prt.fb-floats-tol: the tolerance of fb_floats() is that of the grading (2026-11-13): the
    feedback names only the deviations that lower the grade."""

    def finding(self, fv, sans="S_A", tans="A", test="AlgEquiv", opt=""):
        p = prt("A", [(sans, tans, "{@txt@}", "1")], fv=fv)
        p = p.replace("<answertest>AlgEquiv</answertest>", "<answertest>%s</answertest>" % test)
        p = p.replace("<testoptions></testoptions>", "<testoptions>%s</testoptions>" % opt)
        q = question(FBV_QV, algebraic_input(tans="A", hint="x^2"), p)
        return [f for f in rules.findings(block(q)) if f["rule"] == "prt.fb-floats-tol"], q

    def test_exact_grading_wants_zero(self):
        fs, q = self.finding("[txt, ok]: fb_floats(S_A, A, 0.005);")
        self.assertEqual([f["level"] for f in fs], ["recommended"])
        self.assertIn("[txt, ok]: fb_floats(S_A, A, 0);", prt_of(fs[0]["fix"](block(q)), "A")["feedbackvariables"])
        self.assertEqual(self.finding("[txt, ok]: fb_floats(S_A, A, 0);")[0], [])

    def test_numrelative(self):
        fs, q = self.finding("[txt, ok]: fb_floats(S_A, A, 0);", test="NumRelative", opt="0.01")
        self.assertIn("[txt, ok]: fb_floats(S_A, A, 0.01);", prt_of(fs[0]["fix"](block(q)), "A")["feedbackvariables"])

    def test_graded_by_ok(self):
        self.assertEqual(self.finding("[txt, ok]: fb_floats(S_A, A, 0.005);", sans="ok", tans="true")[0], [])

    def test_no_matching_node(self):
        fs, _ = self.finding("[txt, ok]: fb_floats(S_A, B, 0.005);")
        self.assertEqual([(f["level"], f["fix"]) for f in fs], [("hint", None)])


class CairnChecks(unittest.TestCase):
    """Rules from the rule collection of Cairn for Stack (2026-11-13)."""

    def test_html_comment(self):
        q = question("ta: x;", algebraic_input(hint="x"), prt_ab("prt1", "ans1"),
                     text='<p>[[input:ans1]] [[validation:ans1]]</p><!-- [[include src="x.html" /]] --><!-- plain -->')
        f = next(f for f in rules.findings(block(q)) if f["rule"] == "text.html-comment")
        new = f["fix"](block(q))
        self.assertIn('[[comment]] [[include src="x.html" /]] [[/comment]]', new)
        self.assertIn("<!-- plain -->", new)
        self.assertNotIn("text.html-comment", {x["rule"] for x in rules.findings(new)})

    def test_unreachable(self):
        p = prt_ab("prt1", "ans1", nodes=[("0", "ans1", "ta", "-1", "-1"), ("1", "ans1", "ta", "-1", "-1")])
        k = keys(question("ta: x;", algebraic_input(hint="x"), p))
        self.assertIn("prt.unreachable[PRT prt1]", k)
        p = prt_ab("prt1", "ans1", nodes=[("0", "ans1", "ta", "1", "-1"), ("1", "ans1", "ta", "-1", "-1")])
        self.assertNotIn("prt.unreachable[PRT prt1]", keys(question("ta: x;", algebraic_input(hint="x"), p)))

    def test_jsxgraph(self):
        text = "<p>[[jsxgraph]] var a = {@ta@}; [[input:ans1]] [[/jsxgraph]] [[validation:ans1]]</p>"
        q = question("ta: x;", algebraic_input(hint="x"), prt_ab("prt1", "ans1"), text=text)
        k = keys(q)
        self.assertIn("graphic.input-in-jsxgraph", k)
        self.assertIn("graphic.castext-in-jsxgraph", k)
        f = next(f for f in rules.findings(block(q)) if f["rule"] == "graphic.castext-in-jsxgraph")
        self.assertIn("var a = {#ta#};", f["fix"](block(q)))

    def test_castext_in_maxima(self):
        q = question("ta: x;", algebraic_input(hint="x"), prt_ab("prt1", "ans1", "{@ta@}"))
        f = next(f for f in rules.findings(block(q)) if f["rule"] == "prt.castext-in-maxima")
        self.assertIn("<tans>ta</tans>", f["fix"](block(q)))
        q = question("ta: x;", algebraic_input(hint="x"),
                     prt_ab("prt1", "ans1").replace("<text></text>", '<text>t: castext("{@ta@}");</text>'))
        self.assertNotIn("prt.castext-in-maxima", keys(q))       # castext in a string is right

    def test_unused(self):
        q = question("ta: x;\nu: 3; w: ta+1;\nr: rand(5);", algebraic_input(hint="x"), prt_ab("prt1", "ans1"))
        k = keys(q)
        self.assertIn("qv.unused[u]", k)
        self.assertIn("qv.unused[w]", k)
        self.assertIn("qv.unused[r]", k)
        self.assertNotIn("qv.unused[ta]", k)
        fs = {f["key"]: f for f in rules.findings(block(q))}
        self.assertIsNone(fs["qv.unused[r]"]["fix"])          # rand(): deleting changes the variants
        new = fs["qv.unused[u]"]["fix"](block(q))
        self.assertIn("ta: x;\nw: ta+1;\nr: rand(5);", new)


class UnitName(unittest.TestCase):
    """qv.unit-name: the fix renames the variable everywhere (2026-11-12)."""

    def test_fix_renames(self):
        inp = "<input><name>ans1</name><type>units</type><tans>m*g</tans></input>\n"
        q = question("g: 10*m/s^2;\nm: 2*kg;", inp, prt_ab("prt1", "ans1", "m*g"),
                     text="<p>g = {@g@} [[input:ans1]] [[validation:ans1]] [[feedback:prt1]]</p>")
        f = next(f for f in rules.findings(block(q)) if f["key"] == "qv.unit-name[g]")
        new = f["fix"](block(q))
        self.assertIn("g0: 10*m/s^2;", new)
        self.assertIn("{@g0@}", new)
        self.assertIn("<tans>m*g0</tans>", new)
        self.assertNotIn("qv.unit-name[g]", {x["key"] for x in rules.findings(new)})


if __name__ == "__main__":
    unittest.main()
