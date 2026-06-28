# ai-setup — Claude Code config, clone-and-talk

Reproduce a Claude Code configuration on any machine, any OS, by *talking to it*.
You install and authenticate Claude Code yourself, open it in this repo, and say
**"set me up."** This file is the driver: it tells a running Claude how to apply
the payloads in `config/` into your live Claude configuration directory.

## Prerequisites (manual, once per machine)

1. Install and **authenticate Claude Code** (the native binary is fine). A running
   Claude cannot install or authenticate itself — this is the one required manual
   step.
2. **Node.js** is required *only for the status line* (it runs as a Node script).
   Native Claude does not bundle a general-purpose `node`. Install Node.js LTS if
   you want the status line; otherwise setup skips it. No other category needs
   Node.
3. Clone this repo and open Claude Code with this repo as the working directory.

## How to run

In a Claude Code session opened in this repo, say: **"set me up."** Claude
follows the procedure below. Nothing is written until you approve a preview.

## What gets configured (manifest)

| Category   | Source                            | Destination                    | Mode  | Requires                  |
|------------|-----------------------------------|--------------------------------|-------|---------------------------|
| statusline | `config/statusline/statusline.js` | `${CLAUDE_HOME}/statusline.js` | copy  | `node` on PATH            |
| settings   | `config/settings/settings.json`   | `${CLAUDE_HOME}/settings.json` | merge | `node` (wires statusline) |

- `${CLAUDE_HOME}` is the live Claude config directory: **`$CLAUDE_CONFIG_DIR` if
  that environment variable is set**, otherwise the OS default
  (`C:/Users/<you>/.claude` on Windows, `~/.claude` elsewhere). Resolved
  automatically — never hardcode it.
- **merge**: deep-merge JSON into any existing file; repo values win on
  conflicts; keep unknown local keys.
- **copy**: overwrite the destination.
- **Requires**: a category whose requirement is unmet is skipped with a clear
  message (see procedure).
- Existing destination files are backed up first.

## Setup procedure (Claude follows this on "set me up")

1. **Detect environment.** Determine the OS and resolve `${CLAUDE_HOME}`: use
   `$CLAUDE_CONFIG_DIR` if that variable is set, otherwise the OS-default
   `~/.claude` (`C:/Users/<you>/.claude` on Windows). Confirm Claude Code is
   installed and authenticated; if not, stop and point to Prerequisites. Write all
   paths with forward slashes — never Windows backslashes.
2. **Check dependencies.** Detect whether `node` is on PATH. Record it; it gates
   the status-line category below.
3. **Read this manifest.** For each row: source, destination, mode, requirement.
4. **Resolve placeholders.** Replace the **exact literal token `${CLAUDE_HOME}`**
   (the only Phase 1 placeholder) with the resolved absolute path (forward
   slashes). Do **not** scan for or rewrite any other `${...}` — e.g.
   `statusline.js` contains JS template literals like `${ctxPct}` that must stay
   intact. Substitution applies only to merge/templated payloads; **copy-mode
   payloads are written byte-for-byte** with no substitution. No secrets are
   requested.
5. **Preview.** Show the user, per category: destination path; create / merge /
   overwrite; what will be backed up; and any category that will be **skipped**
   because its requirement is unmet (e.g. status line skipped — `node` not found).
   Wait for explicit approval before writing anything.
6. **Apply** each category whose requirement is met:
   - Back up any existing destination file to `<destination>.bak.<unix-timestamp>`
     first.
   - **statusline** (copy, requires `node`): write
     `config/statusline/statusline.js` to `${CLAUDE_HOME}/statusline.js`.
   - **settings** (merge, requires `node`): deep-merge the resolved
     `config/settings/settings.json` into `${CLAUDE_HOME}/settings.json` (create
     it if absent). In Phase 1 this only wires the status line, so it shares the
     `node` requirement.
   - If `node` is absent: skip both, and tell the user to install Node.js LTS and
     re-run "set me up" to enable the status line.
7. **Verify.** For applied categories: `settings.json` must be valid JSON and its
   `statusLine.command` must point at the resolved `statusline.js` path with
   forward slashes; `statusline.js` must run (`node ${CLAUDE_HOME}/statusline.js`
   with `{}` on stdin prints two lines). Report a per-category summary, including
   anything skipped.
8. **Done.** Tell the user to restart Claude Code to see the status line.

Re-running is safe: backups are taken before each overwrite/merge, and a category
skipped for a missing requirement is simply applied on a later run once the
requirement is met.

## Scope notes

- Phase 1 ships the two payloads above (both currently serve the status line).
  New categories are added by dropping a payload under `config/` and adding a
  manifest row — the procedure does not change.
- **Secrets** (e.g. MCP tokens) are not handled yet; they'll be added with
  interactive prompting when the first payload that needs one is introduced. Real
  secrets are never committed to this repo.
- See `docs/setup-guide.md` for details, a manual sandbox rehearsal, and
  troubleshooting.
