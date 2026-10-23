"""
The STACK API (STACK's own PHP code without Moodle) in Docker, for "check in STACK" on the
Questions page: question tests run by STACK itself, with STACK's input validation.

Two images, built once on this machine for the STACK version of config/stack/<version>/ (the one
of the Moodle server) and the Maxima version of the server:

  meclib-stackapi:<version>              STACK's api/ (PHP 8.4, Apache) from the release on GitHub,
                                         built with STACK's own Dockerfile (api/docker/Dockerfile)
  meclib-goemaxima:<version>-<maxima>    the Maxima server STACK's images use (goemaxima), with
                                         STACK's Maxima library of that version and the given
                                         Maxima version (compiled from source: 10-20 minutes)

Usage (in tools/workbench, Docker Desktop running):

    python stackapi.py build [--stack 2026080600] [--maxima 5.45.1]
    python stackapi.py up | down | status

"build" downloads STACK and goemaxima into .cache/stackapi/, builds both images and writes
.cache/stackapi/docker-compose.yml; "up" starts the two containers (the workbench does this on
the first "check in STACK"), "down" stops them. The API listens on http://localhost:3080; a
third container serves the Maxima files of the working copy to it (http://includes/<file>), for
stack_include with the meclib source "local working copy".
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
CACHE = HERE / ".cache" / "stackapi"
COMPOSE = CACHE / "docker-compose.yml"
SETTINGS = CACHE / "settings.json"
STACK_REPO = "https://github.com/maths/moodle-qtype_stack"
GOEMAXIMA_REPO = "https://github.com/mathinstitut/goemaxima"
PORT = 3080
# another STACK API (e.g. a manual installation with PHP): MECLIB_STACKAPI_URL; its includes
# container is then missing, so use the meclib source dev or main
URL = os.environ.get("MECLIB_STACKAPI_URL") or "http://127.0.0.1:%d" % PORT

COMPOSE_TEXT = """# written by stackapi.py build - the STACK API and its Maxima server for the meclib workbench
name: meclib-stackapi
services:
  maxima:
    image: {maxima_image}
    tmpfs:
      - "/tmp"
    restart: "no"
    cap_add:
      - SETGID
      - SETUID
    cap_drop:
      - ALL
    environment:
      GOEMAXIMA_QUEUE_LEN: 32
    read_only: true
  stack:
    image: {stack_image}
    restart: "no"
    depends_on:
      - maxima
    environment:
      MAXIMA_URL: http://maxima:8080/maxima
    volumes:
      - ./php-meclib.ini:/usr/local/etc/php/conf.d/zz-meclib.ini:ro
    ports:
      - "127.0.0.1:{port}:80"
  includes:
    # the Maxima files of the working copy for stack_include (meclib source "local working
    # copy"): http://includes/fb_value.mac
    image: nginx:alpine
    restart: "no"
    volumes:
      - "{maxima_dir}:/usr/share/nginx/html:ro"
"""
INCLUDE_BASE = "http://includes/"

# STACK compiles a question on every API call (no cache): with large includes (fb_fbd.mac) this
# takes longer than PHP's default limit of 30 s
PHP_INI = """max_execution_time = 600
memory_limit = 1G
"""


def run(cmd, cwd=None):
    print("+ " + " ".join(str(c) for c in cmd), flush=True)
    subprocess.run([str(c) for c in cmd], cwd=cwd, check=True)


def docker_ok():
    try:
        return subprocess.run(["docker", "info"], capture_output=True, timeout=30).returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


def profile(version):
    try:
        return json.loads((REPO / "config" / "stack" / version / "profile.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def clone(url, ref, target, skip=()):
    """The files of a GitHub repository at ref (refs/tags/<tag> or refs/heads/<branch>), downloaded as an archive
    (no git needed) and unpacked into target - with LF line ends as in the repository (the shell
    scripts run in Linux containers)."""
    import io
    import tarfile
    repo = url[:-4] if url.endswith(".git") else url
    archive = "%s/archive/%s.tar.gz" % (repo, ref)
    print("+ download " + archive, flush=True)
    req = urllib.request.Request(archive, headers={"User-Agent": "meclib-workbench"})
    data = urllib.request.urlopen(req, timeout=600).read()
    if target.exists():
        shutil.rmtree(target, ignore_errors=True)
    target.mkdir(parents=True)
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        for m in tar.getmembers():
            parts = m.name.split("/", 1)          # drop the top folder (<repo>-<tag>/)
            if len(parts) < 2 or not parts[1] or m.issym() or m.islnk() or parts[1].split("/")[0] in skip:
                continue
            out = target / parts[1]
            if m.isdir():
                out.mkdir(parents=True, exist_ok=True)
            elif m.isfile():
                out.parent.mkdir(parents=True, exist_ok=True)
                out.write_bytes(tar.extractfile(m).read())


def build(version, maxima):
    if not docker_ok():
        sys.exit("Docker is not running - start Docker Desktop first.")
    prof = profile(version)
    tag = prof.get("tag") or ("v" + prof["release"] if prof.get("release") else None)
    if not tag:
        sys.exit("config/stack/%s/profile.json has no release - which STACK tag is it?" % version)
    # 1. STACK's api/ with STACK's own Dockerfile; api/config.php from config_sample.txt (as the
    #    official images), with a longer CAS timeout
    src = CACHE / ("stack-" + version)
    # (without STACK's unit tests and sample questions: not needed, and their long paths may
    # exceed Windows' limit)
    clone(STACK_REPO, "refs/tags/" + tag, src, skip=("tests", "samplequestions"))
    sample = (src / "api" / "config_sample.txt").read_text(encoding="utf-8")
    m = re.search(r'\$CFG->stackmaximaversion\s*=\s*"(\d+)"', sample)
    if m and m.group(1) != version:
        print("note: STACK %s's config_sample.txt names stackmaximaversion %s" % (tag, m.group(1)))
    sample = re.sub(r"\$CFG->castimeout = \d+;", "$CFG->castimeout = 60;", sample)
    (src / "api" / "config.php").write_text(sample, encoding="utf-8", newline="\n")
    stack_image = "meclib-stackapi:%s" % version
    run(["docker", "build", "-f", "api/docker/Dockerfile", "--target", "production", "-t", stack_image, "."], cwd=src)
    # 2. goemaxima with STACK's Maxima library of this version and the server's Maxima version
    gm = CACHE / "goemaxima"
    clone(GOEMAXIMA_REPO, "refs/heads/master", gm)
    if not (gm / "stack" / version / "maxima").is_dir():
        sys.exit("goemaxima has no library for STACK %s (see %s/stack)" % (version, gm))
    versions = {ln.split("\t")[0]: ln.split("\t") for ln in (gm / "versions").read_text().splitlines() if "\t" in ln}
    row = versions.get(version)
    sbcl = row[2] if row and len(row) > 2 else "2.5.2"
    maxima = maxima or (row[1] if row else "5.44.0")
    maxima_image = "meclib-goemaxima:%s-%s" % (version, maxima)
    run(["docker", "build", "-t", maxima_image, "--build-arg", "MAXIMA_VERSION=" + maxima,
         "--build-arg", "SBCL_VERSION=" + sbcl, "--build-arg", "LIB_PATH=stack/%s/maxima" % version, "."], cwd=gm)
    # 3. the compose file and the settings the workbench reads
    COMPOSE.write_text(COMPOSE_TEXT.format(maxima_image=maxima_image, stack_image=stack_image, port=PORT,
                                           maxima_dir=(REPO / "Maxima").as_posix()),
                       encoding="utf-8", newline="\n")
    (CACHE / "php-meclib.ini").write_text(PHP_INI, encoding="utf-8", newline="\n")
    SETTINGS.write_text(json.dumps({"stack": version, "release": prof.get("release"), "maxima": maxima,
                                    "stack_image": stack_image, "maxima_image": maxima_image}, indent=1),
                        encoding="utf-8")
    print("\nBuilt %s and %s. Start with: python stackapi.py up" % (stack_image, maxima_image))


def settings():
    try:
        return json.loads(SETTINGS.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def alive(timeout=3):
    """True if the API answers: any HTTP response of its web server, without following
    redirects (its / answers with a redirect to a host name the workbench cannot reach)."""
    import http.client
    u = urllib.parse.urlsplit(URL)
    try:
        conn = http.client.HTTPConnection(u.hostname, u.port or 80, timeout=timeout)
        conn.request("GET", "/")
        conn.getresponse().read()
        conn.close()
        return True
    except (OSError, ValueError, http.client.HTTPException):
        return False


def status():
    s = settings()
    return {"built": bool(s), "settings": s, "docker": docker_ok() if s else None, "running": alive(), "url": URL}


def up(wait=120, verbose=False):
    """Starts the containers (if needed) and waits until the API answers. Returns status().
    verbose (command line): Docker's output and the waiting are shown."""
    say = (lambda t: print(t, flush=True)) if verbose else (lambda t: None)
    if alive():
        say("The STACK API is already running at " + URL)
        return status()
    if not settings():
        raise RuntimeError("the STACK API images are not built yet - run: python stackapi.py build")
    say("checking Docker ...")
    if not docker_ok():
        raise RuntimeError("Docker is not running - start Docker Desktop")
    say("starting the containers (docker compose up -d) ...")
    r = subprocess.run(["docker", "compose", "-f", str(COMPOSE), "up", "-d"], cwd=CACHE,
                       capture_output=not verbose, text=True, timeout=600)
    if r.returncode:
        raise RuntimeError("docker compose up failed:\n" + ((r.stderr or "") + (r.stdout or ""))[-2000:])
    say("waiting for the STACK API at %s ..." % URL)
    t0 = time.time()
    while time.time() - t0 < wait and not alive():
        time.sleep(1)
    if not alive():
        raise RuntimeError("the STACK API does not answer at %s after %d s - see: docker compose -f \"%s\" logs stack"
                           % (URL, wait, COMPOSE))
    say("running (%.0f s)" % (time.time() - t0))
    return status()


def down():
    if settings():
        subprocess.run(["docker", "compose", "-f", str(COMPOSE), "down"], cwd=CACHE, check=False, timeout=300)


def call(route, body, timeout=900):
    """POST /<route> of the API; returns (seconds, parsed JSON or {"error": ...})."""
    t0 = time.time()
    req = urllib.request.Request(URL + "/" + route, data=json.dumps(body).encode("utf-8"),
                                 headers={"Content-Type": "application/json"})
    try:
        raw = urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8")
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", "replace")
    try:
        out = json.loads(raw)
    except ValueError:
        out = {"error": raw[:2000] or "no answer"}
    return round(time.time() - t0, 2), out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("command", choices=["build", "up", "down", "status"])
    ap.add_argument("--stack", help="STACK version (config/stack/<version>), default: the newest")
    ap.add_argument("--maxima", help="Maxima version of the Maxima server, e.g. 5.45.1 (default: goemaxima's)")
    a = ap.parse_args()
    if a.command == "build":
        version = a.stack or sorted(p.name for p in (REPO / "config" / "stack").iterdir()
                                    if (p / "maxima").is_dir())[-1]
        build(version, a.maxima)
    elif a.command == "up":
        try:
            print(json.dumps(up(verbose=True), indent=1))
        except RuntimeError as err:
            sys.exit(str(err))
    elif a.command == "down":
        down()
    else:
        print(json.dumps(status(), indent=1))


if __name__ == "__main__":
    main()
