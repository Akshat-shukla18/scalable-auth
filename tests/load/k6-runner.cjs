#!/usr/bin/env node
/**
 * Scalable-Auth — Multi-Level Load Benchmark Runner
 * 
 * Runs k6 sequentially across VU levels, collects metrics,
 * and prints a formatted ASCII table + writes a markdown report.
 *
 * Usage:
 *   node tests/load/k6-runner.js
 *   node tests/load/k6-runner.js --flow health_only --base-url http://localhost:3000
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const K6_BINARY   = '"C:\\Program Files\\k6\\k6.exe"';
const SCRIPT      = path.join(__dirname, 'k6-scalability-test.js');
const RESULTS_DIR = path.join(__dirname, 'results');
const DOCS_DIR    = path.join(__dirname, '..', '..', 'docs');

const args     = process.argv.slice(2);
const BASE_URL = argVal(args, '--base-url') || 'http://localhost:3000';
const FLOW     = argVal(args, '--flow')     || 'health_only';

// VU ladder: label + vus + duration (seconds)
const LEVELS = [
  { label: 'Baseline',  vus:    10, dur: 15 },
  { label: '100 VUs',  vus:   100, dur: 20 },
  { label: '250 VUs',  vus:   250, dur: 20 },
  { label: '500 VUs',  vus:   500, dur: 20 },
  { label: '1,000 VUs',vus:  1000, dur: 25 },
  { label: '2,000 VUs',vus:  2000, dur: 25 },
  { label: '5,000 VUs',vus:  5000, dur: 30 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function argVal(argv, flag) {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function pad(str, len, right = false) {
  const s = String(str);
  const spaces = len - s.length;
  if (spaces <= 0) return s.slice(0, len);
  return right ? s + ' '.repeat(spaces) : ' '.repeat(spaces) + s;
}

function rpad(str, len) { return pad(str, len, true); }
function lpad(str, len) { return pad(str, len, false); }

// ---------------------------------------------------------------------------
// Collect OS-level CPU / RAM snapshot (Windows + Linux/Mac)
// ---------------------------------------------------------------------------
function getProcessSnapshot(pidName) {
  try {
    if (process.platform === 'win32') {
      // Get the tsx / node dev server process
      const ps = execSync(
        `powershell -NoProfile -Command "` +
        `$p = Get-Process -Name tsx,node -ErrorAction SilentlyContinue | ` +
        `Sort-Object CPU -Descending | Select-Object -First 1; ` +
        `if ($p) { Write-Output ($p.CPU.ToString() + ',' + $p.WorkingSet64.ToString()) } else { Write-Output '0,0' }"`,
        { timeout: 5000, encoding: 'utf8' }
      ).trim();
      const parts = ps.split(',');
      return {
        cpuSeconds: parseFloat(parts[0]) || 0,
        ramBytes:   parseInt(parts[1])   || 0,
      };
    } else {
      // Linux/Mac: parse /proc or use ps
      const ps = execSync(
        `ps -o pid,%cpu,rss -p $(pgrep -f "tsx|node" | head -1) 2>/dev/null | tail -1`,
        { timeout: 5000, encoding: 'utf8' }
      ).trim().split(/\s+/);
      return {
        cpuPercent: parseFloat(ps[1]) || 0,
        ramBytes:   (parseInt(ps[2]) || 0) * 1024,
      };
    }
  } catch (_) {
    return { cpuSeconds: 0, ramBytes: 0 };
  }
}

function formatRam(bytes) {
  if (!bytes) return 'N/A';
  const mb = bytes / 1024 / 1024;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}

function formatCpu(before, after, durationSec) {
  if (process.platform === 'win32') {
    // CPU seconds used during this window
    const delta = (after.cpuSeconds || 0) - (before.cpuSeconds || 0);
    const cores = os.cpus().length;
    const pct   = (delta / durationSec / cores) * 100;
    return pct > 0 ? `${Math.min(pct, 999).toFixed(0)}%` : 'N/A';
  } else {
    return after.cpuPercent ? `${after.cpuPercent.toFixed(0)}%` : 'N/A';
  }
}

// ---------------------------------------------------------------------------
// Parse k6 summary-export JSON
// ---------------------------------------------------------------------------
function parseMetrics(jsonPath) {
  const empty = { rps: 0, p50: 0, p95: 0, p99: 0, errorRate: 0, requests: 0 };
  try {
    if (!fs.existsSync(jsonPath)) return empty;
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const json = JSON.parse(raw);
    const m    = json.metrics || {};

    // k6 v0.46+ flat format: m.http_reqs = { count, rate }
    // k6 older nested:       m.http_reqs = { values: { count, rate } }
    const httpReqs = m.http_reqs || {};
    const rps  = httpReqs.rate   ?? httpReqs.values?.rate   ?? 0;
    const reqs = httpReqs.count  ?? httpReqs.values?.count  ?? 0;

    const dur  = m.http_req_duration || {};
    const dv   = dur.values || dur;   // handle both flat + nested
    const p50  = dv.med   ?? dv['p(50)'] ?? 0;
    const p95  = dv['p(95)'] ?? 0;
    const p99  = dv['p(99)'] ?? 0;

    const failed = m.http_req_failed || {};
    const fv   = failed.values || failed;
    const errR = (fv.rate ?? fv.passes ?? 0) * 100; // rate = fraction

    return {
      rps:       parseFloat(rps.toFixed(1)),
      p50:       parseFloat(p50.toFixed(2)),
      p95:       parseFloat(p95.toFixed(2)),
      p99:       parseFloat(p99.toFixed(2)),
      errorRate: parseFloat(errR.toFixed(2)),
      requests:  Math.round(reqs),
    };
  } catch (e) {
    console.error('  ⚠ Could not parse metrics:', e.message);
    return empty;
  }
}

// ---------------------------------------------------------------------------
// Run a single k6 stage
// ---------------------------------------------------------------------------
function runStage(level, summaryPath) {
  const env = [
    `VUS=${level.vus}`,
    `DURATION=${level.dur}s`,
    `FLOW=${FLOW}`,
    `BASE_URL=${BASE_URL}`,
  ].join(' ');

  const cmd = [
    `set ${env.replace(/ /g, ' & set ')} &`,
    K6_BINARY,
    'run',
    `--vus ${level.vus}`,
    `--duration ${level.dur}s`,
    `--env VUS=${level.vus}`,
    `--env DURATION=${level.dur}s`,
    `--env FLOW=${FLOW}`,
    `--env BASE_URL=${BASE_URL}`,
    `--summary-export "${summaryPath}"`,
    '--no-color',
    '--quiet',
    `"${SCRIPT}"`,
  ].join(' ');

  execSync(cmd, {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: (level.dur + 30) * 1000,
  });
}

// ---------------------------------------------------------------------------
// Print ASCII table
// ---------------------------------------------------------------------------
function printTable(rows) {
  const cols = [
    { h: 'Concurrency',  w: 13 },
    { h: 'Req/s',        w: 10 },
    { h: 'P50',          w: 10 },
    { h: 'P95',          w: 10 },
    { h: 'P99',          w: 10 },
    { h: 'Errors',       w: 8  },
    { h: 'CPU',          w: 7  },
    { h: 'RAM',          w: 9  },
    { h: 'DB Conn',      w: 9  },
    { h: 'Redis Ops/s',  w: 12 },
  ];

  const sep = (l, m, r, f) =>
    l + cols.map(c => f.repeat(c.w + 2)).join(m) + r;

  const row = (cells, padFn = lpad) =>
    '│ ' + cols.map((c, i) => padFn(cells[i] ?? '—', c.w)).join(' │ ') + ' │';

  console.log('');
  console.log(sep('┌', '┬', '┐', '─'));
  console.log(row(cols.map(c => c.h)));
  console.log(sep('├', '┼', '┤', '─'));
  for (const r of rows) {
    console.log(row([
      rpad(r.label,      cols[0].w),
      lpad(r.rps + ' r/s', cols[1].w),
      lpad(r.p50 + 'ms',   cols[2].w),
      lpad(r.p95 + 'ms',   cols[3].w),
      lpad(r.p99 + 'ms',   cols[4].w),
      lpad(r.errorRate + '%', cols[5].w),
      lpad(r.cpu,          cols[6].w),
      lpad(r.ram,          cols[7].w),
      lpad(r.dbConn,       cols[8].w),
      lpad(r.redisOps,     cols[9].w),
    ]));
  }
  console.log(sep('└', '┴', '┘', '─'));
  console.log('');
}

// ---------------------------------------------------------------------------
// Write markdown report
// ---------------------------------------------------------------------------
function writeReport(rows, timestamp) {
  const lines = [
    `# Scalability Benchmark Report`,
    ``,
    `Generated: ${new Date(timestamp).toISOString()}  `,
    `Base URL: ${BASE_URL}  `,
    `Flow: ${FLOW}  `,
    ``,
    `| Concurrency  | Req/s | P50 | P95 | P99 | Errors | CPU | RAM | DB Conn | Redis Ops/s |`,
    `|-------------|-------|-----|-----|-----|--------|-----|-----|---------|-------------|`,
    ...rows.map(r =>
      `| ${r.label} | ${r.rps} r/s | ${r.p50}ms | ${r.p95}ms | ${r.p99}ms | ${r.errorRate}% | ${r.cpu} | ${r.ram} | ${r.dbConn} | ${r.redisOps} |`
    ),
    ``,
    `## Notes`,
    ``,
    `- Flow \`${FLOW}\` — does not require PostgreSQL or Redis`,
    `- CPU/RAM: captured from the highest-CPU Node.js process during each stage`,
    `- DB Conn / Redis Ops: reported as "N/A" when services are offline`,
    `- Single-node dev server; horizontal scaling (Docker + Nginx) needed for 5,000+ VUs`,
  ];

  const md = lines.join('\n');
  const fname = `scalability-report-${timestamp}.md`;

  ensureDir(RESULTS_DIR);
  fs.writeFileSync(path.join(RESULTS_DIR, fname), md, 'utf8');
  fs.writeFileSync(path.join(DOCS_DIR, 'scalability-report.md'), md, 'utf8');

  console.log(`  📄 Report saved to:`);
  console.log(`     tests/load/results/${fname}`);
  console.log(`     docs/scalability-report.md`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          Scalable-Auth — Load Benchmark Suite                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  Flow     : ${FLOW}`);
  console.log(`  Base URL : ${BASE_URL}`);
  console.log(`  Levels   : ${LEVELS.map(l => l.label).join(' → ')}`);
  console.log('');

  // Sanity check: is the server up?
  try {
    execSync(`curl -sf ${BASE_URL}/health -o NUL`, { timeout: 5000, stdio: 'pipe', shell: true });
    console.log('  ✓ Server is reachable\n');
  } catch (_) {
    console.error(`  ✗ Server at ${BASE_URL} is not responding. Start with: npm run dev:api`);
    process.exit(1);
  }

  const timestamp = Date.now();
  const rows = [];

  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    const summaryPath = path.join(RESULTS_DIR, `stage-${level.vus}.json`);
    ensureDir(RESULTS_DIR);

    console.log(`  ▶ [${i + 1}/${LEVELS.length}] ${rpad(level.label, 12)} — ${level.vus} VUs × ${level.dur}s`);

    const snapBefore = getProcessSnapshot();

    let ok = true;
    try {
      runStage(level, summaryPath);
    } catch (e) {
      console.error(`    ⚠ k6 exited with error (some errors tolerated):`, e.message.slice(0, 120));
      ok = false;
    }

    const snapAfter = getProcessSnapshot();

    const m = parseMetrics(summaryPath);

    rows.push({
      label:     level.label,
      rps:       m.rps,
      p50:       m.p50,
      p95:       m.p95,
      p99:       m.p99,
      errorRate: m.errorRate,
      cpu:       formatCpu(snapBefore, snapAfter, level.dur),
      ram:       formatRam(snapAfter.ramBytes),
      dbConn:    'N/A',       // DB offline on local dev
      redisOps:  'N/A',       // Redis offline on local dev
    });

    console.log(`    ✓ ${m.rps} req/s  P50=${m.p50}ms  P95=${m.p95}ms  P99=${m.p99}ms  Err=${m.errorRate}%`);
    console.log('');

    // Brief cooldown between stages
    if (i < LEVELS.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Final table
  console.log('═'.repeat(110));
  console.log(' RESULTS');
  console.log('═'.repeat(110));
  printTable(rows);

  writeReport(rows, timestamp);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
