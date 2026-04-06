---
name: review-reply
description: Scrape recent Google Business reviews, categorize by sentiment, and draft tailored replies. Run daily by GMs to manage online reputation.
---

# Review Reply

Scrape recent Google Business reviews, categorize them by sentiment (complaints first), and draft tailored replies using the GM's brand voice. Save everything to a markdown file the GM can use to post replies manually.

## Step 1 — Check Config

The config file is at `~/.claude/skills/review-reply/config.json`.

1. Read `config.json`. If it doesn't exist or is missing required fields, run the **First-Run Setup** below.
2. If the user says "update my review-reply settings", also run **First-Run Setup** (overwrite existing config).
3. If config exists and is complete, skip to Step 2.

### First-Run Setup

Ask these questions **one at a time**, waiting for each answer:

1. "What is your Google Business URL?" (e.g., `https://maps.google.com/maps?cid=...` or a Google Maps link to the business)
2. "What is your business name?" (e.g., "Hotel & Spa Le Sunny")
3. "Describe your brand voice for review replies, or paste a sample reply you've written before. Include how you'd like to sign off (e.g., name and title)."

Save to `~/.claude/skills/review-reply/config.json`:

```json
{
  "business_url": "<their URL>",
  "business_name": "<their business name>",
  "brand_voice": "<their brand voice description or sample>",
  "lookback_days": 5
}
```

Confirm: "Config saved. I'll use these settings each time you run `/review-reply`. Say 'update my review-reply settings' anytime to change them."

## Step 2 — Scrape Reviews

Fetch recent reviews for the business. Use today's date to calculate the lookback window (`lookback_days` from config, default 5).

### Primary Method

1. Use `WebSearch` to find the business reviews:
   - Query: `"{business_name}" reviews`
   - This should surface the Google Business listing with recent reviews

2. Use `WebFetch` on the Google Maps business URL (from config) to try extracting review data directly.

3. From the fetched content and search results, extract for each review:
   - **Reviewer name** (first name is sufficient)
   - **Star rating** (1-5)
   - **Review date** (convert relative dates like "2 days ago" to absolute dates using today's date)
   - **Review text** (the full review body)
   - **Has existing reply** (yes/no — skip reviews that already have a business reply)

### Fallback Method

If `WebFetch` does not return usable review data (Google Maps pages are JavaScript-heavy), fall back to:

1. `WebSearch` with query: `"{business_name}" Google reviews recent`
2. `WebSearch` with query: `site:google.com/maps "{business_name}" reviews`
3. Extract whatever review data is available from the search result snippets.

### Filtering

- **Only keep** reviews from the last `lookback_days` days
- **Exclude** reviews that already have a business reply
- If no reviews are found: tell the GM "No new reviews found in the last {lookback_days} days for {business_name}." and stop.

### Transparency

Tell the GM:
- How many reviews were found
- If you suspect there may be more reviews that couldn't be extracted (e.g., "I found 3 reviews. Note: Google Maps pages are JavaScript-heavy, so there may be additional recent reviews not captured here. Check your Google Business dashboard for the complete list.")

## Step 3 — Categorize by Sentiment

Group the extracted reviews into three categories:

| Category | Criteria | Priority |
|---|---|---|
| **Complaints** | 1-2 stars. Also include 3-star reviews where the text is predominantly negative (complaints, disappointment, problems). | Shown first |
| **Neutral** | 3-star reviews with genuinely mixed feedback (both positive and negative points). | Shown second |
| **Positive** | 4-5 stars. | Shown third |

Within each category, sort by date (most recent first).

## Step 4 — Draft Replies

For each review, draft a reply following these rules:

### Brand Voice
- Apply the GM's `brand_voice` from config throughout every reply
- This is the most important rule — the replies must sound like the GM, not like AI

### General Rules
- Reference **specific details** from the review (a dish they liked, a room issue, a staff member they mentioned). Never write generic replies.
- Use the **reviewer's first name**
- Sign off as specified in the brand voice (or use the business name if not specified)

### Tone by Sentiment

**Complaints (1-2 stars, negative 3-star):**
- 3-5 sentences
- Empathetic and sincere — acknowledge what went wrong
- Never defensive, never make excuses
- Offer a concrete path forward: "I'd love the chance to make this right. Please reach out to us directly at [contact]."
- If the brand voice doesn't include contact info, use a placeholder: `[your contact info]`

**Neutral (mixed 3-star):**
- 2-4 sentences
- Grateful for the feedback
- Briefly acknowledge any concerns raised
- Highlight the positives they mentioned
- Invite them to return

**Positive (4-5 stars):**
- 2-4 sentences
- Warm and genuine thanks
- Reference the specific things they enjoyed
- Invite them back

## Step 5 — Save Output

### Create the output file

1. Create the `./review-replies/` directory if it doesn't exist (in the current working directory)
2. Write the file as `./review-replies/YYYY-MM-DD-reviews.md` using today's date

### File format

```markdown
# Review Replies — {Business Name} — {Date}

Found {total} reviews from the last {lookback_days} days ({complaint_count} complaints, {neutral_count} neutral, {positive_count} positive).

---

## Complaints ({count})

### {"*" repeated for star count} — {Reviewer Name} — {Review Date}

> "{Full review text}"

**Suggested Reply:**

> {Drafted reply}

---

## Neutral ({count})

### {"*" repeated for star count} — {Reviewer Name} — {Review Date}

> "{Full review text}"

**Suggested Reply:**

> {Drafted reply}

---

## Positive ({count})

### {"*" repeated for star count} — {Reviewer Name} — {Review Date}

> "{Full review text}"

**Suggested Reply:**

> {Drafted reply}
```

If a category has 0 reviews, still include the section header with "(0)" and write "No {category} reviews in this period."

## Step 6 — Terminal Summary

After saving the file, display a concise summary:

```
Review Replies — {Business Name}
Found {total} reviews from the last {lookback_days} days:
  - Complaints: {count}
  - Neutral: {count}
  - Positive: {count}

Replies saved to: ./review-replies/YYYY-MM-DD-reviews.md

Next step: Review the suggested replies, then copy-paste them into your Google Business dashboard.
```
