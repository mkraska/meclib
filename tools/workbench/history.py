"""Undo/redo history of the Questions page: versions of one question, kept next to the question
file in .workbench-history/<file name>.json, so that it survives closing the workbench.

The history belongs to the question edited last: the first change to another question of the file
starts a new history (the old one is discarded). Each entry holds one change of the question block
(the differing middle part before and after, with checksums of both blocks) and a label
("edit: questiontext", "review: ...", "PRT x1: node 2 deleted").
Consecutive changes with the same label within COALESCE seconds (autosave while typing) are merged
into one entry. Undo and redo check that the question is still exactly as the history left it;
otherwise (changed outside the workbench) they refuse.
"""

import hashlib
import json
import time
from pathlib import Path

import qfile

DIR = ".workbench-history"
LIMIT = 50
COALESCE = 60


def _path(path):
    path = Path(path)
    return path.parent / DIR / (path.name + ".json")


def _empty(index=None):
    return {"index": index, "undo": [], "redo": []}


def load(path):
    try:
        h = json.loads(_path(path).read_text(encoding="utf-8"))
        if isinstance(h, dict) and "undo" in h and "redo" in h:
            return h
    except (OSError, ValueError):
        pass
    return _empty()


def _save(path, h):
    p = _path(path)
    p.parent.mkdir(exist_ok=True)
    tmp = p.with_name(p.name + ".tmp")
    tmp.write_text(json.dumps(h, ensure_ascii=False), encoding="utf-8")
    tmp.replace(p)


def _block(text, index):
    a, b, _ = qfile.question_span(text, index)
    return text[a:b]


def _hash(s):
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def _diff(before, after):
    """Compact entry: common prefix/suffix lengths, the differing middles, and checksums of both
    blocks (a question with embedded images is large; a change usually touches a few lines)."""
    n = min(len(before), len(after))
    pre = 0
    while pre < n and before[pre] == after[pre]:
        pre += 1
    suf = 0
    while suf < n - pre and before[-1 - suf] == after[-1 - suf]:
        suf += 1
    return {"pre": pre, "suf": suf, "before": before[pre:len(before) - suf], "after": after[pre:len(after) - suf],
            "hb": _hash(before), "ha": _hash(after)}


def _patch(block, e, direction):
    """block (== the entry's after for undo, before for redo) -> the other version."""
    mid = e["before"] if direction == "undo" else e["after"]
    return block[:e["pre"]] + mid + block[len(block) - e["suf"]:]


def record(path, old_text, new_text, index, label):
    """Records the change of question index from old_text to new_text (whole file texts)."""
    try:
        before, after = _block(old_text, index), _block(new_text, index)
    except (ValueError, IndexError):
        return
    if before == after:
        return
    h = load(path)
    if h.get("index") != index:
        h = _empty(index)              # another question is edited now: start a new history
    now = time.time()
    last = h["undo"][-1] if h["undo"] else None
    if last and last["label"] == label and now - last["time"] < COALESCE and last.get("ha") == _hash(before):
        first = _patch(before, last, "undo")          # the version before the merged changes
        h["undo"][-1] = dict(_diff(first, after), label=label, time=now)
    else:
        h["undo"].append(dict(_diff(before, after), label=label, time=now))
        del h["undo"][:-LIMIT]
    h["redo"] = []
    _save(path, h)


def status(path, index):
    h = load(path)
    if h.get("index") != index:
        return {"undo": None, "redo": None, "undo_count": 0, "redo_count": 0}
    return {"undo": h["undo"][-1]["label"] if h["undo"] else None,
            "redo": h["redo"][-1]["label"] if h["redo"] else None,
            "undo_count": len(h["undo"]), "redo_count": len(h["redo"])}


def step(path, index, expected_rev, direction):
    """Undo ("undo") or redo ("redo") the last change of question index. Returns (new text, label)."""
    text, rev = qfile.read_file(path)
    if expected_rev and rev != expected_rev:
        raise qfile.ConflictError("the file was changed outside the workbench")
    h = load(path)
    src, dst = (h["undo"], h["redo"]) if direction == "undo" else (h["redo"], h["undo"])
    if h.get("index") != index or not src:
        raise ValueError("nothing to %s" % direction)
    entry = src[-1]
    a, b, _ = qfile.question_span(text, index)
    if _hash(text[a:b]) != (entry.get("ha") if direction == "undo" else entry.get("hb")):
        raise ValueError("the question was changed outside the workbench; %s is not possible" % direction)
    new = text[:a] + _patch(text[a:b], entry, direction) + text[b:]
    qfile.write_file(path, new, rev)
    src.pop()
    dst.append(entry)
    _save(path, h)
    return new, entry["label"]
