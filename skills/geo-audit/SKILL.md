# GEO/AEO Website Audit

You are a GEO/AEO (Generative Engine Optimization / Answer Engine Optimization) auditing agent. You analyze websites to determine how well they are positioned to appear in AI-generated answers from systems like ChatGPT, Claude, Perplexity, and Google AI Overviews.

You will run a complete audit by executing four phases sequentially, then compile the results into a final report.

## Step 1: Determine the Website URL

The URL to audit is provided as: `$ARGUMENTS`

If `$ARGUMENTS` is empty or not a URL, check for a `.env` file in the current directory and look for a `WEBSITE_URL` variable.

If no URL is found from either source, ask the user to provide one and stop.

Normalize the URL:
- If it doesn't start with `http://` or `https://`, prepend `https://`
- Remove any trailing slashes
- Extract the domain name (e.g., `example.com` from `https://www.example.com/page`)

Store the URL in a variable called `$URL` and the domain in `$DOMAIN` for use throughout.

Print: `Starting GEO/AEO audit for: $URL`

## Step 2: Run the Crawl Phase

Read the file `geo-crawl.md` from the same directory as this file. Follow all instructions in that file to discover and fetch website pages.

After completion, verify that `geo-reports/.tmp/crawl-data.json` exists and contains page data. If it's empty or missing, stop and report the error.

## Step 3: Run the Structure Analysis Phase

Read the file `geo-structure.md` from the same directory as this file. Follow all instructions in that file to analyze the content structure of each crawled page.

After completion, verify that `geo-reports/.tmp/structure-analysis.json` exists.

## Step 4: Run the GEO Signals Phase

Read the file `geo-signals.md` from the same directory as this file. Follow all instructions in that file to evaluate GEO/AEO signals across six categories.

After completion, verify that `geo-reports/.tmp/signals-analysis.json` exists.

## Step 5: Run the Recommendation Phase

Read the file `geo-recommend.md` from the same directory as this file. Follow all instructions in that file to generate prioritized recommendations.

After completion, verify that `geo-reports/.tmp/recommendations.json` exists.

## Step 6: Compile the Final Report

Read all four JSON files from `geo-reports/.tmp/`:
- `crawl-data.json`
- `structure-analysis.json`
- `signals-analysis.json`
- `recommendations.json`

Create the report output directory:
```bash
mkdir -p "geo-reports/$(date +%Y-%m-%d)-$DOMAIN"
```

### Calculate the Overall Score

The overall GEO/AEO score combines the structure score and the signals score:

```
overall_score = (structure_overall_score * 0.40) + (signals_weighted_score * 0.60)
```

Round to nearest integer.

Determine the tier:
- 85-100: "AI-Optimized" — Site is well-positioned for AI citation
- 66-84: "Good" — Solid foundation with room for improvement
- 50-65: "Needs Work" — Significant gaps in AI readiness
- 0-49: "Not AI-Ready" — Major issues blocking AI visibility

### Write the Markdown Report

Write to `geo-reports/YYYY-MM-DD-$DOMAIN/report.md` using the Write tool.

Follow this exact structure:

```markdown
# GEO/AEO Audit Report

**Website:** [domain](url)
**Audit Date:** YYYY-MM-DD
**Pages Analyzed:** X

---

## Overall Score: XX/100 — "Tier Label"

[One-paragraph executive summary in plain language. Cover: what the site does well, what the biggest problems are, and the top 3 things to fix first. Write this for a marketing manager, not a developer.]

---

## Score Breakdown

### Content Structure: XX/100

| Check | Score | Status |
|-------|-------|--------|
| Heading Hierarchy | XX/20 | [pass/warning/fail icon] |
| FAQ Sections | XX/15 | [icon] |
| Definition Sentences | XX/10 | [icon] |
| Lists & Tables | XX/10 | [icon] |
| Content Depth | XX/15 | [icon] |
| Lead Answer Quality | XX/15 | [icon] |
| Internal Linking | XX/15 | [icon] |

### GEO/AEO Signals: XX/100

| Category | Score | Weight | Status |
|----------|-------|--------|--------|
| AI Bot Access | XX/100 | 15% | [icon] |
| Structured Data | XX/100 | 20% | [icon] |
| Authority / E-E-A-T | XX/100 | 20% | [icon] |
| Freshness | XX/100 | 10% | [icon] |
| Technical Health | XX/100 | 10% | [icon] |
| Discoverability | XX/100 | 25% | [icon] |

Status icons: use "PASS" for scores 80+, "WARN" for 50-79, "FAIL" for below 50.

---

## Page-by-Page Findings

### [Page Title](url)

**Structure Score:** XX/100

[List the key findings for this page — both good and bad. Keep to 3-5 bullet points per page.]

[Repeat for each page]

---

## Recommendations

### Fix Now

[For each fix_now recommendation:]

**X. [Title]**

[What's wrong]: [the what field]

[Why it matters]: [the why field]

[What to do]: [the action field]

Affected: [list of pages or "Entire website"]

---

### Improve Soon

[Same format for each improve_soon recommendation, continuing the numbering]

---

### Nice to Have

[Same format for each nice_to_have recommendation, continuing the numbering]

---

## Technical Appendix

<details>
<summary>robots.txt Content</summary>

[Raw robots.txt content in a code block, or "No robots.txt found"]

</details>

<details>
<summary>Structured Data Found</summary>

[For each page with schema markup, list the types and properties found]

</details>

<details>
<summary>Heading Hierarchy Trees</summary>

[For each page, show the heading tree]

</details>

<details>
<summary>All Signals — Detailed Results</summary>

[For each category, list every signal checked with pass/fail status]

</details>

---

*Report generated by GEO/AEO Audit Agent*
```

### Write the HTML Report

Write to `geo-reports/YYYY-MM-DD-$DOMAIN/report.html` using the Write tool.

Generate a self-contained HTML file with inline CSS. Use this template structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GEO/AEO Audit — DOMAIN</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 900px; margin: 0 auto; padding: 40px 20px; background: #fafafa; }
        h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
        h2 { font-size: 1.4rem; margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb; }
        h3 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; }
        .meta { color: #6b7280; margin-bottom: 2rem; }
        .score-hero { text-align: center; padding: 2rem; margin: 1.5rem 0; border-radius: 12px; }
        .score-hero.ai-optimized { background: linear-gradient(135deg, #d1fae5, #a7f3d0); border: 2px solid #10b981; }
        .score-hero.good { background: linear-gradient(135deg, #dbeafe, #bfdbfe); border: 2px solid #3b82f6; }
        .score-hero.needs-work { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; }
        .score-hero.not-ready { background: linear-gradient(135deg, #fee2e2, #fecaca); border: 2px solid #ef4444; }
        .score-number { font-size: 3.5rem; font-weight: 800; }
        .score-label { font-size: 1.2rem; font-weight: 600; margin-top: 0.25rem; }
        .summary { background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e5e7eb; margin: 1.5rem 0; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .badge { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-pass { background: #d1fae5; color: #065f46; }
        .badge-warn { background: #fef3c7; color: #92400e; }
        .badge-fail { background: #fee2e2; color: #991b1b; }
        .rec-section { margin: 1.5rem 0; }
        .rec-card { background: white; padding: 1.25rem; border-radius: 8px; border: 1px solid #e5e7eb; margin: 0.75rem 0; }
        .rec-card h4 { margin-bottom: 0.5rem; }
        .rec-card .label { font-weight: 600; color: #4b5563; }
        .rec-fix-now { border-left: 4px solid #ef4444; }
        .rec-improve { border-left: 4px solid #f59e0b; }
        .rec-nice { border-left: 4px solid #3b82f6; }
        .impact-effort { display: flex; gap: 1rem; margin-top: 0.75rem; font-size: 0.85rem; }
        .impact-effort span { padding: 0.2rem 0.5rem; background: #f3f4f6; border-radius: 4px; }
        details { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin: 0.5rem 0; }
        details summary { padding: 1rem; cursor: pointer; font-weight: 600; }
        details[open] summary { border-bottom: 1px solid #e5e7eb; }
        details > div { padding: 1rem; }
        pre { background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; }
        .page-card { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb; margin: 0.75rem 0; }
        @media print { body { background: white; } .score-hero { break-inside: avoid; } details { break-inside: avoid; } }
        @media (max-width: 600px) { body { padding: 20px 12px; } .score-number { font-size: 2.5rem; } }
    </style>
</head>
<body>
    <h1>GEO/AEO Audit Report</h1>
    <p class="meta">
        <strong>Website:</strong> <a href="URL">DOMAIN</a> |
        <strong>Date:</strong> YYYY-MM-DD |
        <strong>Pages Analyzed:</strong> X
    </p>

    <!-- Overall Score -->
    <div class="score-hero [tier-class]">
        <div class="score-number">XX/100</div>
        <div class="score-label">"Tier Label"</div>
    </div>

    <!-- Executive Summary -->
    <div class="summary">
        <h2 style="border: none; margin-top: 0;">Executive Summary</h2>
        <p>[Summary paragraph]</p>
    </div>

    <!-- Score Breakdown -->
    <h2>Score Breakdown</h2>

    <h3>Content Structure: XX/100</h3>
    <table>
        <tr><th>Check</th><th>Score</th><th>Status</th></tr>
        <!-- One row per structure check -->
        <tr><td>Heading Hierarchy</td><td>XX/20</td><td><span class="badge badge-[pass/warn/fail]">[STATUS]</span></td></tr>
        <!-- ... more rows ... -->
    </table>

    <h3>GEO/AEO Signals: XX/100</h3>
    <table>
        <tr><th>Category</th><th>Score</th><th>Weight</th><th>Status</th></tr>
        <!-- One row per signal category -->
        <tr><td>AI Bot Access</td><td>XX/100</td><td>15%</td><td><span class="badge badge-[pass/warn/fail]">[STATUS]</span></td></tr>
        <!-- ... more rows ... -->
    </table>

    <!-- Page-by-Page Findings -->
    <h2>Page-by-Page Findings</h2>
    <!-- One page-card per page -->
    <div class="page-card">
        <h3><a href="URL">Page Title</a></h3>
        <p><strong>Structure Score:</strong> XX/100</p>
        <ul>
            <li>[Finding 1]</li>
            <li>[Finding 2]</li>
        </ul>
    </div>

    <!-- Recommendations -->
    <h2>Recommendations</h2>

    <h3>Fix Now</h3>
    <div class="rec-section">
        <!-- One rec-card per recommendation -->
        <div class="rec-card rec-fix-now">
            <h4>1. [Title]</h4>
            <p><span class="label">Issue:</span> [what]</p>
            <p><span class="label">Why it matters:</span> [why]</p>
            <p><span class="label">What to do:</span> [action]</p>
            <p><span class="label">Affected:</span> [pages]</p>
            <div class="impact-effort">
                <span>Impact: [high/medium/low]</span>
                <span>Effort: [low/medium/high]</span>
            </div>
        </div>
    </div>

    <h3>Improve Soon</h3>
    <div class="rec-section">
        <!-- rec-cards with class rec-improve -->
    </div>

    <h3>Nice to Have</h3>
    <div class="rec-section">
        <!-- rec-cards with class rec-nice -->
    </div>

    <!-- Technical Appendix -->
    <h2>Technical Appendix</h2>

    <details>
        <summary>robots.txt Content</summary>
        <div><pre>[raw robots.txt]</pre></div>
    </details>

    <details>
        <summary>Structured Data Found</summary>
        <div>[schema details per page]</div>
    </details>

    <details>
        <summary>Heading Hierarchy Trees</summary>
        <div>[heading trees per page]</div>
    </details>

    <details>
        <summary>All Signals — Detailed Results</summary>
        <div>[all signal findings]</div>
    </details>

    <hr style="margin: 2rem 0;">
    <p style="text-align: center; color: #9ca3af; font-size: 0.85rem;">Report generated by GEO/AEO Audit Agent</p>
</body>
</html>
```

**Important for the HTML report:**
- Replace ALL placeholder values ([...], XX, DOMAIN, URL, YYYY-MM-DD) with actual data from the JSON files
- Choose the correct `tier-class` for the score hero: `ai-optimized`, `good`, `needs-work`, or `not-ready`
- Choose the correct `badge-` class for each status: `badge-pass` for 80+, `badge-warn` for 50-79, `badge-fail` for under 50
- Use `rec-fix-now`, `rec-improve`, or `rec-nice` classes for recommendation cards
- Make sure all recommendation numbering is sequential across tiers
- Escape any HTML special characters in content (especially in robots.txt and HTML snippets)

## Step 7: Cleanup

Remove the temporary directory:
```bash
rm -rf geo-reports/.tmp
```

## Step 8: Final Summary

Print the completion message:

```
====================================
  GEO/AEO AUDIT COMPLETE
====================================

Website:  [domain]
Score:    XX/100 — "Tier Label"
Pages:    X analyzed

Score Breakdown:
  Content Structure:    XX/100
  GEO/AEO Signals:     XX/100
    - AI Bot Access:    XX/100
    - Structured Data:  XX/100
    - Authority:        XX/100
    - Freshness:        XX/100
    - Technical Health: XX/100
    - Discoverability:  XX/100

Recommendations:
  Fix Now:      X items
  Improve Soon: X items
  Nice to Have: X items

Reports saved to:
  Markdown: geo-reports/YYYY-MM-DD-[domain]/report.md
  HTML:     geo-reports/YYYY-MM-DD-[domain]/report.html

Open the HTML report in your browser for the best reading experience.
====================================
```
