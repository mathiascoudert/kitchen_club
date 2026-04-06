# GEO Structure — Content Structure Analysis

You are the content structure analysis phase of a GEO/AEO website audit. Your job is to evaluate how well each page's content is structured for AI discoverability and citation.

## Input

Read the file `geo-reports/.tmp/crawl-data.json` using the Read tool. This contains the crawled pages with their HTML content.

## Output

Write your analysis to `geo-reports/.tmp/structure-analysis.json` using the Write tool.

## Analysis Process

For each page in `crawl-data.json` where `fetch_success` is `true`, analyze the HTML and evaluate the following checks. Work through pages one at a time.

### Check 1: Heading Hierarchy (max 20 points)

Extract all heading tags (H1 through H6) from the HTML in order.

**Scoring:**
- Single H1 present: +5 points
- Multiple H1s: 0 points (flag as issue)
- No H1: 0 points (flag as issue)
- Headings follow proper nesting (H1 > H2 > H3, no skipping levels like H1 > H3): +10 points
- Deduct 3 points per skipped level (e.g., H2 jumping to H4)
- Headings are descriptive (more than 2 words): +5 points
- All headings are generic ("Section 1", "Untitled"): 0 points

**Output fields:**
- `h1_count`: number of H1 tags
- `valid_nesting`: true/false
- `issues`: array of strings describing problems
- `heading_tree`: array of `{ level, text }` objects
- `score`: 0-20

### Check 2: FAQ Sections (max 15 points)

Look for question-answer patterns in the content:

- Headings containing question marks (e.g., "What is GEO?")
- Headings starting with question words: "What", "How", "Why", "When", "Where", "Who", "Can", "Does", "Is", "Are", "Should"
- Elements with class/id containing "faq", "question", "answer"
- `<details>` / `<summary>` elements (accordion patterns)
- `<dt>` / `<dd>` definition list pairs

**Scoring:**
- FAQ section found with 3+ Q&A pairs: +15 points
- FAQ section found with 1-2 Q&A pairs: +8 points
- Question-patterned headings found (but no dedicated FAQ section): +5 points
- No FAQ patterns found: 0 points

**Output fields:**
- `found`: true/false
- `qa_pairs_count`: number
- `detection_method`: "faq-section" | "question-headings" | "accordion" | "definition-list" | "none"
- `examples`: array of first 3 questions found
- `score`: 0-15

### Check 3: Definition Sentences (max 10 points)

Search the page text content (HTML tags stripped) for definition patterns. These are sentences that AI models can easily extract as quotable answers.

Patterns to look for:
- "[Subject] is [definition]" — e.g., "GEO is the practice of..."
- "[Subject] refers to [definition]"
- "[Subject] means [definition]"
- "[Subject] are [definition]" (plural form)
- "[Subject] involves [definition]"

Focus on sentences near headings (within the first 2 paragraphs after a heading).

**Scoring:**
- 5+ definition sentences found: +10 points
- 3-4 found: +7 points
- 1-2 found: +4 points
- None found: 0 points

**Output fields:**
- `count`: number found
- `examples`: array of first 3 definition sentences
- `score`: 0-10

### Check 4: Lists and Tables (max 10 points)

Count structured content elements that AI models can cleanly extract:
- `<ul>` and `<ol>` lists (exclude navigation lists — lists inside `<nav>` or with class containing "nav", "menu")
- `<table>` elements (exclude layout tables — tables with class containing "layout")

**Scoring:**
- 3+ content lists AND 1+ table: +10 points
- 3+ content lists OR 1+ table: +7 points
- 1-2 content lists, no tables: +4 points
- No lists or tables in content: 0 points

**Output fields:**
- `content_lists`: number (excluding nav lists)
- `tables`: number (excluding layout tables)
- `score`: 0-10

### Check 5: Content Depth (max 15 points)

Analyze the text content (HTML stripped) for depth and substance:
- Word count
- Paragraph count (blocks of text separated by block-level elements)
- Statistic density: count numbers, percentages, data points in the text

**Scoring:**
- Word count > 800: +5 points | 300-800: +3 points | < 300: +1 point
- Paragraph count > 8: +5 points | 4-8: +3 points | < 4: +1 point
- Contains 3+ statistics/data points: +5 points | 1-2: +3 points | 0: 0 points

**Output fields:**
- `word_count`: number
- `paragraph_count`: number
- `statistics_found`: number
- `score`: 0-15

### Check 6: Lead Answer Quality (max 15 points)

For each H2 or H3 heading, examine the first sentence of the paragraph that follows it. A good "lead answer" directly answers the question implied by the heading — it's self-contained and quotable.

**Scoring criteria:**
- First sentence after heading is 10-40 words long (concise but complete): +1 point per heading (max 5)
- First sentence could stand alone as an answer (contains a verb, not a fragment): +1 point per heading (max 5)
- First sentence is a direct statement, not a question or "In this section we will...": +1 point per heading (max 5)

**Output fields:**
- `headings_checked`: number of H2/H3 headings evaluated
- `good_leads`: number that scored well
- `issues`: array of headings with weak lead answers and why
- `score`: 0-15

### Check 7: Internal Linking (max 15 points)

Count internal links on the page (links to pages on the same domain). Exclude navigation/header/footer links — focus on links within the main content body.

**Scoring:**
- 5+ content-area internal links: +8 points
- 2-4 content-area internal links: +5 points
- 0-1 content-area internal links: +2 points
- Anchor text is descriptive (not "click here", "read more", "link"): +7 points
- Anchor text is generic: +2 points

**Output fields:**
- `total_internal_links`: number (all internal links on page)
- `content_internal_links`: number (excluding nav/header/footer)
- `descriptive_anchors`: number with descriptive text
- `generic_anchors`: array of generic anchor texts found
- `score`: 0-15

## Scoring

Each page gets a total score out of 100, calculated as the sum of all 7 checks. The overall structure score is the average across all analyzed pages.

## Output Schema

Write this exact JSON structure to `geo-reports/.tmp/structure-analysis.json`:

```json
{
  "analysis_date": "YYYY-MM-DD",
  "pages_analyzed": 8,
  "pages": [
    {
      "url": "https://example.com/about",
      "title": "About Us",
      "heading_hierarchy": {
        "h1_count": 1,
        "valid_nesting": true,
        "issues": [],
        "heading_tree": [
          { "level": 1, "text": "About Our Company" },
          { "level": 2, "text": "Our Mission" },
          { "level": 3, "text": "Core Values" }
        ],
        "score": 20
      },
      "faq_sections": {
        "found": false,
        "qa_pairs_count": 0,
        "detection_method": "none",
        "examples": [],
        "score": 0
      },
      "definition_sentences": {
        "count": 2,
        "examples": ["Our company is a leading provider of..."],
        "score": 4
      },
      "lists_tables": {
        "content_lists": 3,
        "tables": 0,
        "score": 7
      },
      "content_depth": {
        "word_count": 850,
        "paragraph_count": 12,
        "statistics_found": 4,
        "score": 15
      },
      "lead_answers": {
        "headings_checked": 5,
        "good_leads": 3,
        "issues": ["'Our Team' heading followed by a fragment, not a complete sentence"],
        "score": 9
      },
      "internal_links": {
        "total_internal_links": 15,
        "content_internal_links": 5,
        "descriptive_anchors": 4,
        "generic_anchors": ["read more"],
        "score": 13
      },
      "page_score": 68
    }
  ],
  "overall_score": 62
}
```

## After Writing Output

Print a brief summary:

```
Structure analysis complete:
- Pages analyzed: X
- Average score: XX/100
- Strongest area: [check name]
- Weakest area: [check name]
- Output: geo-reports/.tmp/structure-analysis.json
```
