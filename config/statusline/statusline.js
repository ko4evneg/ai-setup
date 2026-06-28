#!/usr/bin/env node
'use strict';

const fs  = require('fs');
const os  = require('os');
const { execSync } = require('child_process');

// ── stdin ──────────────────────────────────────────────────────────────────
let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (_) {}
let data = {};
try { data = JSON.parse(raw || '{}'); } catch (_) {}

// ── ANSI ───────────────────────────────────────────────────────────────────
const R    = '\x1b[0m';
const BOLD = '\x1b[1m';
const rgb  = (r, g, b) => `\x1b[38;2;${r};${g};${b}m`;

const C = {
  model:  rgb(203,166,247),
  effort: rgb(88, 91, 112),
  sep:    rgb(49, 50, 68),
  ctxLo:  rgb(166,227,161),  // context <50%   light green
  ctxMid: rgb(249,226,175),  // context 50-70% light yellow
  ctxHi:  rgb(243,139,168),  // context >70%   light red
  tokIn:  rgb(137,220,235),
  tokOut: rgb(203,166,247),
  tokTot: rgb(205,214,244),  // total = bright text
  dim:    rgb(69, 71, 90),
  repo:   rgb(249,226,175),
  branch: rgb(137,180,250),
  untr:   rgb(243,139,168),
  modif:  rgb(166,227,161),
  boxClean: rgb(166,227,161),  // git clean     soft green
  boxMod:   rgb(249,226,175),  // git modified  soft yellow
  boxUntr:  rgb(243,139,168),  // git untracked soft red
  verOk:  rgb(166,227,161),
  verNew: rgb(249,226,175),
  cacheR: rgb(166,227,161),  // cache read  = savings (green)
  cacheW: rgb(249,226,175),  // cache write = premium (yellow)
};

// ── width helpers ──────────────────────────────────────────────────────────
const stripAnsi = s => s.replace(/\x1b\[[0-9;]*m/g, '');
const vlen = s => {
  let w = 0;
  for (const ch of stripAnsi(s)) {
    const cp = ch.codePointAt(0);
    w += cp > 0x2E7F ? 2 : 1; // emoji/CJK = 2 cols
  }
  return w;
};

// pad left and right content to fill the terminal width
const termW = process.stdout.columns || 120;
const row = (left, right) => {
  const gap = Math.max(2, termW - vlen(left) - vlen(right));
  return left + ' '.repeat(gap) + right + R;
};

const SEP = `  ${C.sep}|${R}  `;
const ktok = n => {
  n = n || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  if (n <= 0)    return '0';
  return `${(n / 1000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}k`;  // e.g. 0.1k, 0.03k
};

// ── git helper ─────────────────────────────────────────────────────────────
const cwd = (data.workspace && data.workspace.current_dir) || data.cwd || process.cwd();
const git  = args => {
  try {
    return execSync(`git -C "${cwd}" ${args}`, {
      stdio: ['ignore', 'pipe', 'ignore'], timeout: 1000,
    }).toString().trim();
  } catch (_) { return ''; }
};

// ══════════════════════════════════════════════════════════════════════════
// LINE 1:  Model (effort)  |  Context X%  |  200K 🟢      In/Out: Xk/Xk (total: Xk)
// ══════════════════════════════════════════════════════════════════════════

const modelName = (data.model && (data.model.display_name || data.model.id)) || 'Claude';

// per-model "temperature" color (cool → hot); case-insensitive match
const mc = (() => {
  const n = modelName.toLowerCase();
  if (n.includes('fable') || n.includes('4.8') || n.includes('4-8')) return rgb(250,179,135); // peach — hottest
  if (n.includes('opus'))   return rgb(249,226,175);  // gold  — warm
  if (n.includes('sonnet')) return rgb(148,226,213);  // teal  — balanced
  if (n.includes('haiku'))  return rgb(137,180,250);  // blue  — cool
  return rgb(203,166,247);                            // lavender — fallback
})();

// effort: exposed as top-level effortLevel in Claude Code settings/status
let effortRaw = data.effortLevel
  || (data.model && (data.model.thinking_effort || data.model.thinkingEffort || data.model.effort))
  || data.thinking_effort || '';
if (!effortRaw) {
  // fall back to the configured default in settings.json
  try {
    const dir = process.env.CLAUDE_CONFIG_DIR || `${os.homedir()}/.claude`;
    effortRaw = JSON.parse(fs.readFileSync(`${dir}/settings.json`, 'utf8')).effortLevel || '';
  } catch (_) {}
}
const effortStr = effortRaw ? ` ${mc}(${effortRaw})${R}` : '';

// context % — parse last usage block from transcript
let inputTok = 0, outputTok = 0, cacheRead = 0, cacheWrite = 0;
try {
  const tp = data.transcript_path;
  if (tp && fs.existsSync(tp)) {
    const lines = fs.readFileSync(tp, 'utf8').trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const u = JSON.parse(lines[i]);
        const usage = u.message && u.message.usage;
        if (usage && usage.input_tokens != null) {
          cacheRead  = usage.cache_read_input_tokens     || 0;
          cacheWrite = usage.cache_creation_input_tokens || 0;
          inputTok   = (usage.input_tokens || 0) + cacheRead + cacheWrite;
          outputTok  = usage.output_tokens || 0;
          break;
        }
      } catch (_) {}
    }
  }
} catch (_) {}

// fall back to cumulative cost totals if transcript gave nothing
if (!inputTok && data.cost) {
  cacheRead  = data.cost.total_cache_read_input_tokens     || 0;
  cacheWrite = data.cost.total_cache_creation_input_tokens || 0;
  inputTok   = (data.cost.total_input_tokens || 0) + cacheRead + cacheWrite;
  outputTok  = data.cost.total_output_tokens || 0;
}

const ctxPct   = Math.min(100, Math.round((inputTok / 200_000) * 100));
const ctxColor = ctxPct < 50 ? C.ctxLo : ctxPct <= 70 ? C.ctxMid : C.ctxHi;
const over200k = data.exceeds_200k_tokens || ctxPct >= 100;

const l1left = [
  `${BOLD}${mc}${modelName}${R}${effortStr}`,
  `${ctxColor}Context ${ctxPct}%${R}`,
  `200K ${over200k ? '🔴' : '🟢'}`,
].join(SEP);

const totalTok  = inputTok + outputTok;
const readPct   = totalTok ? Math.round((cacheRead  / totalTok) * 100) : 0;
const writePct  = totalTok ? Math.round((cacheWrite / totalTok) * 100) : 0;
const l1right = `${C.dim}In/Out: ${R}${C.tokIn}${ktok(inputTok)}${R}${C.sep}/${R}${C.tokOut}${ktok(outputTok)}${R}${C.dim}  (total: ${C.tokTot}${ktok(totalTok)}${C.dim}, cache R/W: ${C.cacheR}${readPct}%${C.dim}/${C.cacheW}${writePct}%${C.dim})${R}`;

// ══════════════════════════════════════════════════════════════════════════
// LINE 2:  repo | branch | ?N !N        version: X  latest: X
// ══════════════════════════════════════════════════════════════════════════

let l2left;
const branch = git('rev-parse --abbrev-ref HEAD');

if (branch) {
  const root     = git('rev-parse --show-toplevel');
  const repoName = root ? root.replace(/\\/g, '/').split('/').pop() : '';

  const statusOut = git('status --porcelain');
  let untracked = 0, modified = 0;
  for (const l of (statusOut ? statusOut.split('\n') : [])) {
    if (!l) continue;
    if (l.startsWith('??')) untracked++;
    else modified++;  // any tracked change (robust to the helper's .trim())
  }

  // git status as soft colored boxes: green ■ clean, yellow ■ modified, red ■ untracked
  const box = (color, n) => `${color}■ ${n}${R}`;
  const filesStr = (!untracked && !modified)
    ? `${C.boxClean}■${R}`
    : [
        untracked ? box(C.boxUntr, untracked) : '',
        modified  ? box(C.boxMod,  modified)  : '',
      ].filter(Boolean).join('   ');

  l2left = [
    `${BOLD}${C.repo}${repoName}${R}`,
    `${C.branch}${branch}${R}`,
    filesStr,
  ].join(SEP);
} else {
  const shortCwd = cwd.replace(/\\/g, '/');
  l2left = `${C.dim}— no repo —${R}${SEP}${C.dim}${shortCwd}${R}`;
}

// version check — cached to tmp for 1 h to avoid npm round-trip every render
const currentVer = data.version || '';
let latestVer = '';
try {
  const cache = JSON.parse(fs.readFileSync(`${os.tmpdir()}/ccver.json`, 'utf8'));
  latestVer = (Date.now() - cache.ts < 3_600_000) ? cache.ver : '';
} catch (_) {}

if (!latestVer) {
  try {
    latestVer = execSync('npm view @anthropic-ai/claude-code version', {
      stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000,
    }).toString().trim();
    fs.writeFileSync(`${os.tmpdir()}/ccver.json`, JSON.stringify({ ver: latestVer, ts: Date.now() }));
  } catch (_) {}
}

// show only the pending update (yellow) when out of date; otherwise gray "up to date"
let l2right;
if (latestVer && currentVer && latestVer !== currentVer) {
  l2right = `${C.untr}↑ ${latestVer}${R}`;            // pending update
} else if (latestVer && currentVer) {
  l2right = `${C.dim}${currentVer} up to date${R}`;     // up to date
} else {
  l2right = `${C.dim}${currentVer || '…'}${R}`;         // latest unknown
}

// ── output ─────────────────────────────────────────────────────────────────
process.stdout.write(row(l1left, l1right) + '\n' + row(l2left, l2right) + '\n');
