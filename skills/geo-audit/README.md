# GEO/AEO Audit Agent

Analyze any hotel website's readiness for AI search engines like ChatGPT, Claude, Perplexity, and Google AI Overviews. Get a scored report with plain-language recommendations your marketing team can act on.

## What It Does

This skill crawls your website's key pages and evaluates them across two dimensions:

**Content Structure** — How well your content is organized for AI extraction:
- Heading hierarchy and nesting
- FAQ sections and question patterns
- Definition sentences AI can quote
- Lists, tables, and structured content
- Content depth and lead answer quality
- Internal linking

**GEO/AEO Signals** — Technical signals that affect AI discoverability:
- AI bot access (robots.txt rules for GPTBot, ClaudeBot, etc.)
- Structured data / schema markup quality
- Authority signals (author bios, about page, citations)
- Content freshness indicators
- Technical health (HTTPS, meta tags, Open Graph)
- Discoverability (sitemap, llms.txt, URL structure)

You get an overall score (0-100), per-category breakdowns, and prioritized recommendations in three tiers: **Fix Now**, **Improve Soon**, and **Nice to Have**.

## Quick Start

### 1. Install

Copy the `geo-audit` folder into your Claude Code skills directory:

```bash
cp -r skills/geo-audit ~/.claude/skills/
```

Or use the CLI installer:

```bash
npx skills add mathiascoudert/kitchen_club --skill geo-audit
```

### 2. Run

```bash
# Pass a URL directly
/geo-audit https://yourhotel.com

# Or set it in a .env file
echo "WEBSITE_URL=https://yourhotel.com" > .env
/geo-audit
```

### 3. Read Your Report

Reports are saved to `geo-reports/YYYY-MM-DD-domain/` in your current directory:

- `report.md` — Markdown version (good for version control, quick reading)
- `report.html` — Styled HTML version (best for sharing with your team)

Open the HTML file in your browser for the best experience.

## Score Tiers

| Score | Rating | What It Means |
|-------|--------|---------------|
| 85-100 | AI-Optimized | Your site is well-positioned to appear in AI answers |
| 66-84 | Good | Solid foundation, some areas to improve |
| 50-65 | Needs Work | Significant gaps — AI assistants may overlook your site |
| 0-49 | Not AI-Ready | Major issues preventing AI visibility |

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed and configured
- Internet access (the tool fetches your website's pages)
- That's it. No API keys, no databases, no dependencies.

## File Structure

```
geo-audit/
├── SKILL.md            # Main skill — run this
├── geo-crawl.md        # Page discovery & fetching logic
├── geo-structure.md    # Content structure analysis
├── geo-signals.md      # GEO/AEO signal evaluation
├── geo-recommend.md    # Recommendation generator
└── README.md           # This file
```
