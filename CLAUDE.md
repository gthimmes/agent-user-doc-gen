# User Documentation Generator

## Project Overview
Automated user documentation generator that uses `agent-browser` CLI to drive a live web portal and generate user-facing documentation (tutorials + reference pages) with embedded screenshots.

## Architecture
Two-phase pipeline: **Capture** (browser automation) then **Generate** (Claude Code or API).

```
Config (YAML) -> Auth -> Crawl -> Capture -> Generate Docs -> Output
```

## Two Generation Modes

### Mode 1: Claude Code (no API key needed - recommended)
Use `--manual` flag. Claude Code reads the captures and generates docs interactively.
```bash
npx tsx src/index.ts crawl                # Discover pages
npx tsx src/index.ts capture              # Capture screenshots + text
npx tsx src/index.ts record               # Record workflows (if configured)
npx tsx src/index.ts generate --manual    # Prepare data for Claude Code
```
Then tell Claude Code: "Read .captures/for-claude-code/GENERATE.md and follow the instructions"

Claude Code can:
- Read the page summary files in `.captures/for-claude-code/`
- View the screenshots (it's multimodal)
- Generate Markdown docs and write them to `output/`
- Iterate on quality interactively

### Mode 2: Anthropic API (automated, needs ANTHROPIC_API_KEY)
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npx tsx src/index.ts generate             # Calls Claude API programmatically
```

## Key Commands
```bash
# Development
npm run dev -- <command>       # Run via tsx (no build needed)
npm run build                  # Compile TypeScript

# CLI Commands
npx tsx src/index.ts init              # Create config from template
npx tsx src/index.ts auth              # Login and save auth state
npx tsx src/index.ts crawl             # Discover pages, build sitemap
npx tsx src/index.ts capture           # Capture pages (screenshots + text)
npx tsx src/index.ts capture -p /path  # Capture specific pages
npx tsx src/index.ts record            # Record all workflows
npx tsx src/index.ts record -w <id>    # Record specific workflow
npx tsx src/index.ts generate --manual # Prepare for Claude Code (no API key)
npx tsx src/index.ts generate          # Generate via API (needs API key)
npx tsx src/index.ts serve             # Preview generated HTML docs
npx tsx src/index.ts run               # Full pipeline (API mode)
```

## Recommended Workflow (Claude Max, no API key)
1. On the machine with a browser, run:
   ```bash
   npm install -g agent-browser && agent-browser install
   cd <project-dir> && npm install
   npx tsx src/index.ts auth              # Login manually in browser
   npx tsx src/index.ts crawl             # Discover pages
   npx tsx src/index.ts capture --all     # Capture all pages
   npx tsx src/index.ts generate --manual # Prepare for Claude Code
   ```
2. Then tell Claude Code:
   ```
   Read .captures/for-claude-code/GENERATE.md and generate the documentation.
   You can view the screenshots in .captures/screenshots/ for visual context.
   Write output to output/markdown/
   ```

## Tech Stack
- TypeScript, Node.js (ES modules)
- `agent-browser` CLI for browser automation (child_process.execFile)
- `@anthropic-ai/sdk` for Claude API doc generation (optional)
- `commander` for CLI, `js-yaml` for config, `zod` for validation
- `handlebars` for templates, `marked` for Markdown->HTML
- `express` for preview server

## Project Structure
- `src/types/` - TypeScript interfaces
- `src/config/` - YAML config loading + Zod validation
- `src/browser/` - agent-browser CLI wrapper + auth
- `src/discovery/` - BFS crawler + page classifier
- `src/capture/` - Screenshot + snapshot capture
- `src/workflow/` - Workflow step recording
- `src/generator/` - Doc generation (API mode + manual prep for Claude Code)
- `src/output/` - Markdown/HTML rendering + asset management
- `src/cli/commands/` - CLI command implementations
- `config/` - YAML config files
- `templates/` - Handlebars templates (markdown + html)

## Config
Main config: `config/default.yaml`
- `portal.baseUrl` - target portal URL
- `auth.strategy` - `manual`, `form`, or `state-file`
- `discovery` - crawl depth, include/exclude patterns
- `workflows` - step-by-step user flows to record
- `generation` - Claude model, tokens, doc types
- `output` - formats (markdown/html), screenshot dir

## Environment Variables
- `ANTHROPIC_API_KEY` - only needed for API mode (`generate` without `--manual`)
- `PORTAL_USERNAME` / `PORTAL_PASSWORD` - only for `form` auth strategy

## agent-browser CLI Reference
```bash
agent-browser open <url>       # Open URL in browser
agent-browser snapshot [-i]    # Get page structure (interactive elements with -i)
agent-browser screenshot <path> # Save screenshot
agent-browser click <ref>      # Click element by ref
agent-browser fill <ref> <val> # Fill input field
agent-browser navigate <url>   # Navigate to URL
agent-browser state save <name> # Save browser state
agent-browser state load <name> # Load browser state
```

Important: After any navigation, always re-snapshot. Refs from previous snapshots are stale.
