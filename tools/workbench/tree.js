"use strict";
// A collapsible tree for the side column of the workbench pages (Tests page; meant for the
// question folders of the Questions page, too). Nodes are plain objects:
//   {id, label, hint?, title?, cls?, children?: [node], open?: bool (default), onClick?(node),
//    tools?: [{label, title?, onClick(node)}]}
// opts: storeKey, onSelect(node) - called whenever the marked node changes (or is marked again)
// Nodes with children are <details> (the top level styled as roots, like the question folders),
// the others list items. The open/closed state of each node with children is kept in
// localStorage under storeKey (by id), so a reload shows the same tree. A filter text shows the
// leaves whose label or hint contains it, with their branches opened.
const MeclibTree = (() => {
  function esc(s) { return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  function create(container, opts = {}) {
    const storeKey = opts.storeKey || "meclib-tree";
    let roots = [], selected = null, filterText = "";
    const byId = new Map();     // id -> {node, el}

    function openState() { try { return JSON.parse(localStorage.getItem(storeKey) || "{}"); } catch (e) { return {}; } }
    function saveOpen(id, open) {
      const s = openState(); s[id] = open;
      try { localStorage.setItem(storeKey, JSON.stringify(s)); } catch (e) { /* no storage */ }
    }

    function leaf(node) {
      const li = document.createElement("li");
      li.className = "tleaf" + (node.cls ? " " + node.cls : "");
      li.innerHTML = esc(node.label) + (node.hint ? ` <span class="thint">${esc(node.hint)}</span>` : "");
      if (node.title) li.title = node.title;
      if (node.onClick) li.addEventListener("click", (ev) => { ev.stopPropagation(); api.select(node.id); node.onClick(node); });
      else li.classList.add("tinert");
      byId.set(node.id, { node, el: li });
      return li;
    }

    function branch(node, depth) {
      const det = document.createElement("details");
      det.className = (depth === 0 ? "troot" : "tbranch") + (node.cls ? " " + node.cls : "");
      const st = openState();
      det.open = node.id in st ? st[node.id] : !!node.open;
      const sum = document.createElement("summary");
      sum.innerHTML = `<span class="tlabel">${esc(node.label)}</span>` + (node.hint ? ` <span class="thint">${esc(node.hint)}</span>` : "");
      if (node.title) sum.title = node.title;
      if (node.onClick) sum.querySelector(".tlabel").addEventListener("click", (ev) => {
        // a click on the label selects the node; the marker (or a second click) opens/closes
        if (det.open) ev.preventDefault();
        api.select(node.id); node.onClick(node);
      });
      det.appendChild(sum);
      det.addEventListener("toggle", () => { if (!filterText) saveOpen(node.id, det.open); });
      const ul = document.createElement("ul"); ul.className = "tlist";
      for (const c of node.children) ul.appendChild(c.children ? wrapLi(branch(c, depth + 1)) : leaf(c));
      if (!node.children.length) ul.innerHTML = '<li class="tleaf tinert tempty">(empty)</li>';
      det.appendChild(ul);
      if (node.tools && node.tools.length) {
        const tools = document.createElement("div"); tools.className = "ttools";
        for (const t of node.tools) {
          const b = document.createElement("button"); b.className = "small"; b.textContent = t.label;
          if (t.title) b.title = t.title;
          b.addEventListener("click", () => t.onClick(node));
          tools.appendChild(b);
        }
        det.appendChild(tools);
      }
      byId.set(node.id, { node, el: det });
      return det;
    }
    function wrapLi(el) { const li = document.createElement("li"); li.className = "tsub"; li.appendChild(el); return li; }

    function matches(node) {
      return (node.label + " " + (node.hint || "")).toLowerCase().includes(filterText);
    }
    // shows the nodes that match or contain a match; returns whether node is shown
    function applyFilter(node) {
      const rec = byId.get(node.id);
      if (!rec) return false;
      let show;
      if (node.children) {
        const any = node.children.map(applyFilter).some(Boolean);
        show = !filterText || any || matches(node);
        if (filterText && any) rec.el.open = true;
        else if (!filterText) { const st = openState(); rec.el.open = node.id in st ? st[node.id] : !!node.open; }
      } else show = !filterText || matches(node);
      const host = rec.el.parentElement && rec.el.parentElement.classList.contains("tsub") ? rec.el.parentElement : rec.el;
      host.hidden = !show;
      return show;
    }

    const api = {
      render(newRoots) {
        roots = newRoots; byId.clear();
        container.innerHTML = "";
        for (const r of roots) container.appendChild(r.children ? branch(r, 0) : leaf(r));
        if (filterText) roots.forEach(applyFilter);
        if (selected) api.select(selected, true);
      },
      // marks a node; reveal: opens its branches and scrolls it into view
      select(id, quiet) {
        for (const rec of byId.values()) rec.el.classList.remove("tsel");
        selected = id;
        const rec = byId.get(id);
        if (!rec) return;
        rec.el.classList.add("tsel");
        if (opts.onSelect) opts.onSelect(rec.node);
        if (!quiet) {
          for (let p = rec.el.parentElement; p && p !== container; p = p.parentElement)
            if (p.tagName === "DETAILS" && !p.open) { p.open = true; }
        }
      },
      reveal(id) {
        api.select(id);
        const rec = byId.get(id);
        if (rec) (rec.el.tagName === "DETAILS" ? rec.el.querySelector("summary") : rec.el).scrollIntoView({ block: "nearest" });
      },
      filter(text) { filterText = String(text || "").trim().toLowerCase(); roots.forEach(applyFilter); },
      selected() { return selected; },
      node(id) { const rec = byId.get(id); return rec ? rec.node : null; },
    };
    return api;
  }
  return { create, esc };
})();
