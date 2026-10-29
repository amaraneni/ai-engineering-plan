// Builds a dated, checkable schedule from the plan files.
// Usage (from the plan folder):  node tools/build-schedule.mjs [start-date YYYY-MM-DD]
// Default start date: 2026-10-28. Re-run it after editing the plan; your ticks in
// schedule.html are kept in the browser, keyed by week and day, so they survive a rebuild.
// Outputs: schedule.md (printable, tickable on GitHub) and schedule.html (click to tick).
// schedule.html links to the HTML lesson pages; run tools/build-html.mjs to create them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const startArg = process.argv[2] ?? "2026-10-28";
if (!/^\d{4}-\d{2}-\d{2}$/.test(startArg)) throw new Error("Start date must be YYYY-MM-DD");
const start = new Date(`${startArg}T00:00:00Z`);

// GitHub-style heading anchors, numbered when a heading repeats within a file.
function makeSlugger() {
  const seen = new Map();
  return (heading) => {
    const base = heading.toLowerCase().trim()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s/g, "-");
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

const sectionFiles = ["plan.md", ...fs.readdirSync(path.join(root, "weeks")).filter((f) => f.endsWith(".md")).sort().map((f) => `weeks/${f}`)];
const sectionTitles = new Map(); // week -> section title
const weeks = new Map();         // week -> { title, file, days: [] }

for (const rel of sectionFiles) {
  const lines = fs.readFileSync(path.join(root, rel), "utf8").split(/\r?\n/);
  const slug = makeSlugger();
  let section = null;
  let week = null;
  let day = null;
  let inCode = false;
  for (const line of lines) {
    // Lines inside ``` blocks are code; a "# comment" there isn't a heading.
    if (/^\s*```/.test(line)) { inCode = !inCode; continue; }
    if (inCode) continue;
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const headingSlug = heading ? slug(heading[2]) : null;

    const sec = line.match(/^# Section ([A-J]): (.*)$/);
    if (sec) section = `${sec[1]}. ${sec[2]}`;

    const w = line.match(/^## Week (\d+)(?: in full)?: (.*)$/);
    if (w) {
      const n = Number(w[1]);
      week = { number: n, title: w[2].trim(), file: rel, days: [] };
      weeks.set(n, week);
      if (section) sectionTitles.set(n, section);
      day = null;
      continue;
    }
    const d = line.match(/^### Day (\d+): (.*)$/);
    if (d && week) {
      day = { number: Number(d[1]), title: d[2].trim(), anchor: headingSlug, doneWhen: "" };
      week.days.push(day);
      continue;
    }
    if (heading && heading[1].length <= 2) { day = null; }
    const done = line.match(/^\*\*Done when:\*\*\s*(.*)$/);
    if (done && day && !day.doneWhen) day.doneWhen = done[1].trim();
  }
}
// One name per section, by week range, so Week 1 (in plan.md) and Weeks 2–4 share Section A.
const SECTIONS = [
  [1, 4, "A. AI foundations in .NET (Weeks 1–4)"],
  [5, 8, "B. Python for AI (Weeks 5–8)"],
  [9, 14, "C. RAG in depth (Weeks 9–14)"],
  [15, 20, "D. Agents (Weeks 15–20)"],
  [21, 24, "E. MCP (Weeks 21–24)"],
  [25, 32, "F. AWS foundations with .NET (Weeks 25–32)"],
  [33, 38, "G. AI on AWS (Weeks 33–38)"],
  [39, 44, "H. Production and DevOps (Weeks 39–44)"],
  [45, 50, "I. Forward deployed engineering (Weeks 45–50)"],
  [51, 52, "J. Capstone (Weeks 51–52)"]
];
for (const [from, to, name] of SECTIONS) for (let n = from; n <= to; n++) sectionTitles.set(n, name);

// Plain text for the schedule: drop Markdown links and emphasis.
const plain = (s) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*|`/g, "");

const entries = [];
for (let n = 1; n <= 52; n++) {
  const w = weeks.get(n);
  if (!w) throw new Error(`Week ${n} not found`);
  for (const d of w.days) {
    if (d.number < 1 || d.number > 7) continue;
    const offset = (n - 1) * 7 + (d.number - 1);
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + offset);
    entries.push({
      id: `W${String(n).padStart(2, "0")}D${d.number}`,
      week: n,
      weekTitle: plain(w.title),
      section: sectionTitles.get(n) ?? "",
      day: d.number,
      title: plain(d.title),
      doneWhen: plain(d.doneWhen) || (d.number === 7 ? "Your week's work is pushed and anything skipped is caught up." : ""),
      light: d.number === 7,
      date: date.toISOString().slice(0, 10),
      link: `${w.file}#${d.anchor}`,
      htmlLink: `${w.file.replace(/\.md$/, ".html")}#${d.anchor}`
    });
  }
}
if (entries.length !== 364) throw new Error(`Expected 364 days, found ${entries.length}`);

const fmt = (iso, opts) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
const endDate = entries.at(-1).date;

// ---------- schedule.md ----------
let md = `# Schedule and checklist\n\n`;
md += `Starts **${fmt(entries[0].date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}** and ends **${fmt(endDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}**: 52 weeks, 364 days. Day 7 of each week is a light catch-up day.\n\n`;
md += `Tick a day when its "Done when" goal is met. Each title links to the full lesson. For clickable ticks that are saved for you, open [schedule.html](schedule.html) in your browser instead.\n\n`;
md += `Missed a day? Do it next, and use that week's Day 7 to catch up. The dates are a guide, not a deadline.\n\n`;
md += `Generated by \`node tools/build-schedule.mjs ${startArg}\`. To start on a different date, run it again with that date.\n`;
let lastSection = "";
for (let n = 1; n <= 52; n++) {
  const days = entries.filter((e) => e.week === n);
  if (days[0].section !== lastSection) { md += `\n## ${days[0].section}\n`; lastSection = days[0].section; }
  md += `\n### Week ${n}: ${days[0].weekTitle} (${fmt(days[0].date, { month: "short", day: "numeric" })} – ${fmt(days.at(-1).date, { month: "short", day: "numeric", year: "numeric" })})\n\n`;
  for (const e of days) {
    md += `- [ ] **${fmt(e.date, { weekday: "short", month: "short", day: "numeric" })}** · Day ${e.day}: [${e.title}](${e.link})${e.light ? " *(light)*" : ""}\n`;
    if (e.doneWhen) md += `  - Done when: ${e.doneWhen}\n`;
  }
}
fs.writeFileSync(path.join(root, "schedule.md"), md, "utf8");

// ---------- schedule.html ----------
const data = JSON.stringify(entries).replace(/</g, "\\u003c");
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Engineering Plan: schedule and checklist</title>
<style>
  :root { --bg:#fff; --fg:#1b1f24; --muted:#59636e; --line:#d1d9e0; --accent:#0969da; --done:#1a7f37; --today:#fff8c5; --card:#f6f8fa; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0d1117; --fg:#e6edf3; --muted:#9198a1; --line:#3d444d; --accent:#4493f8; --done:#3fb950; --today:#3a3000; --card:#151b23; } }
  * { box-sizing: border-box; }
  body { margin:0; font:16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; background:var(--bg); color:var(--fg); }
  header { position:sticky; top:0; z-index:2; background:var(--bg); border-bottom:1px solid var(--line); padding:12px 16px; }
  h1 { font-size:1.25rem; margin:0 0 6px; }
  .bar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .progress { flex:1 1 240px; height:10px; background:var(--card); border:1px solid var(--line); border-radius:6px; overflow:hidden; }
  .progress > span { display:block; height:100%; background:var(--done); width:0; }
  button, select { font:inherit; padding:6px 10px; border:1px solid var(--line); border-radius:6px; background:var(--card); color:var(--fg); cursor:pointer; min-height:36px; }
  button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible { outline:3px solid var(--accent); outline-offset:2px; }
  main { max-width:960px; margin:0 auto; padding:8px 16px 48px; }
  h2 { font-size:1.1rem; margin:28px 0 8px; color:var(--muted); }
  section.week { border:1px solid var(--line); border-radius:8px; margin:12px 0; background:var(--card); }
  section.week > h3 { margin:0; padding:10px 12px; font-size:1rem; display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; }
  section.week > h3 small { color:var(--muted); font-weight:normal; }
  ul { list-style:none; margin:0; padding:0; }
  li { display:grid; grid-template-columns:auto 1fr; gap:4px 10px; padding:8px 12px; border-top:1px solid var(--line); background:var(--bg); }
  li.today { background:var(--today); }
  li.done .title { text-decoration:line-through; color:var(--muted); }
  input[type=checkbox] { width:20px; height:20px; margin-top:2px; accent-color:var(--done); }
  .date { color:var(--muted); font-size:.9rem; margin-right:6px; white-space:nowrap; }
  .done-when { grid-column:2; color:var(--muted); font-size:.92rem; }
  .light { font-size:.8rem; border:1px solid var(--line); border-radius:10px; padding:0 6px; margin-left:6px; color:var(--muted); }
  a { color:var(--accent); }
  .status { min-height:1.5em; color:var(--muted); font-size:.9rem; }
  .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
  @media print { header { position:static; } .bar button, .bar select { display:none; } li.today { background:none; } }
</style>
</head>
<body>
<header>
  <h1>AI Engineering Plan: schedule and checklist</h1>
  <p style="margin:0 0 6px"><a href="plan.html">Plan</a> · <a href="resources.html">Resources</a></p>
  <div class="bar">
    <div class="progress" role="progressbar" aria-label="Days completed" aria-valuemin="0" aria-valuemax="364" aria-valuenow="0"><span></span></div>
    <strong id="count">0 / 364</strong>
    <button type="button" id="today-btn">Go to today</button>
    <label class="sr-only" for="filter">Show</label>
    <select id="filter"><option value="all">All days</option><option value="todo">Not done</option><option value="done">Done</option></select>
    <button type="button" id="export-btn">Export progress</button>
    <button type="button" id="import-btn">Import progress</button>
    <input type="file" id="import-file" accept="application/json" hidden>
  </div>
  <div class="status" id="status" role="status" aria-live="polite"></div>
</header>
<main id="main"></main>
<script>
"use strict";
const ENTRIES = ${data};
const KEY = "ai-plan-checklist-v1";
let done = {};
try { done = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { done = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch { say("Your browser isn't saving progress. Use Export to keep a copy."); } };
const say = (msg) => { document.getElementById("status").textContent = msg; };
const todayIso = (() => { const d = new Date(); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10); })();
const fmt = (iso, opts) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

function el(tag, props = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) { if (k === "text") n.textContent = v; else n.setAttribute(k, v); }
  for (const c of [].concat(children)) n.append(c);
  return n;
}

function render() {
  const main = document.getElementById("main");
  main.replaceChildren();
  const filter = document.getElementById("filter").value;
  let section = "";
  for (let w = 1; w <= 52; w++) {
    const days = ENTRIES.filter((e) => e.week === w && (filter === "all" || (filter === "done") === !!done[e.id]));
    if (!days.length) continue;
    if (days[0].section !== section) { section = days[0].section; main.append(el("h2", { text: section })); }
    const all = ENTRIES.filter((e) => e.week === w);
    const weekDone = all.filter((e) => done[e.id]).length;
    const box = el("section", { class: "week", "aria-labelledby": "w" + w });
    box.append(el("h3", { id: "w" + w }, [
      el("span", { text: "Week " + w + ": " + all[0].weekTitle }),
      el("small", { text: fmt(all[0].date, { month: "short", day: "numeric" }) + " – " + fmt(all[6].date, { month: "short", day: "numeric" }) + " · " + weekDone + "/7 done" })
    ]));
    const list = el("ul");
    for (const e of days) {
      const li = el("li", { id: e.id });
      if (e.date === todayIso) li.classList.add("today");
      if (done[e.id]) li.classList.add("done");
      const cb = el("input", { type: "checkbox", id: "cb-" + e.id });
      cb.checked = !!done[e.id];
      cb.addEventListener("change", () => {
        if (cb.checked) done[e.id] = new Date().toISOString(); else delete done[e.id];
        save(); updateProgress();
        li.classList.toggle("done", cb.checked);
        say((cb.checked ? "Marked done: " : "Marked not done: ") + "Week " + e.week + " Day " + e.day + ".");
      });
      const label = el("label", { for: "cb-" + e.id }, [
        el("span", { class: "date", text: fmt(e.date, { weekday: "short", month: "short", day: "numeric" }) }),
        el("span", { class: "title", text: "Day " + e.day + ": " + e.title })
      ]);
      if (e.light) label.append(el("span", { class: "light", text: "light" }));
      const link = el("a", { href: e.htmlLink, target: "_blank", rel: "noopener", text: "Open lesson" });
      li.append(cb, el("div", {}, [label, document.createTextNode(" · "), link]));
      if (e.doneWhen) li.append(el("div", { class: "done-when", text: "Done when: " + e.doneWhen }));
      list.append(li);
    }
    box.append(list);
    main.append(box);
  }
  if (!main.children.length) main.append(el("p", { text: "Nothing to show for this filter." }));
}

function updateProgress() {
  const count = ENTRIES.filter((e) => done[e.id]).length;
  document.getElementById("count").textContent = count + " / 364";
  const bar = document.querySelector(".progress");
  bar.setAttribute("aria-valuenow", count);
  bar.firstElementChild.style.width = (count / 364 * 100) + "%";
  document.querySelectorAll("section.week").forEach((s) => {
    const w = Number(s.querySelector("h3").id.slice(1));
    const all = ENTRIES.filter((e) => e.week === w);
    s.querySelector("h3 small").textContent = fmt(all[0].date, { month: "short", day: "numeric" }) + " – " + fmt(all[6].date, { month: "short", day: "numeric" }) + " · " + all.filter((e) => done[e.id]).length + "/7 done";
  });
}

document.getElementById("filter").addEventListener("change", () => { render(); updateProgress(); });
document.getElementById("today-btn").addEventListener("click", () => {
  const target = ENTRIES.find((e) => e.date === todayIso) || ENTRIES.find((e) => !done[e.id]);
  if (!target) { say("Everything is done."); return; }
  document.getElementById("filter").value = "all"; render(); updateProgress();
  const li = document.getElementById(target.id);
  li.scrollIntoView({ block: "center" });
  document.getElementById("cb-" + target.id).focus();
  say(target.date === todayIso ? "Today: Week " + target.week + " Day " + target.day + "." : "Today isn't in the schedule. Showing your first unfinished day.");
});
document.getElementById("export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ format: KEY, exportedAt: new Date().toISOString(), done }, null, 2)], { type: "application/json" });
  const a = el("a", { href: URL.createObjectURL(blob), download: "ai-plan-progress.json" });
  document.body.append(a); a.click(); a.remove();
  say("Progress exported.");
});
document.getElementById("import-btn").addEventListener("click", () => document.getElementById("import-file").click());
document.getElementById("import-file").addEventListener("change", async (ev) => {
  const file = ev.target.files[0]; ev.target.value = "";
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const ids = new Set(ENTRIES.map((e) => e.id));
    if (parsed.format !== KEY || typeof parsed.done !== "object") throw new Error("not a progress file from this page");
    const clean = {};
    for (const [id, when] of Object.entries(parsed.done)) if (ids.has(id) && typeof when === "string") clean[id] = when;
    if (!confirm("Replace your current progress with " + Object.keys(clean).length + " completed days from this file?")) { say("Import cancelled."); return; }
    done = clean; save(); render(); updateProgress();
    say("Progress imported.");
  } catch (err) { say("Couldn't import that file: " + err.message + "."); }
});

render(); updateProgress();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, "schedule.html"), html, "utf8");
console.log(`Wrote schedule.md and schedule.html: ${entries.length} days, ${entries[0].date} to ${endDate}.`);
const missingDoneWhen = entries.filter((e) => !e.doneWhen).map((e) => e.id);
if (missingDoneWhen.length) console.log(`Days without a "Done when" line: ${missingDoneWhen.join(", ")}`);
