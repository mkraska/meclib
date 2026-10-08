"""
meclib tryout server - local helper for tools/tryout/index.html.

Python standard library only, no installation needed. Start with
    python server.py            (or double-click start_tryout.bat on Windows)
then open http://localhost:8765/ (the browser is opened automatically unless
--no-browser is given).

Why a server at all: GitHub serves raw files (raw.githubusercontent.com) as
text/plain with "X-Content-Type-Options: nosniff", so a browser refuses to run
meclib.js loaded from there with a <script> tag, and CDN mirrors cache branch
files for hours. This server fetches the requested meclib.js version itself
(local working copy, or a GitHub branch, always fresh) and hands it to the page
as text. It also proxies a few whitelisted GitHub files with the correct
content type (e.g. the JSXGraph copy bundled with STACK). Later steps will add
Maxima evaluation (question and feedback variables) to the same server.

Endpoints
  GET /                     index.html
  GET /<file>               static files from this folder
  GET /vendor/<path>        static files from ./vendor/ (optional local copies,
                            e.g. MathJax for offline use; not in the repo)
  GET /api/config           merged configuration (see tryout_config.json)
  GET /api/meclib?src=X     meclib.js as text, X = local | dev | main
  GET /proxy?url=U          whitelisted URL, cached in ./.cache/, served with
                            a content type derived from the file extension
  GET /api/cases            list of test scenes in tests/scenes/ (repository root)
  GET /api/cases/<name>     one scene (tests/scenes/<name>.json)
  POST /api/cases/<name>    write a scene (whole file, formatted by dump_scene()) and
                            regenerate Maxima/tests/fixtures/scenes.mac
  GET /api/usage            which Maxima test files use which scene/case
                            (scene_obj/scene_names/scene_init calls in
                            Maxima/tests/test_*.mac)
"""

import argparse
import hashlib
import json
import mimetypes
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
CACHE = HERE / ".cache"
CASES = REPO / "tests" / "scenes"
MAXIMA_TESTS = REPO / "Maxima" / "tests"
SCENE_NAME = re.compile(r"^[A-Za-z0-9_-]+$")
CASE_ID = re.compile(r"^[A-Za-z0-9_-]+$")
USAGE_CALL = re.compile(r'\bscene_(obj|names|init)\(\s*"([^"]+)"(?:\s*,\s*"([^"]+)")?')

sys.path.insert(0, str(HERE))
import scenes_to_maxima  # noqa: E402  (fixture generator, same folder)


def load_config():
    """tryout_config.json, overridden key by key by tryout_config.local.json if present
    (the local file is meant for per-machine settings and is not committed)."""
    cfg = json.loads((HERE / "tryout_config.json").read_text(encoding="utf-8"))
    local = HERE / "tryout_config.local.json"
    if local.exists():
        for key, value in json.loads(local.read_text(encoding="utf-8")).items():
            if isinstance(value, dict) and isinstance(cfg.get(key), dict):
                cfg[key] = {**cfg[key], **value}
            else:
                cfg[key] = value
    return cfg


def git_branch():
    """Name of the branch checked out in the local working copy (read from .git/HEAD)."""
    try:
        head = (REPO / ".git" / "HEAD").read_text(encoding="utf-8").strip()
        return head.split("/")[-1] if head.startswith("ref:") else head[:8]
    except OSError:
        return None


def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": "meclib-tryout",
                                               "Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def dump_scene(scene):
    """Serializes a scene with a fixed key order and one meclib object per line, so that
    files stay readable and diffs in git show exactly which object of which case changed."""
    def objlist(lst, indent):
        if not isinstance(lst, list) or not lst:
            return json.dumps(lst, ensure_ascii=False)
        pad = " " * indent
        return "[\n" + ",\n".join(pad + "  " + json.dumps(o, ensure_ascii=False) for o in lst) + "\n" + pad + "]"

    def value(key, val, indent):
        if key in ("initdata", "state", "objects"):
            return objlist(val, indent)
        return json.dumps(val, ensure_ascii=False)

    def obj(d, order, indent):
        keys = [k for k in order if k in d] + sorted(k for k in d if k not in order)
        pad = " " * indent
        lines = []
        for k in keys:
            if k == "cases":
                items = ",\n".join(pad + "    " + obj(c, CASE_ORDER, indent + 4).lstrip() for c in d[k])
                lines.append(pad + '  "cases": [\n' + items + "\n" + pad + "  ]" if d[k] else pad + '  "cases": []')
            elif k == "expected" and isinstance(d[k], dict):
                lines.append(pad + '  "expected": ' + obj(d[k], ["names", "objects"], indent + 2).lstrip())
            else:
                lines.append(pad + "  " + json.dumps(k) + ": " + value(k, d[k], indent + 2))
        return pad + "{\n" + ",\n".join(lines) + "\n" + pad + "}"

    return obj(scene, SCENE_ORDER, 0) + "\n"


SCENE_ORDER = ["title", "notes", "decsep", "block", "initdata", "cases"]
CASE_ORDER = ["id", "label", "notes", "state", "expected", "recorded"]


def list_scenes():
    result = []
    for path in sorted(CASES.glob("*.json")):
        try:
            scene = json.loads(path.read_text(encoding="utf-8"))
            result.append({"file": path.stem, "title": scene.get("title", path.stem),
                           "notes": scene.get("notes", ""), "cases": len(scene.get("cases", []))})
        except (OSError, ValueError) as err:
            result.append({"file": path.stem, "title": path.stem, "error": str(err), "cases": 0})
    return result


def scene_usage():
    """{scene: {case_id or "": [test file names]}} from scene_* calls in the Maxima tests."""
    usage = {}
    for path in sorted(MAXIMA_TESTS.glob("test_*.mac")):
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        for _kind, scene, case in USAGE_CALL.findall(text):
            files = usage.setdefault(scene, {}).setdefault(case or "", [])
            if path.name not in files:
                files.append(path.name)
    return usage


def check_scene(scene):
    """Validates a scene before writing; fills in missing case ids. Returns an error or None."""
    if not isinstance(scene, dict) or not isinstance(scene.get("initdata"), list) \
            or not isinstance(scene.get("cases"), list):
        return "a scene needs 'initdata' and 'cases' lists"
    seen = set()
    for number, case in enumerate(scene["cases"], start=1):
        if not isinstance(case, dict):
            return "case %d is not an object" % number
        cid = case.get("id") or str(number)
        if not CASE_ID.match(cid):
            return "case id %r: letters, digits, '_' and '-' only" % cid
        if cid in seen:
            return "case id %r is used twice" % cid
        seen.add(cid)
        case["id"] = cid
    return None


def regenerate_fixtures():
    problems = scenes_to_maxima.generate(CASES)
    for problem in problems:
        sys.stderr.write("fixtures: %s\n" % problem)
    return problems


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HERE), **kwargs)

    def log_message(self, fmt, *args):  # keep the console readable
        if not self.path.startswith(("/vendor/", "/proxy")):
            sys.stderr.write("%s %s\n" % (time.strftime("%H:%M:%S"), fmt % args))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        # The graphic runs in a sandboxed frame (origin "null", as in STACK); fonts and other
        # resources it loads from this server need CORS permission.
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def send_bytes(self, data, ctype, status=200, extra=None):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, obj, status=200):
        self.send_bytes(json.dumps(obj).encode("utf-8"), "application/json; charset=utf-8", status)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        if parsed.path == "/api/config":
            cfg = load_config()
            cfg["local_branch"] = git_branch()
            cfg["repo_path"] = str(REPO)
            return self.send_json(cfg)
        if parsed.path == "/api/meclib":
            return self.serve_meclib(query.get("src", ["local"])[0])
        if parsed.path == "/proxy":
            return self.serve_proxy(query.get("url", [""])[0])
        if parsed.path == "/api/cases":
            return self.send_json(list_scenes())
        if parsed.path == "/api/usage":
            return self.send_json(scene_usage())
        if parsed.path.startswith("/api/cases/"):
            name = urllib.parse.unquote(parsed.path[len("/api/cases/"):])
            if not SCENE_NAME.match(name):
                return self.send_json({"error": "invalid scene name"}, 400)
            path = CASES / (name + ".json")
            if not path.exists():
                return self.send_json({"error": "no scene " + name}, 404)
            return self.send_bytes(path.read_bytes(), "application/json; charset=utf-8")
        if parsed.path.startswith("/.") or "tryout_config.local" in parsed.path:
            return self.send_error(404)
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if not parsed.path.startswith("/api/cases/"):
            return self.send_error(404)
        name = urllib.parse.unquote(parsed.path[len("/api/cases/"):])
        if not SCENE_NAME.match(name):
            return self.send_json({"error": "invalid scene name"}, 400)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            scene = json.loads(self.rfile.read(length).decode("utf-8"))
        except ValueError as err:
            return self.send_json({"error": str(err)}, 400)
        error = check_scene(scene)
        if error:
            return self.send_json({"error": error}, 400)
        CASES.mkdir(parents=True, exist_ok=True)
        (CASES / (name + ".json")).write_text(dump_scene(scene), encoding="utf-8", newline="\n")
        problems = regenerate_fixtures()
        self.send_json({"ok": True, "file": name, "cases": len(scene["cases"]), "fixture_problems": problems})

    def serve_meclib(self, src):
        cfg = load_config()
        try:
            if src == "local":
                path = REPO / "meclib.js"
                data = path.read_bytes()
                info = "local working copy (%s), %s" % (
                    git_branch() or "?", time.strftime("%Y-%m-%d %H:%M", time.localtime(path.stat().st_mtime)))
            elif src in cfg["branches"]:
                branch = cfg["branches"][src]
                url = "https://raw.githubusercontent.com/%s/%s/meclib.js?t=%d" % (
                    cfg["github_repo"], branch, int(time.time()))
                data = fetch(url)
                info = "GitHub %s (%s), fetched %s" % (src, branch, time.strftime("%H:%M:%S"))
            else:
                return self.send_json({"error": "unknown source " + src}, 400)
        except (OSError, urllib.error.URLError) as err:
            return self.send_json({"error": "could not load meclib.js from %s: %s" % (src, err)}, 502)
        self.send_bytes(data, "text/plain; charset=utf-8", extra={"X-Meclib-Source": info})

    def serve_proxy(self, url):
        cfg = load_config()
        if not any(url.startswith(p) for p in cfg["proxy_allowed_prefixes"]):
            return self.send_error(403, "URL not in proxy_allowed_prefixes")
        CACHE.mkdir(exist_ok=True)
        cached = CACHE / hashlib.sha1(url.encode("utf-8")).hexdigest()
        # Branch files can change at any time; only tagged/versioned files are cached.
        cacheable = "/v" in url or "@" in url
        if cacheable and cached.exists():
            data = cached.read_bytes()
        else:
            try:
                data = fetch(url)
            except (OSError, urllib.error.URLError) as err:
                return self.send_error(502, "proxy fetch failed: %s" % err)
            if cacheable:
                cached.write_bytes(data)
        ctype = mimetypes.guess_type(urllib.parse.urlparse(url).path)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype.endswith("javascript"):
            ctype += "; charset=utf-8"
        self.send_bytes(data, ctype)


def main():
    parser = argparse.ArgumentParser(description="meclib tryout server")
    parser.add_argument("--port", type=int, default=None)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    mimetypes.add_type("text/javascript", ".js")
    mimetypes.add_type("text/css", ".css")
    port = args.port or load_config().get("port", 8765)
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    url = "http://localhost:%d/" % port
    print("meclib tryout running at %s  (repository: %s)" % (url, REPO))
    regenerate_fixtures()
    print("Stop with Ctrl+C or by closing this window.")
    if not args.no_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
