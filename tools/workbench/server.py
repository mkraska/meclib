"""
meclib workbench server - local helper for the pages in tools/workbench/.

Python standard library only, no installation needed. Start with
    python server.py            (or double-click start_workbench.bat on Windows)
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
  GET /api/config           merged configuration (see workbench_config.json)
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
  Question files (Moodle XML in the user's folders, see qfile.py):
  GET  /api/snippets        text snippets (templates/snippets/*.txt): [{name, text}]
  GET  /api/q/folders       question folders (configured, added in the page, inbox) with
                            their XML files, and the recently opened files
  POST /api/q/folders       {add: path} or {remove: path}
  POST /api/q/open          {path} -> {path, rev, questions}
  POST /api/q/question      {path, index} -> editable fields of a STACK question, rev
  POST /api/q/save          {path, index, rev, changes, backup} -> {rev, changed}; 409 if
                            the file changed on disk since rev
  POST /api/q/eval          {path, index, seed, src} -> question variables, model answers and
                            rendered texts, evaluated with STACK's Maxima library
  POST /api/q/check         like eval, plus {answers: {input: raw text}} -> "check": validation of the
                            answers and the PRT results (score, penalty, answer notes, feedback)
  POST /api/q/new           {folder, filename, name} new file with a question from the template,
                            or {path, rev, name} appended to an existing file; optional
                            questionvariables, questiontext
  POST /api/q/duplicate     {path, index, rev} copy of a question, right after it
  POST /api/q/input         {path, index, rev, op: "add", name, kind, tans?, tol?} new input S_<name>
                            with PRT <name> (qfile.INPUT_KINDS), or {op: "delete", input, prt?}
                            -> {rev, fields}
  POST /api/q/review        {path, index} -> {rev, findings}: the review rules (rules.py) for a question
  POST /api/q/review-apply  {path, index, rev, apply: [keys], reject: [keys]} -> fixes applied, rejected
                            findings recorded in the question description -> {rev, applied, fields, findings}
  POST /api/q/saveas        {path, index, folder, filename} one question into a new file
  POST /api/q/upload        a dropped XML file (body; headers X-File-Name, X-Folder) -> copied
                            into that folder
  POST /api/q/split         {path} -> one file per STACK question, in <folder>/<file name>/
  POST /api/pick-folder     {title, initial} -> {path} chosen in the system's folder dialog
                            ("" if cancelled), shown by a separate Python process (tkinter)
  POST /api/shutdown        stops this server (used by the next start to replace it)

Every POST must carry the header "X-Workbench: 1". Browsers only send such a header from
the workbench's own pages (other web sites would need a CORS preflight, which this server
does not answer), so no other site can write files through the workbench.
"""

import argparse
import os
import subprocess
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
import xml.etree.ElementTree as ET
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
import stack_question  # noqa: E402
import qfile  # noqa: E402
import rules  # noqa: E402
from maxima_session import MaximaSession, MaximaError  # noqa: E402

INBOX = CACHE / "questions"      # copies of files dropped onto the page
STATE = qfile.State(CACHE / "workbench_state.json")


class SessionPool:
    """One Maxima session per (question, source); at most MAX sessions, least recently used
    ones are closed. A session keeps its state, so re-evaluating a question only needs the
    names it assigned before to be killed."""
    MAX = 3

    def __init__(self):
        self.lock = threading.Lock()
        self.sessions = {}   # key -> [session, last_used, names]

    def get(self, key, maxima):
        with self.lock:
            entry = self.sessions.get(key)
            if entry and entry[0].alive():
                entry[1] = time.time()
                return entry
            if entry:
                del self.sessions[key]
            while len(self.sessions) >= self.MAX:
                oldest = min(self.sessions, key=lambda k: self.sessions[k][1])
                self.sessions.pop(oldest)[0].close()
        session = MaximaSession(maxima or None)
        entry = [session, time.time(), []]
        with self.lock:
            self.sessions[key] = entry
        return entry

    def close_all(self):
        with self.lock:
            for entry in self.sessions.values():
                entry[0].close()
            self.sessions.clear()


POOL = SessionPool()


def question_folders(cfg):
    """[(path, source)]: configured folders, folders added in the page, the inbox."""
    out, seen = [], set()
    for d, source in ([(d, "config") for d in cfg.get("question_dirs", []) if d] +
                      [(d, "added") for d in STATE.data["folders"]] + [(str(INBOX), "inbox")]):
        p = Path(d).expanduser()
        key = str(p.resolve()) if p.exists() else str(p)
        if key not in seen:
            seen.add(key)
            out.append((p, source))
    return out


def allowed_path(cfg, path, must_exist=True):
    """The resolved path if it lies in one of the question folders, else ValueError."""
    target = Path(path).expanduser().resolve()
    for folder, _ in question_folders(cfg):
        if folder.exists() and folder.resolve() in target.parents:
            if must_exist and not target.is_file():
                raise ValueError("file not found: %s" % target)
            if target.suffix.lower() != ".xml":
                raise ValueError("only .xml files")
            return target
    raise ValueError("not in a question folder: %s" % target)


def target_folder(cfg, folder):
    """Folder for a new file: a question folder or a folder inside one; any other existing
    folder (chosen in the folder dialog) is added to the question folders."""
    try:
        return allowed_path(cfg, Path(folder) / "x.xml", must_exist=False).parent
    except ValueError:
        STATE.add_folder(str(folder))
        return allowed_path(cfg, Path(folder) / "x.xml", must_exist=False).parent


def unique_path(folder, filename):
    target = Path(folder) / filename
    n = 2
    while target.exists():
        target = Path(folder) / ("%s (%d)%s" % (Path(filename).stem, n, Path(filename).suffix))
        n += 1
    return target


def load_config():
    """workbench_config.json, overridden key by key by workbench_config.local.json if present
    (the local file is meant for per-machine settings and is not committed)."""
    cfg = json.loads((HERE / "workbench_config.json").read_text(encoding="utf-8"))
    local = HERE / "workbench_config.local.json"
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
    req = urllib.request.Request(url, headers={"User-Agent": "meclib-workbench",
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
        if parsed.path == "/api/q/folders":
            return self.send_json(self.folder_listing())
        if parsed.path == "/api/snippets":
            out = []
            for p in sorted((HERE / "templates" / "snippets").glob("*.txt")):
                out.append({"name": re.sub(r"^\d+\s*", "", p.stem),
                            "text": p.read_text(encoding="utf-8").replace("\r\n", "\n")})
            return self.send_json(out)
        if parsed.path.startswith("/api/cases/"):
            name = urllib.parse.unquote(parsed.path[len("/api/cases/"):])
            if not SCENE_NAME.match(name):
                return self.send_json({"error": "invalid scene name"}, 400)
            path = CASES / (name + ".json")
            if not path.exists():
                return self.send_json({"error": "no scene " + name}, 404)
            return self.send_bytes(path.read_bytes(), "application/json; charset=utf-8")
        if parsed.path.startswith("/.") or "_config.local" in parsed.path or parsed.path.startswith("/templates"):
            return self.send_error(404)
        return super().do_GET()

    def read_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        return self.rfile.read(length).decode("utf-8")

    def folder_listing(self):
        folders = []
        for path, source in question_folders(load_config()):
            files = []
            if path.is_dir():
                files = sorted(str(p.relative_to(path)).replace("\\", "/") for p in path.rglob("*.xml")
                               if not any(part.startswith(".") for part in p.relative_to(path).parts))
            folders.append({"path": str(path.resolve() if path.exists() else path), "source": source,
                            "exists": path.is_dir(), "files": files})
        return {"folders": folders, "recent": STATE.data["recent"]}

    def question_post(self, path):
        cfg = load_config()
        try:
            if path == "/api/q/upload":
                name = urllib.parse.unquote(self.headers.get("X-File-Name", "") or "") or "upload.xml"
                folder = urllib.parse.unquote(self.headers.get("X-Folder", "") or "") or str(INBOX)
                INBOX.mkdir(parents=True, exist_ok=True)
                body = self.read_body()
                qfile.list_questions(body)                      # must be a readable export
                folder = allowed_path(cfg, Path(folder) / "x.xml", must_exist=False).parent
                target = unique_path(folder, qfile.safe_filename(Path(name).stem))
                target.write_text(body, encoding="utf-8", newline="")
                return self.send_json({"path": str(target)})
            req = json.loads(self.read_body() or "{}")
            if path == "/api/q/folders":
                if req.get("add"):
                    STATE.add_folder(req["add"])
                if req.get("remove"):
                    STATE.remove_folder(req["remove"])
                return self.send_json(self.folder_listing())
            if path == "/api/q/open":
                target = allowed_path(cfg, req["path"])
                text, rev = qfile.read_file(target)
                questions = qfile.list_questions(text)
                STATE.touch(str(target))
                return self.send_json({"path": str(target), "rev": rev, "questions": questions})
            if path == "/api/q/question":
                target = allowed_path(cfg, req["path"])
                text, rev = qfile.read_file(target)
                fields = qfile.question_fields(text, int(req["index"]))
                STATE.touch(str(target), int(req["index"]), fields["name"])
                return self.send_json({"path": str(target), "rev": rev, "fields": fields})
            if path == "/api/q/save":
                target = allowed_path(cfg, req["path"])
                result = qfile.save_changes(target, int(req["index"]), req.get("changes", {}), req.get("rev"),
                                            bool(req.get("backup")))
                return self.send_json(result)
            if path in ("/api/q/eval", "/api/q/check"):
                target = allowed_path(cfg, req["path"])
                text, _ = qfile.read_file(target)
                index, src = int(req["index"]), req.get("src", "local")
                data = stack_question.question_data(stack_question.question_element(text, index))
                entry = POOL.get("%s:%d:%s" % (target, index, src), cfg.get("maxima"))
                resolver = stack_question.IncludeResolver(src, cfg["branches"], fetch)
                answers = req.get("answers") if path == "/api/q/check" else None
                result = stack_question.evaluate(entry[0], data, int(req.get("seed", 1)), resolver, entry[2], answers)
                entry[2] = result["kill"]
                result.update({"name": data["name"], "format": data["formats"]["questiontext"],
                               "formats": data["formats"], "prts": data["prts"],
                               "seeds": data["seeds"], "decimals": data["decimals"],
                               "simplify": data["questionsimplify"], "maxima_start": round(entry[0].started, 1)})
                return self.send_json(result)
            if path == "/api/q/new":
                block = qfile.question_from_template(req.get("name") or "New meclib question",
                                                     req.get("questionvariables"), req.get("questiontext"))
                if req.get("path"):
                    target = allowed_path(cfg, req["path"])
                    text, rev = qfile.read_file(target)
                    new = qfile.append_question(text, block)
                    rev = qfile.write_file(target, new, req.get("rev", rev))
                else:
                    folder = target_folder(cfg, req["folder"])
                    target = unique_path(folder, qfile.safe_filename(req.get("filename") or req.get("name") or "question"))
                    new = qfile.new_file_text([block])
                    rev = qfile.write_file(target, new, None)
                questions = qfile.list_questions(new)
                return self.send_json({"path": str(target), "rev": rev, "questions": questions,
                                       "index": questions[-1]["index"]})
            if path == "/api/q/review":
                target = allowed_path(cfg, req["path"])
                text, rev = qfile.read_file(target)
                a, b, _ = qfile.question_span(text, int(req["index"]))
                return self.send_json({"rev": rev, "findings": rules.public(rules.findings(text[a:b]))})
            if path == "/api/q/review-apply":
                target = allowed_path(cfg, req["path"])
                text, rev = qfile.read_file(target)
                if req.get("rev") and req["rev"] != rev:
                    raise qfile.ConflictError("the file was changed outside the workbench")
                index = int(req["index"])
                new, applied = rules.apply(text, index, req.get("apply") or [], req.get("reject") or [])
                rev = qfile.write_file(target, new, rev, bool(req.get("backup")))
                a, b, _ = qfile.question_span(new, index)
                return self.send_json({"rev": rev, "applied": applied, "fields": qfile.question_fields(new, index),
                                       "findings": rules.public(rules.findings(new[a:b]))})
            if path == "/api/q/input":
                target = allowed_path(cfg, req["path"])
                text, rev = qfile.read_file(target)
                if req.get("rev") and req["rev"] != rev:
                    raise qfile.ConflictError("the file was changed outside the workbench")
                index = int(req["index"])
                if req.get("op") == "add":
                    new, iname, pname = qfile.add_input(text, index, req.get("name", ""), req.get("kind", ""),
                                                        req.get("tans") or None, req.get("tol") or "0.005")
                elif req.get("op") == "delete":
                    new = qfile.delete_input(text, index, req["input"], req.get("prt") or None)
                else:
                    raise ValueError("unknown op")
                rev = qfile.write_file(target, new, rev, bool(req.get("backup")))
                return self.send_json({"rev": rev, "fields": qfile.question_fields(new, index)})
            if path == "/api/q/duplicate":
                target = allowed_path(cfg, req["path"])
                text, rev = qfile.read_file(target)
                index = int(req["index"])
                new = qfile.append_question(text, qfile.duplicate_block(text, index), after_index=index)
                rev = qfile.write_file(target, new, req.get("rev", rev))
                return self.send_json({"path": str(target), "rev": rev, "questions": qfile.list_questions(new),
                                       "index": index + 1})
            if path == "/api/q/saveas":
                source = allowed_path(cfg, req["path"])
                text, _ = qfile.read_file(source)
                a, b, _ = qfile.question_span(text, int(req["index"]))
                folder = target_folder(cfg, req.get("folder") or source.parent)
                target = unique_path(folder, qfile.safe_filename(Path(req.get("filename") or "question").stem))
                new = qfile.new_file_text([text[a:b]])
                rev = qfile.write_file(target, new, None)
                return self.send_json({"path": str(target), "rev": rev, "questions": qfile.list_questions(new)})
            if path == "/api/q/split":
                return self.send_json(self.split_file(allowed_path(cfg, req["path"])))
        except qfile.ConflictError as err:
            return self.send_json({"error": str(err), "conflict": True}, 409)
        except (MaximaError, ValueError, KeyError, IndexError, OSError, ET.ParseError) as err:
            return self.send_json({"error": "%s: %s" % (type(err).__name__, err)}, 400)
        return self.send_error(404)

    def split_file(self, source):
        """Writes each STACK question of a file as its own file (one question per file, as
        qbank_gitsync keeps them) into <folder of the file>/<file name>/. The questions are cut
        out of the original text, so CDATA sections and formatting stay as exported."""
        text, _ = qfile.read_file(source)
        folder = source.parent / source.stem
        folder.mkdir(parents=True, exist_ok=True)
        written = []
        for a, b, qtype in qfile.spans(text):
            if qtype != "stack":
                continue
            qname = stack_question.text_of(ET.fromstring(text[a:b]), "name/text") or "question"
            target = unique_path(folder, qfile.safe_filename(qname))
            target.write_text(qfile.new_file_text([text[a:b]]), encoding="utf-8", newline="")
            written.append(str(target))
        return {"folder": str(folder), "files": written}

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if self.headers.get("X-Workbench") != "1":
            return self.send_json({"error": "missing X-Workbench header"}, 403)
        if parsed.path == "/api/shutdown":
            self.send_json({"ok": True, "pid": os.getpid()})
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            return None
        if parsed.path == "/api/pick-folder":
            req = json.loads(self.read_body() or "{}")
            try:
                return self.send_json({"path": pick_folder(req.get("title") or "Choose a folder", req.get("initial") or "")})
            except (OSError, subprocess.SubprocessError, RuntimeError) as err:
                return self.send_json({"error": "no folder dialog available (%s) - type or paste the path instead" % err}, 400)
        if parsed.path.startswith("/api/q/"):
            return self.question_post(parsed.path)
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


PICK_FOLDER_SCRIPT = r"""
import sys, tkinter
from tkinter import filedialog
root = tkinter.Tk()
root.withdraw()
root.attributes("-topmost", True)
root.update()
path = filedialog.askdirectory(parent=root, title=sys.argv[1], initialdir=sys.argv[2] or None, mustexist=True)
root.destroy()
sys.stdout.write(path or "")
"""
PICK_LOCK = threading.Lock()


def pick_folder(title, initial):
    """The system's folder dialog, in a separate Python process (tkinter wants its own main
    thread). Returns the chosen folder or "" if cancelled."""
    with PICK_LOCK:
        proc = subprocess.run([sys.executable, "-c", PICK_FOLDER_SCRIPT, title, initial if Path(initial).is_dir() else ""],
                              capture_output=True, text=True, encoding="utf-8", timeout=600)
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr.strip().splitlines() or ["tkinter failed"])[-1])
    return str(Path(proc.stdout.strip())) if proc.stdout.strip() else ""


class WorkbenchServer(ThreadingHTTPServer):
    # On Windows, SO_REUSEADDR lets a second server bind a port that is in use; then two
    # servers would answer at random. Without it, a busy port is reported as an error.
    allow_reuse_address = os.name != "nt"
    daemon_threads = True


def stop_previous_server(port):
    """Asks a workbench server still running on this port to stop (so that starting the
    workbench again replaces the old server), and waits until the port is free."""
    req = urllib.request.Request("http://127.0.0.1:%d/api/shutdown" % port, data=b"{}", method="POST",
                                 headers={"X-Workbench": "1", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            json.loads(resp.read().decode("utf-8"))
    except (OSError, ValueError, urllib.error.URLError):
        return False        # nothing running there, or not a workbench server of this version
    print("Stopped the workbench server that was still running on port %d." % port)
    time.sleep(1.0)
    return True


def main():
    parser = argparse.ArgumentParser(description="meclib workbench server")
    parser.add_argument("--port", type=int, default=None)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    mimetypes.add_type("text/javascript", ".js")
    mimetypes.add_type("text/css", ".css")
    port = args.port or load_config().get("port", 8765)
    stop_previous_server(port)
    server = None
    for _ in range(10):
        try:
            server = WorkbenchServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            time.sleep(0.5)
    if server is None:
        print("Port %d is in use by another program - probably an older workbench (or tryout) server" % port)
        print("whose window is still open. Close that window and start again.")
        sys.exit(2)
    url = "http://localhost:%d/" % port
    INBOX.mkdir(parents=True, exist_ok=True)      # the inbox is always available as a question folder
    print("meclib workbench running at %s  (repository: %s)" % (url, REPO))
    regenerate_fixtures()
    print("Stop with Ctrl+C or by closing this window.")
    if not args.no_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        POOL.close_all()


if __name__ == "__main__":
    main()
