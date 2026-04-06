# Review Reply Skill — Implementation Plan

**Date**: 2026-04-05
**Status**: Draft
**Author**: Claude
**Spec**: [2026-04-05-review-reply-skill-design.md](../superpowers/specs/2026-04-05-review-reply-skill-design.md)

## Overview

Build a Claude Code skill (`/review-reply`) that scrapes recent Google Business reviews, categorizes them by sentiment, drafts tailored replies using the GM's brand voice, and saves the output to a markdown file. Pure SKILL.md — no code, no dependencies, no API keys.

## Schematic Diagrams

### Skill Flow

```
+--------+     +----------------+     +----------------+     +----------------+     +----------------+
|   GM   |     |  Config Check  |     |  Scrape        |     |  Categorize &  |     |  Save & Report |
|  runs  |---->|  (Read JSON)   |---->|  Reviews       |---->|  Draft Replies |---->|  (Write .md)   |
| /review|     |                |     |  (WebSearch +  |     |  (Sentiment +  |     |                |
| -reply |     |  First run?    |     |   WebFetch)    |     |   Brand Voice) |     |  Terminal      |
|        |     |  -> Setup flow |     |                |     |                |     |  summary       |
+--------+     +----------------+     +----------------+     +----------------+     +----------------+
```

### First-Run Setup Flow

```
+--------+     +----------------+     +----------------+     +----------------+
|   GM   |     |  No config?    |     |  Ask 3         |     |  Save          |
|  runs  |---->|  Detect via    |---->|  questions:    |---->|  config.json   |
| /review|     |  Read tool     |     |  1. GMB URL    |     |  then continue |
| -reply |     |                |     |  2. Biz name   |     |  to scraping   |
|        |     |                |     |  3. Brand voice|     |                |
+--------+     +----------------+     +----------------+     +----------------+
```

## Implementation Phases

### Phase 1: Create the SKILL.md file

**Complexity**: Medium
**Dependencies**: None

This is the entire implementation — a single SKILL.md file with detailed instructions that Claude follows at runtime. The skill file must be precise enough that Claude executes the full pipeline correctly every time.

#### Tasks

- [ ] Create `~/.claude/skills/review-reply/SKILL.md` with frontmatter (name, description)
- [ ] Write the config check & first-run setup section
- [ ] Write the review scraping section (WebSearch + WebFetch strategy)
- [ ] Write the scraping fallback section
- [ ] Write the sentiment categorization rules
- [ ] Write the reply drafting rules with brand voice integration
- [ ] Write the output file generation section (markdown format)
- [ ] Write the terminal summary section

#### Files to Create

| File | Description |
|------|-------------|
| `~/.claude/skills/review-reply/SKILL.md` | The complete skill definition |

#### SKILL.md Structure

```markdown
---
name: review-reply
description: Scrape recent Google Business reviews, categorize by sentiment, and draft tailored replies. Run daily by GMs.
---

# Review Reply

[Setup section]
[Pipeline section with steps 1-5]
```

The SKILL.md must contain these sections, each with explicit instructions for Claude:

**Section 1 — Setup / Config Check**
- Read `~/.claude/skills/review-reply/config.json`
- If missing or incomplete, ask the GM for: Google Business URL, business name, brand voice guidelines
- Save config and confirm
- If the GM says "update my review-reply settings", re-run setup

**Section 2 — Scrape Reviews**
- Primary: `WebSearch` for `"{business_name}" reviews site:google.com/maps` to find the listing
- Then `WebFetch` on the business URL to extract reviews
- Fallback: if WebFetch returns no usable review data, use `WebSearch` with `"{business_name}" recent reviews` and extract from search snippets
- Extract per review: reviewer name, star rating, date, text, existing reply status
- Filter: only reviews from the last `lookback_days` days with no existing reply
- Report to GM how many reviews were found

**Section 3 — Categorize by Sentiment**
- Complaints: 1-2 stars, or 3 stars with clearly negative language
- Neutral: 3 stars with mixed feedback
- Positive: 4-5 stars
- Sort: complaints first, then neutral, then positive

**Section 4 — Draft Replies**
- Use brand voice from config
- Reference specific details from each review
- Use reviewer's first name
- Length: 2-4 sentences for positive, 3-5 for complaints
- Complaints: empathetic, acknowledge, offer path forward, invite direct contact
- Neutral: grateful, address concerns briefly, highlight positives
- Positive: warm, thank specific details, invite them back
- Never be defensive, never be generic

**Section 5 — Save Output**
- Create `./review-replies/` directory if needed
- Write `./review-replies/YYYY-MM-DD-reviews.md` using the spec format
- Display terminal summary: count by sentiment + file path

### Phase 2: Test with a real business

**Complexity**: Low
**Dependencies**: Phase 1

#### Tasks

- [ ] Run `/review-reply` to trigger first-run setup
- [ ] Verify config.json is created correctly
- [ ] Run again to test the full scraping + drafting pipeline
- [ ] Verify output file format matches the spec
- [ ] Test the fallback path (if primary scraping doesn't return reviews)
- [ ] Test "update my review-reply settings" reconfiguration

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google Maps pages are JS-heavy, WebFetch may not extract reviews | High | Fallback to WebSearch snippets; skill reports what it found and flags gaps |
| Review dates shown as relative ("2 days ago") not absolute | Medium | Skill instructions tell Claude to convert relative dates to absolute using today's date |
| Google changes page structure | Medium | Skill relies on Claude's understanding of page content, not hardcoded selectors — naturally resilient |
| Brand voice instructions too vague | Low | First-run setup asks for specific example or guidelines; GM can update anytime |
| No reviews found in lookback window | Low | Skill reports "No new reviews in the last N days" and exits cleanly |

## Success Metrics

- GM can run `/review-reply` and get a complete output file in under 2 minutes
- Reviews are correctly categorized by sentiment
- Drafted replies reference specific details from each review
- Output file follows the spec format exactly
- First-run setup works cleanly and config persists

## Future Enhancements

- Auto-post replies via Google Business Profile API (when approved)
- Multi-location batch mode for portfolio managers
- Weekly digest summarizing review trends
- Integration with Notion or email for delivery
