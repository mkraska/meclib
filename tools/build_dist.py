"""Compact copies of the meclib Maxima libraries for stack_include: Maxima/<name>.mac ->
Maxima/dist/<name>.mac without comments, indentation and empty lines. STACK fetches and parses
an included file completely (comments included) whenever it compiles a question, so a smaller
file means a faster import and first preview; the Maxima code itself is unchanged.

The sources in Maxima/ stay the place to edit (with their comments and wiki links);
the dist files are generated and not edited by hand.

    python tools/build_dist.py          write Maxima/dist/*.mac
    python tools/build_dist.py --check  exit code 1 if a dist file is missing or out of date
"""
import argparse
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "Maxima"
DIST = SRC / "dist"
FILES = ["fb_fbd.mac", "fb_value.mac", "fb_spline.mac"]   # the libraries questions include


def compact(code):
    """Maxima code without comments (nested /* */ as Maxima allows), leading/trailing blanks
    and empty lines. Strings ("...", with \\ escapes) are kept exactly, also across lines."""
    out, i, n, depth = [], 0, len(code), 0
    while i < n:
        if depth:
            if code.startswith("/*", i):
                depth += 1; i += 2
            elif code.startswith("*/", i):
                depth -= 1; i += 2
            else:
                if code[i] == "\n":
                    out.append("\n")   # keep the line structure (error positions stay near)
                i += 1
            continue
        c = code[i]
        if c == '"':
            j = i + 1
            while j < n and code[j] != '"':
                j += 2 if code[j] == "\\" else 1
            out.append(code[i:j + 1]); i = j + 1
        elif code.startswith("/*", i):
            depth = 1; i += 2
        else:
            out.append(c); i += 1
    if depth:
        raise ValueError("unterminated comment")
    # blanks at line ends and starts, empty lines - outside strings only
    text, lines, cur, in_str, k = "".join(out), [], [], False, 0
    while k < len(text):
        c = text[k]
        if c == '"':
            j = k + 1
            while j < len(text) and text[j] != '"':
                j += 2 if text[j] == "\\" else 1
            cur.append(text[k:j + 1]); k = j + 1; continue
        if c == "\n":
            line = "".join(cur).strip()
            if line:
                lines.append(line)
            cur = []
        else:
            cur.append(c)
        k += 1
    line = "".join(cur).strip()
    if line:
        lines.append(line)
    return "\n".join(lines) + "\n"


def build(name):
    src = (SRC / name).read_text(encoding="utf-8")
    head = "/* generated from Maxima/%s by tools/build_dist.py - do not edit */\n" % name
    return head + compact(src)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="only check that the dist files are up to date")
    a = ap.parse_args()
    DIST.mkdir(exist_ok=True)
    stale = []
    for name in FILES:
        new, target = build(name), DIST / name
        old = target.read_text(encoding="utf-8") if target.exists() else None
        if old == new:
            continue
        if a.check:
            stale.append(name)
        else:
            target.write_text(new, encoding="utf-8", newline="\n")
            print("%s: %d -> %d bytes" % (name, len((SRC / name).read_bytes()), len(new.encode("utf-8"))))
    if stale:
        print("out of date: " + ", ".join(stale) + " (run python tools/build_dist.py)")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
