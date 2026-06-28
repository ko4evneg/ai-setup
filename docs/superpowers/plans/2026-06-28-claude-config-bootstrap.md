# Claude Code Config Bootstrap — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `ai-setup` into a clone-and-talk config repo whose `CLAUDE.md` drives a running Claude to install a status line into the live Claude config dir on any OS.

**Architecture:** A single driver file (`CLAUDE.md`) documents prerequisites, holds an inline manifest of config payloads under `config/`, and describes the apply procedure a running Claude follows on "set me up". Machine-specific paths are resolved at apply time via the `${CLAUDE_HOME}` placeholder (written with forward slashes). Phase 1 ships two payloads: `settings.json` (merge) and `statusline.js` (copy).

**Tech Stack:** Markdown (driver + docs), JSON (settings), Node.js (status line script + verification), Git. No build system; no app to run.

## Global Constraints

- **OS-agnostic output:** applied files use forward-slash separators; never emit Windows backslash paths.
- **Secrets never committed:** Phase 1 has no secrets; no real credential ever lands in the repo.
- **Idempotent & safe:** re-runnable; back up any existing destination file to `<file>.bak.<unix-timestamp>` before overwrite/merge.
- **Trigger:** talk to `CLAUDE.md` — the phrase is "set me up". No slash command, no install script.
- **Node.js optional** — required only for the status line (it runs as a Node script); the native Claude binary bundles no general-purpose `node`. Setup gates the status line on `node` and skips it with a message when absent. Any helper would be `.mjs` — none in Phase 1.
- **Only placeholder in Phase 1:** `${CLAUDE_HOME}` → the live Claude config dir.
- **Driver is authoritative:** `CLAUDE.md` holds the procedure; `docs/` is the human companion.

---

## Implementation deltas (post-plan)

The shipped `CLAUDE.md`, `README.md`, and `docs/setup-guide.md` are the source of
truth; they extend the task code-blocks below with approved refinements made
during execution:

- **Node is optional; the status line is gated on it.** The shipped manifest has a
  **Requires** column; when `node` is not on PATH, setup skips the status line
  with a message instead of failing. This supersedes the Global Constraint
  "Node.js assumed present" — the native Claude binary bundles no general-purpose
  `node`, so Node is needed only for the status line, not for setup overall.
- **`${CLAUDE_HOME}` honors `$CLAUDE_CONFIG_DIR`** when set, else the OS-default
  `~/.claude`.
- **Placeholder resolution is a literal `${CLAUDE_HOME}` swap.** `copy`-mode
  payloads (e.g. `statusline.js`, which contains JS template literals) are written
  byte-for-byte — no general `${...}` scan.

The task steps below predate these refinements; follow the shipped files where
they differ.

## File Structure

- `CLAUDE.md` — **rewrite.** The driver: intro, prerequisites, inline manifest, apply procedure, scope notes.
- `config/settings/settings.json` — **create** (relocated + normalized from `settings/settings.json`). Settings payload wiring the status line.
- `config/statusline/statusline.js` — **create** (verbatim relocation of `settings/statusline.js`). The status-line script.
- `README.md` — **create.** Human quickstart: prereqs, "set me up", what it configures.
- `docs/setup-guide.md` — **create.** Per-category detail, sandbox self-test, troubleshooting.
- `.gitignore` — **create.** Ignore `*.local`, backups, sandbox output.
- `settings/settings.json`, `settings/statusline.js` — **delete** (relocated into `config/`).

All shell commands below assume the Bash tool (Git Bash on Windows: `sed`/`cp`/`wc`/`node` available).

---

### Task 1: Relocate & normalize seed payloads; add `.gitignore`

**Files:**
- Create: `config/statusline/statusline.js` (verbatim move of `settings/statusline.js`)
- Create: `config/settings/settings.json` (normalized)
- Create: `.gitignore`
- Delete: `settings/settings.json`, `settings/statusline.js`

**Interfaces:**
- Produces: payloads at `config/settings/settings.json` and `config/statusline/statusline.js`; the normalized status-line command string `node ${CLAUDE_HOME}/statusline.js`. Tasks 2–3 reference these exact paths and that string.

- [ ] **Step 1: Move the status-line script verbatim** (content must not change)

```bash
mkdir -p config/statusline
mv settings/statusline.js config/statusline/statusline.js
```

- [ ] **Step 2: Create the normalized settings payload**

Create `config/settings/settings.json` with exactly:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ${CLAUDE_HOME}/statusline.js"
  }
}
```

(The original used `CLAUDE_HOME\statusline.js` with a Windows backslash; this normalizes the token to `${CLAUDE_HOME}` and the separator to `/`.)

- [ ] **Step 3: Remove the now-empty old directory**

```bash
rm -f settings/settings.json
rmdir settings 2>/dev/null || true
```

- [ ] **Step 4: Create `.gitignore`**

Create `.gitignore` with exactly:

```gitignore
# Local, machine-specific — never committed
*.local
secrets.local

# Backups created during apply
*.bak.*

# Sandbox rehearsal output
.sandbox/
```

- [ ] **Step 5: Verify JSON validity and normalization**

```bash
node -e "JSON.parse(require('fs').readFileSync('config/settings/settings.json','utf8'))" && echo VALID_JSON
grep -F 'node ${CLAUDE_HOME}/statusline.js' config/settings/settings.json
grep -c '\\' config/settings/settings.json
```

Expected: first line prints `VALID_JSON`; second prints the matching command line; third prints `0` (no backslashes).

- [ ] **Step 6: Smoke-test the status-line script**

```bash
echo '{}' | node config/statusline/statusline.js | wc -l
```

Expected: `2` (two rendered rows), exit code 0. (Offline is fine — the script swallows the npm version-check error and still prints two lines.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Relocate seed payloads to config/, normalize statusLine path, add .gitignore"
```

---

### Task 2: Rewrite `CLAUDE.md` as the setup driver

**Files:**
- Modify: `CLAUDE.md` (replace the existing Windows-oriented content entirely)

**Interfaces:**
- Consumes: `config/settings/settings.json`, `config/statusline/statusline.js` (Task 1); the `${CLAUDE_HOME}` token.
- Produces: the documented apply procedure + inline manifest that README/setup-guide (Task 3) reference.

- [ ] **Step 1: Replace `CLAUDE.md` with the driver**

Write `CLAUDE.md` with exactly:

````markdown
# ai-setup — Claude Code config, clone-and-talk

Reproduce a Claude Code configuration on any machine, any OS, by *talking to it*.
You install and authenticate Claude Code yourself, open it in this repo, and say
**"set me up."** This file is the driver: it tells a running Claude how to apply
the payloads in `config/` into your live Claude configuration directory.

## Prerequisites (manual, once per machine)

1. Install **Node.js** (needed only for the status line).
2. Install and **authenticate Claude Code**. A running Claude cannot install or
   authenticate itself — this is the one manual step.
3. Clone this repo and open Claude Code with this repo as the working directory.

## How to run

In a Claude Code session opened in this repo, say: **"set me up."** Claude
follows the procedure below. Nothing is written until you approve a preview.

## What gets configured (manifest)

| Category   | Source                            | Destination                    | Mode  |
|------------|-----------------------------------|--------------------------------|-------|
| settings   | `config/settings/settings.json`   | `${CLAUDE_HOME}/settings.json` | merge |
| statusline | `config/statusline/statusline.js` | `${CLAUDE_HOME}/statusline.js` | copy  |

- `${CLAUDE_HOME}` is the live Claude config directory for the current OS/user
  (e.g. `C:/Users/<you>/.claude` on Windows, `~/.claude` elsewhere). Resolved
  automatically — never hardcode it.
- **merge**: deep-merge JSON into any existing file; repo values win on
  conflicts; keep unknown local keys.
- **copy**: overwrite the destination.
- Existing destination files are backed up first (see procedure).

## Setup procedure (Claude follows this on "set me up")

1. **Detect environment.** Determine the OS and resolve `${CLAUDE_HOME}` (the
   live Claude config dir). Confirm Claude Code is installed and authenticated;
   if not, stop and point to Prerequisites. Write all paths with forward slashes
   — never Windows backslashes.
2. **Read this manifest.** For each row: source, destination, mode.
3. **Resolve placeholders.** Phase 1 has exactly one: `${CLAUDE_HOME}`. Replace
   it in payload content with the resolved absolute path (forward slashes). No
   secrets are requested.
4. **Preview.** Show the user, per category: destination path, whether it will be
   created / merged / overwritten, and what will be backed up. Wait for explicit
   approval before writing anything.
5. **Apply** each category:
   - Back up any existing destination file to `<destination>.bak.<unix-timestamp>`
     first.
   - **settings** (merge): deep-merge the resolved `config/settings/settings.json`
     into `${CLAUDE_HOME}/settings.json` (create it if absent).
   - **statusline** (copy): write `config/statusline/statusline.js` to
     `${CLAUDE_HOME}/statusline.js`.
6. **Verify.** Re-read each written file: `settings.json` must be valid JSON and
   its `statusLine.command` must point at the resolved `statusline.js` path with
   forward slashes; `statusline.js` must run (`echo '{}' | node
   ${CLAUDE_HOME}/statusline.js` prints two lines). Report a per-category summary.
7. **Done.** Tell the user to restart Claude Code to see the status line.

Re-running is safe: backups are taken before each overwrite/merge.

## Scope notes

- Phase 1 ships the two payloads above. New categories are added by dropping a
  payload under `config/` and adding a manifest row — the procedure does not
  change.
- **Secrets** (e.g. MCP tokens) are not handled yet; they'll be added with
  interactive prompting when the first payload that needs one is introduced. Real
  secrets are never committed to this repo.
- See `docs/setup-guide.md` for details, a manual sandbox rehearsal, and
  troubleshooting.
````

- [ ] **Step 2: Verify required anchors are present**

```bash
for s in "set me up" "CLAUDE_HOME" "config/settings/settings.json" "config/statusline/statusline.js" "merge" "copy" "back up" "Prerequisites"; do
  grep -qi "$s" CLAUDE.md && echo "found: $s" || echo "MISSING: $s"
done
```

Expected: every line begins `found:`; no `MISSING:`.

- [ ] **Step 3: Rehearse the procedure against a sandbox** (proves the procedure as written produces correct output)

```bash
rm -rf .sandbox && mkdir -p .sandbox
SB="$(pwd)/.sandbox"
# Step 3 of the procedure: resolve ${CLAUDE_HOME} -> sandbox path
sed "s#\${CLAUDE_HOME}#${SB}#g" config/settings/settings.json > .sandbox/settings.json
# Step 5: copy the statusline payload
cp config/statusline/statusline.js .sandbox/statusline.js
# Step 6: verify
node -e "const j=JSON.parse(require('fs').readFileSync('.sandbox/settings.json','utf8')); const c=j.statusLine.command; if(c.includes('\\\\')||!c.endsWith('/statusline.js')){throw new Error('bad command: '+c)} console.log('resolved:', c)"
echo '{}' | node .sandbox/statusline.js | wc -l
```

Expected: prints `resolved: node <abs-sandbox-path>/statusline.js` (forward slashes), then `2`.

- [ ] **Step 4: Verify backup-on-rerun behavior**

```bash
cp .sandbox/settings.json ".sandbox/settings.json.bak.$(date +%s)"
ls .sandbox/settings.json.bak.* >/dev/null && echo "backup OK"
rm -rf .sandbox
```

Expected: prints `backup OK`. (This validates the `<file>.bak.<timestamp>` convention the procedure mandates.)

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "Rewrite CLAUDE.md as the OS-agnostic setup driver (inline manifest + procedure)"
```

---

### Task 3: Add `README.md` and `docs/setup-guide.md`

**Files:**
- Create: `README.md`
- Create: `docs/setup-guide.md`

**Interfaces:**
- Consumes: the `CLAUDE.md` procedure + manifest (Task 2); payload paths (Task 1).
- Produces: human-facing entry docs. No downstream consumer in Phase 1.

- [ ] **Step 1: Create `README.md`**

Write `README.md` with exactly:

````markdown
# ai-setup

Reproduce a Claude Code setup on any machine — any OS — by cloning this repo and
talking to it. No install scripts: a running Claude reads this repo and applies
the config for you.

## Prerequisites

- **Node.js** installed.
- **Claude Code** installed and authenticated. A running Claude can't install or
  authenticate itself — do this once, manually.

## Quickstart

```bash
git clone <repo-url> ai-setup
cd ai-setup
# open Claude Code with this folder as the working directory, then say:
#   set me up
```

Claude reads `CLAUDE.md`, shows a preview of exactly what it will write and where,
and applies it only after you approve. Existing files are backed up first.

## What it configures (Phase 1)

- A two-line **status line** (`config/statusline/statusline.js`) wired up via
  `settings.json`.

The set of things it configures grows over time; see `CLAUDE.md` for the live
manifest and `docs/setup-guide.md` for details, a self-test, and troubleshooting.

## Notes

- **OS-agnostic:** machine-specific paths are resolved at setup time
  (`${CLAUDE_HOME}` → your live config dir) and written with forward slashes.
- **Secrets are never committed.** Credential handling (interactive prompts) is
  added when a payload first needs one.
````

- [ ] **Step 2: Create `docs/setup-guide.md`**

Write `docs/setup-guide.md` with exactly:

````markdown
# Setup guide

What `set me up` does, how to verify it yourself, and how to fix common issues.
The authoritative procedure lives in `CLAUDE.md`; this is the human companion.

## What each category does

| Category   | Source                            | Destination                    | Mode  | Effect |
|------------|-----------------------------------|--------------------------------|-------|--------|
| settings   | `config/settings/settings.json`   | `${CLAUDE_HOME}/settings.json` | merge | Deep-merges into your existing settings; repo values win on conflicts, your other keys are preserved. |
| statusline | `config/statusline/statusline.js` | `${CLAUDE_HOME}/statusline.js` | copy  | Installs the two-line status-line script. |

`${CLAUDE_HOME}` is your live Claude config directory (`C:/Users/<you>/.claude`
on Windows, `~/.claude` elsewhere), resolved automatically at setup. Paths are
written with forward slashes so the same value works on every OS.

## Self-test: rehearse against a sandbox

Prove the apply works without touching your real config. From the repo root, in a
Bash shell:

```bash
rm -rf .sandbox && mkdir -p .sandbox
SB="$(pwd)/.sandbox"
sed "s#\${CLAUDE_HOME}#${SB}#g" config/settings/settings.json > .sandbox/settings.json
cp config/statusline/statusline.js .sandbox/statusline.js
node -e "const j=JSON.parse(require('fs').readFileSync('.sandbox/settings.json','utf8')); console.log('command =', j.statusLine.command)"
echo '{}' | node .sandbox/statusline.js
rm -rf .sandbox
```

Expected: `command = node <abs-sandbox-path>/statusline.js` (forward slashes) and
two rendered status-line rows.

## Backups

Before overwriting or merging an existing file, setup copies it to
`<file>.bak.<unix-timestamp>` in the same directory. To roll back, restore the
most recent `.bak.*`.

## Troubleshooting

- **Status line doesn't appear:** restart Claude Code. Confirm
  `${CLAUDE_HOME}/settings.json` has `statusLine.command` pointing at the real
  `statusline.js` path, and that `node` is on your PATH.
- **`node: command not found`:** install Node.js; required by both Claude Code
  and the status-line script.
- **Merged settings look wrong:** check the timestamped backup beside
  `settings.json`, then re-apply or restore the backup.

## Not handled yet

- **Secrets / credentials** (e.g. MCP tokens) — added with interactive prompts
  when the first payload needs one. Real secrets are never committed.
````

- [ ] **Step 3: Verify required anchors in both files**

```bash
for s in "set me up" "Node.js" "authenticat"; do
  grep -qi "$s" README.md && echo "README found: $s" || echo "README MISSING: $s"
done
for s in "sandbox" "CLAUDE_HOME" "Backups" "Troubleshooting"; do
  grep -qi "$s" docs/setup-guide.md && echo "guide found: $s" || echo "guide MISSING: $s"
done
```

Expected: every line begins `... found:`; no `MISSING:`.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/setup-guide.md
git commit -m "Add README and setup guide (quickstart, sandbox self-test, troubleshooting)"
```

---

## Self-Review

**1. Spec coverage (Phase 1 subset of `2026-06-28-claude-config-bootstrap-design.md`):**
- Repo scaffold + relocate/normalize seed payloads → Task 1. ✓
- `.gitignore` (ignore `*.local`, backups) → Task 1. ✓
- `CLAUDE.md` driver with inline manifest + apply procedure → Task 2. ✓
- `${CLAUDE_HOME}`-only resolution, forward-slash output → Task 1 (normalization) + Task 2 (procedure, rehearsal). ✓
- settings `merge`, statusline `copy`, timestamped backups, preview, verify → Task 2 (procedure text + sandbox rehearsal + backup check). ✓
- README + setup-guide + manual rehearsal → Task 3. ✓
- Deferred (secrets machinery, standalone `manifest.md`, apply helper script) → explicitly out of Phase 1 per spec "Phasing". ✓ No gaps.

**2. Placeholder scan:** No "TBD/TODO/handle edge cases" placeholders; every file's full content is shown; every verification has exact commands + expected output.

**3. Type/path consistency:** `config/settings/settings.json`, `config/statusline/statusline.js`, `${CLAUDE_HOME}`, and the command string `node ${CLAUDE_HOME}/statusline.js` are used identically across Tasks 1–3.
