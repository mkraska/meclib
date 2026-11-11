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


if __name__ == "__main__":
    unittest.main()
