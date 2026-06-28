# ai-setup

Reproduce a Claude Code setup on any machine — any OS — by cloning this repo and
talking to it. No install scripts: a running Claude reads this repo and applies
the config for you.

## Prerequisites

- **Claude Code** installed and authenticated (the native binary is fine). A
  running Claude can't install or authenticate itself — do this once, manually.
- **Node.js** — required *only for the status line* (it's a Node script). Native
  Claude doesn't bundle a general-purpose `node`; install Node.js LTS if you want
  the status line. Without it, setup skips the status line and configures
  everything else.

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
  `settings.json` — applied only if `node` is on your PATH.

The set of things it configures grows over time; see `CLAUDE.md` for the live
manifest and `docs/setup-guide.md` for details, a self-test, and troubleshooting.

## Notes

- **OS-agnostic:** machine-specific paths are resolved at setup time
  (`${CLAUDE_HOME}` → your live config dir) and written with forward slashes.
- **Secrets are never committed.** Credential handling (interactive prompts) is
  added when a payload first needs one.
