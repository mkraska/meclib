"""
Question files of the workbench: Moodle XML files in the user's own folders, read and written
back in place.

Writing changes only the fields that were edited, directly in the file text: the question is
located in the text, and only the content of the changed elements (and a changed format
attribute) is replaced. Everything else - order, indentation, CDATA sections, line endings,
elements the workbench does not know - stays as it is, so a version control diff shows just
the edits. ElementTree is used for reading only.

Safety: a write is refused if the file changed on disk since it was read (the client sends the
revision it knows, a hash of the file content); the first write after opening a file can make
a backup copy <file>.bak; files are written through a temporary file and renamed.
"""

import hashlib
import html
import json
import os
import re
import time
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEMPLATES = HERE / "templates"

QUESTION = re.compile(r'<question\s+type="([^"]*)"\s*>.*?</question>', re.S)
TEXT_FIELDS = ["questiontext", "generalfeedback", "specificfeedback", "questionnote", "questiondescription"]
INPUT_FIELDS = ["type", "tans", "boxsize", "strictsyntax", "insertstars", "syntaxhint", "syntaxattribute",
                "forbidwords", "allowwords", "forbidfloat", "requirelowestterms", "checkanswertype",
                "mustverify", "showvalidation", "options"]
FORMATS = ["html", "markdown", "moodle_auto_format", "plain_text"]
# question-level options (stack/options.class.php and the question form); value lists where fixed
OPTIONS = {
    "decimals": [".", ","], "multiplicationsign": ["dot", "cross", "onum", "none", "space"],
    "questionsimplify": ["1", "0"], "scientificnotation": ["*10", "E"], "assumepositive": ["0", "1"],
    "assumereal": ["0", "1"], "sqrtsign": ["1", "0"], "complexno": ["i", "j", "symi", "symj"],
    "inversetrig": ["cos-1", "acos", "arccos", "arsinh"], "logicsymbol": ["lang", "symbol"],
    "matrixparens": ["[", "(", "", "{", "|"], "defaultgrade": None, "penalty": None, "idnumber": None,
}


class ConflictError(Exception):
    """The file changed on disk since the client read it."""


# ---------------------------------------------------------------------- reading
def read_file(path):
    """(text, revision). The text keeps its line endings (newline="")."""
    with open(path, encoding="utf-8", newline="") as f:
        text = f.read()
    return text, revision(text)


def revision(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]


def spans(text):
    """[(start, end, type)] of all <question> elements, in document order."""
    return [(m.start(), m.end(), m.group(1)) for m in QUESTION.finditer(text)]


def list_questions(text):
    """[{index, name, type, category}] - index counts all <question> elements (as
    stack_question does), category questions are not listed but set the category."""
    out, category = [], ""
    for i, (a, b, qtype) in enumerate(spans(text)):
        el = ET.fromstring(text[a:b])
        if qtype == "category":
            category = _text(el, "category/text")
            continue
        out.append({"index": i, "name": _text(el, "name/text"), "type": qtype, "category": category})
    return out


def _text(el, path, default=""):
    found = el.find(path)
    return found.text if found is not None and found.text is not None else default


def question_span(text, index):
    s = spans(text)
    if not 0 <= index < len(s):
        raise ValueError("no question %d in this file" % index)
    return s[index]


def question_fields(text, index):
    """The editable fields of a STACK question as plain strings."""
    a, b, qtype = question_span(text, index)
    if qtype != "stack":
        raise ValueError("question %d is not a STACK question" % index)
    el = ET.fromstring(text[a:b])
    fields = {"name": _text(el, "name/text"), "questionvariables": _text(el, "questionvariables/text")}
    for key in TEXT_FIELDS:
        node = el.find(key)
        fields[key] = _text(el, key + "/text")
        fields[key + "_format"] = (node.get("format") if node is not None else None) or "html"
    fields["inputs"] = [{k: _text(inp, k) for k in ["name"] + INPUT_FIELDS} for inp in el.findall("input")]
    fields["prts"] = [prt_summary(p) for p in el.findall("prt")]
    fields["options"] = {k: _text(el, k) for k in OPTIONS if el.find(k) is not None}
    return fields


def prt_summary(p):
    """A PRT for display (read only in this version)."""
    nodes = []
    for n in p.findall("node"):
        nodes.append({k: _text(n, k) for k in ("name", "description", "answertest", "sans", "tans", "testoptions",
                                               "quiet", "truescoremode", "truescore", "truenextnode",
                                               "trueanswernote", "falsescoremode", "falsescore",
                                               "falsenextnode", "falseanswernote")}
                     | {"truefeedback": _text(n, "truefeedback/text"), "falsefeedback": _text(n, "falsefeedback/text")})
    return {"name": _text(p, "name"), "value": _text(p, "value"), "autosimplify": _text(p, "autosimplify"),
            "feedbackstyle": _text(p, "feedbackstyle"), "feedbackvariables": _text(p, "feedbackvariables/text"),
            "nodes": nodes}


# ---------------------------------------------------------------------- writing
def _newline(text):
    return "\r\n" if text.count("\r\n") * 2 > text.count("\n") else "\n"


def encode_text(value, was_cdata):
    """Content of a <text> element: CDATA where the file had CDATA or where the value needs
    escaping (as Moodle writes it), plain text otherwise."""
    if was_cdata or re.search(r"[<>&]", value):
        return "<![CDATA[" + value.replace("]]>", "]]]]><![CDATA[>") + "]]>"
    return value


def encode_plain(value):
    return html.escape(value, quote=False)


def _decode(raw):
    """Element content as text (CDATA sections and entities resolved)."""
    return ET.fromstring("<x>" + raw + "</x>").text or ""


def _replace_text_child(q, tag, value, nl, fmt=None, first_only=True):
    """In question text q, sets <tag ...><text>value</text></tag>. Returns (q, changed)."""
    pat = re.compile(r"(<%s\b([^>]*)>\s*<text>)(.*?)(</text>)" % re.escape(tag), re.S)
    m = pat.search(q)
    if not m:
        empty = re.compile(r"(<%s\b([^>]*)>\s*)<text\s*/>" % re.escape(tag), re.S).search(q)
        if not empty:
            raise ValueError("element <%s> not found in the question" % tag)
        q = q[:empty.end(1)] + "<text></text>" + q[empty.end():]
        m = pat.search(q)
    raw = m.group(3)
    changed = False
    if _decode(raw).replace("\r\n", "\n") != value.replace("\r\n", "\n"):
        new = encode_text(value.replace("\r\n", "\n").replace("\n", nl), raw.lstrip().startswith("<![CDATA["))
        q = q[:m.start(3)] + new + q[m.end(3):]
        changed = True
    if fmt is not None:
        attrs = m.group(2)
        fm = re.search(r'format="([^"]*)"', attrs)
        current = fm.group(1) if fm else "html"
        if fmt != current:
            if fmt not in FORMATS:
                raise ValueError("unknown format %r" % fmt)
            newattrs = (attrs[:fm.start(1)] + fmt + attrs[fm.end(1):]) if fm else attrs + ' format="%s"' % fmt
            start = m.start(2)
            q = q[:start] + newattrs + q[start + len(attrs):]
            changed = True
    return q, changed


def _replace_simple(block, tag, value):
    """<tag>value</tag> inside block (first occurrence). Returns (block, changed)."""
    m = re.search(r"<%s>(.*?)</%s>|<%s\s*/>" % (tag, tag, tag), block, re.S)
    if not m:
        raise ValueError("element <%s> not found" % tag)
    current = _decode(m.group(1) or "")
    if current == value:
        return block, False
    return block[:m.start()] + "<%s>%s</%s>" % (tag, encode_plain(value), tag) + block[m.end():], True


def apply_changes(text, index, changes):
    """New file text with the changes applied to question index, and the list of changed fields.
    changes: {name?, questionvariables?, <textfield>?, <textfield>_format?, inputs?: [{name, ...}]}"""
    a, b, qtype = question_span(text, index)
    if qtype != "stack":
        raise ValueError("question %d is not a STACK question" % index)
    nl = _newline(text)
    q = text[a:b]
    changed = []
    if "name" in changes:
        q, c = _replace_text_child(q, "name", changes["name"], nl)
        changed += ["name"] if c else []
    if "questionvariables" in changes:
        q, c = _replace_text_child(q, "questionvariables", changes["questionvariables"], nl)
        changed += ["questionvariables"] if c else []
    for key in TEXT_FIELDS:
        if key in changes or key + "_format" in changes:
            if key not in changes:
                changes[key] = question_fields(text, index)[key]
            q, c = _replace_text_child(q, key, changes[key], nl, changes.get(key + "_format"))
            changed += [key] if c else []
    for tag, value in (changes.get("options") or {}).items():
        if tag not in OPTIONS:
            raise ValueError("unknown option %r" % tag)
        if OPTIONS[tag] is not None and value not in OPTIONS[tag]:
            raise ValueError("option %s: %r not allowed" % (tag, value))
        # only the question's own element: before the first <input>/<prt> (nodes have e.g. truepenalty)
        cut = min([i for i in (q.find("<input>"), q.find("<prt>")) if i >= 0] or [len(q)])
        head, tail = q[:cut], q[cut:]
        if re.search(r"<%s>.*?</%s>|<%s\s*/>" % (tag, tag, tag), head, re.S):
            head, c = _replace_simple(head, tag, value)
        else:   # missing in the file: add it before the inputs
            line = head.rfind("\n") + 1
            indent = re.match(r"[ \t]*", head[line:]).group(0) or "    "
            head, c = head[:line] + "%s<%s>%s</%s>%s" % (indent, tag, encode_plain(value), tag, nl) + head[line:], True
        q = head + tail
        if c:
            changed.append("option " + tag)
    for inp in changes.get("inputs", []):
        blocks = list(re.finditer(r"<input>.*?</input>", q, re.S))
        target = next((m for m in blocks if re.search(r"<name>%s</name>" % re.escape(inp["name"]), m.group(0))), None)
        if target is None:
            raise ValueError("input %r not found" % inp["name"])
        block = target.group(0)
        for k in INPUT_FIELDS:
            if k in inp and inp[k] is not None:
                block, c = _replace_simple(block, k, str(inp[k]))
                if c:
                    changed.append("input %s: %s" % (inp["name"], k))
        q = q[:target.start()] + block + q[target.end():]
    return text[:a] + q + text[b:], changed


def write_file(path, text, expected_rev, backup=False):
    """Writes text to path unless the file changed since expected_rev. Returns the new revision."""
    path = Path(path)
    if path.exists():
        current, rev = read_file(path)
        if expected_rev is not None and rev != expected_rev:
            raise ConflictError("the file was changed outside the workbench")
        if backup:
            Path(str(path) + ".bak").write_text(current, encoding="utf-8", newline="")
    elif expected_rev is not None:
        raise ConflictError("the file no longer exists")
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(text, encoding="utf-8", newline="")
    os.replace(tmp, path)
    return revision(text)


def save_changes(path, index, changes, expected_rev, backup=False):
    text, rev = read_file(path)
    if rev != expected_rev:
        raise ConflictError("the file was changed outside the workbench")
    new, changed = apply_changes(text, index, changes)
    if not changed:
        return {"rev": rev, "changed": [], "saved": False}
    return {"rev": write_file(path, new, rev, backup), "changed": changed, "saved": True}


# ---------------------------------------------------------------------- inputs and PRTs
# Kinds offered by the "Input ..." dialog of the Questions page, with the defaults of the meclib
# wiki pages (fb_unit - also for numbers without unit, fb_number is obsolete - fb_vars; multilingual syntax hints meclib_h_* from fb_value.mac,
# wiki page "Multilingual questions"). X is the name given in the dialog: input S_X,
# PRT X, teacher's answer X (a question variable).
INPUT_KINDS = {
    "units": {
        "input": {"type": "units", "boxsize": "8", "insertstars": "3", "syntaxhint": "{@meclib_h_unit@}",
                  "syntaxattribute": "1", "forbidfloat": "0", "mustverify": "1", "showvalidation": "3"},
        "prt": {"autosimplify": "0", "answertest": "UnitsRelative", "options": True,
                "true": "{@fb_unit(%(s)s, %(t)s, 0)@}", "false": "{@fb_unit(%(s)s, %(t)s, %(tol)s)@}"},
    },
    "number": {
        "input": {"type": "numerical", "boxsize": "8", "insertstars": "0", "syntaxhint": "{@meclib_h_number@}",
                  "syntaxattribute": "1", "forbidfloat": "0", "mustverify": "1", "showvalidation": "3"},
        "prt": {"autosimplify": "1", "answertest": "NumRelative", "options": True,
                "true": "{@fb_unit(%(s)s, %(t)s, 0)@}", "false": "{@fb_unit(%(s)s, %(t)s, %(tol)s)@}"},
    },
    "expression": {
        "input": {"type": "algebraic", "boxsize": "15", "insertstars": "3", "syntaxhint": "{@meclib_h_alg@}",
                  "syntaxattribute": "1", "forbidfloat": "1", "mustverify": "1", "showvalidation": "3"},
        "prt": {"autosimplify": "1", "answertest": "AlgEquiv", "options": False,
                "true": "{@fb_vars(%(s)s, %(t)s)@}", "false": "{@fb_vars(%(s)s, %(t)s)@}"},
    },
}
NAME = re.compile(r"^[A-Za-z][A-Za-z0-9_]*$")


def input_block(name, kind, tans, nl, indent="    "):
    spec = dict(INPUT_KINDS[kind]["input"])
    fields = [("name", name), ("type", spec["type"]), ("tans", tans), ("boxsize", spec["boxsize"]),
              ("strictsyntax", "1"), ("insertstars", spec["insertstars"]), ("syntaxhint", spec["syntaxhint"]),
              ("syntaxattribute", spec["syntaxattribute"]), ("forbidwords", ""), ("allowwords", ""),
              ("forbidfloat", spec["forbidfloat"]), ("requirelowestterms", "0"), ("checkanswertype", "0"),
              ("mustverify", spec["mustverify"]), ("showvalidation", spec["showvalidation"]), ("options", "")]
    inner = "".join("%s  <%s>%s</%s>%s" % (indent, k, encode_plain(v), k, nl) for k, v in fields)
    return "%s<input>%s%s%s</input>" % (indent, nl, inner, indent)


def prt_block(name, kind, sans, tans, tol, nl, indent="    "):
    spec = INPUT_KINDS[kind]["prt"]
    sub = {"s": sans, "t": tans, "tol": tol}
    i2, i3, i4 = indent + "  ", indent + "    ", indent + "      "

    def fb(tag, text):
        return "%s<%s format=\"html\">%s%s<text>%s</text>%s%s</%s>%s" % (
            i3, tag, nl, i4, encode_text(text, False), nl, i3, tag, nl)
    node = (i2 + "<node>" + nl +
            "".join("%s<%s>%s</%s>%s" % (i3, k, encode_plain(v), k, nl) for k, v in [
                ("name", "0"), ("description", ""), ("answertest", spec["answertest"]), ("sans", sans),
                ("tans", tans), ("testoptions", tol if spec["options"] else ""), ("quiet", "1"),
                ("truescoremode", "="), ("truescore", "1"), ("truepenalty", ""), ("truenextnode", "-1"),
                ("trueanswernote", name + "-1-T")]) +
            fb("truefeedback", spec["true"] % sub) +
            "".join("%s<%s>%s</%s>%s" % (i3, k, encode_plain(v), k, nl) for k, v in [
                ("falsescoremode", "="), ("falsescore", "0"), ("falsepenalty", ""), ("falsenextnode", "-1"),
                ("falseanswernote", name + "-1-F")]) +
            fb("falsefeedback", spec["false"] % sub) +
            i2 + "</node>" + nl)
    head = "".join("%s<%s>%s</%s>%s" % (i2, k, v, k, nl) for k, v in [
        ("name", name), ("value", "1.0000000"), ("autosimplify", spec["autosimplify"]), ("feedbackstyle", "2")])
    fv = "%s<feedbackvariables>%s%s<text></text>%s%s</feedbackvariables>%s" % (i2, nl, i3, nl, i2, nl)
    return indent + "<prt>" + nl + head + fv + node + indent + "</prt>"


def _insert_after_last(q, closing, block, nl, fallbacks):
    """Inserts block (a whole line) after the last closing tag, else before the first of
    fallbacks (opening tags, in order of preference), else before </question>."""
    pos = q.rfind(closing)
    if pos >= 0:
        end = pos + len(closing)
        return q[:end] + nl + block + q[end:]
    for tag in fallbacks:
        m = re.search(r"\n([ \t]*)" + re.escape(tag), q)
        if m:
            return q[:m.start() + 1] + block + nl + q[m.start() + 1:]
    end = q.rfind("</question>")
    line = q.rfind("\n", 0, end) + 1
    return q[:line] + block + nl + q[line:]


def add_input(text, index, name, kind, tans=None, tol="0.005"):
    """New input S_<name> and PRT <name> (see INPUT_KINDS). Returns (text, input name, prt name)."""
    if kind not in INPUT_KINDS:
        raise ValueError("unknown kind %r" % kind)
    if not NAME.match(name or ""):
        raise ValueError("name: a letter, then letters, digits or _")
    a, b, qtype = question_span(text, index)
    if qtype != "stack":
        raise ValueError("question %d is not a STACK question" % index)
    nl = _newline(text)
    q = text[a:b]
    el = ET.fromstring(q)
    iname, pname = "S_" + name, name
    if any(_text(i, "name") == iname for i in el.findall("input")):
        raise ValueError("there is already an input %s" % iname)
    if any(_text(p, "name") == pname for p in el.findall("prt")):
        raise ValueError("there is already a PRT %s" % pname)
    tans = tans or name
    q = _insert_after_last(q, "</input>", input_block(iname, kind, tans, nl), nl,
                           ["<prt>", "<deployedseed>", "<qtest>", "<hint"])
    q = _insert_after_last(q, "</prt>", prt_block(pname, kind, iname, tans, str(tol), nl), nl,
                           ["<deployedseed>", "<qtest>", "<hint"])
    # a question with PRTs needs a mark; the template starts with 0
    m = re.search(r"<defaultgrade>([^<]*)</defaultgrade>", q)
    if m and float(m.group(1) or 0) == 0:
        q = q[:m.start(1)] + "1" + q[m.end(1):]
    return text[:a] + q + text[b:], iname, pname


def _remove_block(q, pattern):
    """Removes the elements matching pattern together with their line (indentation, line end)."""
    def cut(m):
        return ""
    return re.sub(r"[ \t]*" + pattern + r"[ \t]*\r?\n?", cut, q, flags=re.S)


def delete_input(text, index, iname, with_prt=None):
    """Removes input iname, its [[input:..]]/[[validation:..]] placeholders, its test inputs, and
    optionally PRT with_prt with its [[feedback:..]] placeholder and expected test results."""
    a, b, qtype = question_span(text, index)
    q = text[a:b]
    blocks = [m for m in re.finditer(r"<input>.*?</input>", q, re.S)
              if re.search(r"<name>%s</name>" % re.escape(iname), m.group(0))]
    if not blocks:
        raise ValueError("input %r not found" % iname)
    q = _remove_block(q, r"<input>(?:(?!</input>).)*?<name>%s</name>.*?</input>" % re.escape(iname))
    q = _remove_block(q, r"<testinput>(?:(?!</testinput>).)*?<name>%s</name>.*?</testinput>" % re.escape(iname))
    placeholders = [r"\[\[\s*input:%s\s*\]\]" % re.escape(iname), r"\[\[\s*validation:%s\s*\]\]" % re.escape(iname)]
    if with_prt:
        q = _remove_block(q, r"<prt>(?:(?!</prt>).)*?<name>%s</name>.*?</prt>" % re.escape(with_prt))
        q = _remove_block(q, r"<expected>(?:(?!</expected>).)*?<name>%s</name>.*?</expected>" % re.escape(with_prt))
        placeholders.append(r"\[\[\s*feedback:%s\s*\]\]" % re.escape(with_prt))
    # placeholders in the texts (inside CDATA or escaped text, both are plain characters here)
    for ph in placeholders:
        q = re.sub(r" ?" + ph, "", q)
    # an emptied paragraph (e.g. <p hidden> </p>) is removed as well
    q = re.sub(r"[ \t]*<p( hidden)?>\s*</p>[ \t]*\r?\n?", "", q)
    return text[:a] + q + text[b:]


# ---------------------------------------------------------------------- new questions
def question_from_template(name, questionvariables=None, questiontext=None):
    """A STACK question (the <question> element as text) from templates/meclib_question.xml."""
    tpl = (TEMPLATES / "meclib_question.xml").read_text(encoding="utf-8")
    block = QUESTION.search(tpl).group(0)
    block, _ = _replace_text_child(block, "name", name, "\n")
    if questionvariables is not None:
        block, _ = _replace_text_child(block, "questionvariables", questionvariables, "\n")
    if questiontext is not None:
        block, _ = _replace_text_child(block, "questiontext", questiontext, "\n")
    import rules   # "Generated by Meclib Workbench <date>" in the internal description
    block, _ = _replace_text_child(block, "questiondescription", rules.generated_description(), "\n", "html")
    return block


def new_file_text(question_blocks):
    return '<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n' + "".join(
        "  " + qb + "\n\n" for qb in question_blocks) + "</quiz>\n"


def append_question(text, block, after_index=None):
    """File text with block inserted after question after_index, or as the last question."""
    nl = _newline(text)
    block = block.replace("\r\n", "\n").replace("\n", nl)
    if after_index is not None:
        _, end, _ = question_span(text, after_index)
        return text[:end] + nl + nl + "  " + block + text[end:]
    end = text.rfind("</quiz>")
    if end < 0:
        raise ValueError("no </quiz> in this file")
    line = text.rfind("\n", 0, end) + 1          # start of the line with </quiz>
    return text[:line] + "  " + block + nl + nl + text[line:]


def duplicate_block(text, index, suffix=" (copy)"):
    a, b, _ = question_span(text, index)
    block = text[a:b]
    name = _text(ET.fromstring(block), "name/text")
    block, _ = _replace_text_child(block, "name", name + suffix, _newline(text))
    # an idnumber must be unique in a category
    block = re.sub(r"<idnumber>[^<]*</idnumber>", "<idnumber></idnumber>", block, count=1)
    return block


def safe_filename(name, ext=".xml"):
    base = re.sub(r'[<>:"/\\|?*\x00-\x1f]+', "_", name).strip(" .")[:80] or "question"
    return base + ext


# ---------------------------------------------------------------------- folders and recent files
class State:
    """Persistent workbench state (folders added in the page, recently opened files), kept in
    .cache/workbench_state.json - per machine, not committed."""

    def __init__(self, path):
        self.path = Path(path)
        try:
            self.data = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            self.data = {}
        self.data.setdefault("folders", [])
        self.data.setdefault("recent", [])

    def save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(self.data, indent=1, ensure_ascii=False), encoding="utf-8")

    def add_folder(self, folder):
        # Windows Explorer's "copy as path" puts the path in quotes
        folder = folder.strip().strip('"').strip("'").strip()
        folder = str(Path(folder).expanduser().resolve())
        if not Path(folder).is_dir():
            raise ValueError("not a folder: %s" % folder)
        if folder not in self.data["folders"]:
            self.data["folders"].append(folder)
            self.save()
        return folder

    def remove_folder(self, folder):
        self.data["folders"] = [f for f in self.data["folders"] if f != folder]
        self.save()

    def touch(self, path, index=None, name=None):
        recent = [r for r in self.data["recent"] if not (r["path"] == path and r.get("index") == index)]
        recent.insert(0, {"path": path, "index": index, "name": name, "time": time.strftime("%Y-%m-%d %H:%M")})
        self.data["recent"] = recent[:15]
        self.save()
