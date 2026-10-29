// Converts the plan's Markdown files to HTML pages you can open straight from disk.
// Usage (from the plan folder): node tools/build-html.mjs
// Output: plan.html, resources.html, and weeks/*.html next to their .md files.
// Links between .md files are rewritten to the .html versions, and heading IDs match the
// anchors used by schedule.html. No packages needed; it handles the Markdown this plan uses:
// headings, paragraphs, nested lists, fenced code, tables, links, bold, italics, inline code.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Same slug rule as build-schedule.mjs, so schedule links land on the right heading.
export function makeSlugger() {
  const seen = new Map();
  return (heading) => {
    const base = heading.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function rewriteHref(href) {
  if (/^https?:/i.test(href) || href.startsWith("#") || href.startsWith("mailto:")) return href;
  return href.replace(/\.md(?=$|#)/, ".html");
}

function inline(text) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const h = rewriteHref(href.replace(/&amp;/g, "&"));
    const external = /^https?:/i.test(h);
    return `<a href="${esc(h)}"${external ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1<em>$2</em>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
  return s;
}

const indentOf = (line) => line.match(/^ */)[0].length;
const listMarker = (line) => line.match(/^( *)([-*]|\d+\.) +(.*)$/);
const isFence = (line) => /^ *```/.test(line);
const isTableStart = (lines, i) => /^\s*\|/.test(lines[i]) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1]);

function parseBlocks(lines, slug) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (isFence(line)) {
      const pad = indentOf(line);
      const lang = line.trim().slice(3).trim();
      const body = [];
      i++;
      while (i < lines.length && !isFence(lines[i])) {
        body.push(lines[i].slice(Math.min(pad, indentOf(lines[i]))));
        i++;
      }
      i++; // closing fence
      out.push(`<pre><code${lang ? ` class="lang-${esc(lang)}"` : ""}>${esc(body.join("\n"))}</code></pre>`);
      continue;
    }

    const h = line.match(/^(#{1,6}) +(.*)$/);
    if (h) {
      const level = h[1].length;
      const id = slug(h[2]);
      out.push(`<h${level} id="${esc(id)}">${inline(h[2])}<a class="anchor" href="#${esc(id)}" aria-label="Link to this heading">#</a></h${level}>`);
      i++;
      continue;
    }

    if (/^ *(-{3,}|\*{3,}) *$/.test(line)) { out.push("<hr>"); i++; continue; }

    if (isTableStart(lines, i)) {
      const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const head = cells(lines[i]);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }

    const m = listMarker(line);
    if (m) {
      const baseIndent = m[1].length;
      const ordered = /\d/.test(m[2]);
      const startNumber = ordered ? parseInt(m[2], 10) : 1;
      const items = [];
      while (i < lines.length) {
        const mm = listMarker(lines[i]);
        if (!mm || mm[1].length !== baseIndent || /\d/.test(mm[2]) !== ordered) break;
        const contentIndent = mm[1].length + mm[2].length + (lines[i].length - mm[1].length - mm[2].length - mm[3].length);
        const itemLines = [mm[3]];
        i++;
        while (i < lines.length) {
          const l = lines[i];
          if (!l.trim()) {
            // A blank line continues the item only if the next text line is indented into it.
            let j = i + 1;
            while (j < lines.length && !lines[j].trim()) j++;
            if (j < lines.length && indentOf(lines[j]) > baseIndent) { itemLines.push(""); i++; continue; }
            break;
          }
          if (indentOf(l) <= baseIndent) break;
          itemLines.push(l.slice(Math.min(contentIndent, indentOf(l))));
          i++;
        }
        items.push(itemLines);
      }
      const tag = ordered ? "ol" : "ul";
      const startAttr = ordered && startNumber !== 1 ? ` start="${startNumber}"` : "";
      const lis = items.map((itemLines) => {
        const inner = parseBlocks(itemLines, slug);
        // Tight item: a single paragraph, or a paragraph followed by a nested list.
        if (inner.length && inner[0].startsWith("<p>")) inner[0] = inner[0].slice(3, -4);
        return `<li>${inner.join("\n")}</li>`;
      });
      out.push(`<${tag}${startAttr}>\n${lis.join("\n")}\n</${tag}>`);
      continue;
    }

    // Paragraph: gather lines until a blank line or another block starts.
    const para = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !isFence(lines[i]) && !/^#{1,6} /.test(lines[i]) && !listMarker(lines[i]) && !isTableStart(lines, i) && !/^ *-{3,} *$/.test(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out;
}

const CSS = `
:root { --bg:#fff; --fg:#1b1f24; --muted:#59636e; --line:#d1d9e0; --accent:#0969da; --code:#f6f8fa; --target:#fff8c5; }
@media (prefers-color-scheme: dark) { :root { --bg:#0d1117; --fg:#e6edf3; --muted:#9198a1; --line:#3d444d; --accent:#4493f8; --code:#151b23; --target:#3a3000; } }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif; }
nav.top { position:sticky; top:0; z-index:2; background:var(--bg); border-bottom:1px solid var(--line); padding:8px 16px; display:flex; flex-wrap:wrap; gap:6px 16px; font-size:.95rem; }
main { max-width:900px; margin:0 auto; padding:16px 16px 64px; }
a { color:var(--accent); }
a:focus-visible { outline:3px solid var(--accent); outline-offset:2px; }
h1,h2,h3,h4 { line-height:1.3; scroll-margin-top:56px; }
h1 { font-size:1.8rem; } h2 { font-size:1.4rem; margin-top:2.2em; padding-bottom:.2em; border-bottom:1px solid var(--line); } h3 { font-size:1.15rem; margin-top:1.8em; }
h1:target,h2:target,h3:target { background:var(--target); }
.anchor { margin-left:.4em; color:var(--muted); text-decoration:none; font-weight:normal; opacity:0; }
h1:hover .anchor,h2:hover .anchor,h3:hover .anchor,.anchor:focus { opacity:1; }
code { font:.9em/1.4 ui-monospace,Consolas,monospace; background:var(--code); padding:.1em .3em; border-radius:4px; }
pre { background:var(--code); border:1px solid var(--line); border-radius:6px; padding:12px; overflow:auto; }
pre code { background:none; padding:0; font-size:.88rem; }
.table-wrap { overflow-x:auto; }
table { border-collapse:collapse; margin:1em 0; }
th,td { border:1px solid var(--line); padding:6px 10px; text-align:left; vertical-align:top; }
th { background:var(--code); }
li { margin:.2em 0; } li > p { margin:.3em 0; }
hr { border:0; border-top:1px solid var(--line); margin:2em 0; }
.pager { display:flex; justify-content:space-between; gap:16px; margin-top:3em; padding-top:1em; border-top:1px solid var(--line); }
@media print { nav.top, .pager, .anchor { display:none; } h1:target,h2:target,h3:target { background:none; } }
`;

const pages = [
  ["plan.md", "Plan and Week 1"],
  ["weeks/A-ai-foundations-weeks-02-04.md", "A. AI foundations (Weeks 2–4)"],
  ["weeks/B-python-weeks-05-08.md", "B. Python (Weeks 5–8)"],
  ["weeks/C-rag-weeks-09-14.md", "C. RAG (Weeks 9–14)"],
  ["weeks/D-agents-weeks-15-20.md", "D. Agents (Weeks 15–20)"],
  ["weeks/E-mcp-weeks-21-24.md", "E. MCP (Weeks 21–24)"],
  ["weeks/F-aws-foundations-weeks-25-32.md", "F. AWS foundations (Weeks 25–32)"],
  ["weeks/G-ai-on-aws-weeks-33-38.md", "G. AI on AWS (Weeks 33–38)"],
  ["weeks/H-production-weeks-39-44.md", "H. Production (Weeks 39–44)"],
  ["weeks/I-forward-deployed-weeks-45-50.md", "I. Forward deployed (Weeks 45–50)"],
  ["weeks/J-capstone-weeks-51-52.md", "J. Capstone (Weeks 51–52)"],
  ["resources.md", "Resources"]
];
for (const [rel] of pages) if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing ${rel}`);

const relLink = (fromRel, toRel) => {
  const r = path.relative(path.dirname(path.join(root, fromRel)), path.join(root, toRel)).split(path.sep).join("/");
  return r.replace(/\.md$/, ".html");
};

pages.forEach(([rel, label], index) => {
  const md = fs.readFileSync(path.join(root, rel), "utf8").replace(/\r\n/g, "\n");
  const body = parseBlocks(md.split("\n"), makeSlugger()).join("\n");
  const title = (md.match(/^# (.*)$/m) || [, label])[1].replace(/[`*]/g, "");
  const nav = [
    `<a href="${relLink(rel, "schedule.html")}">← Schedule</a>`,
    `<a href="${relLink(rel, "plan.md")}">Plan</a>`,
    `<a href="${relLink(rel, "resources.md")}">Resources</a>`
  ].join("");
  const prev = pages[index - 1];
  const next = pages[index + 1];
  const pager = `<nav class="pager" aria-label="Sections">${prev ? `<a href="${relLink(rel, prev[0])}">← ${esc(prev[1])}</a>` : "<span></span>"}${next ? `<a href="${relLink(rel, next[0])}">${esc(next[1])} →</a>` : "<span></span>"}</nav>`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<nav class="top" aria-label="Plan">${nav}</nav>
<main>
${body}
${pager}
</main>
</body>
</html>
`;
  fs.writeFileSync(path.join(root, rel.replace(/\.md$/, ".html")), html, "utf8");
});
console.log(`Wrote ${pages.length} HTML pages.`);
