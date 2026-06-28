# Setup guide

What `set me up` does, how to verify it yourself, and how to fix common issues.
The authoritative procedure lives in `CLAUDE.md`; this is the human companion.

## Requirements

- Claude Code installed + authenticated (the native binary is fine).
- **Node.js** only to *render* the status line. The status-line payload runs as
  `node ${CLAUDE_HOME}/statusline.js`, so it needs `node` on PATH. Native Claude
  installs don't include a general-purpose `node`; install Node.js LTS to see the
  bar. If `node` is missing, **everything still applies** — the status line just
  won't draw until Node is installed.
- **`claude` CLI + network** for the plugins step (to install superpowers).
- **A shell** (PowerShell, bash, or zsh) for the `claude<m>` aliases step.

## What each category does

| Category   | Source                            | Destination                    | Mode    | Requires | Effect |
|------------|-----------------------------------|--------------------------------|---------|----------|--------|
| aliases    | `config/aliases/claude-aliases.{ps1,sh}` | shell profile + `${CLAUDE_HOME}/` | install | a supported shell | Installs 20 `claude<m>[<e>]` launcher functions (model + effort) into `$PROFILE` / `~/.bashrc` / `~/.zshrc`. |
| statusline | `config/statusline/statusline.js` | `${CLAUDE_HOME}/statusline.js` | copy    | `node` to render | Installs the two-line status-line script. |
| settings   | `config/settings/settings.json`   | `${CLAUDE_HOME}/settings.json` | merge   | —        | Deep-merges your prefs (model, effort, theme, `statusLine` wiring, plugin enable-flags); your other keys are preserved. |
| plugins    | `anthropics/claude-plugins-official` → `superpowers` | `${CLAUDE_HOME}/plugins/` | install | `claude` CLI + network | Installs the **superpowers** plugin (required). The settings flag only enables it; this fetches it. |
| memory     | `config/settings/settings.local.json` | `${CLAUDE_HOME}/settings.local.json` | merge | **opt-in** | *(asked first)* Disables auto-memory in the home dir for a clean start; offers to purge existing home memory. |

`${CLAUDE_HOME}` is your live Claude config directory (`C:/Users/<you>/.claude` on
Windows, `~/.claude` elsewhere), resolved automatically at setup. Paths are
written with forward slashes so the same value works on every OS.

## Self-test: rehearse against a sandbox

Prove the apply works without touching your real config. Requires `node`. From the
repo root, in a Bash shell:

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

- **Status line doesn't render:** `node` isn't on PATH. The files are still in
  place — install Node.js LTS, restart your shell / Claude session, and it'll draw
  (no need to re-run "set me up").
- **Superpowers not loaded:** confirm `claude plugin list` shows
  `superpowers@claude-plugins-official`; if not, re-run the plugins step
  (`claude plugin install superpowers@claude-plugins-official`) and restart.
- **`claude<m>` shortcuts not found:** open a new shell (or re-source your
  profile). The functions live in `$PROFILE` (PowerShell) or `~/.bashrc` / `~/.zshrc`.
- **Status line doesn't appear after applying:** restart Claude Code. Confirm
  `${CLAUDE_HOME}/settings.json` has `statusLine.command` pointing at the real
  `statusline.js` path, and that `node` is on PATH.
- **`node: command not found`:** install Node.js LTS. Native Claude doesn't bundle
  a general-purpose `node`.
- **Merged settings look wrong:** check the timestamped backup beside
  `settings.json`, then re-apply or restore the backup.

## Not handled yet

- **Secrets / credentials** (e.g. MCP tokens) — added with interactive prompts
  when the first payload needs one. Real secrets are never committed.
