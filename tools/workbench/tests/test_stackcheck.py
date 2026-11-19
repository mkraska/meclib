"""Check of the preview in STACK itself (preview bar, engine "API", POST /api/q/stackcheck): the
answers go to the STACK API's route grade, each input listed to validate; the reply keeps STACK's
HTML (feedback, validation) with the plots as URLs of the API. No Docker needed: stackapi is
replaced by a stub."""
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
import stackapi  # noqa: E402

Q = """<?xml version="1.0" encoding="UTF-8"?>
<quiz>
<question type="stack">
  <name><text>q</text></name>
  <questionvariables><text>a: 1;</text></questionvariables>
  <deployedseed>11</deployedseed>
</question>
</quiz>
"""


class StackCheck(unittest.TestCase):

    def setUp(self):
        d = Path(tempfile.mkdtemp())
        self.file = d / "q.xml"
        self.file.write_text(Q, encoding="utf-8")
        self.calls = []

        def call(route, body, timeout=900):
            self.calls.append((route, body))
            if route == "grade":
                return 1.0, {"isgradable": True, "score": 0.5, "scoreweights": {"p": 1, "total": 1},
                             "prts": {"p": '<div class="incorrect">no</div><img src="prt-p-0.png">'},
                             "prtresults": {"p": {"score": 0.5, "penalty": 0.1, "answernotes": ["p-1-F"], "errors": []}},
                             "specificfeedback": "[[feedback:p]]", "gradingassets": {"prt-p-0.png": "abc.png"},
                             "responsesummary": "S_a: 2", "iframes": [["f0", "<html><head></head></html>", "stack-iframe-holder-0", "t", False, False]]}
            return 0.5, {"validation": "<span>valid %s</span>" % body["inputName"], "iframes": []}
        self.patches = [mock.patch.object(stackapi, "call", call),
                        mock.patch.object(stackapi, "up", lambda *a, **k: {"settings": {"release": "4.13.1"}}),
                        mock.patch.object(server, "allowed_path", lambda cfg, p, must_exist=True: Path(p))]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in self.patches:
            p.stop()

    def check(self, **kw):
        req = dict({"path": str(self.file), "index": 0, "seed": 22, "src": "main", "lang": "en",
                    "answers": {"S_a": "2"}, "inputs": ["S_a"]}, **kw)
        return server.Handler.stack_check(None, {"branches": {"main": "main"}}, req)

    def test_grade_and_validate(self):
        r = self.check()
        self.assertEqual([c[0] for c in self.calls], ["grade", "validate"])
        grade = self.calls[0][1]
        self.assertEqual(grade["answers"], {"S_a": "2"})
        self.assertEqual(grade["seed"], 22)
        self.assertIn("<deployedseed>22</deployedseed>", grade["questionDefinition"])
        self.assertEqual(self.calls[1][1]["inputName"], "S_a")
        p = r["prts"]["p"]
        self.assertEqual((p["score"], p["penalty"], p["notes"]), (0.5, 0.1, ["p-1-F"]))
        self.assertIn('"%splot.php/abc.png"' % r["base"], p["feedback"])
        self.assertEqual(r["validation"], {"S_a": "<span>valid S_a</span>"})
        self.assertEqual(len(r["iframes"]), 1)
        self.assertEqual(r["specificfeedback"], "[[feedback:p]]")

    def test_error_of_stack(self):
        stackapi.call = lambda route, body, timeout=900: (0.1, {"message": "<b>Bad</b> question"})
        self.assertEqual(self.check()["error"], "STACK: Bad question")
