"""
Local copies of the browser libraries, for using the workbench without internet.

    python fetch_vendor.py           download what is missing
    python fetch_vendor.py --force   download everything again

The workbench loads JSXGraph, MathJax, CodeMirror and the Markdown renderer (marked) from the
jsDelivr CDN, as configured in workbench_config.json (and workbench_config.local.json). This
script downloads each configured package version from the npm registry into
vendor/npm/<package>@<version>/ (not committed); from then on the server hands the pages the
local copy instead of the CDN URL whenever it exists (same entries in the selectors, nothing
to configure). Entries without an exact version (e.g. "CDN latest") stay online only.

It also puts the JSXGraph copies bundled with the STACK versions in config/stack/ into the
server's cache (.cache/), where the "STACK ... bundled" entries are read from.
"""
import argparse
import hashlib
import io
import re
import shutil
import sys
import tarfile
from pathlib import Path

import server

NPM_URL = re.compile(r"^https://cdn\.jsdelivr\.net/npm/((?:@[\w.-]+/)?[\w.-]+)@(\d+\.\d+\.\d+)/([^?#]*)")
VENDOR = server.VENDOR / "npm"


def cdn_urls(cfg):
    """All CDN URLs of the configuration: JSXGraph (js, css), MathJax, marked, CodeMirror."""
    urls = []
    for entry in (cfg.get("jsxgraph") or {}).values():
        urls += [entry.get("js"), entry.get("css")] if isinstance(entry, dict) else [entry]
    urls += list((cfg.get("mathjax") or {}).values())
    urls += [cfg.get("markdown"), cfg.get("codemirror")]
    return [u for u in urls if isinstance(u, str)]


# packages whose configured files need nothing else from the package (only those files are kept)
SELF_CONTAINED = {"jsxgraph", "marked"}


def packages(cfg):
    """{(package, version): set of paths to keep (files, or folders ending in /), None: all}.
    Of a self-contained package only the configured files are kept; otherwise the folder of the
    configured file (e.g. es5/ of MathJax 3, which loads its components from there), and the whole
    package for a file at its top (MathJax 2) or a base URL (CodeMirror)."""
    out, skipped = {}, []
    for url in cdn_urls(cfg):
        m = NPM_URL.match(url)
        if not m:
            if url.startswith("https://cdn.jsdelivr.net/"):
                skipped.append(url)
            continue
        pkg, ver, path = m.groups()
        if pkg in SELF_CONTAINED and path and not path.endswith("/"):
            add = path
        elif "/" in path.rstrip("/") or (path.endswith("/") and path):
            add = path.split("/")[0] + "/"
        else:
            add = None
        keep = out.setdefault((pkg, ver), set())
        if keep is not None:
            out[(pkg, ver)] = None if add is None else keep | {add}
    return out, skipped


def fetch_package(pkg, ver, keep, force):
    target = VENDOR / ("%s@%s" % (pkg, ver))
    if target.exists() and not force:
        print("  %s@%s: present" % (pkg, ver))
        return
    name = pkg.split("/")[-1]
    url = "https://registry.npmjs.org/%s/-/%s-%s.tgz" % (pkg, name, ver)
    print("  %s@%s: downloading %s ..." % (pkg, ver, url), flush=True)
    data = server.fetch(url, timeout=600)
    tmp = target.with_name(target.name + ".part")
    shutil.rmtree(tmp, ignore_errors=True)
    size, plain = 0, {}
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        for m in tar.getmembers():
            if not m.isfile():
                continue
            parts = m.name.split("/")[1:]          # npm packages unpack into package/
            rel = "/".join(parts)
            if keep and any(re.sub(r"\.min(\.\w+)$", r"\1", k) == rel and k != rel for k in keep):
                plain[rel] = tar.extractfile(m).read()
            if not parts or ".." in parts or (keep is not None and not any(
                    rel == k or (k.endswith("/") and rel.startswith(k)) for k in keep)):
                continue
            out = tmp.joinpath(*parts)
            out.parent.mkdir(parents=True, exist_ok=True)
            content = tar.extractfile(m).read()
            out.write_bytes(content)
            size += len(content)
    # files the package does not contain because jsDelivr generates them (minified copies, e.g.
    # jsxgraph.min.css): the unminified file of the package (same effect), otherwise from jsDelivr
    for rel in sorted(k for k in keep or () if not k.endswith("/") and not tmp.joinpath(*k.split("/")).exists()):
        full = re.sub(r"\.min(\.\w+)$", r"\1", rel)
        if full != rel and full in plain:
            content = plain[full]
        else:
            content = server.fetch("https://cdn.jsdelivr.net/npm/%s@%s/%s" % (pkg, ver, rel), timeout=300)
        out = tmp.joinpath(*rel.split("/"))
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(content)
        size += len(content)
    shutil.rmtree(target, ignore_errors=True)
    tmp.rename(target)
    print("  %s@%s: %.1f MB in %s" % (pkg, ver, size / 1e6, target))


def fetch_bundled(force):
    """The JSXGraph files of the "STACK ... bundled" entries into the proxy cache."""
    cfg = server.stack_info({"jsxgraph": {}})
    for key, entry in cfg["jsxgraph"].items():
        for u in (entry["js"], entry["css"]):
            url = u[len("proxy:"):]
            cached = server.CACHE / hashlib.sha1(url.encode("utf-8")).hexdigest()
            if cached.exists() and not force:
                print("  %s (%s): present" % (key, url.rsplit("/", 1)[-1]))
                continue
            server.CACHE.mkdir(exist_ok=True)
            cached.write_bytes(server.fetch(url, timeout=300))
            print("  %s (%s): downloaded" % (key, url.rsplit("/", 1)[-1]))


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n\n")[0])
    ap.add_argument("--force", action="store_true", help="download everything again")
    a = ap.parse_args()
    cfg = server.load_config()
    pkgs, skipped = packages(cfg)
    print("CDN packages -> %s" % VENDOR)
    failed = 0
    for (pkg, ver), keep in sorted(pkgs.items()):
        try:
            fetch_package(pkg, ver, keep, a.force)
        except OSError as err:
            failed += 1
            print("  %s@%s: FAILED: %s" % (pkg, ver, err))
    for url in skipped:
        print("  not copied (no exact version, stays online): " + url)
    print("JSXGraph bundled with STACK -> %s" % server.CACHE)
    try:
        fetch_bundled(a.force)
    except OSError as err:
        failed += 1
        print("  FAILED: %s" % err)
    print("done" if not failed else "%d download(s) failed" % failed)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
