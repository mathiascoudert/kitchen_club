# The Dual-View Pattern: How Parallel.ai Serves Both Humans and Machines

## Overview

Parallel.ai implements a pattern where every page contains **two versions of the same content** — one styled for human visitors, one formatted as markdown for AI crawlers. A toggle at the bottom of the page lets humans preview the machine view, but the real purpose is that **both versions exist in the HTML simultaneously**, and AI crawlers naturally consume the machine-readable layer.

No bot detection. No server-side routing. No separate pages. Just CSS visibility.

## How It Works

### 1. Data Attribute Toggle

A `data-mode` attribute on the `<main>` element controls which view is visible:

```html
<main data-mode="human">
  <!-- Both versions of all content live here -->
</main>
```

Two buttons switch the mode via JavaScript:

```html
<button data-switch-mode="human"><span>Human</span></button>
<button data-switch-mode="machine"><span>Machine</span></button>
```

```js
button.addEventListener('click', (e) => {
  document.querySelector('main').dataset.mode = e.target.dataset.switchMode;
});
```

### 2. Custom Tailwind CSS Variants

Tailwind CSS v4 custom variants control visibility based on the `data-mode` value:

```css
@custom-variant machine (&:where([data-mode="machine"], [data-mode="machine"] *));
@custom-variant not-machine (&:where(:not([data-mode="machine"]), :not([data-mode="machine"]) *));
```

This enables utility classes like:

```html
<!-- Visible only in human mode -->
<a class="machine:hidden" href="/blog">Read our blog</a>

<!-- Visible only in machine mode -->
<span class="not-machine:hidden">[Read our blog](/ai/blog)</span>
```

### 3. Dual Content Rendering

Every piece of content has both a human and machine representation inline:

```html
<!-- Human sees: styled heading -->
<h3>
  <span class="not-machine:hidden whitespace-pre">### </span>
  About the benchmark
</h3>

<!-- Human sees: styled link -->
<a class="machine:hidden text-brand hover:underline" href="/blog/post">
  Read more
</a>
<!-- Machine sees: markdown link -->
<span class="not-machine:hidden">
  [Read more](/ai/blog/post)
</span>
```

### 4. The `/ai/` Route Prefix

Machine-view links use `/ai/`-prefixed paths that mirror the human site structure:

| Human URL | Machine URL |
|-----------|-------------|
| `/about` | `/ai/about` |
| `/blog` | `/ai/blog` |
| `/pricing` | `/ai/pricing` |
| `/products/search` | `/ai/products/search` |

When an AI crawler follows links from the machine view, it stays within the `/ai/` route tree — presumably serving markdown-optimized content at each destination. This creates a self-contained machine-readable version of the entire site that AI agents navigate naturally.

## What Changes Between Modes

| Element | Human Mode | Machine Mode |
|---------|-----------|-------------|
| Headings | Styled with fonts/colors | Prefixed with `#`, `##`, `###` |
| Links | Styled anchor tags | Markdown `[text](url)` format |
| Buttons/CTAs | Visible, interactive | Hidden (`machine:hidden`) |
| Layout | Multi-column grid | Single column (`machine:flex-col`) |
| Colors | Light backgrounds | Dark terminal-style |
| Borders | Rounded corners | Square or removed |
| Images | Displayed | Markdown `![alt](url)` format |
| Blockquotes | Styled pull-quotes | Prefixed with `>` |
| Lists | Styled bullets | Prefixed with `-` |

## Why This Works for AI

CSS `display: hidden` is **irrelevant to crawlers**. When GPTBot, ClaudeBot, or Perplexity scrapes the page, they read the raw HTML and see **all content** — both the human and machine versions. The machine-formatted content (markdown syntax) is naturally what LLMs parse best, so it effectively gets prioritized.

The page ships with `data-mode="human"` as default, so browsers render the pretty version. But the machine content is always there in the DOM, ready to be consumed.

## Key Design Decisions

1. **No bot detection needed** — both views coexist in the same HTML. Crawlers naturally consume the markdown-formatted text.

2. **The toggle is a demo, not the mechanism** — it exists so humans can see what AI sees. The actual AI optimization happens because the content is in the DOM regardless of toggle state.

3. **`/ai/` routes keep agents in the machine view** — once an AI follows a machine-formatted link, every subsequent page it visits serves machine-optimized content. This creates a parallel (no pun intended) navigation tree.

4. **Same content, different format** — there's no hidden content or cloaking. Both views say the same thing, just formatted differently. This avoids any search engine cloaking penalties.

5. **Markdown is the lingua franca** — LLMs are trained on massive amounts of markdown. Serving content in markdown format makes it maximally parseable and quotable by AI systems.

## Comparison to Other Approaches

| Approach | How it works | Pros | Cons |
|----------|-------------|------|------|
| **Parallel's dual-view** | Both formats inline, CSS toggles visibility | No duplication of pages, no bot detection, always in sync | Doubles HTML size, requires discipline to maintain both |
| **llms.txt** | Separate markdown file at site root | Simple, one file | Only a summary, not full site content |
| **Server-side UA detection** | Serve different content based on User-Agent | Clean separation | Fragile, can be seen as cloaking, maintenance burden |
| **Separate /api/ docs** | Machine-readable docs at different URLs | Clear separation | Content drift, double maintenance |
| **Schema markup only** | Structured data in JSON-LD | Standard, well-supported | Limited to structured fields, not full content |

## Implementation Complexity

- **Low** if using Tailwind CSS v4 with custom variants
- **Medium** for content authors — each piece of content needs both a human and machine representation
- **Ideally automated** — a CMS or build step could generate the machine view from structured content (e.g., Sanity CMS, which Parallel uses based on their CDN URLs)
