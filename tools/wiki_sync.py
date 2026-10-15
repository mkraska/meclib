"""Publishes the wiki drafts in doc/wiki to the meclib wiki (a separate git repository).

Wiki page names may contain double quotes ('Feedback for "contact"'), which Windows does not
allow in file names, so the drafts are kept under plain names and doc/wiki/sync.json maps
each draft to its page:

    {"Feedback for contact.md": {"page": "Feedback for \\"contact\\"", "base": "3f2a..."}}

"base" is the hash of the wiki page the draft was made from (null for a new page). A draft is
written to the wiki only if the page is still as it was then; if someone edited the page on
GitHub in the meantime, the page is left alone and reported as a conflict, so that the edit
can be merged into the draft first (then "base" is set to the hash of the edited page).
Drafts that equal their page are skipped.

    python tools/wiki_sync.py --wiki <clone of the wiki> [--drafts doc/wiki] [--check] [--push]
    python tools/wiki_sync.py --hash <file>          hash of a file, for "base"

--check reports only. --push commits and pushes the wiki clone (GitHub Action
.github/workflows/wiki-sync.yml). Exit code 1 if there are conflicts.
"""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path


def norm(text):
    """Line ends and trailing newlines do not count (Windows clone, GitHub's editor)."""
    return text.replace("\r\n", "\n").rstrip("\n")


def page_hash(text):
    return hashlib.sha256(norm(text).encode("utf-8")).hexdigest()[:16]


def page_file(page):
    """GitHub wiki file name of a page: blanks become '-'."""
    return page.replace(" ", "-") + ".md"


SYNC_AUTHOR = "meclib wiki sync"     # git user.name of the GitHub Action (wiki-sync.yml)


def last_author(wiki, target):
    """Author of the last wiki commit that changed the page: if it is this script (an earlier
    sync), nobody edited the page on GitHub since, even though "base" still names the page
    before that sync."""
    r = subprocess.run(["git", "-C", str(wiki), "log", "-1", "--format=%an", "--", target.name],
                       capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--wiki", help="clone of the wiki (https://github.com/mkraska/meclib.wiki.git)")
    ap.add_argument("--drafts", default="doc/wiki", help="folder with the drafts and sync.json")
    ap.add_argument("--check", action="store_true", help="only report, write nothing")
    ap.add_argument("--push", action="store_true", help="commit and push the wiki clone")
    ap.add_argument("--hash", help="print the hash of this file and exit")
    a = ap.parse_args()
    if a.hash:
        print(page_hash(Path(a.hash).read_text(encoding="utf-8")))
        return 0
    if not a.wiki:
        ap.error("--wiki is required")
    drafts, wiki = Path(a.drafts), Path(a.wiki)
    sync = json.loads((drafts / "sync.json").read_text(encoding="utf-8"))
    published, same, conflicts, missing = [], [], [], []
    for name, entry in sync.items():
        src = drafts / name
        if not src.exists():
            missing.append(name)
            continue
        draft = src.read_text(encoding="utf-8")
        target = wiki / page_file(entry["page"])
        live = target.read_text(encoding="utf-8") if target.exists() else None
        if live is not None and norm(live) == norm(draft):
            same.append(entry["page"])
        elif (live is None and entry.get("base") is None) or (live is not None and (
                page_hash(live) == entry.get("base") or last_author(wiki, target) == SYNC_AUTHOR)):
            if not a.check:
                target.write_text(norm(draft) + "\n", encoding="utf-8", newline="\n")
            published.append(entry["page"])
        else:
            conflicts.append((entry["page"], name, "page is new on GitHub" if entry.get("base") is None else
                              "page was deleted on GitHub" if live is None else "page was edited on GitHub"))
    unlisted = sorted(p.name for p in drafts.glob("*.md") if p.name not in sync and p.name != "README.md")
    print(("would publish" if a.check else "published") + ": " + (", ".join(published) or "-"))
    print("unchanged: %d page(s)" % len(same))
    for page, name, why in conflicts:
        print("CONFLICT %s (%s): %s - merge the page into the draft, then set its base" % (page, name, why))
    for name in missing:
        print("missing draft: " + name)
    for name in unlisted:
        print("not in sync.json (not published): " + name)
    if a.push and published and not a.check:
        sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
        subprocess.run(["git", "-C", str(wiki), "add", "-A"], check=True)
        subprocess.run(["git", "-C", str(wiki), "commit", "-q", "-m",
                        "Sync from meclib %s: %s" % (sha, ", ".join(published))], check=True)
        subprocess.run(["git", "-C", str(wiki), "push", "-q"], check=True)
    return 1 if conflicts else 0


if __name__ == "__main__":
    sys.exit(main())
