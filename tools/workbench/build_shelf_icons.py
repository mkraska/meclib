"""Builds the icons of the shelf on the Graphic page (shelf_icons.json, next to this script).

Each default entry of the shelf (SHELF in index.html) is drawn by meclib.js, alone in a small
board without grid lines, and the board is saved as a PNG (2x for sharp icons on high-resolution
screens). The page shows the icons on the shelf buttons; without the file it shows the names.

Needs the workbench server (python server.py) and Playwright (pip install playwright;
python -m playwright install chromium). Run it again after a change of SHELF or of the drawing of
an object:

    python build_shelf_icons.py [--url http://127.0.0.1:8765] [--src local]
"""
import argparse
import base64
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

W, H = 60, 45                      # board size in CSS pixels (4:3); symbols of meclib have a fixed size in pixels
KEEP_NAMES = {"label", "dim", "angle", "angle1", "angle2", "description"}   # objects that are their text
NO_ICON = {"contact"}              # draws nothing on its own (needs a target): the button keeps its name

# runs in the Graphic page: draws one entry and resolves when meclib is done
DRAW = """async ([entry, w, h, src]) => {
  const pts = (entry[0] === "spline" ? [entry[2]] : pointArgs(entry).map((p) => p[1]));
  let x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
  let y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
  if (entry[0] === "spline") { x1 += 1.5; y1 += 0.5; }
  if (entry[0] === "forceGen" || entry[0] === "momentGen") { x0 -= 0.2; x1 += 2.2; y0 -= 0.4; y1 += 0.6; }   // the generator box
  const m = 0.4;                                    // margin in grid units
  x0 -= m; x1 += m; y0 -= m; y1 += m;
  // the window in the icon's aspect ratio, at least 2.4 x 1.8 units
  let ww = Math.max(x1 - x0, 1.4), hh = Math.max(y1 - y0, 1.05);
  if (ww / hh > w / h) hh = ww * h / w; else ww = hh * w / h;
  // vertical shift (share of the height) for symbols drawn beyond their points: the arrows of the
  // generators below the box, the arc and the label of the angles above their points
  const SHIFT = { forceGen: -0.15, momentGen: -0.15, angle: 0.15, angle1: 0.15, angle2: 0.15 };
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + (SHIFT[entry[0]] || 0) * hh;
  const pix = w / ww;
  const init = [["grid", "", "", +(cx - ww / 2).toFixed(4), +(cx + ww / 2).toFixed(4), +(cy - hh / 2).toFixed(4), +(cy + hh / 2).toFixed(4), +pix.toFixed(4)], entry];
  const block = F.BLOCK_PRESETS.noninteractive.replace("[[/jsxgraph]]",
    `board.removeGrids();
document.getElementById(divid).style.border = "none";
for (const o of [...board.objectsList]) if (o.elType === "text" && /Meclib|JXG/.test(String(o.plaintext || o.htmlStr || ""))) board.removeObject(o);
[[/jsxgraph]]`);
  const meclib = await F.loadMeclib(src, true);
  const box = document.getElementById("iconBox");
  const handle = F.run({ container: box, config, jsxKey: Object.keys(config.jsxgraph)[0], mathjaxKey: Object.keys(config.mathjax).find((k) => /local/.test(k)) || $("mathjax").value,
    meclibSource: meclib.text, initText: JSON.stringify(init), blockText: block, decsep: "." });
  const res = await handle.done;
  handle.stop();
  return { errors: res.errors, finished: res.finished };
}"""


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--url", default="http://127.0.0.1:8765", help="workbench server")
    ap.add_argument("--src", default="local", help="meclib.js source as in the page's selector (local, dev, main)")
    a = ap.parse_args()
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_context(viewport={"width": 900, "height": 700}, device_scale_factor=2).new_page()
        pg.goto(a.url + "/index.html")
        pg.wait_for_function("typeof SHELF !== 'undefined' && config !== null && objectArgs !== null", timeout=30000)
        pg.evaluate("""() => { const d = document.createElement("div"); d.id = "iconBox";
            Object.assign(d.style, {position: "fixed", left: "10px", top: "10px", zIndex: 9999, background: "#fff"});
            document.body.appendChild(d); }""")
        shelf = pg.evaluate("SHELF")
        for group, entries in shelf:
            for e in entries:
                if e[0] in NO_ICON:
                    continue
                entry = json.loads(json.dumps(e))
                if entry[0] not in KEEP_NAMES:          # names would only clutter the icon
                    entry = [x if not (isinstance(x, str) and i > 0 and i < 3 and x and x != "--") else ""
                             for i, x in enumerate(entry)] if entry[0] != "line" else entry
                res = pg.evaluate(DRAW, [entry, W, H, a.src])
                pg.wait_for_timeout(300)                  # MathJax of labels
                frame = pg.locator("#iconBox iframe").first
                png = frame.screenshot()
                out[e[0]] = "data:image/png;base64," + base64.b64encode(png).decode()
                print("%-12s %s%s" % (e[0], "ok" if res["finished"] else "not finished",
                                      ("  " + "; ".join(res["errors"])) if res["errors"] else ""))
        b.close()
    path = Path(__file__).with_name("shelf_icons.json")
    path.write_text(json.dumps(out, indent=0), encoding="utf-8")
    print("%d icons -> %s (%d kB)" % (len(out), path, path.stat().st_size // 1024))


if __name__ == "__main__":
    main()
