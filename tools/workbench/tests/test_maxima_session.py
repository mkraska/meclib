"""Tests of maxima_session.py that need no Maxima (the process is replaced by a stub).

Run from tools/workbench:  python -m unittest discover -s tests -v
"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import maxima_session  # noqa: E402


class FirstRunTimeout(unittest.TestCase):
    """The first run_with_results() of a session may take FIRST_RUN_TIMEOUT (180 s), later runs
    the session's timeout (60 s) - the first check of a slow question on Windows took over a
    minute and was stopped (2026-11-11)."""

    def session(self):
        s = maxima_session.MaximaSession.__new__(maxima_session.MaximaSession)   # no Maxima process
        s.timeout, s.used, s.counter = 60, False, 0
        s.tmp = Path(tempfile.mkdtemp(prefix="meclib-test-"))
        s.seen = []
        s.run = lambda code, timeout=None: s.seen.append(timeout) or ""
        return s

    def test_first_run_longer(self):
        s = self.session()
        s.run_with_results("x: 1$")
        s.run_with_results("x: 2$")
        self.assertEqual(s.seen, [180, None])          # None: run() uses the session's 60 s

    def test_explicit_timeout_kept(self):
        s = self.session()
        s.run_with_results("x: 1$", timeout=10)
        self.assertEqual(s.seen, [10])


if __name__ == "__main__":
    unittest.main()
