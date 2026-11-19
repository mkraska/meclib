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


class TempDir(unittest.TestCase):
    """maxima_tempdir: backslashes on Windows (STACK's plot() runs `del` on it)."""

    def test_windows(self):
        name = maxima_session.os.name
        try:
            maxima_session.os.name = "nt"
            lit = maxima_session.mtempdir("C:/Users/x/Temp/wb")
        finally:
            maxima_session.os.name = name
        # Maxima literal of C:\Users\x\Temp\wb\ (each backslash escaped)
        self.assertEqual(lit, r'"C:\\Users\\x\\Temp\\wb\\"')
        self.assertNotIn("/", lit)

    def test_linux(self):
        if maxima_session.os.name != "nt":
            self.assertEqual(maxima_session.mtempdir("/tmp/wb"), '"/tmp/wb/"')


if __name__ == "__main__":
    unittest.main()


class PoolDropsFailedSession(unittest.TestCase):
    """After a Maxima error of a run the session leaves the pool and is closed, so that the next run
    starts a new one (2026-11-18, Windows: after a run with a syntax error the question's session
    stayed dead - "Maxima process is not running" - until the workbench was restarted)."""

    class Stub:
        made = 0

        def __init__(self, maxima=None, stack=None):
            type(self).made += 1
            self.closed, self.used, self.started = False, False, 0

        def alive(self):
            return not self.closed

        def close(self):
            self.closed = True

    def setUp(self):
        import server
        self.server = server
        self.old = server.MaximaSession
        server.MaximaSession = self.Stub
        self.pool = server.SessionPool()
        self.pool.prepare = lambda *a, **k: None       # no spare in the test

    def tearDown(self):
        self.server.MaximaSession = self.old

    def test_drop(self):
        e1 = self.pool.get("q", None)
        self.pool.drop("q", e1)
        self.assertTrue(e1[0].closed)
        e2 = self.pool.get("q", None)
        self.assertIsNot(e1[0], e2[0])

    def test_drop_only_that_session(self):
        """a newer session under the same key (another request) is not dropped"""
        e1 = self.pool.get("q", None)
        self.pool.drop("q", e1)
        e2 = self.pool.get("q", None)
        self.pool.drop("q", e1)
        self.assertIs(self.pool.get("q", None)[0], e2[0])


class CloseKillsTree(unittest.TestCase):
    """close() of a session that does not quit: on Windows the whole process tree (maxima.bat starts
    the Lisp as a child; kill() would stop only the batch file)."""

    def test_windows_taskkill(self):
        calls = []
        s = maxima_session.MaximaSession.__new__(maxima_session.MaximaSession)
        s.tmp = Path(tempfile.mkdtemp(prefix="meclib-test-"))

        class Proc:
            pid = 4711
            stdin = None

            def poll(self):
                return None

            def kill(self):
                calls.append("kill")

        s.proc = Proc()
        old_os, old_run = maxima_session.os.name, maxima_session.subprocess.run
        try:
            maxima_session.os.name = "nt"
            maxima_session.subprocess.run = lambda cmd, **k: calls.append(cmd)
            s.close()
        finally:
            maxima_session.os.name, maxima_session.subprocess.run = old_os, old_run
        self.assertIn(["taskkill", "/F", "/T", "/PID", "4711"], calls)
        self.assertIsNone(s.proc)
