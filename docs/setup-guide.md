# Setup guide

What `set me up` does, how to verify it yourself, and how to fix common issues.
The authoritative procedure lives in `CLAUDE.md`; this is the human companion.

## Requirements

- Claude Code installed + authenticated (the native binary is fine).
- **Node.js** only for the status line. The status-line payload runs as
  `node ${CLAUDE_HOME}/statusline.js`, so it needs `node` on PATH. Native Claude
  installs don't include a general-purpose `node`; install Node.js LTS to enable
  the status line. Setup detects `node` and skips the status line (with a message)
  if it's missing.

## What each category does

| Category   | Source                            | Destination                    | Mode  | Requires | Effect |
|------------|-----------------------------------|--------------------------------|-------|----------|--------|
| statusline | `config/statusline/statusline.js` | `${CLAUDE_HOME}/statusline.js` | copy  | `node`   | Installs the two-line status-line script. |
| settings   | `config/settings/settings.json`   | `${CLAUDE_HOME}/settings.json` | merge | `node`   | Deep-merges the `statusLine` wiring into your settings; your other keys are preserved. |

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

- **Status line was skipped:** `node` wasn't on PATH at setup. Install Node.js
  LTS, restart your shell / Claude session, and re-run "set me up".
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
