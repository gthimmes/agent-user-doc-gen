# User Documentation Generator

Automated tool for generating comprehensive user documentation from live web applications using browser automation and AI analysis.

## What It Does

This tool automatically:
1. **Captures** screenshots and content from a running web application
2. **Analyzes** the captured data using Claude AI
3. **Generates** professional user documentation with embedded screenshots

Perfect for creating user manuals, feature guides, and reference documentation for web applications without manually writing or screenshotting.

## How It Works

**Two-Phase Pipeline:**

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: CAPTURE                                           │
│  Browser automation → Screenshots + Page data → .captures/  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: GENERATE                                          │
│  Claude AI analyzes captures → Markdown/HTML → output/      │
└─────────────────────────────────────────────────────────────┘
```

This two-phase approach means you can:
- Re-generate docs without re-crawling the application
- Manually curate captures before generation
- Iterate on documentation quality quickly

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone or download this repository
cd user-doc-gen

# Install dependencies
npm install

# Install Playwright browsers (for capture automation)
npx playwright install chromium

# Copy environment template (if using Claude API mode)
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY if using API mode
```

## Quick Start

### Option 1: Manual Mode (Recommended - No API Key Needed)

This mode uses Claude Code interactively to generate documentation.

```bash
# 1. Configure your target application
# Edit config/default.yaml with your application URL

# 2. Capture screenshots and data
npx tsx src/index.ts capture --all

# 3. Prepare for Claude Code
npx tsx src/index.ts generate --manual

# 4. Tell Claude Code to generate docs:
# "Read .captures/for-claude-code/GENERATE.md and generate the documentation"
```

### Option 2: API Mode (Automated - Requires API Key)

```bash
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run full pipeline
npx tsx src/index.ts run
```

## Usage

### Core Commands

```bash
# Initialize project with example config
npx tsx src/index.ts init

# Capture screenshots from all configured pages
npx tsx src/index.ts capture --all

# Capture specific pages only
npx tsx src/index.ts capture -p /clients -p /settings

# Generate documentation (API mode)
npx tsx src/index.ts generate

# Generate documentation (Manual/Claude Code mode)
npx tsx src/index.ts generate --manual

# Preview generated HTML documentation
npx tsx src/index.ts serve

# Run full pipeline (capture + generate via API)
npx tsx src/index.ts run
```

### Development Commands

```bash
# Run with hot reload during development
npm run dev -- capture --all

# Build TypeScript to dist/
npm run build

# Type check without building
npm run lint
```

## Configuration

Main config file: `config/default.yaml`

### Key Settings

```yaml
portal:
  baseUrl: https://your-app.example.com
  name: Your Application
  description: Documentation for your application

auth:
  strategy: manual  # or 'state-file' for saved auth
  loginUrl: https://your-app.example.com/login
  verifySelector: dashboard  # Element that indicates successful login

capture:
  screenshotFormat: png
  screenshotQuality: 90
  captureDir: .captures

generation:
  model: claude-sonnet-4-5-20250929
  maxTokens: 4096
  temperature: 0.3
  docTypes:
    - tutorial
    - reference
  includeScreenshots: true

output:
  dir: output
  formats:
    - markdown
    - html
  generateToc: true
  generateIndex: true
  siteName: Your App Documentation
```

See `config/examples/example-portal.yaml` for a complete example.

## Project Structure

```
user-doc-gen/
├── src/
│   ├── browser/          # Browser automation (Playwright)
│   ├── capture/          # Screenshot & page capture logic
│   ├── cli/commands/     # CLI command implementations
│   ├── config/           # Configuration loading & validation
│   ├── generator/        # Documentation generation (Claude API)
│   ├── output/           # Markdown/HTML rendering
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Shared utilities
├── config/
│   ├── default.yaml      # Main configuration file
│   └── examples/         # Example configurations
├── templates/
│   ├── markdown/         # Handlebars templates for Markdown
│   └── html/             # Handlebars templates for HTML
├── .captures/            # Captured data (gitignored)
├── output/               # Generated docs (gitignored)
└── CLAUDE.md             # Instructions for Claude Code
```

## How Capture Works

The tool uses Playwright to automate a Chromium browser:

1. **Login**: Opens your application and waits for manual login (or loads saved auth state)
2. **Navigate**: Visits each configured page
3. **Capture**: Takes full-page screenshots at 2560x1440 resolution
4. **Extract**: Captures page content, form fields, buttons, links
5. **Save**: Stores everything in `.captures/` as JSON + PNG files

Authentication state is preserved in `.browser-profile/` so you only need to login once.

## How Generation Works

### Manual Mode (Claude Code)
1. Prepares structured summaries of all captured pages
2. Creates instructions file at `.captures/for-claude-code/GENERATE.md`
3. You tell Claude Code to read the instructions and generate docs
4. Claude Code views screenshots and writes professional documentation

### API Mode (Automated)
1. Sends captures to Claude API programmatically
2. AI analyzes screenshots and page content
3. Generates reference docs and tutorials automatically
4. Outputs Markdown and HTML to `output/`

## Example: Documenting a Web Portal

```bash
# 1. Edit config to point to your portal
vim config/default.yaml
# Set baseUrl: https://your-portal.example.com

# 2. Run capture (browser will open, login manually when prompted)
npx tsx src/index.ts capture --all

# Screenshots and data now in .captures/

# 3. Generate docs with Claude Code
npx tsx src/index.ts generate --manual

# Then tell Claude Code:
# "Read .captures/for-claude-code/GENERATE.md and follow the instructions"

# 4. Preview the output
npx tsx src/index.ts serve
# Open http://localhost:3000
```

## Output Formats

### Markdown
- Clean, portable documentation
- Easy to version control
- Great for GitHub wikis or static site generators
- Located in `output/markdown/`

### HTML
- Styled, ready-to-deploy documentation
- Embedded screenshots
- Table of contents with navigation
- Located in `output/html/`

## Tips & Best Practices

1. **Start Small**: Capture 2-3 pages first to test before doing a full site crawl
2. **Login Once**: Use `strategy: state-file` to save authentication and avoid re-logging in
3. **Manual Mode First**: Use `--manual` mode with Claude Code for best quality docs
4. **Review Captures**: Check `.captures/screenshots/` before generating to ensure quality
5. **Iterate**: Re-run `generate` as many times as needed - captures are saved

## Troubleshooting

### Browser crashes or won't open
```bash
# Delete browser profile and start fresh
rm -rf .browser-profile
npx tsx src/index.ts capture --all
```

### Authentication keeps failing
```bash
# Use manual login and save state
# Edit config: strategy: manual
# After successful login, browser state is saved automatically
```

### Generated docs are generic/wrong
- Make sure you're using actual screenshots from the running app
- Try Manual mode with Claude Code for more accurate results
- Check that captures in `.captures/screenshots/` show the right content

## Environment Variables

```bash
# Required only for API mode (automated generation)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Override default config file
CONFIG_FILE=config/custom.yaml
```

## Requirements

- **Node.js**: 18 or higher
- **RAM**: 2GB+ recommended (browser automation)
- **Disk**: 500MB+ for dependencies and browser
- **Network**: Access to target application
- **API Key**: Only needed for automated API mode

## License

MIT - See LICENSE file for details

## Contributing

Contributions welcome! This tool was built to solve the tedious problem of keeping user documentation in sync with actual software. If you have ideas for improvements, please open an issue or PR.

## Credits

Built with:
- [Playwright](https://playwright.dev/) - Browser automation
- [Anthropic Claude](https://www.anthropic.com/) - AI documentation generation
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Handlebars](https://handlebarsjs.com/) - Templating
- [Marked](https://marked.js.org/) - Markdown rendering

---

**Questions?** See `CLAUDE.md` for detailed instructions for use with Claude Code.
