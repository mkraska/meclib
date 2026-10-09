"""
STACK questions for the workbench: reading Moodle XML exports and evaluating a question locally
with STACK's Maxima library (question variables, model answers, castext).

What is reproduced from STACK 4.13 (moodle-qtype_stack):
- question variables are evaluated in order, after stack_randseed(seed) (as in
  stack/cas/cassession2.class.php), with the question's simplification setting;
- stack_include("...") is resolved before evaluation, as STACK does it at compile time; for
  meclib files it follows the workbench's source selector (local working copy / dev / main);
- castext ({@...@}, {#...#}, [[if]], [[foreach]], [[define]], [[comment]], [[lang]]) is
  rendered with the renderer from Maxima/tests/harness.mac, {@...@} through STACK's own
  ct2_latex(); [[lang]] blocks are resolved per language like STACK's pick_lang();
- {#stackfltsep#} gives the question's decimal separator.

Not reproduced: STACK's input validation (insert stars, syntax hints, forbidden words, units
syntax) and castext blocks other than the ones listed above (they are left as text).
"""

import re
import time
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

from maxima_session import mstring, mpath

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
CACHE = HERE / ".cache"
MECLIB_RAW = re.compile(r"^https://raw\.githubusercontent\.com/mkraska/meclib/([^/]+)/(.+)$")
INCLUDE = re.compile(r'stack_include\(\s*"([^"]+)"\s*\)')
ASSIGN = re.compile(r"^\s*([A-Za-z_%][A-Za-z0-9_%]*)\s*:(?!=)")
FUNDEF = re.compile(r"^\s*([A-Za-z_%][A-Za-z0-9_%]*)\s*\(.*?\)\s*:=", re.S)


# ---------------------------------------------------------------------- XML
def text_of(el, path, default=""):
    found = el.find(path)
    return found.text if found is not None and found.text is not None else default


def parse_export(xml_text):
    """Questions of a Moodle XML export: [{index, name, type, category}] (all types listed,
    only "stack" ones can be opened)."""
    root = ET.fromstring(xml_text)
    out, category = [], ""
    for i, q in enumerate(root.findall("question")):
        qtype = q.get("type")
        if qtype == "category":
            category = text_of(q, "category/text")
            continue
        out.append({"index": i, "name": text_of(q, "name/text"), "type": qtype, "category": category})
    return out


def question_element(xml_text, index):
    root = ET.fromstring(xml_text)
    q = root.findall("question")[index]
    if q.get("type") != "stack":
        raise ValueError("question %d is not a STACK question" % index)
    return q


# question options and their defaults (stack/options.class.php)
STACK_OPTION_DEFAULTS = {"scientificnotation": "*10", "multiplicationsign": "dot", "complexno": "i",
                         "inversetrig": "cos-1", "logicsymbol": "lang", "sqrtsign": "1",
                         "assumepositive": "0", "assumereal": "0", "matrixparens": "["}


def option_commands(data):
    """The Maxima commands STACK runs before a question's variables (stack_options::get_cas_commands)."""
    o = data["options"]
    flag = lambda v: "false" if v.strip() in ("0", "false", "") else "true"
    return ['texput_decimal(%s)$' % mstring(data["decimals"]),
            'texput_scientificnotation(%s)$' % mstring(o["scientificnotation"]),
            'make_multsgn(%s)$' % mstring(o["multiplicationsign"]),
            'make_complexJ(%s)$' % mstring(o["complexno"]),
            'make_arccos(%s)$' % mstring(o["inversetrig"]),
            'make_logic(%s)$' % mstring(o["logicsymbol"]),
            'sqrtdispflag: %s$' % flag(o["sqrtsign"]),
            'assume_pos: %s$' % flag(o["assumepositive"]),
            'assume_real: %s$' % flag(o["assumereal"]),
            'lmxchar: %s$' % mstring(o["matrixparens"])]


def prt_data(p):
    nodes = []
    for n in p.findall("node"):
        node = {k: text_of(n, k) for k in ("name", "answertest", "sans", "tans", "testoptions", "quiet",
                                           "truescoremode", "truescore", "truepenalty", "truenextnode", "trueanswernote",
                                           "falsescoremode", "falsescore", "falsepenalty", "falsenextnode",
                                           "falseanswernote")}
        for br in ("true", "false"):
            fb = n.find(br + "feedback")
            node[br + "feedback"] = text_of(n, br + "feedback/text")
            node[br + "format"] = (fb.get("format") if fb is not None else None) or "html"
        nodes.append(node)
    return {"name": text_of(p, "name"), "value": text_of(p, "value", "1") or "1",
            "autosimplify": text_of(p, "autosimplify", "1") != "0", "feedbackstyle": text_of(p, "feedbackstyle", "1"),
            "feedbackvariables": text_of(p, "feedbackvariables/text"), "nodes": nodes}


def question_data(q):
    inputs = []
    for inp in q.findall("input"):
        inputs.append({k: text_of(inp, k) for k in
                       ("name", "type", "tans", "boxsize", "syntaxhint", "syntaxattribute", "mustverify", "showvalidation",
                        "forbidwords", "allowwords", "insertstars", "options")})
    prts = [prt_data(p) for p in q.findall("prt")]
    seeds = [s.text for s in q.findall("deployedseed") if s.text]
    return {
        "name": text_of(q, "name/text"),
        "questionvariables": text_of(q, "questionvariables/text"),
        "questiontext": text_of(q, "questiontext/text"),
        "formats": {k: (q.find(k).get("format") or "html") if q.find(k) is not None else "html"
                    for k in ("questiontext", "generalfeedback", "specificfeedback", "questionnote")},
        "generalfeedback": text_of(q, "generalfeedback/text"),
        "specificfeedback": text_of(q, "specificfeedback/text"),
        "questionnote": text_of(q, "questionnote/text"),
        "questionsimplify": text_of(q, "questionsimplify", "1") != "0",
        "decimals": text_of(q, "decimals", ".") or ".",
        "options": {k: text_of(q, k, d) or d for k, d in STACK_OPTION_DEFAULTS.items()},
        "penalty": text_of(q, "penalty", "0.1") or "0.1",
        "inputs": inputs,
        "prts": prts,
        "seeds": seeds,
    }


# ---------------------------------------------------------------------- Maxima source handling
NEW_STATEMENT = re.compile(r"\s*[A-Za-z_%][A-Za-z0-9_%]*\s*(:|\()")


def split_statements(src):
    """Splits Maxima source at ; and $ outside strings and /* comments */. Returns
    [(statement, line, inserted)] - line of the statement's first code character; inserted
    is True where a missing semicolon was assumed: like STACK's parser (which inserts missing
    statement separators), a line break after a complete expression (brackets balanced)
    followed by a new assignment or call ends the statement."""
    out, cur, i, n = [], [], 0, len(src)
    in_str, depth, start, inserted = False, 0, None, False

    def flush(end_inserted=False):
        nonlocal cur, start, inserted
        text = "".join(cur)
        if strip_comments(text):
            line = src.count("\n", 0, start if start is not None else 0) + 1
            out.append((text, line, inserted))
        cur, start, inserted = [], None, end_inserted

    while i < n:
        c = src[i]
        if in_str:
            cur.append(c)
            if c == "\\" and i + 1 < n:
                cur.append(src[i + 1]); i += 2; continue
            if c == '"':
                in_str = False
            i += 1; continue
        if src.startswith("/*", i):
            end = src.find("*/", i + 2)
            end = n if end < 0 else end + 2
            cur.append(src[i:end]); i = end; continue
        if c in ";$":
            flush(); depth = 0; i += 1; continue
        if c == "\n" and depth == 0 and strip_comments("".join(cur)) and NEW_STATEMENT.match(src, i + 1):
            flush(True); i += 1; continue
        if start is None and not c.isspace():
            start = i
        if c == '"':
            in_str = True
        elif c in "([{":
            depth += 1
        elif c in ")]}":
            depth = max(0, depth - 1)
        cur.append(c)
        i += 1
    flush()
    return out


def strip_comments(stmt):
    return re.sub(r"/\*.*?\*/", "", stmt, flags=re.S).strip()


class IncludeResolver:
    """Maps stack_include URLs to local files: meclib files follow the source selector."""

    def __init__(self, src, branches, fetch):
        self.src, self.branches, self.fetch = src, branches, fetch

    def local_file(self, url):
        m = MECLIB_RAW.match(url)
        if not m:
            raise ValueError("stack_include of %s is not supported (only meclib files)" % url)
        path = urllib.parse.unquote(m.group(2))
        if self.src == "local":
            target = (REPO / path).resolve()
            if REPO.resolve() not in target.parents or not target.exists():
                raise ValueError("%s not found in the local working copy" % path)
            return target
        branch = self.branches[self.src]
        cache = CACHE / "includes" / branch / path
        if not cache.exists() or time.time() - cache.stat().st_mtime > 60:
            data = self.fetch("https://raw.githubusercontent.com/mkraska/meclib/%s/%s?t=%d" % (branch, path, int(time.time())))
            cache.parent.mkdir(parents=True, exist_ok=True)
            cache.write_bytes(data)
        return cache


# ---------------------------------------------------------------------- evaluation
HTML_BLOCK_TAGS = {
    "address", "article", "aside", "base", "basefont", "blockquote", "body", "caption", "center", "col",
    "colgroup", "dd", "details", "dialog", "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure",
    "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr",
    "html", "iframe", "legend", "li", "link", "main", "menu", "menuitem", "nav", "noframes", "ol",
    "optgroup", "option", "p", "param", "section", "source", "summary", "table", "tbody", "td", "tfoot",
    "th", "thead", "title", "tr", "track", "ul"}
RAW_BLOCK = re.compile(r"\[\[\s*(jsxgraph|javascript|geogebra|style|script|iframe)\b.*?\[\[/\1\]\]", re.S)


def html_block_start(line):
    """STACK's castext2_parser_utils::is_html_block_markdown(): False if the line does not
    start an HTML block, None if a blank line ends it, else the list of end strings."""
    low = line.lower()
    if low.startswith(("<pre", "<script", "<style", "<textarea")):
        return ["</pre>", "</script>", "</style>", "</textarea>"]
    if low.startswith("<!--"):
        return ["-->"]
    if low.startswith("<?"):
        return ["?>"]
    if low.startswith("<!") and len(line) > 2 and line[2].isalpha():
        return [">"]
    if low.startswith("<"):
        name = low[1:]
        if name.startswith("/"):
            name = name[1:]
        name = re.split(r"[> \t\n]|/>", name, 1)[0]
        if name in HTML_BLOCK_TAGS:
            return None
    return False


def mark_html_blocks(text):
    """In Markdown text, STACK treats the lines of HTML blocks as HTML: math delimiters with a
    single backslash, {@...@} not escaped for Markdown (castext2 math_paint(), whose line loop
    is followed here, including its end test: a block with end strings ends at an empty line
    or a line that is part of an end string). Such line ranges are wrapped in
    [[htmlformat]]...[[/htmlformat]], which the castext renderer of the harness handles; a
    range that would cut a [[jsxgraph]] (or similar raw) block is widened to include it."""
    lines = text.split("\n")
    starts, pos = [], 0
    for line in lines:
        starts.append(pos)
        pos += len(line) + 1
    raw, endcond = [], False
    for line in lines:
        if endcond is False:
            endcond = html_block_start(line)
        endafter = False
        if endcond is None and line.strip() == "":
            endafter = True
        elif endcond not in (False, None) and any(line.lower() in e for e in endcond):
            endafter = True
        raw.append(endcond is not False)
        if endafter:
            endcond = False
    ranges, i = [], 0
    while i < len(lines):
        if raw[i]:
            j = i
            while j + 1 < len(lines) and raw[j + 1]:
                j += 1
            ranges.append([starts[i], starts[j] + len(lines[j])])
            i = j + 1
        else:
            i += 1
    if not ranges:
        return text
    for m in RAW_BLOCK.finditer(text):
        for r in ranges:
            if r[0] < m.end() and m.start() < r[1]:
                r[0], r[1] = min(r[0], m.start()), max(r[1], m.end())
    merged = []
    for r in sorted(ranges):
        if merged and r[0] <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], r[1])
        else:
            merged.append(r)
    out, last = [], 0
    for a, b in merged:
        out += [text[last:a], "[[htmlformat]]", text[a:b], "[[/htmlformat]]"]
        last = b
    out.append(text[last:])
    return "".join(out)


# ---------------------------------------------------------------------- STACK's security rules
_SECURITY = None


def security_map():
    """STACK's stack/cas/security-map.json (copied to config/stack/<version>/), loaded once."""
    global _SECURITY
    if _SECURITY is None:
        import glob, json
        hits = sorted(glob.glob(str(REPO / "config" / "stack" / "*" / "security-map.json")))
        try:
            _SECURITY = json.loads(Path(hits[-1]).read_text(encoding="utf-8")) if hits else {}
        except (OSError, ValueError):
            _SECURITY = {}
    return _SECURITY


def forbidden_identifiers(stmt):
    """Identifiers in Maxima code that STACK refuses in any question (security map: globally
    forbidden variables such as values, functions, linel, and functions such as eval_string,
    concat, define): [(name, "variable" | "function")]. Moodle does not save such a question."""
    sec = security_map()
    found, i, n = [], 0, len(stmt)
    while i < n:
        c = stmt[i]
        if c == '"':
            j = i + 1
            while j < n and stmt[j] != '"':
                j += 2 if stmt[j] == "\\" else 1
            i = j + 1
            continue
        if stmt.startswith("/*", i):
            j = stmt.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        m = IDENT.match(stmt, i)
        if m:
            name = m.group(0)
            is_call = stmt[m.end():].lstrip().startswith("(")
            props = sec.get(name, {})
            if is_call and props.get("globalyforbiddenfunction"):
                found.append((name, "function"))
            elif not is_call and props.get("globalyforbiddenvariable"):
                found.append((name, "variable"))
            i = m.end()
            continue
        i += 1
    return found


def forbidden_message(found, consequence="the statement was not evaluated"):
    return "STACK does not allow %s here (Moodle refuses to save the question); %s" % (
        ", ".join("%s %s" % (kind, name) for name, kind in dict.fromkeys(found)), consequence)


CAS_BLOCKS = ("if", "elif", "define", "foreach")   # castext blocks whose attribute values are Maxima
CT_CAS = re.compile(r"\{([@#])(.*?)\1\}", re.S)
CT_BLOCK = re.compile(r"\[\[\s*([A-Za-z_]+)((?:[^\]]|\](?!\]))*)\]\]")
CT_ATTR = re.compile(r"""[A-Za-z_][\w-]*\s*=\s*(?:"([^"]*)"|'([^']*)')""")


def castext_cas_parts(text):
    """The Maxima code in a castext: {@...@}, {#...#} and the attribute values of
    [[if]], [[elif]], [[define]], [[foreach]] (the JavaScript of [[jsxgraph]] is not Maxima)."""
    parts = [m.group(2) for m in CT_CAS.finditer(text or "")]
    for m in CT_BLOCK.finditer(text or ""):
        if m.group(1).lower() in CAS_BLOCKS:
            parts += [a.group(1) if a.group(1) is not None else a.group(2) for a in CT_ATTR.finditer(m.group(2))]
    return parts


def castext_forbidden(text):
    """forbidden_identifiers() of all Maxima code in a castext."""
    return [f for part in castext_cas_parts(text) for f in forbidden_identifiers(part)]


def security_findings(data):
    """Globally forbidden identifiers outside the question variables and feedback variables
    (those are checked per statement): {place: message}. STACK refuses such a question too."""
    out = {}
    texts = [(k, data.get(k, "")) for k in ("questiontext", "generalfeedback", "specificfeedback", "questionnote")]
    texts += [("syntax hint of %s" % i["name"], i.get("syntaxhint") or "") for i in data["inputs"]]
    for prt in data["prts"]:
        for k, node in enumerate(prt["nodes"]):
            where = "PRT %s, node %d" % (prt["name"], k + 1)
            for br in ("true", "false"):
                texts.append(("%s, %s feedback" % (where, br), node.get(br + "feedback") or ""))
            for f in ("sans", "tans", "testoptions"):
                bad = forbidden_identifiers(node.get(f) or "")
                if bad:
                    out["%s, %s" % (where, {"sans": "SAns", "tans": "TAns", "testoptions": "test options"}[f])] = \
                        forbidden_message(bad, "the Check here evaluates it anyway")
    for key, text in texts:
        bad = castext_forbidden(text)
        if bad:
            out[key] = forbidden_message(bad, "the Check here evaluates it anyway" if key.startswith("PRT ")
                                         else "this text is not evaluated")
    for inp in data["inputs"]:
        bad = forbidden_identifiers(inp.get("tans") or "")
        if bad:
            out["model answer of %s" % inp["name"]] = forbidden_message(bad, "the model answer is not evaluated")
    return out


# ---------------------------------------------------------------------- answers and PRTs
# Answer test properties from stack/answertest/controller.class.php ($pops): options required
# (True/False/"optional"), simp during the test, raw student string required.
AT_PROPS = {
    "AlgEquiv": (False, True, False), "AlgEquivNouns": (False, False, False), "EqualComAss": (False, False, False),
    "EqualComAssRules": (True, False, False), "CasEqual": (False, False, False), "SameType": (False, True, False),
    "SubstEquiv": ("optional", True, False), "SysEquiv": (False, True, False), "Sets": (False, False, False),
    "Expanded": (False, True, False), "FacForm": (True, False, False), "SingleFrac": (False, False, False),
    "PartFrac": (True, True, False), "CompSquare": (True, True, False), "PropLogic": (False, True, False),
    "Equiv": ("optional", False, False), "EquivFirst": ("optional", False, False), "GT": (False, True, False),
    "GTE": (False, True, False), "SigFigsStrict": (True, True, True), "NumAbsolute": (True, True, False),
    "NumRelative": (True, True, False), "NumSigFigs": (True, False, True), "NumDecPlaces": (True, False, True),
    "NumDecPlacesWrong": (True, False, False), "Units": (True, False, True), "UnitsStrict": (True, False, True),
    "UnitsAbsolute": (True, False, False), "UnitsStrictAbsolute": (True, False, False),
    "UnitsRelative": (True, False, False), "UnitsStrictRelative": (True, False, False),
    "LowestTerms": (False, False, False), "Diff": (True, False, False), "Int": (True, False, False),
    "Antidiff": (True, False, False), "AddConst": (True, False, False), "String": (False, False, False),
    "StringSloppy": (False, False, False), "Levenshtein": (True, True, False), "SRegExp": (False, True, False),
    "Validator": (True, False, False),
}
IDENT = re.compile(r"[A-Za-z_%][A-Za-z0-9_%]*")


def uses_units(data):
    return any(i.get("type") == "units" for i in data["inputs"]) or any(
        n["answertest"].startswith("Units") for p in data["prts"] for n in p["nodes"])


def student_value(inp, raw, decimals):
    """The Maxima expression for a student's raw input, approximating STACK's input
    processing: strings are quoted; otherwise a decimal comma becomes a point (and ; the
    list separator), and depending on insertstars spaces and implied products get a *.
    STACK's full validation (forbidden words, syntax rules) is not reproduced."""
    if inp.get("type") in ("string", "notes"):
        return mstring(raw)
    v = raw.strip()
    if decimals == ",":
        v = v.replace(",", ".").replace(";", ",")
    stars = inp.get("insertstars") or "0"
    if stars in ("1", "2", "4", "5"):        # implied multiplication: 2x, 2(…), )(
        v = re.sub(r"(\d)\s*([A-Za-z(])", r"\1*\2", v)
        v = re.sub(r"\)\s*([A-Za-z0-9(])", r")*\1", v)
    if stars in ("3", "4", "5", "6", "7"):   # spaces between operands
        v = re.sub(r"([A-Za-z0-9_.)\]])\s+(?=[A-Za-z0-9_(\[%])", r"\1*", v)
    return v


def prt_required_inputs(prt, input_names):
    used = set(IDENT.findall(prt["feedbackvariables"]))
    for n in prt["nodes"]:
        used |= set(IDENT.findall(" ".join([n["sans"], n["tans"], n["testoptions"]])))
    return [i for i in input_names if i in used]


def prt_code(prt, raw_by_input, default_penalty, lang_de, lang_en, includes_resolver):
    """Maxima code evaluating one PRT like STACK's compiled PRT function (stack/prt.class.php):
    feedback variables, then the nodes from the first one along the true/false branches,
    answer test, score and penalty per branch, feedback castext of the branches taken."""
    P = prt["name"]
    tag = re.sub(r"[^A-Za-z0-9]", "_", P)
    v = lambda name: "%%_P_%s_%s" % (tag, name)
    code = ['print("@@PRT %s@@")$' % P, "simp: %s$" % ("true" if prt["autosimplify"] else "false")]
    for k, (stmt, line, _ins) in enumerate(split_statements(prt["feedbackvariables"])):
        clean = strip_comments(stmt)
        if not clean.strip():
            continue
        bad = forbidden_identifiers(clean)
        if bad:
            code.append('print(%s)$' % mstring("@@PRTERR feedback variables, line %d: %s@@" % (line, forbidden_message(bad))))
            continue
        clean = includes_resolver(clean)
        code.append('if errcatch(eval_string(%s)) = [] then print("@@PRTERR feedback variables, line %d@@")$'
                    % (mstring(clean + "$"), line))
    nodes = {n["name"]: n for n in prt["nodes"]}
    targets = {n[b + "nextnode"] for n in prt["nodes"] for b in ("true", "false")}
    roots = [n["name"] for n in prt["nodes"] if n["name"] not in targets]
    root = roots[0] if roots else (prt["nodes"][0]["name"] if prt["nodes"] else "-1")
    code.append("simp: true$")
    code += ["%s: %s$" % (v("node"), mstring(root)), "%s: 0$" % v("score"), "%s: 0$" % v("pen"),
             "%s: []$" % v("path"), "%s: []$" % v("fb"), "%s: []$" % v("atfb"), "%s: 0$" % v("guard")]
    branches = []
    for n in prt["nodes"]:
        opt_req, at_simp, raw_req = AT_PROPS.get(n["answertest"], (bool(n["testoptions"].strip()), True, False))
        args = [n["sans"] or '""', n["tans"] if n["tans"].strip() else '""']
        if opt_req is True or (opt_req == "optional" and n["testoptions"].strip()):
            args.append("ev(%s, simp)" % (n["testoptions"].strip() or "0"))
        if raw_req:
            args.append(mstring(raw_by_input.get(n["sans"].strip(), "")) if n["sans"].strip() in raw_by_input else "false")
        at = "AT%s(%s)" % (n["answertest"], ", ".join(args))
        body = ["simp: %s" % ("true" if at_simp else "false"),
                "%%_t: errcatch(%s)" % at, "simp: true"]

        def branch(b):
            score = (n[b + "score"] or "0").strip()
            mode = n[b + "scoremode"] or "="
            pen = (n[b + "penalty"] or "").strip() or default_penalty
            upd = {"=": "%s: %s" % (v("score"), score), "+": "%s: %s + (%s)" % (v("score"), v("score"), score),
                   "-": "%s: %s - (%s)" % (v("score"), v("score"), score)}.get(mode, "%s: %s" % (v("score"), score))
            parts = [upd, "%s: %s" % (v("pen"), pen),
                     "%s: append(%s, [%s])" % (v("path"), v("path"), mstring(n[b + "answernote"]))]
            fb = n[b + "feedback"] or ""
            if fb.strip():
                md = n[b + "format"] == "markdown"
                src = mark_html_blocks(fb) if md else fb
                parts.append("fb_tmpl_md: %s" % ("true" if md else "false"))
                parts.append("%%_c: errcatch(castext(%s))" % mstring(src))
                parts.append("fb_tmpl_md: false")
                parts.append("if %%_c # [] then %s: append(%s, [[%s, %%_c[1]]]) else print(%s)"
                             % (v("fb"), v("fb"), mstring(n[b + "format"]),
                                mstring("@@PRTERR feedback castext of node %s (%s)@@" % (int(n["name"]) + 1 if n["name"].isdigit() else n["name"], b))))
            parts.append("%s: %s" % (v("node"), mstring(n[b + "nextnode"] or "-1")))
            return "(" + ", ".join(parts) + ")"
        quiet = n["quiet"] == "1"
        body.append("if %%_t = [] then (print(%s), %s: \"-1\") else (%%_t: %%_t[1]%s, if %%_t[2] = true then %s else %s)"
                    % (mstring("@@PRTERR answer test of node %s: %s@@" % (int(n["name"]) + 1 if n["name"].isdigit() else n["name"], at)),
                       v("node"),
                       "" if quiet else ", if length(%%_t) > 3 and stringp(%%_t[4]) and slength(%%_t[4]) > 0 then %s: append(%s, [%%_t[4]])" % (v("atfb"), v("atfb")),
                       branch("true"), branch("false")))
        branches.append("if %s = %s then (%s)" % (v("node"), mstring(n["name"]), ", ".join(body)))
    loop = " elseif ".join(b[3:] for b in branches) if branches else "true then 0"
    code.append("while %s # \"-1\" and %s < 100 do (%s: %s + 1, if %s else %s: \"-1\")$"
                % (v("node"), v("guard"), v("guard"), v("guard"), loop, v("node")))
    code.append("%s: ev(float(round(max(min(%s, 1.0), 0.0)*1000)/1000), simp)$" % (v("score"), v("score")))
    code.append('meclib_out(%s, string(%s))$' % (mstring("prt:%s:score" % P), v("score")))
    code.append('meclib_out(%s, string(%s))$' % (mstring("prt:%s:penalty" % P), v("pen")))
    code.append('meclib_out(%s, simplode(%s, " | "))$' % (mstring("prt:%s:notes" % P), v("path")))
    code.append('for %%_f in %s do (meclib_out(%s, %%_f[1]), meclib_out(%s, stack_resolve_lang(%%_f[2], %s)),'
                ' meclib_out(%s, stack_resolve_lang(%%_f[2], %s)))$'
                % (v("fb"), mstring("prt:%s:fbformat" % P), mstring("prt:%s:fb:de" % P), mstring(lang_de),
                   mstring("prt:%s:fb:en" % P), mstring(lang_en)))
    code.append('for %%_f in %s do meclib_out(%s, %%_f)$' % (v("atfb"), mstring("prt:%s:atfb" % P)))
    return code


def evaluate(session, data, seed, resolver, previous_names=(), answers=None):
    """Evaluates question variables, model answers and castext of a question in a Maxima
    session. Returns a dict for the preview page."""
    t0 = time.time()
    statements = split_statements(data["questionvariables"])
    names, includes, code = [], [], []
    if previous_names:
        code.append("kill(%s)$" % ",".join(previous_names))
    code.append("simp: %s$" % ("true" if data["questionsimplify"] else "false"))
    code.append("stackfltsep: %s$" % mstring(data["decimals"]))
    code.extend(option_commands(data))
    if uses_units(data):    # as STACK: automatic unit declaration when inputs or tests use units
        code.append("stack_unit_si_declare(true)$")
    code.append("stack_randseed(%d)$" % seed)
    stmt_info = []
    for k, (stmt, line, inserted) in enumerate(statements):
        clean = strip_comments(stmt)
        if inserted:
            stmt_info.append({"index": "s%d" % k, "line": line, "source": clean[:200],
                              "note": "missing ; before this line assumed (as STACK's parser does)"})
        try:
            clean = INCLUDE.sub(lambda m: "load(%s)" % mpath(resolver.local_file(m.group(1))), clean)
            for m in INCLUDE.finditer(strip_comments(stmt)):
                includes.append(m.group(1))
        except ValueError as err:
            stmt_info.append({"index": k, "line": line, "source": clean[:200], "error": str(err)})
            continue
        bad = forbidden_identifiers(strip_comments(stmt))
        if bad:
            stmt_info.append({"index": k, "line": line, "source": clean[:200], "error": forbidden_message(bad)})
            continue
        m = ASSIGN.match(clean) or FUNDEF.match(clean)
        if m and m.group(1) not in names:
            names.append(m.group(1))
        stmt_info.append({"index": k, "line": line, "source": clean[:200]})
        # each statement separately through eval_string(): a syntax error then only affects
        # this statement (in one batch file it would stop everything after it). The explicit
        # "$" is needed: without one, eval_string() appends a terminator only if the text
        # contains no ";" at all - a ";" inside a string literal then ends in a parse error.
        code.append('print("@@QV %d@@")$' % k)
        code.append("%%_r: errcatch(eval_string(%s))$" % mstring(clean + "$"))
        code.append('if %%_r = [] then print("@@QVERR %d@@")$' % k)
    code.append('print("@@QV-END@@")$')
    # values of the assigned variables (raw and as typeset), model answers, castext
    for name in names:
        code.append('block([%%_v: errcatch(string(%s)), %%_t: errcatch(fb_tmpl_tostring(%s))],'
                    ' if %%_v # [] then meclib_out(%s, %%_v[1]), if %%_t # [] then meclib_out(%s, %%_t[1]))$'
                    % (name, name, mstring("var:" + name), mstring("tex:" + name)))
    security = security_findings(data)
    for inp in data["inputs"]:
        tans = inp.get("tans") or ""
        if tans.strip() and "model answer of %s" % inp["name"] not in security:
            code.append('block([%%_v: errcatch(%s)], if %%_v # [] then (meclib_out(%s, string(%%_v[1])),'
                        ' meclib_out(%s, fb_tmpl_tostring(%%_v[1]))))$'
                        % (tans, mstring("tans:" + inp["name"]), mstring("tanstex:" + inp["name"])))
    # syntax hints are castext too (e.g. {@meclib_h_unit@}, multilingual)
    langs_q = languages_used(data["questiontext"])
    for inp in data["inputs"]:
        hint = inp.get("syntaxhint") or ""
        if "syntax hint of %s" % inp["name"] in security:
            continue
        if "{@" in hint or "{#" in hint or "[[" in hint:
            code.append('block([%%_c: errcatch(castext(%s))], if %%_c # [] then (meclib_out(%s, stack_resolve_lang(%%_c[1], %s)),'
                        ' meclib_out(%s, stack_resolve_lang(%%_c[1], %s))))$'
                        % (mstring(hint), mstring("hint:de:" + inp["name"]), mstring(pick_lang("de", langs_q)),
                           mstring("hint:en:" + inp["name"]), mstring(pick_lang("en", langs_q))))
    texts = {"questiontext": data["questiontext"], "generalfeedback": data["generalfeedback"],
             "questionnote": data["questionnote"]}
    langs = languages_used(data["questiontext"])
    for key, txt in texts.items():
        if not txt.strip() or key in security:
            continue
        code.append('print("@@CT %s@@")$' % key)
        # Markdown texts: {@...@} escaped for Markdown, Markdown's math delimiters (as STACK)
        md = data["formats"].get(key) == "markdown"
        code.append('fb_tmpl_md: %s$' % ("true" if md else "false"))
        code.append('%%_c: errcatch(castext(%s))$' % mstring(mark_html_blocks(txt) if md else txt))
        code.append('fb_tmpl_md: false$')
        code.append('if %%_c = [] then print("@@CTERR %s@@") else (meclib_out(%s, stack_resolve_lang(%%_c[1], %s)),'
                    ' meclib_out(%s, stack_resolve_lang(%%_c[1], %s)))$'
                    % (key, mstring(key + ":de"), mstring(pick_lang("de", langs)),
                       mstring(key + ":en"), mstring(pick_lang("en", langs))))
    checked = {}
    if answers is not None:
        code += answer_code(data, answers, langs, resolver, checked)
    stdout, results = session.run_with_results("\n".join(code))

    # attribute Maxima's messages to the statement that produced them
    errors, messages = [], {}
    current = None
    for line in stdout.splitlines():
        m = re.match(r"\s*@@(QV|QVERR|CT|CTERR) ?(\S*)@@\s*$", line)
        if m:
            kind, arg = m.groups()
            if kind in ("QV", "CT"):
                current = (kind, arg)
            elif kind == "QVERR":
                errors.append(("QV", arg))
            elif kind == "CTERR":
                errors.append(("CT", arg))
            continue
        if line.strip() == "@@QV-END@@":
            current = None
            continue
        if current and line.strip():
            messages.setdefault(current, []).append(line.rstrip())
    for info in stmt_info:
        key = ("QV", str(info["index"]))
        if "error" not in info and key in [e for e in errors]:
            info["error"] = "\n".join(messages.get(key, [])) or "error"
        elif key in messages:
            info["output"] = "\n".join(messages[key])
    castext_errors = dict(security)
    castext_errors.update({arg: "\n".join(messages.get(("CT", arg), [])) or "error" for kind, arg in errors if kind == "CT"})

    def first(key):
        text = results.get(key, [None])[0]
        # markers of mark_html_blocks() left over where an HTML block and an [[if]] overlap
        return text.replace("[[htmlformat]]", "").replace("[[/htmlformat]]", "") if text else text

    return {
        "seed": seed,
        "seconds": round(time.time() - t0, 2),
        "statements": [s for s in stmt_info if "error" in s or "output" in s or "note" in s],
        "variables": [{"name": n, "raw": first("var:" + n), "tex": first("tex:" + n)} for n in names],
        "names": names,
        "includes": includes,
        "inputs": [dict(inp, tans_raw=first("tans:" + inp["name"]), tans_tex=first("tanstex:" + inp["name"]),
                        hint_de=first("hint:de:" + inp["name"]), hint_en=first("hint:en:" + inp["name"]))
                   for inp in data["inputs"]],
        "texts": {key: {"de": first(key + ":de"), "en": first(key + ":en")} for key in texts if texts[key].strip()},
        "castext_errors": castext_errors,
        "languages": langs,
        "picked": {"de": pick_lang("de", langs), "en": pick_lang("en", langs)},
        "check": check_results(checked, results, stdout, data) if answers is not None else None,
        # names to kill before the next evaluation in the same Maxima session
        "kill": names + ([i["name"] for i in data["inputs"]] if answers is not None else []) + (
            [m.group(1) for p in data["prts"] for st, _l, _i in split_statements(p["feedbackvariables"])
             for m in [ASSIGN.match(strip_comments(st))] if m] if answers is not None else []),
    }


def answer_code(data, answers, langs, resolver, checked):
    """Code for the student's answers (as STACK: simp:false, then name: value) and the PRTs
    whose inputs are all answered. Fills checked with what is evaluated."""
    names = [i["name"] for i in data["inputs"]]
    raw_by_input = {n: answers.get(n, "") for n in names}
    code = ['print("@@ANSWERS@@")$', "simp: false$"]
    inputs = {}
    for inp in data["inputs"]:
        n = inp["name"]
        raw = raw_by_input[n]
        if not raw.strip():
            inputs[n] = {"state": "blank"}
            continue
        value = student_value(inp, raw, data["decimals"])
        inputs[n] = {"state": "?", "value": value}
        code.append('block([%%_p: errcatch(parse_string(%s))], if %%_p = [] then meclib_out(%s, "invalid") else ('
                    '%s: %%_p[1], meclib_out(%s, "valid"), meclib_out(%s, fb_tmpl_tostring(%s))))$'
                    % (mstring(value), mstring("ans:%s:state" % n), n, mstring("ans:%s:state" % n),
                       mstring("ans:%s:tex" % n), n))
    checked["inputs"] = inputs
    checked["prts"] = {}

    def includes(stmt):
        return INCLUDE.sub(lambda m: "load(%s)" % mpath(resolver.local_file(m.group(1))), stmt)
    for prt in data["prts"]:
        req = prt_required_inputs(prt, names)
        missing = [n for n in req if inputs[n]["state"] == "blank"]
        if missing:
            checked["prts"][prt["name"]] = {"skipped": "not answered: " + ", ".join(missing)}
            continue
        checked["prts"][prt["name"]] = {"inputs": req}
        # an input that does not parse makes the PRT invalid (reported after the run), as in STACK
        code.append("simp: false$")
        code += prt_code(prt, raw_by_input, data.get("penalty") or "0.1", pick_lang("de", langs), pick_lang("en", langs), includes)
    return code


def check_results(checked, results, stdout, data):
    def first(key, default=None):
        return results.get(key, [default])[0]
    out = {"inputs": {}, "prts": {}}
    for n, info in checked["inputs"].items():
        state = first("ans:%s:state" % n, info["state"]) if info["state"] != "blank" else "blank"
        out["inputs"][n] = {"state": state, "tex": first("ans:%s:tex" % n), "value": info.get("value")}
    errors = {}
    current = None
    for line in stdout.splitlines():
        m = re.match(r"\s*@@PRT (.*)@@\s*$", line)
        if m:
            current = m.group(1); continue
        m = re.match(r"\s*@@PRTERR (.*)@@\s*$", line)
        if m and current:
            errors.setdefault(current, []).append(m.group(1))
    prts = {p["name"]: p for p in data["prts"]}
    for name, info in checked["prts"].items():
        if "skipped" in info:
            out["prts"][name] = info; continue
        invalid = [n for n in info["inputs"] if out["inputs"][n]["state"] == "invalid"]
        fbf = results.get("prt:%s:fbformat" % name, [])
        res = {
            "score": first("prt:%s:score" % name), "penalty": first("prt:%s:penalty" % name),
            "notes": first("prt:%s:notes" % name, ""), "value": prts[name]["value"],
            "feedbackstyle": prts[name]["feedbackstyle"],
            "feedback": {"de": list(zip(fbf, results.get("prt:%s:fb:de" % name, []))),
                         "en": list(zip(fbf, results.get("prt:%s:fb:en" % name, [])))},
            # answer test feedback: STACK's message keys, e.g. stack_trans('ATAlgEquiv_SA_not_logic'); !NEWLINE!
            "testfeedback": [", ".join(re.findall(r"stack_trans\('([^']+)'", t)) or t
                             for t in results.get("prt:%s:atfb" % name, [])],
            "errors": errors.get(name, []),
        }
        if invalid:
            res = {"skipped": "invalid input: " + ", ".join(invalid)}
        out["prts"][name] = res
    return out


LANG_CODE = re.compile(r"\[\[\s*lang\s+code\s*=\s*['\"]([^'\"]*)['\"]")


def languages_used(text):
    langs = []
    for m in LANG_CODE.finditer(text or ""):
        for code in m.group(1).split(","):
            code = code.strip().lower().replace("-", "_")
            if code and code not in langs:
                langs.append(code)
    return langs


def pick_lang(lang, langs):
    """STACK's stack_multilang::pick_lang(): the user's language if the question text uses
    it, else 'other' if used, else the first language used. Without any [[lang]] block in
    the question text STACK sets no language at all, so no [[lang]] block (e.g. in the
    feedback functions' texts) is shown - returned here as ""."""
    if not langs:
        return ""
    if lang in langs:
        return lang
    return "other" if "other" in langs else langs[0]
