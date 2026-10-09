// Shared by the workbench pages (Graphic, Questions, Tests): builds and runs a meclib graphic
// in a sandboxed frame the way STACK 4.13 does for a [[jsxgraph]] block, and collects what
// meclib writes into the objects and names inputs.
"use strict";

const MeclibFrame = (() => {

  // Question headers as documented on the wiki page "MecLib Question Setup".
  const BLOCK_PRESETS = {
    interactive:
`[[jsxgraph width='500px' height='400px' input-ref-objects="stateRef" input-ref-names="fbd_names" ]]
var mode  = "STACK";
const initstring = {#init#};
const centeredLabelStyle = {size:0, showInfobox:false, label:{offset:[-6,0],
  anchorX:'left', anchorY:'middle'}};
// End of STACK header
[[include src="https://raw.githubusercontent.com/mkraska/meclib/main/meclib.js" /]]
[[/jsxgraph]]`,
    noninteractive:
`[[jsxgraph width='250px' height='250px' ]]
var mode  = "STACK";  // as opposed to "jsfiddle" which is used in the test environment
var stateRef;         // is empty in the non-interactive case
const initstring = {#init#}; // injection of the list of objects
var decsep = {#stackfltsep#};  // injection of the decimal separator setting
const centeredLabelStyle = {size:0, showInfobox:false, label:{offset:[-6,0],
  anchorX:'left', anchorY:'middle'}};
// End of STACK header
[[include src="https://raw.githubusercontent.com/mkraska/meclib/main/meclib.js" /]]
[[/jsxgraph]]`
  };

  // Accepts a constant Maxima list as well: strips "initdata:" and a trailing ";" or "$".
  function normalizeInit(text) {
    let t = text.trim();
    t = t.replace(/^[A-Za-z_%][A-Za-z0-9_%]*\s*:(?!=)\s*/, "");
    t = t.replace(/[;$]\s*$/, "");
    return t;
  }

  // Returns {data, text} or throws an Error with a readable position hint.
  function parseInit(text) {
    const t = normalizeInit(text);
    try {
      const data = JSON.parse(t);
      if (!Array.isArray(data)) throw new Error("initdata must be a list of objects");
      return { data, text: JSON.stringify(data) };
    } catch (e) {
      let msg = e.message;
      const m = /position (\d+)/.exec(msg);
      if (m) {
        const pos = +m[1], line = t.slice(0, pos).split("\n").length;
        msg += "\n... near line " + line + ": " + t.slice(Math.max(0, pos - 25), pos) + " ⟵ " + t.slice(pos, pos + 15);
      }
      throw new Error("initdata is not valid JSON: " + msg);
    }
  }

  // One meclib object per line - compact but readable, and stable for diffs.
  function formatObjects(list) {
    return "[" + list.map((o) => JSON.stringify(o)).join(",\n ") + "]";
  }

  function parseBlock(text) {
    const open = /\[\[\s*jsxgraph\b([^\]]*)\]\]/.exec(text);
    if (!open) throw new Error("No [[jsxgraph ...]] opening tag found in the STACK block.");
    const attrs = {};
    for (const m of open[1].matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[m[1]] = m[2] ?? m[3];
    const start = open.index + open[0].length;
    const close = text.indexOf("[[/jsxgraph]]", start);
    const body = text.slice(start, close < 0 ? text.length : close);
    const inputs = {};
    for (const [k, v] of Object.entries(attrs)) if (k.startsWith("input-ref-")) inputs[k.slice(10)] = v;
    return { attrs, body, inputs };
  }

  function resolveUrl(u) { return u.startsWith("proxy:") ? "/proxy?url=" + encodeURIComponent(u.slice(6)) : u; }

  // ---------------------------------------------------------------- meclib.js source
  const sourceCache = {};
  // Fetches meclib.js once per source and page load (or again with fresh=true).
  async function loadMeclib(src, fresh) {
    if (!fresh && sourceCache[src]) return sourceCache[src];
    const resp = await fetch("/api/meclib?src=" + encodeURIComponent(src));
    if (!resp.ok) {
      let msg = resp.statusText;
      try { msg = (await resp.json()).error || msg; } catch (e) { /* not JSON */ }
      throw new Error("Could not load meclib.js (" + src + "): " + msg);
    }
    const text = await resp.text();
    const ver = /Meclib\s+(\d{4} \d\d \d\d)/.exec(text);
    const result = { text, info: resp.headers.get("X-Meclib-Source") || "", version: ver ? ver[1] : "?" };
    sourceCache[src] = result;
    return result;
  }

  // ---------------------------------------------------------------- frame document
  // stack_js is replaced by a small local stand-in that creates the same hidden proxy inputs
  // (id = input name, value + data-stack-input-* attributes) and reports changes to the page.
  function frameBridge(token, initialValues, dataset) {
    return `
(function () {
  const TOKEN = ${token};
  const post = (msg) => { msg.token = TOKEN; parent.postMessage(msg, "*"); };
  // Cheap, depth-limited rendering of console arguments: meclib logs whole JSXGraph objects,
  // and serializing those completely (JSON.stringify) made a 30-object scene take 15 s instead
  // of a fraction of a second. Plain data (meclib object lists) is still shown in full.
  const show = (v, depth) => {
    if (v === null || v === undefined) return String(v);
    const t = typeof v;
    if (t === "string") return depth ? JSON.stringify(v) : v;
    if (t === "number" || t === "boolean") return String(v);
    if (t === "function") return "function";
    if (Array.isArray(v)) {
      if (depth > 3) return "[...]";
      const items = v.slice(0, 20).map((x) => show(x, depth + 1));
      return "[" + items.join(",") + (v.length > 20 ? ",... (" + v.length + ")" : "") + "]";
    }
    const name = v.constructor && v.constructor.name;
    if (name && name !== "Object") return "<" + name + ">";
    if (depth > 2) return "{...}";
    const keys = Object.keys(v).slice(0, 8);
    return "{" + keys.map((k) => k + ":" + show(v[k], depth + 1)).join(",") + (Object.keys(v).length > 8 ? ",..." : "") + "}";
  };
  const fmt = (args) => Array.from(args).map((a) => show(a, 0)).join(" ");
  for (const level of ["log", "info", "warn", "error"]) {
    const orig = console[level].bind(console);
    console[level] = function () { post({ type: "console", level, text: fmt(arguments) }); orig.apply(null, arguments); };
  }
  window.addEventListener("error", (e) => post({ type: "console", level: "error",
    text: (e.message || "error") + (e.lineno ? "  (line " + e.lineno + ")" : "") }));
  window.addEventListener("unhandledrejection", (e) => post({ type: "console", level: "error",
    text: "Unhandled promise rejection: " + (e.reason && e.reason.stack ? e.reason.stack : e.reason) }));
  const INITIAL = ${JSON.stringify(initialValues)};
  const DATASET = ${JSON.stringify(dataset)};
  window.__tryout_stack_js = {
    request_access_to_input(name) {
      const input = document.createElement("input");
      input.type = "hidden"; input.id = name; input.value = INITIAL[name] ?? "";
      for (const [k, v] of Object.entries(DATASET)) input.dataset[k] = v;
      document.body.appendChild(input);
      input.addEventListener("change", () => post({ type: "input", name, value: input.value }));
      return Promise.resolve(input.id);
    },
    resize_containing_frame(w, h) { post({ type: "resize", width: w, height: h }); },
    get_content() { return Promise.resolve(null); }
  };
  window.__tryout_done = () => post({ type: "done" });
})();`;
  }

  function buildFrameDoc(opts) {
    const { token, jsx, mathjaxUrl, block, initText, decsep, startState, meclibSource } = opts;
    const unknown = [];
    let body = block.body.replace(/\{#\s*([^#]*?)\s*#\}/g, (m, name) => {
      if (name === "init") return JSON.stringify(initText);
      if (name === "stackfltsep") return JSON.stringify(decsep);
      unknown.push(m); return m;
    });
    if (unknown.length) throw new Error("Placeholders that need question variables (not supported yet): " + unknown.join(", "));
    const include = /\[\[\s*include\s+src\s*=\s*["'][^"']*meclib\.js["']\s*\/\]\]/;
    // "</script" inside the inlined library would end the script element early.
    const safeSource = meclibSource.replace(/<\/script/gi, "<\\/script");
    body = include.test(body) ? body.replace(include, () => safeSource) : body + "\n" + safeSource;
    if (/\[\[\s*include/.test(body)) throw new Error("Only the meclib.js [[include]] can be resolved by the workbench.");

    const inputNames = Object.keys(block.inputs);
    const initial = {};
    const objectsInput = inputNames.find((n) => block.inputs[n] === "stateRef");
    if (objectsInput && startState) initial[objectsInput] = startState;
    const dataset = { stackInputDecimalSeparator: decsep, stackInputListSeparator: decsep === "," ? ";" : "," };
    const promises = inputNames.map((n) => `stack_js.request_access_to_input(${JSON.stringify(n)},true)`).join(",");
    const vars = inputNames.map((n) => block.inputs[n]).join(",");
    const wrapOpen = inputNames.length ? `Promise.all([${promises}]).then(([${vars}]) => {\n` : "";
    const wrapClose = inputNames.length ? "\n});" : "";

    return `<!doctype html><html><head><meta charset="utf-8">
<script>${frameBridge(token, initial, dataset)}<\/script>
<script type="text/x-mathjax-config">MathJax.Hub.Config({messageStyle: "none"});<\/script>
<script src="${mathjaxUrl}"><\/script>
<link rel="stylesheet" href="${jsx.css}">
<script src="${jsx.js}"><\/script>
<style>html{background:#fff}</style>
</head><body style="margin:0px;">
<div style="width:calc(100% - 3px);height:calc(100vh - 3px);"><div class="jxgbox" id="jxgbox" style="width:100%;height:100%;"></div></div>
<script type="module">
const stack_js = window.__tryout_stack_js;
const stack_jxg = {};
${wrapOpen}var divid = "jxgbox";var BOARDID = divid;
${body}
;window.__tryout_done();${wrapClose}
<\/script>
</body></html>`;
  }

  // ---------------------------------------------------------------- running a graphic
  let tokenCounter = 0;
  const handlers = {};   // token -> message handler of a live frame
  window.addEventListener("message", (ev) => {
    const msg = ev.data;
    if (!msg || typeof msg.token !== "number" || !handlers[msg.token]) return;
    handlers[msg.token](msg, ev.source);
  });

  // Renders a graphic into `container` (replacing its content) and returns a handle:
  //   { frame, done: Promise<{objects, names, errors, warnings, finished, seconds}>, stop() }
  // `done` resolves once meclib has finished its initialisation (plus a short settling time
  // for MathJax/resizing), or after `timeout` ms (finished: false) if the script never got
  // there, e.g. because of an error. The frame stays live afterwards; onInput/onConsole keep
  // reporting interactions until stop() is called or the next graphic is rendered.
  // opts: container, config, jsxKey, mathjaxKey, meclibSource, initText, blockText, decsep,
  //       startState, onConsole(level, text), onInput(varName, value, inputName), onResize(w, h),
  //       scale (thumbnail factor, default 1), timeout (ms, default 60000 - a scene with many
  //       line loads can take several seconds to initialise)
  function run(opts) {
    const token = ++tokenCounter;
    const block = parseBlock(opts.blockText || BLOCK_PRESETS.interactive);
    const jsxEntry = opts.config.jsxgraph[opts.jsxKey] || Object.values(opts.config.jsxgraph)[0];
    const mathjax = opts.config.mathjax[opts.mathjaxKey] || Object.values(opts.config.mathjax)[0];
    const doc = buildFrameDoc({
      token, block, initText: opts.initText, decsep: opts.decsep || ".",
      startState: opts.startState || "", meclibSource: opts.meclibSource,
      jsx: { js: resolveUrl(jsxEntry.js), css: resolveUrl(jsxEntry.css) },
      mathjaxUrl: resolveUrl(mathjax),
    });
    const scale = opts.scale || 1;
    const frame = document.createElement("iframe");
    frame.title = "meclib graphic";
    frame.setAttribute("sandbox", "allow-scripts");
    // as STACK for [[jsxgraph]] (stackjsvle.js create_iframe with scrolling = false): the frame
    // does not scroll, but the document's body does not clip - meclib makes the frame 3 px
    // larger than the board, and the board's 1 px border lies outside its wrapper div
    frame.scrolling = "no"; frame.style.overflow = "hidden";
    const wrap = document.createElement("div");
    wrap.style.overflow = "hidden";
    wrap.appendChild(frame);
    const setSize = (w, h) => {
      frame.style.width = w; frame.style.height = h;
      if (scale !== 1) {
        frame.style.transform = "scale(" + scale + ")"; frame.style.transformOrigin = "0 0";
        wrap.style.width = (parseFloat(w) * scale) + "px"; wrap.style.height = (parseFloat(h) * scale) + "px";
      }
    };
    setSize(block.attrs.width || "500px", block.attrs.height || "400px");

    const result = { objects: null, names: null, errors: [], warnings: [], finished: false, seconds: null };
    const started = performance.now();
    if (!Object.values(block.inputs).includes("stateRef")) result.objects = undefined;
    let resolveDone;
    const done = new Promise((r) => { resolveDone = r; });
    let settled = false;
    const finish = (finished) => {
      if (settled) return; settled = true;
      result.finished = finished;
      result.seconds = (performance.now() - started) / 1000;
      resolveDone(result);
    };
    handlers[token] = (msg, source) => {
      if (source !== frame.contentWindow) return;
      if (msg.type === "console") {
        if (msg.level === "error") result.errors.push(msg.text);
        if (msg.level === "warn") result.warnings.push(msg.text);
        if (opts.onConsole) opts.onConsole(msg.level, msg.text);
      } else if (msg.type === "resize") {
        setSize(msg.width, msg.height);
        if (opts.onResize) opts.onResize(msg.width, msg.height);
      } else if (msg.type === "input") {
        const varName = block.inputs[msg.name];
        if (varName === "stateRef") result.objects = msg.value;
        else if (varName === "fbd_names") result.names = msg.value;
        if (opts.onInput) opts.onInput(varName, msg.value, msg.name);
      } else if (msg.type === "done") {
        result.initSeconds = (performance.now() - started) / 1000;
        setTimeout(() => finish(true), 400);
      }
    };
    setTimeout(() => finish(false), opts.timeout || 60000);
    opts.container.innerHTML = "";
    opts.container.appendChild(wrap);
    frame.srcdoc = doc;
    return { frame, done, stop() { delete handlers[token]; } };
  }

  // ---------------------------------------------------------------- comparing results
  // Numbers are compared with a small tolerance (floating-point noise from snapping),
  // everything else exactly. Returns a list of human-readable differences (empty = equal).
  function diffObjects(expected, actual, tol = 1e-9) {
    const diffs = [];
    const same = (a, b) => {
      if (typeof a === "number" && typeof b === "number")
        return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
      if (Array.isArray(a) && Array.isArray(b))
        return a.length === b.length && a.every((x, i) => same(x, b[i]));
      return a === b;
    };
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      if (!same(expected, actual)) diffs.push("objects: expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
      return diffs;
    }
    const n = Math.max(expected.length, actual.length);
    for (let i = 0; i < n; i++) {
      if (!same(expected[i], actual[i]))
        diffs.push("object " + (i + 1) + ": expected " + JSON.stringify(expected[i] ?? null) +
                   "\n          got " + JSON.stringify(actual[i] ?? null));
    }
    return diffs;
  }

  return { BLOCK_PRESETS, normalizeInit, parseInit, formatObjects, parseBlock, resolveUrl,
           loadMeclib, buildFrameDoc, run, diffObjects };
})();
