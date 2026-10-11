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
(function () {
  "use strict";

  const SCRIPTS = ["lib/codemirror.js", "addon/edit/matchbrackets.js", "addon/search/searchcursor.js",
    "addon/dialog/dialog.js", "addon/search/search.js", "addon/search/jump-to-line.js", "mode/javascript/javascript.js"];
  const STYLES = ["lib/codemirror.css", "addon/dialog/dialog.css"];
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
      extraKeys: { Tab: (c) => c.replaceSelection("  "), "Shift-Tab": "indentLess" },
    });
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
      focusLine: (n) => {
        const line = Math.max(0, n - 1);
        cm.focus(); cm.setCursor({ line, ch: 0 });
        cm.scrollIntoView({ line, ch: 0 }, 80);
        cm.addLineClass(line, "background", "cm-flash-line");
        setTimeout(() => cm.removeLineClass(line, "background", "cm-flash-line"), 1500);
      },
      cm,
    };
  }

  window.MeclibEditor = { load, field, available: () => ready };
})();
