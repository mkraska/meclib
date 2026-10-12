"""Builds syntax_help.json, the syntax help of the workbench's code editors (signature box and
autocomplete), from

  - meclib's Maxima files (Maxima/*.mac): function definitions "name(args) :=" and the comments
    above them; a comment "/* https://github.com/mkraska/meclib/wiki/<page> */" names the wiki page
  - meclib.js: the object types ("case "force":") and the signature comments "// [ "force", ... ]"
  - the meclib wiki (a local clone, --wiki or "wiki_dir" in workbench_config.local.json); updated
    pages waiting in doc/wiki/ are used instead of the wiki's version
  - STACK's Maxima library of the selected release (config/stack/<version>/maxima/) for the
    signatures and STACK's documentation of the same release (doc/en of the git tag, fetched into
    .cache/) for the texts; only functions the documentation mentions are included
  - syntax_help_extra.json: entries written by hand (they win over generated ones of the same name)

and prints where code and wiki disagree (missing pages, different numbers of arguments).

    python build_help.py [--wiki PATH] [--stack-tag v4.13.1] [--no-stack]
"""

import argparse
import datetime
import json
import re
import subprocess
import sys
import urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
OUT = HERE / "syntax_help.json"
EXTRA = HERE / "syntax_help_extra.json"
WIKI_URL = "https://github.com/mkraska/meclib/wiki/"
STACK_DOCS_URL = "https://docs.stack-assessment.org/en/"
STACK_REPO = "https://github.com/maths/moodle-qtype_stack.git"
# STACK plugin version (folder name under config/stack) -> release tag
STACK_TAGS = {"2026080600": "v4.13.1"}
TEXT_MAX = 420


# ------------------------------------------------------------------ helpers
def plain(md):
    """Markdown/wiki text -> plain text for the help box (code spans keep their backticks)."""
    t = re.sub(r"\[\[([^\]|]+)\|[^\]]*\]\]", r"\1", md)              # [[text|page]]
    t = re.sub(r"\[\[([^\]]+)\]\]", r"\1", t)                           # [[page]]
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", t)                           # images
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)                       # [text](url)
    t = re.sub(r"<[^>]+>", "", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"\1", t)
    t = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"\1", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def shorten(t, n=TEXT_MAX):
    if len(t) <= n:
        return t
    cut = t[:n]
    m = re.search(r"^(.*[.!?])\s", cut)
    return (m.group(1) if m and len(m.group(1)) > n * 0.4 else cut.rstrip() + " ...")


def split_top(s):
    """Splits at top-level commas (outside brackets and strings)."""
    out, depth, cur, q = [], 0, "", False
    for ch in s:
        if ch == '"':
            q = not q
        if not q and ch in "([{":
            depth += 1
        if not q and ch in ")]}":
            depth -= 1
        if ch == "," and depth == 0 and not q:
            out.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        out.append(cur.strip())
    return out


def clean_arg(a):
    a = a.strip()
    a = re.sub(r"^%_", "", a)
    a = re.sub(r"\[%_", "[", a)
    return a


def norm_page(name):
    """Page name -> key that matches wiki file names and doc/wiki draft file names."""
    return re.sub(r"[\s\-\"]+", " ", urllib.parse.unquote(name)).strip().lower()


def blocks_of(md):
    """Markdown -> list of (kind, text, line) with kind heading/bullet/para/code."""
    out, para, start = [], [], 0
    lines = md.replace("\r\n", "\n").split("\n")
    in_code = False

    def flush():
        if para:
            out.append(("para", " ".join(para), start))
            para.clear()
    for i, line in enumerate(lines):
        s = line.strip()
        if s.startswith("```"):
            flush()
            in_code = not in_code
            continue
        if in_code:
            continue
        if not s:
            flush()
            continue
        if s.startswith("#"):
            flush()
            out.append(("heading", s.lstrip("#").strip(), i))
        elif s.startswith("|"):
            flush()
            cells = [c.strip() for c in s.strip("|").split("|")]
            if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
                out.append(("row", " | ".join(cells), i))
        elif re.match(r"^\s{2,}[-*]\s+", line) and out and out[-1][0] == "bullet" and not para:
            out[-1] = ("bullet", out[-1][1].rstrip(":;,") + "; " + re.sub(r"^[-*]\s+", "", s), out[-1][2])   # sub-item
        elif re.match(r"^[-*]\s+", s):
            flush()
            out.append(("bullet", re.sub(r"^[-*]\s+", "", s), i))
        else:
            if not para:
                start = i
            para.append(s)
    flush()
    return out


def arg_docs(blocks, after, names):
    """Bullets "- `arg` text" after block index `after` (until the next heading)."""
    docs = {}
    for kind, text, _ in blocks[after:]:
        if kind == "heading" and docs:
            break
        if kind != "bullet":
            continue
        m = re.match(r"^`([^`]+)`\s*:?\s*(.*)$", text)
        if not m:
            continue
        keys = [re.sub(r"\s+", "", k).strip('"') for k in split_top(m.group(1))]
        for k in keys:
            for n in names:
                nn = re.sub(r"\s+", "", n).strip('"')
                if nn == k or nn == k.strip("[]"):
                    docs.setdefault(n, plain(m.group(2)))
    return docs


# ------------------------------------------------------------------ wiki
class Wiki:
    def __init__(self, wiki_dir):
        self.pages = {}
        if wiki_dir and Path(wiki_dir).is_dir():
            for p in Path(wiki_dir).glob("*.md"):
                self.pages[norm_page(p.stem)] = (p.stem, p.read_text(encoding="utf-8", errors="replace"))
        drafts = REPO / "doc" / "wiki"
        self.drafts = set()
        if drafts.is_dir():
            for p in drafts.glob("*.md"):
                if p.name.lower() in ("readme.md", "history.md"):
                    continue
                key = norm_page(p.stem)
                stem = self.pages[key][0] if key in self.pages else p.stem
                self.pages[key] = (stem, p.read_text(encoding="utf-8", errors="replace"))
                self.drafts.add(key)

    def get(self, name):
        """Page by name; "f" also finds "f()" and the other way round (updated pages in doc/wiki
        first, they replace outdated ones)."""
        keys = [norm_page(n) for n in (name, name + "()", re.sub(r"\(\)$", "", name))]
        for k in keys:
            if k in self.drafts:
                return self.pages[k]
        for k in keys:
            if k in self.pages:
                return self.pages[k]
        return None

    @staticmethod
    def url(stem):
        return WIKI_URL + urllib.parse.quote(stem.replace(" ", "-"), safe="-_.()'")

    def find_function(self, fname):
        """Page that shows `fname(` in a heading or code span: prefer a page named after it."""
        best = None
        for key, (stem, text) in self.pages.items():
            if not re.search(r"`[^`\n]*\b" + re.escape(fname) + r"\(", text):
                continue
            score = 2 if norm_page(stem).startswith(fname.lower()) else 1
            if not best or score > best[0]:
                best = (score, stem, text)
        return (best[1], best[2]) if best else None


def wiki_function_info(text, fname):
    """Description, signature line (as written in the wiki) and argument docs of fname."""
    blocks = blocks_of(text)
    pat = re.compile(r"`([^`]*\b" + re.escape(fname) + r"\([^`]*)`")
    idx, sig = None, None
    for i, (kind, t, _) in enumerate(blocks):   # the first mention with arguments, else the first one
        m = pat.search(t)
        if m and kind in ("heading", "para"):
            if idx is None:
                idx, sig = i, m.group(1)
            if not re.search(re.escape(fname) + r"\(\s*\)", m.group(1)):
                idx, sig = i, m.group(1)
                break
    if idx is None:
        return None
    # the section: from the last heading at or before idx to the next heading
    start = idx
    while start > 0 and blocks[start][0] != "heading":
        start -= 1
    # candidate paragraphs of the section: one that names the function, else the first one of
    # at least 60 characters, else the first one; a paragraph ending with ":" gets the bullets
    # that follow it
    cands = []
    for j in range(start, len(blocks)):
        kind, t, _ = blocks[j]
        if kind == "heading" and j > idx:
            break
        if kind != "para":
            continue
        p = plain(t)
        if re.fullmatch(r"`[^`]*`[^.]{0,80}", p) and fname in p and len(p) < 120:
            continue          # a signature line on its own
        if p.lower().startswith("source") or len(p) < 25:
            continue
        if p.endswith(":") and len(p) < 40:
            continue          # a label like "Question variables:"
        if p.endswith(":"):
            items = [plain(b[1]) for b in blocks[j + 1:j + 6] if b[0] == "bullet"]
            p = p + " " + "; ".join(items)
        cands.append(p)
    desc = next((c for c in cands if len(c) >= 60), None) or (cands[0] if cands else "")
    if not desc:      # page intro (before the first heading)
        for kind, t, _ in blocks:
            if kind == "heading":
                break
            if kind == "para" and len(plain(t)) >= 25 and not (plain(t).endswith(":") and len(plain(t)) < 40):
                desc = plain(t)
                break
    m = re.search(re.escape(fname) + r"\((.*)\)", sig)
    wargs = split_top(m.group(1)) if m else []
    names = [clean_arg(a) for a in wargs]
    flat = []          # optional arguments written as a list: [a, b] -> a, b
    for x in names:
        flat += [clean_arg(y) for y in split_top(x[1:-1])] if x.startswith("[") and x.endswith("]") else [x]
    return {"text": shorten(desc), "sig": sig.strip(), "args": names,
            "argdocs": arg_docs(blocks, idx, list(dict.fromkeys(names + flat)))}


# ------------------------------------------------------------------ meclib Maxima
DEF = re.compile(r"^([A-Za-z][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*:=", re.M)


def maxima_defs(text):
    """name -> (args, preceding comment text, wiki page from a URL comment)."""
    out = {}
    for m in DEF.finditer(text):
        name, args = m.group(1), m.group(2)
        before = text[:m.start()]
        # comments directly above (only blank lines in between)
        comments, page = [], None
        rest = before
        while True:
            stripped = rest.rstrip(" \t")
            if stripped.endswith("\n\n") or re.search(r"\n\s*\n\s*$", stripped):
                break                      # a blank line ends the comments that belong to the definition
            rest = stripped.rstrip()
            if not rest.endswith("*/"):
                break
            k = rest.rfind("/*")
            if k < 0:
                break
            c = rest[k + 2:-2].strip()
            um = re.match(r"^https://github\.com/mkraska/meclib/wiki/(\S+)$", c)
            if um:
                page = page or urllib.parse.unquote(um.group(1))      # the nearest link
            else:
                comments.insert(0, c)
            rest = rest[:k]
        argl = [clean_arg(a) for a in split_top(args.replace("[", "[").strip())] if args.strip() else []
        out.setdefault(name, (argl, " ".join(comments), page))
    return out


def meclib_functions(wiki, report):
    entries, seen = [], set()
    for f in sorted((REPO / "Maxima").glob("*.mac")):
        if f.name.endswith("_EN.mac"):
            continue           # English-only legacy copy
        for name, (args, comment, page) in maxima_defs(f.read_text(encoding="utf-8", errors="replace")).items():
            if name in seen:
                continue
            seen.add(name)
            e = {"name": name, "kind": "meclib", "sig": "%s(%s)" % (name, ", ".join(args)), "args": args,
                 "text": "", "url": "", "source": "Maxima/" + f.name}
            found = wiki.get(page) if page else None
            if page and not found:
                report.append("%s: wiki page '%s' (named in %s) not found" % (name, page, f.name))
            if not found:
                found = wiki.find_function(name)
                if found and not page:
                    report.append("%s: no wiki link in %s, documented on '%s'" % (name, f.name, found[0]))
            info = wiki_function_info(found[1], name) if found else None
            own = bool(found) and (bool(page and wiki.get(page)) or norm_page(found[0]).startswith(name.lower()))
            if info and not own:
                info["text"] = ""          # a mention on another function's page: its text does not fit
            if found:
                e["url"] = Wiki.url(found[0])
            if info:
                e["text"] = info["text"]
                if info["args"] and (any(x.startswith("[") for x in args) or len(info["args"]) > len(args)):
                    # the wiki names the optional arguments that the code takes as a list
                    shown = info["sig"].split(":", 1)[-1].strip() if re.match(r"^(\[[^\]]*\]|\w+)\s*:", info["sig"]) else info["sig"]
                    e["sig"] = shown
                    flat, opt_from = [], None
                    for x in info["args"]:
                        if x.startswith("[") and x.endswith("]") and len(args) <= len(info["args"]):
                            if opt_from is None:
                                opt_from = len(flat)
                            flat += [clean_arg(y) for y in split_top(x[1:-1])]
                        else:
                            flat.append(x)
                    e["args"] = flat
                    e["argdocs"] = {k: v for k, v in info["argdocs"].items() if k in flat}
                    if opt_from is not None:
                        e["optional_from"] = opt_from
                    args = flat
                e["argdocs"] = {}
                for i, a in enumerate(args):
                    base = a.strip("[]")
                    for k, v in info["argdocs"].items():
                        if k.strip("[]") == base or (i < len(info["args"]) and info["args"][i] == k):
                            e["argdocs"][a] = v
                if ":" in info["sig"].split(name)[0]:
                    e["returns"] = info["sig"].split(name)[0].rstrip(": ").strip()
                if info["args"] and len(info["args"]) != len(args) and not any(x.startswith("[") for x in args + info["args"]):
                    report.append("%s: %d arguments in the code, %d in the wiki ('%s')"
                                  % (name, len(args), len(info["args"]), info["sig"]))
            elif found and own:  # the page does not show a signature: its first paragraph
                intro = [plain(t) for k, t, _ in blocks_of(found[1]) if k == "para" and len(plain(t)) >= 25]
                e["text"] = shorten(intro[0]) if intro else ""
            elif not found:
                report.append("%s: no wiki documentation (left out)" % name)
                continue           # internal helpers
            comment = re.sub(r"^\s*\d{4} \d\d \d\d\s*", "", comment)      # version stamps
            if (not own or not e["text"]) and len(e["text"]) < 60 and len(comment) > len(e["text"]):
                e["text"] = shorten(plain(comment))
            entries.append(e)
    return entries


# ------------------------------------------------------------------ meclib objects
def meclib_objects(wiki, report):
    js = (REPO / "meclib.js").read_text(encoding="utf-8")
    types = sorted(set(re.findall(r'case\s+"([A-Za-z0-9]+)"\s*:\s*objects\.push', js)))
    comment_sig = {}
    for m in re.finditer(r'^//\s*(\[\s*"([A-Za-z0-9]+)".*\])\s*$', js, re.M):
        comment_sig.setdefault(m.group(2), m.group(1))
    entries = []
    for t in types:
        found = wiki.get('"%s"' % t) or wiki.get(t)
        sig, text, argdocs, url = comment_sig.get(t, '[ "%s", ... ]' % t), "", {}, ""
        if found:
            url = Wiki.url(found[0])
            blocks = blocks_of(found[1])
            for i, (kind, s, _) in enumerate(blocks):
                # the whole code span (nested brackets, blanks before the closing backtick)
                m = re.search(r'`\s*(\[\s*"' + re.escape(t) + r'"[^`]*\])\s*`', s)
                if m:
                    sig = m.group(1)
                    break
            for kind, s, _ in blocks:
                p = plain(s)
                if kind == "para" and len(p) >= 25 and not p.startswith("`["):
                    text = p
                    break
            items = split_top(sig.strip()[1:-1])
            argdocs = arg_docs(blocks, 0, items[1:])
        else:
            report.append('object "%s": no wiki page' % t)
        items = split_top(sig.strip()[1:-1])
        entries.append({"name": t, "kind": "object", "sig": "[ " + ", ".join(items) + " ]", "args": items[1:],
                        "argdocs": argdocs, "text": shorten(text), "url": url, "source": "meclib.js"})
    return entries


# ------------------------------------------------------------------ STACK
def stack_docs(tag):
    """Local copy of doc/en of the STACK release tag (sparse git clone into .cache)."""
    target = HERE / ".cache" / "stack-docs" / tag
    if (target / "doc" / "en").is_dir():
        return target / "doc" / "en"
    target.parent.mkdir(parents=True, exist_ok=True)
    print("fetching STACK documentation %s ..." % tag)
    subprocess.run(["git", "-c", "advice.detachedHead=false", "clone", "-q", "--depth", "1", "--branch", tag, "--filter=blob:none", "--sparse",
                    STACK_REPO, str(target)], check=True)
    subprocess.run(["git", "-C", str(target), "sparse-checkout", "set", "doc/en"], check=True)
    return target / "doc" / "en"


def stack_functions(version, tag, report):
    lib = REPO / "config" / "stack" / version / "maxima"
    defs = {}
    for f in sorted(lib.glob("*.mac")):
        if re.match(r"(rtest_|s_test|.*_test\.mac$)", f.name):
            continue
        for name, (args, comment, _) in maxima_defs(f.read_text(encoding="utf-8", errors="replace")).items():
            defs.setdefault(name, (args, comment))
    docs = stack_docs(tag)
    pages = {p: p.read_text(encoding="utf-8", errors="replace") for p in docs.rglob("*.md")}
    entries = []
    for name in sorted(defs):
        if name.startswith("%") or re.search(r"(_aux|_helper|_internal)$", name):
            continue
        pat = re.compile(r"`[^`\n]*\b" + re.escape(name) + r"\(")
        best = None
        for p, text in pages.items():
            if not pat.search(text):
                continue
            for i, (kind, t, _) in enumerate(blocks_of(text)):
                if pat.search(t):
                    rank = {"heading": 0, "bullet": 1, "row": 1, "para": 2}.get(kind, 3)
                    if not best or rank < best[0]:
                        best = (rank, p, blocks_of(text), i)
                    break
        if not best:
            continue
        _, page, blocks, i = best
        kind, t, _ = blocks[i]
        if kind == "heading":       # the text after the heading
            nxt = [b for b in blocks[i + 1:i + 4] if b[0] in ("para", "bullet")]
            t = nxt[0][1] if nxt else t
        elif kind == "row":         # table row: the other cells
            cells = t.split(" | ")
            t = " - ".join(c for c in cells if not re.search(r"\b" + re.escape(name) + r"\(", c)) or t
        rel = page.relative_to(docs).as_posix()
        rel = re.sub(r"(^|/)index\.md$", r"\1", rel)
        rel = re.sub(r"\.md$", "/", rel)
        args = defs[name][0]
        entries.append({"name": name, "kind": "stack", "sig": "%s(%s)" % (name, ", ".join(args)), "args": args,
                        "text": shorten(plain(t)), "url": STACK_DOCS_URL + rel, "source": "STACK %s" % tag})
    return entries


# ------------------------------------------------------------------ main
def mark_optional(e):
    """"optional": indices of the optional arguments - from a list argument in the code (optional_from)
    or from the wiki text "(optional ...". The signature shows them with a trailing "?"."""
    args = e.get("args") or []
    opt = set(range(e.pop("optional_from"), len(args))) if e.get("optional_from") is not None else set()
    for i, a in enumerate(args):
        if re.match(r"^\(?\s*optional\b", (e.get("argdocs") or {}).get(a, ""), re.I):
            opt.add(i)
    if not opt:
        return
    e["optional"] = sorted(opt)
    shown = [a + "?" if i in opt else a for i, a in enumerate(args)]
    if e["kind"] == "object":
        e["sig"] = '[ "%s", %s ]' % (e["name"], ", ".join(shown))
    else:
        e["sig"] = "%s(%s)" % (e["name"], ", ".join(shown))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--wiki", help="local clone of the meclib wiki (git clone https://github.com/mkraska/meclib.wiki.git)")
    ap.add_argument("--stack-version", help="folder under config/stack (default: the only/newest one)")
    ap.add_argument("--stack-tag", help="STACK release tag for the documentation, e.g. v4.13.1")
    ap.add_argument("--no-stack", action="store_true", help="leave out the STACK functions")
    a = ap.parse_args()

    local = HERE / "workbench_config.local.json"
    cfg = json.loads(local.read_text(encoding="utf-8")) if local.exists() else {}
    wiki_dir = a.wiki or cfg.get("wiki_dir")
    if not wiki_dir:
        print("note: no wiki clone given (--wiki or \"wiki_dir\" in workbench_config.local.json); "
              "only the pages in doc/wiki and the code comments are used")
    wiki = Wiki(wiki_dir)
    report = []
    entries = meclib_functions(wiki, report) + meclib_objects(wiki, report)
    sources = {"wiki": str(wiki_dir or ""), "wiki_drafts": sorted(wiki.drafts)}
    if not a.no_stack:
        versions = sorted(p.name for p in (REPO / "config" / "stack").iterdir() if (p / "maxima").is_dir())
        version = a.stack_version or versions[-1]
        tag = a.stack_tag or STACK_TAGS.get(version)
        if not tag:
            sys.exit("unknown STACK release tag for %s - give --stack-tag" % version)
        st = stack_functions(version, tag, report)
        names = {e["name"] for e in entries}
        entries += [e for e in st if e["name"] not in names]
        sources["stack"] = "%s (%s)" % (version, tag)
    if EXTRA.exists():
        extra = json.loads(EXTRA.read_text(encoding="utf-8"))
        byname = {(e["kind"] == "object", e["name"]): i for i, e in enumerate(entries)}
        for e in extra.get("entries", []):
            e.setdefault("kind", "extra")
            e.setdefault("source", EXTRA.name)
            key = (e["kind"] == "object", e["name"])
            if key in byname:
                entries[byname[key]] = {**entries[byname[key]], **e}
            else:
                entries.append(e)
    for e in entries:
        mark_optional(e)
    entries.sort(key=lambda e: (e["kind"] != "meclib", e["kind"] != "object", e["name"].lower()))
    out = {"generated": datetime.date.today().isoformat(), "sources": sources, "entries": entries}
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    counts = {}
    for e in entries:
        counts[e["kind"]] = counts.get(e["kind"], 0) + 1
    print("%s: %s" % (OUT.name, ", ".join("%d %s" % (n, k) for k, n in sorted(counts.items()))))
    if report:
        print("\ncode and wiki (%d notes):" % len(report))
        for r in report:
            print("  - " + r)


if __name__ == "__main__":
    main()
