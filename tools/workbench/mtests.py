"""The offline Maxima tests (Maxima/tests/test_*.mac) as data for the Tests page.

Reads the test files without running Maxima: every fb_check(), fb_check_str() and
fb_check_val() call is a test case, with its label, line, the call under test and the
expected result; the statements between two checks (e.g. o_ok: [...]) set up the next case.
The files are grouped by what they test:
  scene     feedback on free-body diagrams: object and names lists, scene fixtures
  value     feedback on an answer against a model answer (fb_unit, fb_vars, fb_floats, ...)
  other     other functions (sum_xyM, the security test, ...)
The order is that of run_tests.mac; files not listed there come last (not in the suite).
"""
import re
from pathlib import Path

import stack_question as sq
from rules import split_args

CHECK = re.compile(r"^\s*(fb_check|fb_check_str|fb_check_val)\s*\(", re.S)
LOAD = re.compile(r'^\s*load\("(test_[^"]+\.mac)"\)', re.M)
SCENE_HINT = re.compile(r'\bscene_(obj|names|init)\(|\[\s*"(fix1|fix12|fix123|fix13|force|moment|bar|contact|beam|'
                        r'rope|disp|q|dir|line|springt|springc|dashpot|wall|polygon)"\s*,')
GROUPS = [("scene", "Feedback on free-body diagrams"), ("value", "Feedback on answers (sans, tans)"),
          ("other", "Other functions")]
# the expected-result arguments of each check, after the call: names in order; the label is the last one
EXPECTED = {"fb_check": ["ok", "de", "en"], "fb_check_str": ["de", "en"], "fb_check_val": ["value"]}


def maxima_string(src):
    """The value of a Maxima string literal "..." (\\" and \\\\ unescaped), or None."""
    src = src.strip()
    if len(src) < 2 or src[0] != '"' or src[-1] != '"':
        return None
    return re.sub(r"\\(.)", r"\1", src[1:-1], flags=re.S)


def header_comment(text):
    """The first /* ... */ comment of a file, without the frame of = lines."""
    m = re.match(r"\s*/\*(.*?)\*/", text, re.S)
    if not m:
        return ""
    lines = [ln.strip() for ln in m.group(1).splitlines()]
    lines = [ln for ln in lines if not re.fullmatch(r"=+", ln)]
    return "\n".join(lines).strip()


def call_function(call):
    """The function under test: the first meclib-style call (fb_..., sum...) in the checked
    expression, e.g. fb_fbd in firstn(fb_fbd(...), 2), else the outermost function."""
    m = re.search(r"\b(fb_[A-Za-z0-9_]+|sum[A-Za-z0-9_]*)\s*\(", call)
    if m:
        return m.group(1)
    m = re.match(r"\s*([A-Za-z_%][A-Za-z0-9_%]*)\s*\(", call)
    return m.group(1) if m else ""


def parse_file(path):
    """{file, title, group, functions, cases: [{n, label, line, check, call, function, args,
    expected: {...}, setup}]} of one test file."""
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    cases, setup, functions, sequence = [], [], [], []
    # helpers of the file that call a check, e.g. cr_check(r, e, label) := fb_check(...): their
    # calls are cases, too (the call, the expected value, the label)
    wrappers = set(re.findall(r"^\s*([A-Za-z_%][A-Za-z0-9_%]*)\s*\([^)]*\)\s*:=\s*fb_check", text, re.M))
    for stmt, line, _inserted in sq.split_statements(text):
        clean = sq.strip_comments(stmt).strip()
        m = CHECK.match(clean)
        w = re.match(r"^\s*([A-Za-z_%][A-Za-z0-9_%]*)\s*\(", clean)
        if not m and w and w.group(1) in wrappers and not re.match(r"[^=]*\)\s*:=", clean):
            m = w
        if not m:
            if clean and not (w and w.group(1) in wrappers):
                setup.append(clean)
            if clean:
                sequence.append((None, clean, line))
            continue
        sequence.append((len(cases) + 1, clean, line))
        args = split_args(clean[m.end():])
        names = EXPECTED.get(m.group(1), ["value"])
        call = args[0] if args else ""
        label = maxima_string(args[-1]) if len(args) > len(names) else None
        expected = {}
        for k, name in enumerate(names, start=1):
            if k < len(args) - (1 if label is not None else 0):
                v = maxima_string(args[k])
                expected[name] = v if v is not None else args[k].strip()
        fn = call_function(call)
        if fn and fn not in functions:
            functions.append(fn)
        cases.append({"n": len(cases) + 1, "label": label if label is not None else "(case %d)" % (len(cases) + 1),
                      "line": line, "check": m.group(1), "call": call.strip(), "function": fn,
                      "args": [a.strip() for a in split_args(call[call.find("(") + 1:])] if "(" in call else [],
                      "expected": expected, "setup": list(setup)})
        setup = []
    # set-up statements that define a name used by the calls of two or more cases (e.g. an object
    # list): shown once for the file ("shared"), not with each case
    shared = []
    for c in cases:
        own = []
        for st in c["setup"]:
            m = re.match(r"([A-Za-z_%][A-Za-z0-9_%]*)\s*:(?!=)", st)
            users = [d for d in cases if m and re.search(r"(?<![A-Za-z0-9_%])" + re.escape(m.group(1)) + r"(?![A-Za-z0-9_%])", d["call"])]
            (shared if len(users) >= 2 else own).append(st)
        c["setup"] = "\n".join(st + ";" for st in own)
    if SCENE_HINT.search(text):
        group = "scene"
    elif functions and all(f.startswith("fb_") for f in functions):
        group = "value"
    else:
        group = "other"
    return {"file": path.name, "title": header_comment(text), "group": group, "functions": functions,
            "shared": "\n".join(st + ";" for st in shared), "cases": cases, "_sequence": sequence}


def tex_code(info, mstring, sep="."):
    """Maxima code that typesets sans and tans (the first two arguments of the call) of the
    answer-feedback cases as the validation shows them: parsed, not simplified, not evaluated.
    The results come as meclib_out("tex:<n>:<k>", "\\(...\\)")."""
    if info.get("group") != "value":
        return []
    code = [sep_code(sep, mstring)]
    for c in info["cases"]:
        for k, src in enumerate(c["args"][:2]):
            code.append('block([simp: false, %%_e: errcatch(parse_string(%s))], if %%_e # [] then '
                        'block([%%_t: errcatch(fb_tmpl_tostring(%%_e[1]))], if %%_t # [] then meclib_out(%s, %%_t[1])))$'
                        % (mstring(src), mstring("tex:%d:%d" % (c["n"], k))))
    return code


def listing(tests_dir):
    """All test files: {groups: [[key, title]], files: [...]} in the order of run_tests.mac."""
    tests_dir = Path(tests_dir)
    runner = tests_dir / "run_tests.mac"
    order = LOAD.findall(runner.read_text(encoding="utf-8")) if runner.exists() else []
    paths = sorted(tests_dir.glob("test_*.mac"), key=lambda p: (order.index(p.name) if p.name in order
                                                               else len(order), p.name))
    files = []
    for p in paths:
        try:
            info = parse_file(p)
        except (OSError, UnicodeDecodeError) as err:
            info = {"file": p.name, "title": "", "group": "other", "functions": [], "cases": [], "error": str(err)}
        info["in_suite"] = p.name in order
        info.pop("_sequence", None)
        files.append(info)
    return {"groups": GROUPS, "files": files}


# ---------------------------------------------------------------------- running a test file
# The checks record instead of printing: fb_check, fb_check_str and fb_check_val are redefined
# (after the harness) to write the actual result of case mtest_n with meclib_out(); a helper of
# the file that calls fb_check is recorded the same way. Each statement of the file runs on its
# own through eval_string() inside errcatch(), so an error stops only its case; the marker
# printed before it assigns Maxima's message (stdout) to that case.
RECORDER = r"""
mtest_n: 0$
mtest_rec(%_k, %_v) := meclib_out(sconcat(%_k, ":", mtest_n), %_v)$
/* compared: without line breaks inside TeX math (tex_nl_norm() of the harness, they depend on the
   Maxima version) and, with a decimal comma, after {,} -> . (the expected texts use the point) */
mtest_norm(%_s) := tex_nl_norm(if stringp(%_s) and stackfltsep = "," then ssubst(".", "{,}", %_s) else %_s)$
fb_check(result, expected_ok, expected_de, expected_en, label) := block([de, en, ok, pass],
  if not listp(result) or length(result) < 2 then (
    mtest_rec("err", sconcat("the result is not [text, flag]: ", string(result))), return(false)),
  de: resolve_lang(result[1], "de"), en: resolve_lang(result[1], "en"), ok: result[2],
  pass: is(ok = expected_ok and mtest_norm(de) = tex_nl_norm(expected_de) and mtest_norm(en) = tex_nl_norm(expected_en)),
  mtest_rec("ok", string(ok)), mtest_rec("de", de), mtest_rec("en", en), mtest_rec("pass", string(pass)),
  pass)$
fb_check_str(result, expected_de, expected_en, label) := block(
  [de: resolve_lang(result, "de"), en: resolve_lang(result, "en"), pass],
  pass: is(mtest_norm(de) = tex_nl_norm(expected_de) and mtest_norm(en) = tex_nl_norm(expected_en)),
  mtest_rec("de", de), mtest_rec("en", en), mtest_rec("pass", string(pass)), pass)$
fb_check_val(actual, expected, label) := block([pass: is(ratsimp(actual - expected) = 0)],
  mtest_rec("value", string(actual)), mtest_rec("expect", string(expected)), mtest_rec("pass", string(pass)), pass)$
"""


def sep_code(sep, mstring):
    """The decimal separator as a STACK question sets it (stackfltsep and the TeX output)."""
    sep = "," if sep == "," else "."
    return 'stackfltsep: %s$ texput_decimal(%s)$' % (mstring(sep), mstring(sep))


def run_code(path, info, mstring, repo, sep="."):
    """Maxima code that loads the meclib files (fresh from the working copy), the scene fixtures
    and the recording checks, then runs the test file statement by statement. For the cases
    of feedback on free-body diagrams the first argument of the call is written as JSON
    ("obj:<n>") if it is a list of objects, the second as text ("names:<n>")."""
    maxima = Path(repo) / "Maxima"
    code = ['load(%s)$' % mstring(str(maxima / f).replace("\\", "/"))
            for f in ("fb_fbd.mac", "fb_value.mac", "fb_spline.mac") if (maxima / f).exists()]
    fixtures = maxima / "tests" / "fixtures" / "scenes.mac"
    if fixtures.exists():
        code.append('load(%s)$' % mstring(str(fixtures).replace("\\", "/")))
    code.append(RECORDER)
    code.append(sep_code(sep, mstring))
    cases = {c["n"]: c for c in info["cases"]}
    for n, stmt, line in info["_sequence"]:
        if n is not None:
            c = cases[n]
            code.append('mtest_n: %d$ print("@@MT %d@@")$' % (n, n))
            if info["group"] == "scene" and c["args"]:
                code.append('block([%%_a: errcatch(%s)], if %%_a # [] and listp(%%_a[1]) and %%_a[1] # [] and every(listp, %%_a[1]) '
                            'then block([%%_j: errcatch(stackjson_stringify(%%_a[1]))], if %%_j # [] then mtest_rec("obj", %%_j[1])))$'
                            % c["args"][0])
                if len(c["args"]) > 1:
                    code.append('block([%%_a: errcatch(%s)], if %%_a # [] and listp(%%_a[1]) then mtest_rec("names", string(%%_a[1])))$'
                                % c["args"][1])
        else:
            code.append('print("@@MTS %d@@")$' % line)
        code.append('if errcatch(eval_string(%s)) = [] then %s$'
                    % (mstring(stmt + "$"), 'mtest_rec("err", "Maxima error")' if n is not None
                       else 'meclib_out("seterr", "%d")' % line))
        # an object list assigned in the set-up (e.g. o_sx, used by a function before the checks):
        # written as JSON ("var:<name>"), for the graphics of the file
        m = re.match(r"([A-Za-z_%][A-Za-z0-9_%]*)\s*:(?!=)", stmt) if n is None else None
        if m and info["group"] == "scene":
            code.append('block([%%_a: errcatch(%s)], if %%_a # [] and listp(%%_a[1]) and %%_a[1] # [] and '
                        'every(lambda([%%_o], listp(%%_o) and %%_o # [] and stringp(first(%%_o))), %%_a[1]) then '
                        'block([%%_j: errcatch(stackjson_stringify(%%_a[1]))], if %%_j # [] then meclib_out(%s, %%_j[1])))$'
                        % (m.group(1), mstring("var:" + m.group(1))))
    return "\n".join(code)


def run_results(info, stdout, results, sep="."):
    """{cases: {n: {pass, ok, de, en, value, expect, obj, names, err, point}}, passed, failed,
    setup_errors, vars, sep, points}. With a decimal comma, a case whose text still has a
    number with a decimal point gets point: true (not separator-aware)."""
    out, msgs, cur = {}, {}, None
    for line in stdout.splitlines():
        m = re.match(r"\s*@@MT (\d+)@@\s*$", line)
        if m:
            cur = int(m.group(1)); continue
        if re.match(r"\s*@@MTS \d+@@\s*$", line):
            cur = None; continue
        if cur is not None and line.strip():
            msgs.setdefault(cur, []).append(line.strip())
    variables = {}
    for key, vals in results.items():
        kind, _, n = key.partition(":")
        if kind == "var":
            variables[n] = vals[-1]
        if kind == "seterr" or not n.isdigit():
            continue
        out.setdefault(int(n), {})[kind] = vals[-1]
    for n, r in out.items():
        if "err" in r and msgs.get(n):
            r["err"] = "\n".join(msgs[n])[-1500:]
    if sep == ",":
        for r in out.values():
            if re.search(r"\d\.\d", (r.get("de") or "") + " " + (r.get("en") or "")):
                r["point"] = True
    passed = sum(1 for r in out.values() if r.get("pass") == "true")
    for c in info["cases"]:
        out.setdefault(c["n"], {"err": "not run (an error before it?)"})
    return {"cases": out, "passed": passed, "failed": len(info["cases"]) - passed,
            "setup_errors": results.get("seterr", []), "vars": variables,
            "sep": "," if sep == "," else ".", "points": sum(1 for r in out.values() if r.get("point"))}
