// Code editor of the workbench's Questions page: CodeMirror 5 with two modes written for
// STACK questions.
//   "maxima"  - question and feedback variables: comments (nested, as in Maxima), strings,
//               numbers, keywords, constants, assignments "name:" and definitions "f(x):=",
//               function calls, statement ends ; $
//   "castext" - question text and feedback: {@...@} and {#...#} (inside: Maxima), [[blocks]]
//               (the content of [[jsxgraph]] as JavaScript), HTML tags and comments, LaTeX math
//               between \( \) / \[ \] (one to three backslashes, as in HTML and Markdown)
// CodeMirror is loaded from the URL in workbench_config.json ("codemirror"); without it the
// page keeps plain text fields (MeclibEditor.available() is false).
//
// Syntax help (from syntax_help.json, built by build_help.py): a box with the signature of the
// function or meclib object at the cursor (current argument in bold, its description, a link to
// the wiki or the STACK documentation, opened in a small separate window; F1 opens it directly),
// autocomplete of names (while typing or Ctrl+Space), castext snippets (\ -> math delimiters,
// { -> {@ @}, [[ -> blocks, inputs and PRTs) and closing brackets that are added only where
// they rarely disturb (before a space, the end of the line or a closing bracket; Ctrl+Z right
// after removes just the added one; a closing bracket is skipped only if it was added).
// In Maxima fields, ":" at the end of a statement (top level, nothing after it on the line) gets
// a ";" after the cursor in the same way; ";" typed there skips it, "$" replaces it. "/*" gets "*/".
(function () {
  "use strict";

  const SCRIPTS = ["lib/codemirror.js", "addon/edit/matchbrackets.js", "addon/search/searchcursor.js",
    "addon/dialog/dialog.js", "addon/search/search.js", "addon/search/jump-to-line.js", "mode/javascript/javascript.js",
    "addon/hint/show-hint.js"];
  const STYLES = ["lib/codemirror.css", "addon/dialog/dialog.css", "addon/hint/show-hint.css"];
  let ready = false;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script"); s.src = src; s.onload = resolve;
      s.onerror = () => reject(new Error("could not load " + src));
      document.head.appendChild(s);
    });
  }

  async function load(base) {
    if (!base) return false;
    if (!base.endsWith("/")) base += "/";
    for (const css of STYLES) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = base + css; document.head.appendChild(l);
    }
    await loadScript(base + SCRIPTS[0]);              // the addons need CodeMirror itself first
    for (const js of SCRIPTS.slice(1)) await loadScript(base + js);
    defineModes(window.CodeMirror);
    ready = true;
    return true;
  }

  // ------------------------------------------------------------------ Maxima
  const KEYWORDS = new Set(["if", "then", "else", "elseif", "for", "in", "from", "step", "thru", "while", "unless",
    "do", "and", "or", "not", "block", "lambda", "return", "go", "local", "catch", "throw", "errcatch", "error"]);
  const ATOMS = new Set(["true", "false", "inf", "minf", "und", "ind", "infinity", "zeroa", "zerob"]);

  function maximaMode() {
    return {
      startState: () => ({ comment: 0, string: false }),
      copyState: (s) => ({ comment: s.comment, string: s.string }),
      token(stream, state) {
        if (state.comment > 0) {
          while (!stream.eol()) {
            if (stream.match("/*")) state.comment++;
            else if (stream.match("*/")) { state.comment--; if (state.comment === 0) break; }
            else stream.next();
          }
          return "comment";
        }
        if (state.string) {
          let ch;
          while ((ch = stream.next()) != null) {
            if (ch === "\\") stream.next();
            else if (ch === '"') { state.string = false; break; }
          }
          return "string";
        }
        if (stream.eatSpace()) return null;
        if (stream.match("/*")) { state.comment = 1; return this.token(stream, state) || "comment"; }
        if (stream.peek() === '"') { stream.next(); state.string = true; return this.token(stream, state) || "string"; }
        if (stream.match(/^(\d+\.?\d*|\.\d+)([eEbBdD][+-]?\d+)?/)) return "number";
        if (stream.match(/^::?=/)) return "operator def-op";
        if (stream.match(/^[;$]/)) return "meta";
        const id = stream.match(/^[A-Za-z_%?][A-Za-z0-9_%]*/);
        if (id) {
          const w = id[0];
          if (KEYWORDS.has(w)) return "keyword";
          if (ATOMS.has(w) || /^%(pi|e|i|phi|gamma)$/.test(w)) return "atom";
          if (/^\s*:(?![:=])/.test(stream.string.slice(stream.pos)) && /^\s*$/.test(stream.string.slice(0, stream.start).replace(/.*[;$,(\[]/, ""))) return "def";
          if (/^\s*\(/.test(stream.string.slice(stream.pos))) {
            // f(x) := ... marks a definition, otherwise a call
            return /^\s*\([^;$]*?\)\s*:=/.test(stream.string.slice(stream.pos)) ? "def" : "variable-2";
          }
          return "variable";
        }
        if (stream.match(/^[:'!#@^*\/+\-<>=~.|]+/)) return "operator";
        stream.next();
        return null;
      },
      lineComment: null, blockCommentStart: "/*", blockCommentEnd: "*/",
    };
  }

  // ------------------------------------------------------------------ castext
  function castextMode(CM) {
    const maxima = CM.getMode({}, "maxima");
    const js = CM.getMode({ indentUnit: 2 }, "javascript");
    return {
      startState: () => ({ cas: null, casEnd: null, casState: null, js: false, jsState: null,
        htmlComment: false, math: false }),
      copyState: (s) => ({ cas: s.cas, casEnd: s.casEnd, casState: s.casState && CM.copyState(maxima, s.casState),
        js: s.js, jsState: s.jsState && CM.copyState(js, s.jsState), htmlComment: s.htmlComment, math: s.math }),
      token(stream, state) {
        // {@ ... @} and {# ... #}: Maxima inside
        if (state.cas) {
          if (stream.match(state.casEnd)) { state.cas = null; return "castext-delim"; }
          const end = stream.string.indexOf(state.casEnd, stream.pos);
          const style = maxima.token(stream, state.casState);
          if (end >= 0 && stream.pos > end) stream.backUp(stream.pos - end);   // never run past the closing delimiter
          return (style || "") + " castext-cas";
        }
        if (stream.match(/^\{[@#]/)) {
          state.cas = stream.current(); state.casEnd = state.cas === "{@" ? "@}" : "#}";
          state.casState = CM.startState(maxima);
          return "castext-delim";
        }
        // [[jsxgraph]] content as JavaScript
        if (state.js) {
          if (stream.match(/^\[\[\s*\/jsxgraph\s*\]\]/)) { state.js = false; return "castext-block"; }
          if (stream.match(/^\[\[\s*include\b[^\]]*\]\]/)) return "castext-block";
          const end = stream.string.indexOf("[[", stream.pos);
          const style = js.token(stream, state.jsState);
          if (end >= 0 && stream.pos > end) stream.backUp(stream.pos - end);
          return style;
        }
        if (state.htmlComment) {
          if (stream.skipTo("-->")) { stream.match("-->"); state.htmlComment = false; } else stream.skipToEnd();
          return "comment";
        }
        const block = stream.match(/^\[\[\s*(\/?)([A-Za-z_]+)(:[A-Za-z0-9_]+)?([^\]]|\](?!\]))*\]\]/);
        if (block) {
          if (block[2] === "jsxgraph" && !block[1]) { state.js = true; state.jsState = CM.startState(js); }
          return /^(input|validation|feedback)$/.test(block[2]) ? "castext-slot" : "castext-block";
        }
        if (stream.match("<!--")) { state.htmlComment = true; return "comment"; }
        if (stream.match(/^<\/?[A-Za-z][^>]*>/)) return "tag";
        // LaTeX math delimiters (\( in HTML, \\( or \\\( in Markdown)
        const delim = stream.match(/^\\{1,3}([()[\]])/);
        if (delim) { state.math = delim[1] === "(" || delim[1] === "["; return "castext-math-delim"; }
        if (stream.match(/^\\{1,2}(begin|end)\\?\{[a-z*]+\\?\}/)) {
          state.math = stream.current().includes("begin"); return "castext-math-delim";
        }
        if (state.math) {
          if (stream.match(/^\\[A-Za-z]+/)) return "castext-math castext-latex";
          stream.next();
          while (!stream.eol() && !/[\\{[<]/.test(stream.peek())) stream.next();
          return "castext-math";
        }
        stream.next();
        while (!stream.eol() && !/[\\{[<]/.test(stream.peek())) stream.next();
        return null;
      },
      blockCommentStart: "<!--", blockCommentEnd: "-->",
    };
  }

  function defineModes(CM) {
    CM.defineMode("maxima", maximaMode);
    CM.defineMode("castext", () => castextMode(CM));
  }

  // ------------------------------------------------------------------ syntax help
  const settings = { autocomplete: true, closeBrackets: true, semicolon: true, helpBox: true };
  let help = { functions: new Map(), objects: new Map(), variables: new Map(), list: [] };

  function setHelp(data) {
    help = { functions: new Map(), objects: new Map(), variables: new Map(), list: [] };
    for (const e of (data && data.entries) || []) {
      if (e.kind === "object") help.objects.set(e.name, e);
      else if (e.kind === "variable") help.variables.set(e.name, e);   // set by an assignment, e.g. fb_dims: [...]
      else if (!help.functions.has(e.name)) help.functions.set(e.name, e);
      help.list.push(e);
    }
  }
  function configure(s) { Object.assign(settings, s || {}); if (!settings.helpBox) hideBox(); }
  // F2 in an editor: help box off / on; the page hears of it (to update and store its setting)
  function toggleHelpBox(cm) {
    settings.helpBox = !settings.helpBox;
    if (settings.helpBox) updateBox(cm); else hideBox();
    document.dispatchEvent(new CustomEvent("meclib-editor-settings", { detail: Object.assign({}, settings) }));
  }

  // the offline Maxima tests by function (GET /api/mtests, once): name -> [{file, n}], for the
  // "tests" link of the help box, which opens the Tests page at the first case of the function
  let testsByFunction = null;
  function loadTests() {
    if (testsByFunction) return;
    testsByFunction = new Map();
    fetch("/api/mtests").then((r) => r.json()).then((d) => {
      for (const f of d.files || [])
        for (const c of f.cases || [])
          if (c.function) {
            if (!testsByFunction.has(c.function)) testsByFunction.set(c.function, []);
            testsByFunction.get(c.function).push({ file: f.file, n: c.n });
          }
    }).catch(() => {});
  }
  function openTests(name) {
    const t = (testsByFunction && testsByFunction.get(name)) || [];
    if (!t.length) return;
    const win = window.open("tests.html#mtest=" + encodeURIComponent(t[0].file) + "&case=" + t[0].n, "meclib-tests");
    if (win) win.focus();
  }
  function openHelp(url) {
    if (!url) return;
    const w = 720, h = Math.min(860, screen.availHeight - 80);
    const win = window.open(url, "meclib-help",
      `popup,width=${w},height=${h},left=${Math.max(0, screen.availWidth - w - 20)},top=40`);
    if (win) win.focus();
  }

  // The innermost call "name(" or meclib object list "["type"," around the cursor whose name is
  // known, and the index of the argument the cursor is in. Strings and comments are skipped
  // (strings from the start of the text, so that the parity is right).
  function contextAt(cm) {
    const cur = cm.getCursor();
    const from = cm.indexFromPos(cur);
    // from the start of the text (a window starting inside a string or comment would turn the
    // string parity around); questions are short enough
    const start = Math.max(0, from - 30000);
    const text = cm.getRange(cm.posFromIndex(start), cur);
    // blank out comments and the contents of strings (scanning forward, so that a string the
    // cursor is in counts as one)
    let masked = "", inStr = false, inCom = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inCom) { masked += " "; if (ch === "/" && text[i - 1] === "*") inCom = false; continue; }
      if (inStr) { masked += ch === '"' && text[i - 1] !== "\\" ? (inStr = false, '"') : "x"; continue; }
      if (ch === "/" && text[i + 1] === "*") { inCom = true; masked += " "; continue; }
      if (ch === '"') inStr = true;
      masked += ch;
    }
    let depth = 0, commas = 0, stmtStart = 0;
    const stack = [];
    // walk backwards
    for (let i = masked.length - 1; i >= 0; i--) {
      const ch = masked[i];
      if (ch === ")" || ch === "]" || ch === "}") { depth++; continue; }
      if (ch === "(" || ch === "[" || ch === "{") {
        if (depth > 0) { depth--; continue; }
        // an unclosed opening bracket: is it a known call or object list?
        if (ch === "(") {
          const m = /([A-Za-z_%][A-Za-z0-9_%]*)\s*$/.exec(masked.slice(0, i));
          const e = m && help.functions.get(m[1]);
          if (e) return { entry: e, arg: commas, kind: "function", pos: cm.posFromIndex(start + i) };
          // inside a call of a function without help (e.g. atan(...) in an argument): no box
          // rather than the help of the enclosing call; "then (", "do (" are groupings
          if (m && !/^(then|else|elseif|do|and|or|not|if|while|unless|thru|step|in|for|from|next)$/.test(m[1])) return null;
        } else if (ch === "[") {
          const m = /^\[\s*"([A-Za-z0-9]+)"/.exec(text.slice(i));
          const e = m && help.objects.get(m[1]);
          if (e) return { entry: e, arg: commas - 1, kind: "object", pos: cm.posFromIndex(start + i) };
        }
        commas = 0;     // continue outwards (e.g. inside a coordinate pair of an object)
        stack.push(i);
        continue;
      }
      if (ch === "," && depth === 0) commas++;
      if ((ch === ";" || ch === "$") && depth === 0) { stmtStart = i + 1; break; }
    }
    // a statement assigning a variable with help (e.g. fb_dims: [...]): its box anywhere in it
    const mv = /^\s*([A-Za-z_%][A-Za-z0-9_%]*)\s*:(?!=)/.exec(masked.slice(stmtStart));
    const ev = mv && help.variables.get(mv[1]);
    if (ev) return { entry: ev, arg: -1, kind: "variable", pos: cur };
    return null;
  }
  // The commas counted for the level that was found: recount from the bracket to the cursor.
  function argIndex(cm, ctx) {
    if (ctx.kind === "variable") return -1;
    const text = cm.getRange(ctx.pos, cm.getCursor()).slice(1);
    let depth = 0, n = 0, inStr = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"' && text[i - 1] !== "\\") inStr = !inStr;
      if (inStr) continue;
      if ("([{".includes(ch)) depth++;
      else if (")]}".includes(ch)) depth--;
      else if (ch === "," && depth === 0) n++;
    }
    return ctx.kind === "object" ? n - 1 : n;
  }

  let box = null, boxHover = false, boxCtx = null, boxCm = null;   // boxCm: the editor the box is for
  // boxPin: page position the user dragged the box to; it stays there (with changing content)
  // until a double click on it lets it follow the cursor again
  let boxPin = null;
  function hideBox() { if (box) box.style.display = "none"; boxCtx = null; boxCm = null; }
  function escHTML(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }
  function codeSpans(s) { return escHTML(s).replace(/`([^`]+)`/g, "<code>$1</code>"); }
  function sigHTML(e, arg) {
    const args = e.args || [];
    const parts = args.map((a, i) => {
      let h = escHTML(a);
      if ((e.optional || []).includes(i)) h = `<span class="hb-opt">${h}?</span>`;
      return i === arg ? `<b>${h}</b>` : h;
    });
    if (e.kind === "object") return `[ "${escHTML(e.name)}", ${parts.join(", ")} ]`;
    if (e.kind === "variable") return escHTML(e.sig);
    return `${escHTML(e.name)}(${parts.join(", ")})`;
  }
  function boxHTML(e, arg) {
    const a = (e.args || [])[arg];
    const ad = a != null && e.argdocs ? e.argdocs[a] : null;
    const src = e.kind === "meclib" || e.kind === "object" || e.kind === "variable" ? "meclib wiki" : e.kind === "stack" ? "STACK docs" : "Maxima manual";
    return `<div class="hb-sig">${e.returns ? `<span class="hb-ret">${escHTML(e.returns)}:</span> ` : ""}${sigHTML(e, arg)}</div>` +
      (ad ? `<div class="hb-arg"><b>${escHTML(a)}</b>: ${codeSpans(ad)}</div>` : "") +
      (e.text ? `<div class="hb-text">${codeSpans(e.text)}</div>` : "") +
      `<div class="hb-foot">${e.url ? `<a href="#" data-url="${escHTML(e.url)}">${src} ↗</a> <span>F1</span>` : ""}` +
      (testsByFunction && testsByFunction.has(e.name) ? `<a href="#" data-tests="${escHTML(e.name)}" title="the offline Maxima tests of ${escHTML(e.name)}: examples of what it returns (Tests page)">` +
        `tests (${testsByFunction.get(e.name).length}) ↗</a>` : "") +
      `<span class="hb-keys" title="drag the box to move it out of the way; double click: it follows the cursor again; F2 in the editor: box off / on">` +
      `${boxPin ? "double click: follow cursor" : "drag: move"} · F2: off</span><span class="hb-src">${escHTML(e.source || "")}</span></div>`;
  }
  function updateBox(cm) {
    loadTests();
    if (!settings.helpBox || cm.state.completionActive) { hideBox(); return; }
    const ctx = contextAt(cm);
    if (!ctx) { hideBox(); return; }
    const arg = argIndex(cm, ctx);
    if (!box) {
      box = document.createElement("div"); box.className = "meclib-helpbox";
      box.addEventListener("mouseenter", () => { boxHover = true; });
      box.addEventListener("mouseleave", () => { boxHover = false; });
      box.addEventListener("mousedown", (ev) => {
        ev.preventDefault();                   // the editor keeps the focus
        const a = ev.target.closest("a[data-url]");
        if (a) { openHelp(a.dataset.url); return; }
        const tl = ev.target.closest("a[data-tests]");
        if (tl) { openTests(tl.dataset.tests); return; }
        // drag the box out of the way
        const x0 = ev.pageX, y0 = ev.pageY, l0 = box.offsetLeft, t0 = box.offsetTop;
        const move = (e) => { box.style.left = (l0 + e.pageX - x0) + "px"; box.style.top = (t0 + e.pageY - y0) + "px"; };
        const up = (e) => {
          document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up);
          if (Math.abs(e.pageX - x0) + Math.abs(e.pageY - y0) > 3) {
            boxPin = { left: box.offsetLeft, top: box.offsetTop };
            if (boxCm) updateBox(boxCm);
          }
        };
        document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
      });
      box.addEventListener("dblclick", () => { boxPin = null; if (boxCm) updateBox(boxCm); });
      document.body.appendChild(box);
    }
    box.innerHTML = boxHTML(ctx.entry, arg);
    boxCtx = ctx;
    boxCm = cm;
    box.style.display = "block";
    if (boxPin) { box.style.left = boxPin.left + "px"; box.style.top = boxPin.top + "px"; return; }
    const c = cm.cursorCoords(null, "page");
    const h = box.offsetHeight;
    let top = c.top - h - 6;
    if (top < window.scrollY + 4) top = c.bottom + 6;   // no room above: below the line
    box.style.top = top + "px";
    box.style.left = Math.max(4, Math.min(c.left - 20, window.scrollX + document.documentElement.clientWidth - box.offsetWidth - 8)) + "px";
  }
  function openHelpAtCursor(cm) {
    const ctx = contextAt(cm);
    if (ctx) return openHelp(ctx.entry.url);
    const w = cm.findWordAt(cm.getCursor());
    const name = cm.getRange(w.anchor, w.head);
    const e = help.functions.get(name) || help.objects.get(name) || help.variables.get(name);
    if (e) openHelp(e.url);
  }

  // ---------------------------------------------------------------- autocomplete
  function inCas(cm) {          // castext: inside {@ @} or {# #}?
    const tok = cm.getTokenAt(cm.getCursor());
    return /castext-cas/.test(tok.type || "");
  }
  function inJsx(cm) { const st = cm.getStateAfter ? cm.getTokenAt(cm.getCursor()).state : null; return !!(st && st.js); }
  // Markdown: is the cursor in a block of HTML (a paragraph that starts with a tag)? There
  // MathJax delimiters are written as in HTML.
  function inHtmlBlock(cm) {
    let l = cm.getCursor().line;
    while (l > 0 && cm.getLine(l - 1).trim() !== "") l--;
    return /^\s*<[A-Za-z]/.test(cm.getLine(l));
  }
  function mathSnippets(cm, opts) {
    const fmt = opts.context ? (opts.context().format || "html") : "html";
    const b = fmt === "markdown" && !inHtmlBlock(cm) ? "\\\\\\" : "\\";
    return [
      { text: b + "(", tail: b + ")", display: b + "( ... " + b + ")  inline math" },
      { text: b + "[", tail: b + "]", display: b + "[ ... " + b + "]  displayed math" },
    ];
  }
  // list of snippets {text, tail, display}: text is inserted before the cursor, tail after it
  function snippetHint(cm, from, list) {
    return {
      from, to: cm.getCursor(),
      list: list.map((s) => ({
        text: s.text + (s.tail || ""), displayText: s.display,
        hint: (c, data, comp) => {
          c.replaceRange(s.text + (s.tail || ""), data.from, data.to, "complete");
          const p = c.indexFromPos(data.from) + s.text.length;
          c.setCursor(c.posFromIndex(p));
        },
      })),
    };
  }
  function nameHint(cm, kind) {
    const cur = cm.getCursor(), line = cm.getLine(cur.line);
    let s = cur.ch;
    while (s > 0 && /[A-Za-z0-9_%]/.test(line[s - 1])) s--;
    const word = line.slice(s, cur.ch);
    const before = line.slice(0, s);
    // object type inside ["...
    if (/\[\s*"$/.test(before)) {
      const list = [...help.objects.values()].filter((e) => e.name.startsWith(word)).map((e) => ({
        text: e.name + '", ', displayText: e.name, entry: e,
        render: (el) => { el.innerHTML = `<span class="hn">${escHTML(e.name)}</span> <span class="hs">${escHTML(e.sig)}</span>`; },
        hint: (c, data) => {
          const after = c.getRange(data.to, { line: data.to.line, ch: data.to.ch + 1 });
          c.replaceRange(e.name, data.from, data.to, "complete");
          const p = { line: data.from.line, ch: data.from.ch + e.name.length };
          if (after === '"') {            // the closing quote is there already: step over it
            const m = addedAt(c, p); if (m) m.clear();
            c.setCursor({ line: p.line, ch: p.ch + 1 });
            c.replaceSelection(", ", "end", "complete");
          } else c.replaceRange('", ', p, p, "complete");
          updateBox(c);
        },
      }));
      return list.length ? { from: { line: cur.line, ch: s }, to: cur, list } : null;
    }
    if (word.length < 1) return null;
    const rank = { meclib: 0, variable: 0, object: 3, stack: 1, extra: 1, maxima: 2 };
    const list = help.list.filter((e) => e.kind !== "object" && e.name.startsWith(word) && e.name !== word)
      .sort((a, b) => (rank[a.kind] - rank[b.kind]) || a.name.localeCompare(b.name)).slice(0, 60)
      .map((e) => ({
        text: e.name + "(", displayText: e.name, entry: e,
        render: (el) => { el.innerHTML = `<span class="hn">${escHTML(e.name)}</span> <span class="hs">${escHTML(e.sig.slice(e.name.length))}</span> <span class="hk">${e.kind}</span>`; },
        hint: (c, data) => {
          if (e.kind === "variable") {     // an assignment: name: [ ... ]
            c.replaceRange(e.name + ": [", data.from, data.to, "complete");
            autoClose(c, "]");
            return;
          }
          c.replaceRange(e.name + "(", data.from, data.to, "complete");
          autoClose(c, ")");
        },
      }));
    return list.length ? { from: { line: cur.line, ch: s }, to: cur, list } : null;
  }
  function complete(cm, kind, opts, explicit) {
    hideBox();
    cm.showHint({
      hint: (c) => {
        const cur = c.getCursor(), line = c.getLine(cur.line);
        if (kind === "castext" && !inCas(c) && !inJsx(c)) {
          if (line[cur.ch - 1] === "\\") return snippetHint(c, { line: cur.line, ch: cur.ch - 1 - (/\\\\\\$/.test(line.slice(0, cur.ch)) ? 2 : 0) }, mathSnippets(c, opts));
          if (line[cur.ch - 1] === "{") return snippetHint(c, { line: cur.line, ch: cur.ch - 1 },
            [{ text: "{@", tail: "@}", display: "{@ ... @}  value of a CAS expression" }, { text: "{#", tail: "#}", display: "{# ... #}  raw value (e.g. for JavaScript)" }]);
          if (line.slice(cur.ch - 2, cur.ch) === "[[") return snippetHint(c, { line: cur.line, ch: cur.ch - 2 }, blockSnippets(opts));
          if (!explicit) return null;
        }
        return nameHint(c, kind);
      },
      completeSingle: false, closeCharacters: /[\s()\[\]{};:>,]/,
    });
  }
  function blockSnippets(opts) {
    const ctx = opts.context ? opts.context() : {};
    const out = [];
    for (const n of ctx.inputs || []) {
      out.push({ text: `[[input:${n}]] [[validation:${n}]]`, display: `[[input:${n}]] [[validation:${n}]]` });
    }
    for (const n of ctx.prts || []) out.push({ text: `[[feedback:${n}]]`, display: `[[feedback:${n}]]` });
    out.push(
      { text: '[[lang code="de"]]', tail: "[[/lang]]", display: '[[lang code="de"]] ... [[/lang]]' },
      { text: '[[lang code="en,other"]]', tail: "[[/lang]]", display: '[[lang code="en,other"]] ... [[/lang]]' },
      { text: '[[if test="', tail: '"]]\n[[/if]]', display: '[[if test="..."]] ... [[/if]]' },
      { text: "[[comment]]", tail: "[[/comment]]", display: "[[comment]] ... [[/comment]]" },
      { text: '[[jsxgraph width="400px" height="300px"]]\n', tail: "\n[[/jsxgraph]]", display: "[[jsxgraph]] ... [[/jsxgraph]]" },
    );
    return out;
  }
  function onInputRead(cm, change, kind, opts) {
    if (change.origin !== "+input" || cm.state.completionActive) return;
    const ch = change.text.join("");
    if (kind === "castext" && !inCas(cm) && !inJsx(cm)) {
      const cur = cm.getCursor(), line = cm.getLine(cur.line);
      if (ch === "\\" || ch === "{" || (ch === "[" && line[cur.ch - 2] === "[")) { complete(cm, kind, opts, false); return; }
      return;     // no name completion in plain text
    }
    if (!settings.autocomplete) return;
    const tt = cm.getTokenAt(cm.getCursor()).type || "";
    if (/string|comment/.test(tt) && !/\[\s*"[A-Za-z]*$/.test(cm.getLine(cm.getCursor().line).slice(0, cm.getCursor().ch))) return;
    if (/^[A-Za-z0-9_%]$/.test(ch)) {
      const cur = cm.getCursor(), line = cm.getLine(cur.line);
      let s = cur.ch;
      while (s > 0 && /[A-Za-z0-9_%]/.test(line[s - 1])) s--;
      if (cur.ch - s >= 2 || /\[\s*"[A-Za-z]*$/.test(line.slice(0, cur.ch))) complete(cm, kind, opts, false);
    }
  }

  // ---------------------------------------------------------------- brackets
  const PAIRS = { "(": ")", "[": "]", "{": "}", '"': '"' };
  function autoClose(cm, close) {
    // adds the closing character after the cursor as its own undo step (a separate operation,
    // so Ctrl+Z removes just this character), marked as added
    queueMicrotask(() => cm.operation(() => addClosing(cm, close)));
  }
  function addClosing(cm, close) {
    const cur = cm.getCursor();
    const next = cm.getRange(cur, { line: cur.line, ch: cur.ch + 1 });
    if (!(next === "" || /[\s)\]};,]/.test(next))) return;
    cm.replaceRange(close, cur, cur, "*autoclose");
    const m = cm.markText(cur, { line: cur.line, ch: cur.ch + close.length }, { className: "cm-autoclosed", inclusiveLeft: false, inclusiveRight: false });
    (cm.state.autoClosed = cm.state.autoClosed || []).push(m);
    cm.setCursor(cur);
  }
  // Maxima: is the cursor at the top level of a statement (outside strings, comments and
  // brackets, counted from the last ; or $)?
  function statementTopLevel(cm) {
    const text = cm.getRange({ line: 0, ch: 0 }, cm.getCursor());
    let inStr = false, com = 0, depth = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (com) {                       // Maxima comments nest
        if (ch === "*" && text[i + 1] === "/") { com--; i++; }
        else if (ch === "/" && text[i + 1] === "*") { com++; i++; }
        continue;
      }
      if (inStr) { if (ch === "\\") i++; else if (ch === '"') inStr = false; continue; }
      if (ch === "/" && text[i + 1] === "*") { com++; i++; continue; }
      if (ch === '"') inStr = true;
      else if ("([{".includes(ch)) depth++;
      else if (")]}".includes(ch)) depth = Math.max(0, depth - 1);
      else if (ch === ";" || ch === "$") depth = 0;     // a new statement (also after unbalanced text)
    }
    return !inStr && !com && depth === 0;
  }
  function addedAt(cm, pos) {
    for (const m of cm.state.autoClosed || []) {
      const r = m.find();
      if (r && r.from.line === pos.line && r.from.ch === pos.ch) return m;
    }
    return null;
  }
  // In castext, brackets are closed only inside {@ @}/{# #} and [[jsxgraph]] (not in prose).
  function codeHere(cm) { return cm.meclibKind !== "castext" || inCas(cm) || inJsx(cm); }
  function bracketKeys(kind, opts) {
    const keys = {};
    for (const [open, close] of Object.entries(PAIRS)) {
      if (open !== '"') keys[`'${open}'`] = (cm) => {
        if (!settings.closeBrackets) return window.CodeMirror.Pass;
        const code = codeHere(cm);
        if (cm.somethingSelected()) {
          if (!code) return window.CodeMirror.Pass;
          cm.replaceSelection(open + cm.getSelection() + close, "around"); return;
        }
        cm.replaceSelection(open, "end", "+input");
        if (code) autoClose(cm, close);
        else {           // castext prose: the snippets for { and [[
          const cur = cm.getCursor(), line = cm.getLine(cur.line);
          if (open === "{" || (open === "[" && line[cur.ch - 2] === "[")) complete(cm, kind, opts, false);
        }
      };
      keys[`'${close}'`] = (cm) => {
        if (!settings.closeBrackets || cm.somethingSelected()) return window.CodeMirror.Pass;
        const cur = cm.getCursor(), m = addedAt(cm, cur);
        if (m && cm.getRange(cur, { line: cur.line, ch: cur.ch + 1 }) === close) {
          m.clear(); cm.setCursor({ line: cur.line, ch: cur.ch + 1 }); return;
        }
        if (close === '"' && open === '"') {   // a quote: open a pair where a string can start
          if (!codeHere(cm)) return window.CodeMirror.Pass;
          const before = cm.getRange({ line: cur.line, ch: cur.ch - 1 }, cur);
          cm.replaceSelection('"', "end", "+input");
          if (!/[\w\\"]/.test(before)) autoClose(cm, '"');
          return;
        }
        return window.CodeMirror.Pass;
      };
    }
    // "/*" starts a comment (Maxima, and JavaScript in [[jsxgraph]]): "*/" is added after the cursor
    // as a closing bracket; typing "*/" there skips it, Backspace after "/*" removes it again
    const addedComment = (cm, pos) => {
      for (const m of cm.state.autoClosed || []) {
        const r = m.find();
        if (r && r.from.line === pos.line && r.from.ch <= pos.ch && r.to.ch >= pos.ch && cm.getRange(r.from, r.to) === "*/") return [m, r];
      }
      return null;
    };
    keys["'*'"] = (cm) => {
      if (!settings.closeBrackets || cm.somethingSelected() || !codeHere(cm)) return window.CodeMirror.Pass;
      const cur = cm.getCursor(), a = addedComment(cm, cur);
      if (a && a[1].from.ch === cur.ch) { cm.setCursor({ line: cur.line, ch: cur.ch + 1 }); return; }   // over the added "*"
      const prev = cm.getRange({ line: cur.line, ch: cur.ch - 1 }, cur);
      const type = cm.getTokenTypeAt(cur) || "";
      if (prev !== "/" || /comment|string/.test(type)) return window.CodeMirror.Pass;
      cm.replaceSelection("*", "end", "+input");
      autoClose(cm, "*/");
    };
    keys["'/'"] = (cm) => {
      if (cm.somethingSelected()) return window.CodeMirror.Pass;
      const cur = cm.getCursor(), a = addedComment(cm, cur);
      if (a && a[1].from.ch === cur.ch - 1) { a[0].clear(); cm.setCursor({ line: cur.line, ch: cur.ch + 1 }); return; }   // over the added "/"
      return window.CodeMirror.Pass;
    };
    if (kind === "maxima") {
      // ":" ending a statement: add ";" (not inside brackets, e.g. block([a:1], ...), lambda, lists)
      keys["':'"] = (cm) => {
        if (!settings.semicolon || cm.somethingSelected()) return window.CodeMirror.Pass;
        const top = statementTopLevel(cm);
        cm.replaceSelection(":", "end", "+input");
        const cur = cm.getCursor();
        if (top && /^\s*$/.test(cm.getLine(cur.line).slice(cur.ch))) autoClose(cm, ";");
      };
      for (const end of [";", "$"]) keys[`'${end}'`] = (cm) => {
        if (cm.somethingSelected()) return window.CodeMirror.Pass;
        const cur = cm.getCursor(), m = addedAt(cm, cur), after = { line: cur.line, ch: cur.ch + 1 };
        if (!m || cm.getRange(cur, after) !== ";") return window.CodeMirror.Pass;
        m.clear();
        if (end === "$") cm.replaceRange("$", cur, after, "+input");
        cm.setCursor(after);
      };
    }
    keys.Backspace = (cm) => {
      if (cm.somethingSelected()) return window.CodeMirror.Pass;
      const cur = cm.getCursor(), m = addedAt(cm, cur);
      const prev = cm.getRange({ line: cur.line, ch: cur.ch - 1 }, cur);
      const next = cm.getRange(cur, { line: cur.line, ch: cur.ch + 1 });
      if (m && prev === "*" && cm.getRange({ line: cur.line, ch: cur.ch - 2 }, cur) === "/*" &&
          cm.getRange(cur, { line: cur.line, ch: cur.ch + 2 }) === "*/") {   // "/*|*/": back to "/"
        m.clear();
        cm.replaceRange("", { line: cur.line, ch: cur.ch - 1 }, { line: cur.line, ch: cur.ch + 2 }, "+delete");
        return;
      }
      if (m && ((settings.closeBrackets && PAIRS[prev] === next) || (prev === ":" && next === ";"))) {
        m.clear();
        cm.replaceRange("", { line: cur.line, ch: cur.ch - 1 }, { line: cur.line, ch: cur.ch + 1 }, "+delete");
        return;
      }
      return window.CodeMirror.Pass;
    };
    return keys;
  }

  // ------------------------------------------------------------------ fields
  // A field wraps a textarea: a CodeMirror editor when available, the textarea otherwise.
  // opts.height: initial height in px (the user can drag the lower right corner; then
  // opts.onResize(height) is called, e.g. to remember it)
  function field(textarea, kind, onChange, opts) {
    opts = opts || {};
    if (!ready) {
      textarea.addEventListener("input", () => onChange());
      return {
        get: () => textarea.value,
        set: (v) => { textarea.value = v; },
        refresh: () => {}, focusLine: (n) => { textarea.focus(); },
        insert: (text) => {
          const a = textarea.selectionStart ?? textarea.value.length, b = textarea.selectionEnd ?? a;
          textarea.setRangeText(text, a, b, "end"); onChange();
        },
        plain: true,
      };
    }
    const cm = window.CodeMirror.fromTextArea(textarea, {
      mode: kind, lineNumbers: true, lineWrapping: true, matchBrackets: true, indentUnit: 2, tabSize: 2,
      viewportMargin: 50,
      extraKeys: Object.assign({ Tab: (c) => c.replaceSelection("  "), "Shift-Tab": "indentLess",
        "Ctrl-Space": (c) => complete(c, kind, opts, true), F1: (c) => openHelpAtCursor(c), F2: (c) => toggleHelpBox(c),
        Esc: (c) => hideBox() },
        bracketKeys(kind, opts)),
    });
    cm.meclibKind = kind;
    cm.on("cursorActivity", (c) => updateBox(c));
    // only the box of this editor: a click into another field shows that field's box at once
    cm.on("blur", () => setTimeout(() => { if (!boxHover && boxCm === cm) hideBox(); }, 150));
    cm.on("inputRead", (c, change) => onInputRead(c, change, kind, opts));
    const wrap = cm.getWrapperElement();
    wrap.classList.add("cm-resizable");
    if (opts.height) wrap.style.height = opts.height + "px";
    let lastH = wrap.offsetHeight;
    new ResizeObserver(() => {
      const h = wrap.offsetHeight;
      if (h && h !== lastH) { lastH = h; cm.refresh(); if (opts.onResize) opts.onResize(h); }
    }).observe(wrap);
    cm.on("changes", (c, changes) => { if (!changes.every((ch) => ch.origin === "setValue")) onChange(); });
    return {
      get: () => cm.getValue(),
      set: (v) => { if (cm.getValue() !== v) cm.setValue(v); cm.clearHistory(); },
      refresh: () => cm.refresh(),
      insert: (text) => { cm.replaceSelection(text); cm.focus(); },   // at the cursor (kept while the editor is not focused)
      focusLine: (n, ch) => {     // ch: column of the cursor (default: start of the line)
        const line = Math.max(0, n - 1);
        cm.focus(); cm.setCursor({ line, ch: ch || 0 });
        cm.scrollIntoView({ line, ch: 0 }, 80);
        cm.addLineClass(line, "background", "cm-flash-line");
        setTimeout(() => cm.removeLineClass(line, "background", "cm-flash-line"), 1500);
      },
      cm,
    };
  }

  window.MeclibEditor = { load, field, setHelp, configure, available: () => ready };
})();
