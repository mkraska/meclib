"""Builds the wiki page "Meclib Workbench Review Rules" (doc/wiki/) from rules.py, so that the
documentation of the review rules cannot drift from the code:

  - the rules in the order of RULES, grouped by the area of their key (text., inputs., prt., ...)
  - per key: level(s), whether an automatic fix exists, the title and message templates of its
    findings (from the F(...) calls) and the explanation of the rule function (its docstring,
    or else the comment block right above it)

Prints rule functions without an explanation.

    python build_rules_doc.py
"""
import ast
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
SRC = HERE / "rules.py"
OUT = REPO / "doc" / "wiki" / "Meclib Workbench Review Rules.md"

AREAS = [  # (title, key prefixes)
    ("Security", ("security",)),
    ("Texts and layout", ("text.", "layout.", "lang.")),
    ("Inputs", ("inputs.", "matrix.", "feedback.")),
    ("PRTs and grading", ("prt.", "grade.")),
    ("Maxima code and includes", ("include.", "functions.", "maxima.", "qv.")),
    ("Graphics (meclib)", ("graphic.", "state.", "index.", "tans.")),
    ("Files, variants and question tests", ("files.", "variants.", "tests.")),
]
LEVELS = ["required", "recommended", "hint"]


def template(node, consts):
    """A message/title argument as text: string constants kept, everything computed as "…"."""
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        s = node.value
    elif isinstance(node, ast.BinOp) and isinstance(node.op, ast.Mod):
        s = template(node.left, consts)
    elif isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
        s = template(node.left, consts) + template(node.right, consts)
    elif isinstance(node, ast.Name) and node.id in consts:
        s = consts[node.id]
    elif isinstance(node, ast.JoinedStr):
        s = "".join(v.value if isinstance(v, ast.Constant) else "…" for v in node.values)
    else:
        return "…"
    return re.sub(r"%[-0-9.]*[sdrf]", "…", s).replace("%%", "%")


def explanation(func, lines):
    doc = ast.get_docstring(func)
    if doc:
        return doc
    i, com = func.lineno - 2, []
    while i >= 0 and lines[i].lstrip().startswith("#"):
        com.insert(0, lines[i].lstrip()[1:].strip())
        i -= 1
    com = [c for c in com if not re.fullmatch(r"-+\s*\w*", c)]
    return "\n".join(com)


# Text from the code as Markdown: STACK/HTML syntax in backticks, so that GitHub neither renders
# <p> as HTML nor takes [[jsxgraph]] for a wiki link.
CODE = re.compile(r"\[\[[^\]]*\]\](?:\s*\.\.\.\s*\[\[[^\]]*\]\])?"   # [[...]] (... [[...]])
                  r"|\{[@#].*?[@#]\}"                              # {@...@}, {#...#}
                  r"|</?[A-Za-z][^<>]*>(?:\s*\.\.\.\s*</?[A-Za-z][^<>]*>)?"  # <tag> (... </tag>)
                  r"|(?:\\+[()\[\]])(?:\s*\.\.\.\s*\\+[()\[\]])?"         # \( ... \)
                  r"|@@PLUGINFILE@@\S*")


def md(text):
    parts = re.split(r"(`[^`]*`)", text)
    return "".join(p if p.startswith("`") else CODE.sub(lambda m: "`%s`" % m.group(0), p) for p in parts)


def paragraphs(text):
    """Docstring -> Markdown: paragraphs joined, indented lines kept as code."""
    out, para = [], []
    for line in text.splitlines():
        if not line.strip():
            if para:
                out.append(" ".join(para)); para = []
            continue
        if line.startswith("    "):
            if para:
                out.append(" ".join(para)); para = []
            out.append("    " + line.strip())
            continue
        para.append(line.strip())
    if para:
        out.append(" ".join(para))
    return "\n\n".join(o if o.startswith("    ") else md(o) for o in out).replace("\n\n    ", "\n    ")


def collect():
    src = SRC.read_text(encoding="utf-8")
    lines = src.splitlines()
    tree = ast.parse(src)
    consts = {n.targets[0].id: n.value.value for n in tree.body
              if isinstance(n, ast.Assign) and len(n.targets) == 1 and isinstance(n.targets[0], ast.Name)
              and isinstance(n.value, ast.Constant) and isinstance(n.value.value, str)}
    funcs = {f.name: f for f in tree.body if isinstance(f, ast.FunctionDef)}
    order = next([e.id for e in n.value.elts] for n in tree.body if isinstance(n, ast.Assign)
                 and any(getattr(t, "id", "") == "RULES" for t in n.targets))
    rules, missing = {}, []
    for name in order:
        f = funcs[name]
        expl = explanation(f, lines)
        if not expl:
            missing.append(name)
        for n in ast.walk(f):
            if not (isinstance(n, ast.Call) and getattr(n.func, "id", "") == "F"):
                continue
            a = list(n.args)
            kw = {k.arg: k.value for k in n.keywords}
            key = a[0].value if isinstance(a[0], ast.Constant) else "?"
            level = a[2].value if len(a) > 2 and isinstance(a[2], ast.Constant) else "?"
            fixnode = a[5] if len(a) > 5 else kw.get("fix")
            fix = fixnode is not None and not (isinstance(fixnode, ast.Constant) and fixnode.value is None)
            wikinode = a[6] if len(a) > 6 else kw.get("wiki")
            wiki = template(wikinode, consts) if wikinode is not None else ""
            r = rules.setdefault(key, {"func": name, "expl": expl, "levels": [], "fix": [], "titles": [],
                                       "messages": [], "wiki": ""})
            if level not in r["levels"]:
                r["levels"].append(level)
            r["fix"].append(fix)
            for k, node in (("titles", a[3] if len(a) > 3 else None), ("messages", a[4] if len(a) > 4 else None)):
                t = template(node, consts) if node is not None else ""
                if t and t not in r[k]:
                    r[k].append(t)
            if wiki and "…" not in wiki:
                r["wiki"] = wiki
    return order, rules, missing


def own_part(expl, key, keys):
    """A function with several keys explains each in a paragraph "key: ..."; a key's section shows
    the general paragraphs and its own one (without the label)."""
    out = []
    for para in re.split(r"\n\s*\n", expl):
        label = next((k for k in keys if para.startswith(k + ": ")), None)
        if label is None:
            out.append(para)
        elif label == key:
            p = para[len(key) + 2:]
            out.append(p[:1].upper() + p[1:])
    return "\n\n".join(out)


def area_of(key):
    for title, prefixes in AREAS:
        if any(key == p or key.startswith(p) for p in prefixes):
            return title
    return "Other"


def build():
    order, rules, missing = collect()
    by_area = {}
    for key in rules:      # keys in the order of RULES
        by_area.setdefault(area_of(key), []).append(key)
    areas = [a for a, _p in AREAS if a in by_area] + (["Other"] if "Other" in by_area else [])

    def fixtext(r):
        return "yes" if all(r["fix"]) else ("partly" if any(r["fix"]) else "no")

    def lv(r):
        return " / ".join(sorted(r["levels"], key=lambda l: LEVELS.index(l) if l in LEVELS else 9))

    out = ["<!-- generated by tools/workbench/build_rules_doc.py from rules.py - do not edit here -->",
           "The review of the [[Meclib Workbench]] (Questions page, **Review** at the top of the editor) checks a "
           "question against the conventions for STACK questions with meclib whenever it is opened or saved. "
           "Each finding has a key `rule[target]`, a level, a message and, where possible, an automatic fix "
           "with a preview of the changed XML.",
           "",
           "**Levels**",
           "- **required**: Moodle refuses the question, or it does not work as intended",
           "- **recommended**: meclib conventions (style guide, wiki pages of the feedback functions)",
           "- **hint**: worth a look; a fix, if offered, is not preselected",
           "",
           "\"Apply selected, reject the rest\" records the unchecked proposals as rejected in the question "
           "description (internal field): `Review rejected: <rule[target]>, ...`. Rejected findings are shown "
           "greyed and do not count as open.",
           "",
           "## Overview",
           "",
           "| Key | Level | Fix | Finding |",
           "|---|---|---|---|"]
    for a in areas:
        out.append("| **%s** | | | |" % a)
        for key in by_area[a]:
            r = rules[key]
            out.append("| [`%s`](#%s) | %s | %s | %s |" % (key, re.sub(r"[^a-z0-9-]", "", key.replace(".", "")),
                                                          lv(r), fixtext(r), md(" / ".join(r["titles"]))))
    for a in areas:
        out += ["", "## " + a]
        for key in by_area[a]:
            r = rules[key]
            out += ["", "### `%s`" % key, "",
                    "Level: **%s** · automatic fix: **%s** · function `%s()`" % (lv(r), fixtext(r), r["func"])]
            expl = own_part(r["expl"], key, [k for k in rules if rules[k]["func"] == r["func"]])
            if expl:
                out += ["", paragraphs(expl)]
            # messages that are mostly computed ("… (…): …") say nothing here
            msgs = [m for m in r["messages"] if len(re.sub(r"[^A-Za-z]", "", m)) >= 15]
            if msgs:
                out += ["", "Message%s:" % ("s" if len(msgs) > 1 else "")]
                out += ["> " + md(m) for m in msgs]
            if r["wiki"]:
                out += ["", "See also: " + r["wiki"]]
    text = "\n".join(out) + "\n"
    OUT.write_text(text, encoding="utf-8", newline="\n")
    print("%s: %d rules in %d areas" % (OUT.relative_to(REPO), len(rules), len(areas)))
    for m in missing:
        print("  no explanation:", m)


if __name__ == "__main__":
    build()
