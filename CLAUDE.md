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
| statusline | `config/statusline/statusline.js` | `${CLAUDE_HOME}/statusline.js` | copy    | `node` to render       |
| settings   | `config/settings/settings.json`   | `${CLAUDE_HOME}/settings.json` | merge   | —                      |
| plugins    | `anthropics/claude-plugins-official` → `superpowers` | `${CLAUDE_HOME}/plugins/` | install | `claude` CLI + network |

- `${CLAUDE_HOME}` is the live Claude config directory: **`$CLAUDE_CONFIG_DIR` if
  that environment variable is set**, otherwise the OS default
  (`C:/Users/<you>/.claude` on Windows, `~/.claude` elsewhere). Resolved
  automatically — never hardcode it.
- **merge**: deep-merge JSON into any existing file; repo values win on
  conflicts; keep unknown local keys.
- **copy**: overwrite the destination.
- **install**: register the marketplace and install the plugin via the `claude`
  CLI (not a file copy); idempotent — safe to re-run.
- **Requires**: `node` is needed only to *render* the status line — every payload
  still applies without it (the status line just won't show until Node is on
  PATH). The `plugins` step needs the `claude` CLI + network.
- Existing destination files are backed up first.
- **Apply order = manifest order, top-to-bottom.** The **status line is the
  first customization step**; future customizations append below it.

## Setup procedure (Claude follows this on "set me up")

1. **Detect environment.** Determine the OS and resolve `${CLAUDE_HOME}`: use
   `$CLAUDE_CONFIG_DIR` if that variable is set, otherwise the OS-default
   `~/.claude` (`C:/Users/<you>/.claude` on Windows). Confirm Claude Code is
   installed and authenticated; if not, stop and point to Prerequisites. Write all
   paths with forward slashes — never Windows backslashes.
2. **Check dependencies.** Detect whether `node` is on PATH — it determines only
   whether the status line will *render* (every payload still applies without it).
   The `plugins` step needs the `claude` CLI + network.
3. **Read this manifest.** For each row: source, destination, mode, requirement.
4. **Resolve placeholders.** Replace the **exact literal token `${CLAUDE_HOME}`**
   (the only Phase 1 placeholder) with the resolved absolute path (forward
   slashes). Do **not** scan for or rewrite any other `${...}` — e.g.
   `statusline.js` contains JS template literals like `${ctxPct}` that must stay
   intact. Substitution applies only to merge/templated payloads; **copy-mode
   payloads are written byte-for-byte** with no substitution. No secrets are
   requested.
5. **Preview.** Show the user, per category: destination/action (create / merge /
   overwrite / install); what will be backed up; and any caveat (e.g. `node` not
   found → the status line applies but won't render until Node is installed).
   Wait for explicit approval before writing anything.
6. **Apply** each category **in manifest order (status line first)**. Back up any
   existing destination file to `<destination>.bak.<unix-timestamp>` first.
   - **statusline** (copy): write `config/statusline/statusline.js` to
     `${CLAUDE_HOME}/statusline.js`.
   - **settings** (merge): deep-merge the resolved `config/settings/settings.json`
     into `${CLAUDE_HOME}/settings.json` (create if absent) — carries the status
     line wiring plus general prefs (model, effort, theme, the superpowers enable
     flag, …). Applies regardless of `node`.
   - **plugins** (install, **required**): install superpowers —
     `claude plugin marketplace add anthropics/claude-plugins-official`, then
     `claude plugin install superpowers@claude-plugins-official`. The
     `enabledPlugins` flag in `settings.json` only *activates* an installed
     plugin; it does **not** download it, so this step is what actually fetches
     superpowers. Skip only if there's no network / `claude` CLI (report it).
   - **Node note:** only the status line needs `node` at runtime. If `node` isn't
     on PATH, everything still applies — the status line just won't render until
     you install Node.js LTS.
7. **Verify.** `settings.json` is valid JSON and its `statusLine.command` points at
   the resolved `statusline.js` path with forward slashes; if `node` is present,
   `statusline.js` runs (`node ${CLAUDE_HOME}/statusline.js` with `{}` on stdin
   prints two lines). For plugins, `claude plugin list` shows
   `superpowers@claude-plugins-official`. Report a per-category summary.
8. **Done.** Tell the user to restart Claude Code to load the plugin and show the
   status line.

Re-running is safe: backups are taken before each overwrite/merge, and a category
skipped for a missing requirement is simply applied on a later run once the
requirement is met.

## Scope notes

- The **status line is the first customization step** — top of the manifest and
  the first thing applied. New customizations append **below** it (settings, then
  plugins, …). A file payload = drop it under `config/` + a `copy`/`merge` row; a
  non-file action (installing a plugin) = an `install` row. The procedure does not
  change.
- **superpowers** is currently required — the `plugins` step installs it (the
  `enabledPlugins` flag in `settings.json` only enables an already-installed
  plugin, it doesn't fetch one).
- **Secrets** (e.g. MCP tokens) are not handled yet; they'll be added with
  interactive prompting when the first payload that needs one is introduced. Real
  secrets are never committed to this repo.
- See `docs/setup-guide.md` for details, a manual sandbox rehearsal, and
  troubleshooting.
