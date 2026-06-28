# ai-setup

Reproduce a Claude Code setup on any machine — any OS — by cloning this repo and
talking to it. No install scripts: a running Claude reads this repo and applies
the config for you.

## Prerequisites

- **Claude Code** installed and authenticated (the native binary is fine). A
  running Claude can't install or authenticate itself — do this once, manually.
- **Node.js** — needed *only to render the status line* (it's a Node script).
  Native Claude doesn't bundle a general-purpose `node`; install Node.js LTS to
  see the status line. Without it, **everything still applies** — the status line
  just won't draw until Node is on PATH.

## Quickstart

```bash
git clone <repo-url> ai-setup
cd ai-setup
# open Claude Code with this folder as the working directory, then say:
#   set me up
```

Claude reads `CLAUDE.md`, shows a preview of exactly what it will write and where,
and applies it only after you approve. Existing files are backed up first.

## What it configures

1. **Aliases** — global `claude<m>[<e>]` shell shortcuts that launch Claude with a
   preset model + effort (e.g. `claudeo` = opus/max, `claudeox` = opus/xhigh); extra
   args forward through. 20 functions, installed into your shell profile.
2. **Status line** — a two-line bar (`config/statusline/statusline.js`) wired up
   via `settings.json`. Renders only when `node` is on PATH.
3. **Settings** — your `settings.json` prefs (model, effort, theme, plugin
   enable-flags, …), deep-merged into your live config.
4. **Plugins** — installs the **superpowers** plugin (required) from the official
   marketplace; the settings flag only *enables* it, this step *fetches* it.
5. **Memory clean-start** *(opt-in)* — disables Claude auto-memory in your home
   directory so home sessions start clean; you're asked first.

The set of things it configures grows over time; see `CLAUDE.md` for the live
manifest and `docs/setup-guide.md` for details, a self-test, and troubleshooting.

## Notes

- **OS-agnostic:** machine-specific paths are resolved at setup time
  (`${CLAUDE_HOME}` → your live config dir) and written with forward slashes.
- **Secrets are never committed.** Credential handling (interactive prompts) is
  added when a payload first needs one.
