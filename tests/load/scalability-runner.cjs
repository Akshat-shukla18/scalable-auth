"use strict";
// scalability-runner.cjs — run with: node tests/load/scalability-runner.cjs
const { spawnSync } = require("child_process");
const fs   = require("fs");
const path = require("path");
const os   = require("os");
const http = require("http");

const K6      = "C:\\Program Files\\k6\\k6.exe";
const SCRIPT  = path.join(__dirname, "k6-health.js");
const RESULTS = path.join(__dirname, "results");
const DOCS    = path.join(__dirname, "..", "..", "docs");
const argv    = process.argv.slice(2);
const BASE    = getArg("--base-url") || "http://localhost:4000";

const LEVELS = [
  { label: "Baseline",   vus:    10, dur: 15 },
  { label: "100 VUs",    vus:   100, dur: 20 },
  { label: "250 VUs",    vus:   250, dur: 20 },
  { label: "500 VUs",    vus:   500, dur: 20 },
  { label: "1,000 VUs",  vus:  1000, dur: 25 },
  { label: "2,000 VUs",  vus:  2000, dur: 25 },
  { label: "5,000 VUs",  vus:  5000, dur: 30 },
];

function getArg(flag) { const i = argv.indexOf(flag); return i !== -1 ? argv[i + 1] : null; }
function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function rpad(s, n) { s = String(s); return s.length >= n ? s : s + " ".repeat(n - s.length); }
function lpad(s, n) { s = String(s); return s.length >= n ? s : " ".repeat(n - s.length) + s; }

function snap() {
  try {
    const r = spawnSync("powershell", ["-NoProfile", "-Command",
      "$p=Get-Process -Name tsx,node -EA SilentlyContinue|Sort-Object CPU -Desc|Select-Object -First 1;" +
      "if($p){$p.CPU.ToString()+\",\"+$p.WorkingSet64}else{\"0,0\"}"
    ], { encoding: "utf8", timeout: 5000 });
    const [cpu, ram] = (r.stdout || "0,0").trim().split(",");
    return { cpu: parseFloat(cpu) || 0, ram: parseInt(ram) || 0 };
  } catch { return { cpu: 0, ram: 0 }; }
}
function fmtCpu(a, b, sec) {
  const delta = b.cpu - a.cpu;
  const pct   = (delta / sec / os.cpus().length) * 100;
  return pct > 0 ? `${Math.min(pct, 999).toFixed(0)}%` : "N/A";
}
function fmtRam(bytes) {
  if (!bytes) return "N/A";
  const mb = bytes / 1048576;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}

function runStage(vus, dur, summaryPath) {
  // stdio: "ignore" on ALL streams — k6 at 2000-5000 VUs produces gigabytes
  // of progress text on both stdout AND stderr that overflow spawnSync buffers.
  // All metrics come from --summary-export JSON, so we need zero pipe output.
  const r = spawnSync(K6, [
    "run",
    "--vus",             String(vus),
    "--duration",        `${dur}s`,
    "--env",             `BASE_URL=${BASE}`,
    "--summary-export",  summaryPath,
    "--no-color",
    "--no-usage-report",
    SCRIPT,
  ], {
    env:     { ...process.env, BASE_URL: BASE },
    stdio:   "ignore",              // ← key fix: no pipes at all
    timeout: (dur + 90) * 1000,
  });
  if (r.error) throw new Error(`k6 spawn error: ${r.error.message}`);
}

function parse(file) {
  const nil = { rps: 0, p50: 0, p95: 0, p99: 0, err: 0 };
  try {
    if (!fs.existsSync(file)) return nil;
    const m = JSON.parse(fs.readFileSync(file, "utf8")).metrics || {};
    const reqs = m.http_reqs         || {};
    const dur  = m.http_req_duration || {};
    const fail = m.http_req_failed   || {};
    const rps  = reqs.rate  ?? reqs.values?.rate  ?? 0;
    const dv   = dur.values  ?? dur;
    const fv   = fail.values ?? fail;
    return {
      rps: +rps.toFixed(1),
      p50: +((dv.med         ?? dv["p(50)"] ?? 0)).toFixed(2),
      p95: +((dv["p(95)"]    ?? 0)).toFixed(2),
      p99: +((dv["p(99)"]    ?? 0)).toFixed(2),
      err: +((fv.rate        ?? 0) * 100).toFixed(2),
    };
  } catch (e) { console.error("  parse error:", e.message); return nil; }
}

function printTable(rows) {
  const C = [
    ["Concurrency", 13], ["Req/s", 10], ["P50", 10], ["P95", 10],
    ["P99", 10], ["Errors", 8], ["CPU", 7], ["RAM", 9],
    ["DB Conn", 9], ["Redis Ops/s", 12],
  ];
  const bar = (l, m, r) => l + C.map(([,w]) => "─".repeat(w + 2)).join(m) + r;
  console.log("");
  console.log(bar("┌", "┬", "┐"));
  console.log("│ " + C.map(([h, w]) => lpad(h, w)).join(" │ ") + " │");
  console.log(bar("├", "┼", "┤"));
  rows.forEach(r => {
    console.log("│ " + [
      rpad(r.label,         C[0][1]),
      lpad(`${r.rps} r/s`,  C[1][1]),
      lpad(`${r.p50}ms`,    C[2][1]),
      lpad(`${r.p95}ms`,    C[3][1]),
      lpad(`${r.p99}ms`,    C[4][1]),
      lpad(`${r.err}%`,     C[5][1]),
      lpad(r.cpu,           C[6][1]),
      lpad(r.ram,           C[7][1]),
      lpad(r.db,            C[8][1]),
      lpad(r.redis,         C[9][1]),
    ].join(" │ ") + " │");
  });
  console.log(bar("└", "┴", "┘"));
  console.log("");
}

function writeReport(rows, ts) {
  const md = [
    "# Scalability Benchmark Report",
    "",
    `Generated: ${new Date(ts).toISOString()}   Base URL: ${BASE}`,
    "",
    "| Concurrency | Req/s | P50 | P95 | P99 | Errors | CPU | RAM | DB Conn | Redis Ops/s |",
    "|-------------|-------|-----|-----|-----|--------|-----|-----|---------|-------------|",
    ...rows.map(r =>
      `| ${r.label} | ${r.rps} r/s | ${r.p50}ms | ${r.p95}ms | ${r.p99}ms | ${r.err}% | ${r.cpu} | ${r.ram} | ${r.db} | ${r.redis} |`
    ),
    "", "## Notes",
    "- Single-node local dev server (tsx watch, no Docker)",
    "- CPU/RAM: top Node.js process during each stage",
    "- DB Conn / Redis Ops: N/A (services offline on local dev)",
    "- 2K-5K VUs require Docker + Nginx load balancer for linear scaling",
  ].join("\n");
  mkdir(RESULTS);
  mkdir(DOCS);
  const fname = `scalability-report-${ts}.md`;
  fs.writeFileSync(path.join(RESULTS, fname), md);
  fs.writeFileSync(path.join(DOCS, "scalability-report.md"), md);
  console.log(`  📄 Saved: tests/load/results/${fname}`);
  console.log(`  📄 Saved: docs/scalability-report.md`);
}

async function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE}/health`, (res) => { res.resume(); resolve(res.statusCode === 200); });
    req.on("error", () => resolve(false));
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║       Scalable-Auth — Scalability Benchmark Suite            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Base URL : ${BASE}`);
  console.log(`  Levels   : ${LEVELS.map(l => l.label).join(" → ")}`);
  console.log("");

  const up = await checkServer();
  if (!up) { console.error(`  ✗ Server not responding at ${BASE}. Run: npm run dev:api`); process.exit(1); }
  console.log("  ✓ Server is reachable\n");

  mkdir(RESULTS);
  const ts   = Date.now();
  const rows = [];

  for (let i = 0; i < LEVELS.length; i++) {
    const { label, vus, dur } = LEVELS[i];
    const summaryFile = path.join(RESULTS, `stage-${vus}-${ts}.json`);

    process.stdout.write(`  ▶ [${i + 1}/${LEVELS.length}] ${rpad(label, 12)} — ${vus} VUs × ${dur}s  `);

    const sa = snap();
    try {
      runStage(vus, dur, summaryFile);
    } catch (e) {
      console.log(`\n    ✗ k6 error: ${e.message}`);
      rows.push({ label, rps: 0, p50: 0, p95: 0, p99: 0, err: 0, cpu: "N/A", ram: "N/A", db: "N/A", redis: "N/A" });
      continue;
    }
    const sb = snap();
    const m  = parse(summaryFile);

    rows.push({
      label, rps: m.rps, p50: m.p50, p95: m.p95, p99: m.p99, err: m.err,
      cpu: fmtCpu(sa, sb, dur), ram: fmtRam(sb.ram), db: "N/A", redis: "N/A",
    });

    console.log("done ✓");
    console.log(`    → ${m.rps} req/s  P50=${m.p50}ms  P95=${m.p95}ms  P99=${m.p99}ms  Err=${m.err}%\n`);

    if (i < LEVELS.length - 1) await new Promise(r => setTimeout(r, 3000));
  }

  console.log("═".repeat(110));
  console.log(" RESULTS");
  console.log("═".repeat(110));
  printTable(rows);
  writeReport(rows, ts);
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });