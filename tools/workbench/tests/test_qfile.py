"""Tests of qfile.py (file operations of the Questions page), no Maxima needed.

Run from tools/workbench:  python -m unittest discover -s tests -v
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import qfile  # noqa: E402

QUESTION = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="stack">
    <name><text>test</text></name>
    <input>
      <name>ans1</name>
    </input>
    <prt>
      <name>prt1</name>
    </prt>
%s    <qtest>
      <testcase>1</testcase>
    </qtest>
  </question>
</quiz>
"""


class Seeds(unittest.TestCase):
    """seeds_op(): the deployed seeds of the Tests column (2026-11-11)."""

    def test_add_to_question_without_seeds(self):
        new, label = qfile.seeds_op(QUESTION % "", 0, [17, 3, 3])
        self.assertEqual(qfile.deployed_seeds(new), [3, 17])
        # after the PRTs, before the tests, indented like the PRTs
        self.assertIn("    </prt>\n    <deployedseed>3</deployedseed>\n    <deployedseed>17</deployedseed>\n    <qtest>", new)
        self.assertEqual(label, "deployed variants: +3, +17")

    def test_replace_and_remove(self):
        old = QUESTION % "    <deployedseed>1</deployedseed>\n    <deployedseed>2</deployedseed>\n"
        new, label = qfile.seeds_op(old, 0, [2, 5])
        self.assertEqual(qfile.deployed_seeds(new), [2, 5])
        self.assertEqual(label, "deployed variants: +5, -1")
        new, label = qfile.seeds_op(new, 0, [])
        self.assertEqual(qfile.deployed_seeds(new), [])
        self.assertNotIn("deployedseed", new)
        self.assertEqual(new, QUESTION % "")

    def test_crlf_kept(self):
        old = (QUESTION % "").replace("\n", "\r\n")
        new, _ = qfile.seeds_op(old, 0, [4])
        self.assertNotIn("\n", new.replace("\r\n", ""))



RQ = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="stack">
    <name><text>test</text></name>
    <questiontext format="html"><text><![CDATA[<p>a = {@a@}, [[if test="a>1"]]big[[/if]] [[input:ans1]] [[validation:ans1]] [[feedback:a]]</p>
[[jsxgraph input-ref-ans1="stateRef"]] var x = {#a#}; [[/jsxgraph]]]]></text></questiontext>
    <questionvariables><text><![CDATA[a: 2; /* a comment */ b: a^2; s: "a";]]></text></questionvariables>
    <input>
      <name>ans1</name>
      <tans>a</tans>
    </input>
    <prt>
      <name>a</name>
      <feedbackvariables><text>d: ans1 - a;</text></feedbackvariables>
      <node><name>0</name><sans>ans1</sans><tans>a</tans>
        <truefeedback format="html"><text>&lt;p&gt;{@a@} &amp;lt; a&lt;/p&gt;</text></truefeedback></node>
    </prt>
    <qtest>
      <testcase>1</testcase>
      <testinput><name>ans1</name><value>a+1</value></testinput>
      <expected><name>a</name><expectedanswernote>a-1-T</expectedanswernote></expected>
    </qtest>
  </question>
</quiz>
"""


class Rename(unittest.TestCase):
    """rename_op: a variable, input or PRT everywhere (2026-11-12)."""

    def test_variable(self):
        t, label = qfile.rename_op(RQ, 0, "a", "a0", "variable")
        self.assertIn("variable a renamed", label)
        self.assertIn('a0: 2; /* a comment */ b: a0^2; s: "a";', t)       # not in strings, comments
        self.assertIn('<p>a = {@a0@}, [[if test="a0>1"]]big', t)            # not in the plain text
        self.assertIn("var x = {#a0#};", t)
        self.assertIn("<tans>a0</tans>", t)
        self.assertIn("d: ans1 - a0;", t)
        self.assertIn("<value>a0+1</value>", t)
        self.assertIn("&lt;p&gt;{@a0@} &amp;lt; a&lt;/p&gt;", t)          # entity-encoded castext
        self.assertIn("<name>a</name>", t)                                  # the PRT keeps its name
        self.assertIn("[[feedback:a]]", t)

    def test_prt_and_ambiguity(self):
        with self.assertRaises(qfile.AmbiguousName):
            qfile.rename_op(RQ, 0, "a", "p1")
        t, _ = qfile.rename_op(RQ, 0, "a", "p1", "PRT")
        self.assertIn("[[feedback:p1]]", t)
        self.assertIn("<prt>\n      <name>p1</name>", t)
        self.assertIn("<expected><name>p1</name><expectedanswernote>a-1-T</expectedanswernote>", t)  # notes stay
        self.assertIn("{@a@}", t)

    def test_input(self):
        t, _ = qfile.rename_op(RQ, 0, "ans1", "S_x")
        for part in ("[[input:S_x]] [[validation:S_x]]", 'input-ref-S_x="stateRef"', "<name>S_x</name>",
                     "<sans>S_x</sans>", "d: S_x - a;", "<testinput><name>S_x</name>"):
            self.assertIn(part, t)
        self.assertNotIn("ans1", t)

    def test_text_with_file(self):
        """A text with an attached image (<file> after <text>) is renamed, the file kept."""
        q = RQ.replace("[[/jsxgraph]]]]></text></questiontext>",
                       '[[/jsxgraph]]]]></text>\n<file name="a.png" encoding="base64">QUJD</file></questiontext>')
        t, _ = qfile.rename_op(q, 0, "a", "a0", "variable")
        self.assertIn("{@a0@}", t)
        self.assertIn('<file name="a.png" encoding="base64">QUJD</file>', t)

    def test_refused(self):
        for old, new in (("a", "b"), ("zz", "y"), ("ans1", "1x")):
            with self.assertRaises(ValueError):
                qfile.rename_op(RQ, 0, old, new, "variable" if old == "a" else None)


if __name__ == "__main__":
    unittest.main()
