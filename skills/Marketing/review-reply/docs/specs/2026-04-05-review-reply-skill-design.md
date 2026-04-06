# Review Reply Skill — Design Spec

**Date**: 2026-04-05
**Status**: Draft
**Type**: Claude Code Skill (pure SKILL.md, no external dependencies)

## Purpose

A Claude Code skill that GMs run each morning (`/review-reply`) to scrape recent Google Business reviews, categorize them by sentiment, and draft tailored replies saved to a markdown file. The GM then copies the replies into Google Business manually.

## First-Run Setup

On first run, the skill detects no config file and walks the GM through setup:

1. Asks for the Google Business URL
2. Asks for the business name
3. Asks for brand voice guidelines or a sample reply
4. Saves config to `~/.claude/skills/review-reply/config.json`

### Config Schema

```json
{
  "business_url": "https://maps.google.com/...",
  "business_name": "Hotel & Spa Le Sunny",
  "brand_voice": "Warm, personal, uses first name when available. Mention specific details from the review. Sign off as the GM.",
  "lookback_days": 5
}
```

Settings persist across sessions. GM can update by saying "update my review-reply settings".

## Review Scraping

### Method

1. `WebSearch` query: `"[business name]" Google reviews site:google.com/maps`
2. `WebFetch` on the Google Maps URL to extract review data
3. Extract per review: reviewer name, star rating (1-5), review date, review text, whether a reply already exists
4. Filter: only reviews from the last `lookback_days` days with no existing reply

### Fallback

If `WebFetch` cannot parse reviews from the Maps page (JavaScript-heavy rendering), fall back to `WebSearch` with `"[business name]" reviews site:google.com` and extract from search result snippets.

### Known Limitations

- Google Maps pages are JavaScript-heavy; `WebFetch` may not capture all reviews
- For businesses with many reviews, only the most recent visible ones may be captured
- The skill reports how many reviews it found and flags if it suspects there are more

## Sentiment Categorization

Reviews are grouped into three tiers, displayed in priority order:

| Category | Criteria | Display Order |
|---|---|---|
| **Complaints** | 1-2 stars, or negative language in 3-star reviews | First |
| **Neutral** | 3 stars with mixed feedback | Second |
| **Positive** | 4-5 stars | Third |

## Reply Drafting

### Rules

- Apply the GM's brand voice from config
- Reference **specific details** from the review (never generic responses)
- Use the reviewer's first name
- Concise: 2-4 sentences for positive, 3-5 for complaints
- Complaints: never defensive, always acknowledge the experience, offer a path forward (e.g., invite direct contact)
- Sign off with GM name/title if provided in brand voice

### Tone by Sentiment

| Sentiment | Tone |
|---|---|
| Complaint | Empathetic, acknowledge issue, offer to make it right, invite direct contact |
| Neutral | Grateful, address concerns briefly, highlight positives |
| Positive | Warm, thank specific details, invite them back |

## Output

### File Location

```
./review-replies/YYYY-MM-DD-reviews.md
```

### File Format

```markdown
# Review Replies — [Business Name] — [Date]

## Complaints ([count])

### [stars] — [Reviewer Name] — [Review Date]
> "[Review text]"

**Suggested Reply:**
> [Drafted reply]

---

## Neutral ([count])

### [stars] — [Reviewer Name] — [Review Date]
> "[Review text]"

**Suggested Reply:**
> [Drafted reply]

---

## Positive ([count])

### [stars] — [Reviewer Name] — [Review Date]
> "[Review text]"

**Suggested Reply:**
> [Drafted reply]
```

### Terminal Summary

After saving, the skill displays:
- Number of reviews found, broken down by sentiment
- Path to the output file

Example: "Found 4 reviews from the last 5 days (1 complaint, 0 neutral, 3 positive). Replies saved to `./review-replies/2026-04-05-reviews.md`"

## File Structure

```
~/.claude/skills/review-reply/
├── SKILL.md          # Skill definition
├── config.json       # GM's saved settings

./review-replies/     # Output in working directory
├── 2026-04-05-reviews.md
├── 2026-04-04-reviews.md
└── ...
```

## Dependencies

None. The skill uses only Claude Code's built-in tools:
- `WebSearch` — find and search for reviews
- `WebFetch` — scrape review page content
- `Read` / `Write` — config and output files

## Out of Scope

- Automated posting of replies to Google (requires My Business API approval)
- Multi-location batch runs (each GM runs for their own business)
- Historical analytics or trend tracking
