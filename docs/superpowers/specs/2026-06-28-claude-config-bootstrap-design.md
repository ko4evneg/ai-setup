# Claude Code config bootstrap — design spec

**Date:** 2026-06-28
**Status:** Approved (design); pending implementation plan

## Overview

`ai-setup` is a config repo you reproduce by *talking to it*. On a fresh machine
you install and authenticate Claude Code yourself (documented prereq), clone this
repo, open Claude Code inside it, and say **"set me up."** `CLAUDE.md` is the
driver: Claude reads it, discovers the config payloads in the repo, asks you for
any secrets, and writes resolved config into the live Claude config directory for
whatever OS you are on.

It is OS-agnostic because *Claude* adapts the paths and steps at apply time —
there is no mandatory per-OS install script. (Helper scripts are allowed when
genuinely useful; see "Scripts policy".)

This replaces the original Windows-only `install.ps1` framing.

## Goals

- One repeatable way to bring a fresh machine's Claude Code config up to the
  user's standard, on any OS.
- The repo is the source of truth for config plus the procedure to apply it.
- A running Claude instance does the work, driven by `CLAUDE.md`, prompting the
  user for inputs (notably secrets) as needed.
- Scope is extensible: new config categories can be added over time without
  rewriting the procedure.

## Non-goals (YAGNI)

- Installing or authenticating Claude Code itself — that is a manual,
  documented prerequisite (a running Claude cannot install/auth itself).
- Encrypted-in-repo secrets (sops/age/git-crypt).
- A mandatory per-OS install script as the entry point.
- Generic multi-user templating — this is the user's own opinionated config.

## Phasing

Implementation is incremental. **Phase 1 (the current plan)** is deliberately
minimal:

- Repo scaffold + relocate/normalize the two seed payloads.
- A single driver file, `CLAUDE.md`, that contains the manifest **inline** (as a
  section) plus the apply procedure — no separate `manifest.md` yet.
- `${CLAUDE_HOME}` is the only placeholder resolved (`${OS}` only if a step needs
  it).
- Apply three categories — `statusline.js` (copy), `settings.json` (merge; carries
  model/effort/theme/statusLine-wiring/plugin-enable-flags), and `plugins`
  (install superpowers via the `claude` CLI) — with timestamped backups; preview
  before writing; verify after.
- **`node` is needed only to *render* the status line.** Every category still
  applies without it (the bar just won't draw until Node is on PATH); settings and
  plugins don't need Node at all.
- README + setup-guide, including a manual sandbox rehearsal.

**Deferred to later phases (built when first needed):**

- Interactive secrets machinery (`secrets.example`, `secrets.local`, prompting,
  the manifest "Secrets" column) — added when the first MCP server or hook needs
  a token.
- Splitting the manifest out into a standalone `manifest.md` once categories grow.
- Any deterministic apply helper script, if hand-application proves fragile.

The sections below describe the full design; Phase 1 implements the subset above.

## Locked decisions

| Decision | Choice |
|---|---|
| Execution model | Claude-driven, config only. Install/auth is a manual prereq. |
| Trigger | Talk to `CLAUDE.md` ("set me up"); no slash command or packaged skill. |
| Scope | Extensible via a manifest; categories defined/grown incrementally. |
| Placeholders | Two classes: **auto-resolved** (paths/env, e.g. `${CLAUDE_HOME}`) filled from environment detection, no prompt; **interactive secrets** (`${TOKEN}`) prompted. |
| Secrets | Secret tokens in tracked files, resolved interactively; never committed. Optional gitignored cache for re-runs. |
| Path output | Applied files use cross-platform separators (forward slashes); never emit Windows-specific backslash paths. |
| Manifest format | Markdown table (human- and Claude-readable). |
| settings.json / MCP | `merge` apply mode. |
| statusline / keybindings | `copy` apply mode (overwrite + backup). |
| memory | `init` apply mode (create only if absent). |
| Scripts | Allowed when necessary as helpers; not the front door. Prefer cross-platform `.mjs`. |

## Principles

- **Repo = source of truth + procedure.** No imperative install scripts as the
  primary mechanism.
- **Convention-based & extensible.** Config categories are rows in a manifest;
  adding one means adding files + a manifest row, not rewriting the procedure.
- **Secrets never committed.** Placeholders in tracked files; real values
  collected interactively; resolved output lands only in the live config dir
  (outside the repo).
- **Idempotent & safe.** Re-runnable; back up existing target files before
  touching them.
- **Cross-platform at apply time.** Claude resolves the config dir and adapts
  steps for the current OS when it runs. Auto-resolved path placeholders (e.g.
  `${CLAUDE_HOME}`) are filled from environment detection, and applied output
  uses forward-slash separators — never Windows-specific backslashes.

## Repo layout

```
ai-setup/
  CLAUDE.md              # THE driver: setup procedure Claude follows + human docs
  README.md              # prereqs (install+auth Claude Code) + "open Claude here, say 'set me up'"
  manifest.md            # registry: category -> source, destination, apply-mode, required secrets
  config/                # tracked payloads (with ${PLACEHOLDER} tokens for secrets)
    settings/settings.json
    statusline/statusline.js
    keybindings/keybindings.json
    mcp/...              # MCP server defs w/ ${TOKENS}
    hooks/...            # hook scripts and/or settings fragments
    memory/...           # seed memory + MEMORY.md template
  secrets/
    secrets.example      # required secret keys: name, purpose, where to get it (tracked)
  scripts/               # optional cross-platform helpers (.mjs) invoked by the procedure
  docs/
    setup-guide.md       # what each category does, troubleshooting
    superpowers/specs/   # design specs (this file)
  .gitignore             # ignores secrets.local, backups, etc.
```

## Manifest format

A Markdown table is the registry Claude reads to know what to apply. Example:

| Category | Source | Destination | Mode | Secrets |
|---|---|---|---|---|
| settings | `config/settings/settings.json` | `<claude-dir>/settings.json` | merge | — |
| statusline | `config/statusline/statusline.js` | `<claude-dir>/statusline.js` | copy | — |
| keybindings | `config/keybindings/keybindings.json` | `<claude-dir>/keybindings.json` | copy | — |
| mcp | `config/mcp/*` | `<claude-dir>/...` | merge | `${GITHUB_TOKEN}`, ... |
| memory | `config/memory/*` | `<claude-dir>/projects/.../memory/` | init | — |

`<claude-dir>` is resolved per-OS at apply time (e.g. `~/.claude` /
`C:\Users\<user>\.claude`). Growing scope = add a row + the payload files.

## Seed payloads (already in the repo)

Two initial config payloads already exist at the repo root under `settings/` and
will be relocated under `config/` per the layout above:

- `settings/settings.json` → `config/settings/settings.json`. Wires the status
  line; uses the `${CLAUDE_HOME}` auto-resolved placeholder (currently a bare
  `CLAUDE_HOME` + `\` to be normalized). Apply mode: **merge**.
- `settings/statusline.js` → `config/statusline/statusline.js`. A self-contained,
  cross-platform Node status line (model/effort, context %, token in/out; repo /
  branch / dirty counts; version-vs-latest with a 1h npm cache). Apply mode:
  **copy**.

## Setup procedure (what CLAUDE.md instructs Claude to do)

1. **Detect environment** — determine OS and the live Claude config directory
   (`$CLAUDE_CONFIG_DIR` if set, else the OS-default `~/.claude`). Confirm Claude
   Code is installed/authed; if not, point to README prereqs and stop.
2. **Read manifest** — enumerate categories (source, destination, apply-mode,
   declared secrets).
3. **Resolve placeholders** — substitute only **known reserved/declared tokens**,
   by exact literal match, and only in **templated/merge payloads**.
   **Auto-resolved** tokens (reserved names like `${CLAUDE_HOME}`, `${OS}`) are
   filled from step-1 environment detection with no prompt; **secret** tokens
   (declared in the manifest / `secrets.example`) are resolved from the optional
   gitignored `secrets.local` cache or environment, then the user is prompted for
   anything still missing. Do **not** treat every `${...}` as a placeholder:
   `copy`-mode payloads are written byte-for-byte, and files like `statusline.js`
   contain JS template literals (`${ctxPct}`, …) that must be left intact. Never
   write resolved secret values back into tracked files.
4. **Preview & confirm** — show what will be created vs. merged vs. overwritten,
   and what gets backed up. Wait for go-ahead.
5. **Apply each category** per its mode (see below).
6. **Verify** — re-read outputs, validate JSON, sanity-check that statusline runs;
   print a per-category summary.
7. **Offer to cache** resolved secrets into gitignored `secrets.local` for
   painless re-runs.

## Apply modes

- **`merge`** — deep-merge JSON; repo values win on conflicts; preserve unknown
  local keys. Used for `settings.json`, MCP config, settings-based hooks. Back up
  the existing file first.
- **`copy`** — overwrite after a timestamped backup. Used for `statusline.js`,
  `keybindings.json`, standalone hook scripts.
- **`init`** — create only if absent; never clobber. Used for memory seed files.

## Placeholders

All placeholders use `${NAME}` syntax and fall into two classes:

- **Auto-resolved** — reserved names filled from environment detection (step 1),
  with no user prompt. Initial reserved set:
  - `${CLAUDE_HOME}` → the live Claude config directory: `$CLAUDE_CONFIG_DIR` if
    set, else the OS default for the current user.
  - `${OS}` → the detected platform, when a step needs to branch on it.
  Auto-resolved values are emitted with cross-platform separators (forward
  slashes). Example: the seed `settings.json` wires the status line as
  `"command": "node ${CLAUDE_HOME}/statusline.js"`, resolving to an absolute path
  under the live config dir at apply time. (The current seed file uses a bare
  `CLAUDE_HOME` with a Windows `\` separator; implementation normalizes it to
  `${CLAUDE_HOME}` + forward slash.)
- **Secrets** — `${NAME}` tokens **declared in the manifest / `secrets.example`**
  (not arbitrary `${...}`); resolved interactively (see below). Tokens in
  `copy`-mode payloads or code — e.g. JS template literals in `statusline.js` —
  are never treated as placeholders.

The manifest's "Secrets" column lists only secret tokens. Reserved auto-resolved
names are documented here, not per-category.

## Secrets handling

- Tracked files contain secret `${NAME}` placeholders.
- `secrets/secrets.example` documents each required secret: name, purpose, where
  to obtain it.
- At apply time, resolution order: `secrets.local` cache → environment → prompt
  the user.
- Resolved values are written **only** to the live config dir and (optionally)
  the gitignored `secrets.local`. Claude must refuse to write a resolved secret
  into any tracked repo file.
- `.gitignore` covers `secrets.local`, `*.local`, and backup files.

## Scripts policy

- Talk-to-`CLAUDE.md` is the front door. Most steps are inline, Claude-driven.
- A helper script is permitted when it is the more reliable or repeatable tool
  for a specific step (e.g., a non-trivial file transform, a validation/sanity
  check, invoking Node to verify the statusline).
- Prefer cross-platform helpers: since Claude Code requires Node.js, helpers
  should be Node (`.mjs`) rather than per-OS shell scripts. Where a shell step is
  unavoidable, Claude selects/generates the right variant per-OS at apply time.
- Helpers live under `scripts/` and are referenced from the manifest or the
  procedure. They never become a mandatory single-entry install script.

## Error handling

- **Missing prereq** (Claude Code not installed/authed) → stop with a pointer to
  README prereqs.
- **Existing target files** → always create a timestamped backup before
  merge/overwrite.
- **Invalid JSON after merge** → abort that category, restore the backup, report.
- **Unknown OS / config path** → ask the user to confirm the directory.
- **Partial failure** → report per-category success/failure; the procedure is
  idempotent and safe to re-run.

## Verification / testing

There is no application to run, so the guardrails are procedural:

- **Step-4 preview** before any write (the primary guard).
- **Step-6 verification**: JSON parses, files exist at destinations, statusline
  runs without error (optionally invoke Node), MCP config is valid.
- **Optional sandbox mode**: target a temp directory instead of the live config
  dir to rehearse the full procedure end-to-end.
- `docs/setup-guide.md` carries a manual confirmation checklist.

## Open items (to settle during implementation)

- Exact initial set of config categories to ship in `config/` (grows over time).
- Precise memory destination path convention across OSes.
- Whether `secrets.local` caching is on by default or opt-in per run.
- Final reserved auto-resolved token set beyond `${CLAUDE_HOME}` / `${OS}`.
