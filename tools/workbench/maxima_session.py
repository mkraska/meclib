"""
A persistent Maxima process with STACK's Maxima library loaded, for the workbench's question
preview. Loading the library takes a few seconds, so a session is started once and reused
for evaluating question variables, castext and (later) PRTs.

Protocol: code is written to a temporary .mac file and run with batchload(); afterwards a
unique marker is printed, and everything Maxima printed up to the marker is returned (error
messages included). Results that must arrive exactly (rendered texts) are written by the
Maxima side to a separate output file instead of stdout, see meclib_out() in PRELUDE.
"""

import glob
import os
import queue
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent


def find_maxima(configured=None):
    """Path of the Maxima executable: configured value, PATH, then usual Windows locations."""
    if configured:
        return configured
    for name in ("maxima", "maxima.bat"):
        found = shutil.which(name)
        if found:
            return found
    if os.name == "nt":
        patterns = [r"C:\maxima-*\bin\maxima.bat",
                    os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"), "maxima-*", "bin", "maxima.bat"),
                    os.path.join(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"), "maxima-*", "bin", "maxima.bat"),
                    os.path.join(os.environ.get("LOCALAPPDATA", ""), "maxima-*", "bin", "maxima.bat"),
                    os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "maxima-*", "bin", "maxima.bat")]
        for pattern in patterns:
            hits = sorted(glob.glob(pattern))
            if hits:
                return hits[-1]
    return None


def stack_library_dir():
    hits = sorted(glob.glob(str(REPO / "config" / "stack" / "*" / "maxima" / "stackmaxima.mac")))
    return Path(hits[-1]).parent if hits else None


def mpath(path):
    """A path as a Maxima string literal (forward slashes work on Windows too)."""
    return '"' + str(path).replace("\\", "/").replace('"', '\\"') + '"'


def mstring(text):
    """Python text as a Maxima string literal."""
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'


class MaximaError(RuntimeError):
    pass


class MaximaSession:
    def __init__(self, maxima=None, timeout=60):
        self.maxima = find_maxima(maxima)
        if not self.maxima:
            raise MaximaError("Maxima not found - set \"maxima\" in workbench_config.local.json to the full path of maxima.bat")
        self.libdir = stack_library_dir()
        if not self.libdir:
            raise MaximaError("STACK's Maxima library not found under config/stack/<version>/maxima/")
        self.timeout = timeout
        self.tmp = Path(tempfile.mkdtemp(prefix="meclib-maxima-"))
        self.counter = 0
        self.lock = threading.Lock()
        self.lines = queue.Queue()
        self.proc = None
        self.started = None
        self.start()

    # ------------------------------------------------------------------ process
    def start(self):
        cmd = [self.maxima, "--very-quiet"]
        self.proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                     text=True, encoding="utf-8", errors="replace", bufsize=1,
                                     creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        threading.Thread(target=self._reader, daemon=True).start()
        t0 = time.time()
        out = self.run(self._prelude(), timeout=max(self.timeout, 120))
        if "MECLIB-LIBRARY-LOADED" not in out:
            self.close()
            raise MaximaError("loading STACK's Maxima library failed:\n" + out[-3000:])
        self.started = time.time() - t0

    def _reader(self):
        for line in self.proc.stdout:
            self.lines.put(line)
        self.lines.put(None)

    def alive(self):
        return self.proc is not None and self.proc.poll() is None

    def close(self):
        if self.proc and self.proc.poll() is None:
            try:
                self.proc.stdin.write("quit();\n")
                self.proc.stdin.flush()
                self.proc.wait(timeout=3)
            except Exception:
                self.proc.kill()
        self.proc = None
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _stack_setup(self):
        """STACK_SETUP() from the library's stacklocal{win,linux}.mac (STACK's maximalocal.mac):
        stackmaxima.mac calls it on loading; it defines among others the unit lists used by
        stack_unit_si_declare() and the units answer tests."""
        local = self.libdir / ("stacklocalwin.mac" if os.name == "nt" else "stacklocallinux.mac")
        try:
            text = local.read_text(encoding="utf-8")
        except OSError:
            return ""
        a = text.find("STACK_SETUP(ex):=block(")
        b = text.find("true)$", a)
        return text[a:b + len("true)$")] if a >= 0 and b > a else ""

    def _prelude(self):
        lib = self.libdir
        harness = REPO / "Maxima" / "tests" / "harness.mac"
        return "\n".join([
            "display2d: false$", "linel: 100000$",
            "file_search_maxima: cons(%s, file_search_maxima)$" % mpath(str(lib) + "/###.{mac,mc}"),
            "file_search_maxima: cons(%s, file_search_maxima)$" % mpath(str(lib) + "/contrib/###.{mac,mc}"),
            "file_search_lisp: cons(%s, file_search_lisp)$" % mpath(str(lib) + "/###.{lisp}"),
            self._stack_setup(),
            "load(%s)$" % mpath(lib / "stackmaxima.mac"),
            # as STACK's maximalocal.mac
            'load("stats")$', 'load("distrib")$', 'load("descriptive")$',
            # castext() renderer and resolve_lang() shared with the offline Maxima tests
            "meclib_real_stack_loaded: true$",
            "load(%s)$" % mpath(harness),
            # exact result channel: blocks "@@MECLIBOUT:key@@\n<text>\n" appended to a file
            "meclib_out_file: false$",
            "meclib_out(%_key, %_text) := block([%_s: opena(meclib_out_file)],"
            " printf(%_s, \"@@MECLIBOUT:~a@@~%~a~%\", %_key, %_text), close(%_s), true)$",
            'print("MECLIB-LIBRARY-LOADED")$',
        ])

    # ------------------------------------------------------------------ running code
    def run(self, code, timeout=None):
        """Runs Maxima code, returns everything printed (stdout). Raises MaximaError on timeout."""
        with self.lock:
            if not self.alive():
                raise MaximaError("Maxima process is not running")
            self.counter += 1
            marker = "@@MECLIB-DONE-%d@@" % self.counter
            src = self.tmp / ("run%d.mac" % self.counter)
            src.write_text(code + "\n", encoding="utf-8")
            self.proc.stdin.write("batchload(%s)$ print(\"%s\")$\n" % (mpath(src), marker))
            self.proc.stdin.flush()
            out = []
            deadline = time.time() + (timeout or self.timeout)
            while True:
                try:
                    line = self.lines.get(timeout=max(0.1, deadline - time.time()))
                except queue.Empty:
                    line = ""
                    if time.time() >= deadline:
                        self.close()
                        raise MaximaError("Maxima did not answer within %d s (process stopped)" % (timeout or self.timeout))
                    continue
                if line is None:
                    raise MaximaError("Maxima process ended unexpectedly:\n" + "".join(out)[-3000:])
                if marker in line:
                    break
                out.append(line)
            try:
                src.unlink()
            except OSError:
                pass
            return "".join(out)

    def run_with_results(self, code, timeout=None):
        """Like run(), but the code may call meclib_out(key, text); returns (stdout, {key: [texts]})."""
        outfile = self.tmp / ("out%d.txt" % (self.counter + 1))
        outfile.write_text("", encoding="utf-8")
        text = self.run("meclib_out_file: %s$\n%s\nmeclib_out_file: false$" % (mpath(outfile), code), timeout)
        results = {}
        raw = outfile.read_text(encoding="utf-8")
        parts = raw.split("@@MECLIBOUT:")
        for part in parts[1:]:
            key, _, rest = part.partition("@@\n")
            results.setdefault(key, []).append(rest[:-1] if rest.endswith("\n") else rest)
        try:
            outfile.unlink()
        except OSError:
            pass
        return text, results


if __name__ == "__main__":
    s = MaximaSession()
    print("started in %.1f s" % s.started)
    print(s.run_with_results('x: 2*q_0*a$ meclib_out("tex", fb_tmpl_tostring(x))$ meclib_out("raw", string(x))$ print("hello")$ foo(;'))
    print(s.run('print(x)$'))
    s.close()
