# Weekend Hotel Agent — Design Spec

## Overview

A multi-agent system that runs every Wednesday morning, automatically drafting a weekend marketing email for a hotel. It fetches the weekend weather forecast, discovers local activities, identifies nearby past guests without future reservations, and composes a personalized email — saved locally and optionally drafted in Gmail.

Built with the **Claude Code SDK** (`@anthropic-ai/claude-code`), running on the user's Claude subscription (no API key needed). Scheduled via a system cron job tied to the hotel's local timezone.

## Architecture

**Hybrid approach:** deterministic tools for data fetching, Claude Code agent for creative work.

```
Orchestrator (index.ts)
  ├── Tool: getWeatherForecast(hotelZip)            → forecast
  ├── Tool: searchLocalActivities(hotelCity)         → events  (Claude Code session for web search)
  ├── Tool: getNearbyGuests(hotelZip, radius)        → guest list
  ├── Agent: MarketingAgent(forecast, events, hotel) → email draft
  └── Output: Gmail draft (if MCP available) + local file (always)
```

## Project Structure

```
weekend-hotel-agent/
├── src/
│   ├── index.ts              # Entry point — loads config, runs orchestrator
│   ├── orchestrator.ts       # Sequentially calls tools then marketing agent
│   ├── tools/
│   │   ├── weather.ts        # NWS API fetch (Fri/Sat/Sun forecast)
│   │   ├── activities.ts     # Claude Code session — web search for local events
│   │   └── mews-guests.ts    # Mews API + ZIP code proximity filter
│   ├── agents/
│   │   └── marketing.ts      # Claude Code session — composes email
│   ├── output/
│   │   └── gmail.ts          # Gmail MCP draft or local file fallback
│   └── data/
│       └── zip-codes.json    # US ZIP code → lat/lng lookup table
├── scripts/
│   └── install-cron.sh       # Installs/removes the Wednesday cron job
├── logs/                     # Run logs (one per execution)
├── output/
│   └── drafts/               # Local email draft archive
├── .env                      # Hotel config + Mews tokens
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration (.env)

```
HOTEL_NAME="The Grand Downtown Austin"
HOTEL_ZIP="78701"
HOTEL_CITY="Austin, TX"
HOTEL_TIMEZONE="America/Chicago"
MEWS_CLIENT_TOKEN="..."
MEWS_ACCESS_TOKEN="..."
GUEST_RADIUS_MILES=100
```

- No `ANTHROPIC_API_KEY` — runs on Claude subscription via Claude Code SDK
- Gmail access comes from existing Claude MCP configuration (optional)
- `HOTEL_TIMEZONE` drives the cron schedule and log timestamps

## Tools

### 1. Weather Tool (`tools/weather.ts`)

**Source:** National Weather Service API (free, no key, US-only)

**Flow:**
1. Convert `HOTEL_ZIP` → lat/lng via `zip-codes.json`
2. `GET https://api.weather.gov/points/{lat},{lng}` → forecast grid
3. `GET https://api.weather.gov/gridpoints/{office}/{x},{y}/forecast` → 7-day forecast
4. Filter to Friday, Saturday, Sunday only

**Output:**
```ts
{
  friday:   { high: 82, low: 65, condition: "Sunny", wind: "5 mph" },
  saturday: { high: 78, low: 62, condition: "Partly Cloudy", wind: "10 mph" },
  sunday:   { high: 80, low: 64, condition: "Sunny", wind: "8 mph" }
}
```

### 2. Activities Tool (`tools/activities.ts`)

**Source:** Web search via Claude Code session

A lightweight Claude Code SDK call with the prompt:
> "Search for events, activities, and things to do in {HOTEL_CITY} this coming Friday through Sunday. Return the top 5-8 results with name, date, location, and a one-line description."

**Output:** Structured list of activities (name, date, location, description).

Uses LLM + web search because event discovery is unstructured and benefits from reasoning.

### 3. Mews Guests Tool (`tools/mews-guests.ts`)

**Source:** Mews Connector API (demo or production)

**Flow:**
1. Fetch all customers via `POST /api/connector/v1/customers/getAll` (paginated with `Limitation` cursor)
2. For each customer with an address, look up their ZIP code in `zip-codes.json`
3. Calculate distance from `HOTEL_ZIP` using the Haversine formula
4. Filter to customers within `GUEST_RADIUS_MILES`
5. Fetch future reservations via `reservations/getAll`, exclude customers with active bookings

**Output:**
```ts
{
  guests: [
    { name: "Mathias Coudert", email: "mathias@example.com", city: "Brooklyn, NY", distanceMiles: 12 },
    ...
  ],
  totalFound: 34,
  filteredOut: 8
}
```

### ZIP Code Lookup (`data/zip-codes.json`)

A static US ZIP code → latitude/longitude table. City-level accuracy. Used by both the weather tool (hotel location) and the Mews guests tool (customer proximity). No external geocoding API needed.

## Marketing Agent

### Agent (`agents/marketing.ts`)

A Claude Code session via the SDK. Receives the combined output of all three tools.

**System prompt instructs the agent to:**
- Write a warm, inviting weekend getaway email on behalf of the hotel
- Incorporate weather naturally ("Sunshine all weekend — highs near 82F")
- Highlight 3-4 of the best activities
- Keep it concise and scannable
- Include a soft CTA (e.g., "Book your weekend escape") with a placeholder link
- Output structured data: `{ subject, htmlBody, textBody }`

The agent does not know who the recipients are — it only drafts content.

## Email Output

### Step 1 — Always save locally

```
output/drafts/YYYY-MM-DD-weekend-email.md
```

Contains the full email (subject, body) plus metadata: guest count, weather summary, run timestamp, hotel name. Acts as an audit trail.

### Step 2 — Gmail draft (if available)

- Check if Gmail MCP is accessible
- If yes: create a Gmail draft via `gmail_create_draft` with all guest emails in BCC
- If no: log "Gmail MCP not configured — email saved locally only"

The draft lands in the user's Gmail inbox for review. Never auto-sends.

## Orchestrator Flow

Sequential execution in `orchestrator.ts`:

```
1. Load .env config
2. Run weatherTool(hotelZip)                          → forecast
3. Run activitiesTool(hotelCity)                       → events
4. Run mewsGuestsTool(hotelZip, radius, mewsTokens)   → guests
5. Run marketingAgent(forecast, events, hotel)          → email draft
6. Run emailOutput(draft, guests)                       → Gmail draft + local file
7. Log summary to console
```

No parallel execution. Simple, predictable, easy to debug. Expected total runtime: under 2 minutes.

## Scheduling

### Cron Job

Runs every Wednesday at 9:00 AM in the hotel's local timezone.

`scripts/install-cron.sh` reads `HOTEL_TIMEZONE` from `.env`, converts 9:00 AM local to UTC, and installs the crontab entry:

```bash
# Example: 9am America/Chicago = 2pm UTC
0 14 * * 3 cd /path/to/weekend-hotel-agent && npx tsx src/index.ts >> logs/cron.log 2>&1
```

The script supports install and remove operations.

## Error Handling

Fail-forward strategy — the system degrades gracefully rather than aborting on non-critical failures:

| Step | On failure | Behavior |
|---|---|---|
| Weather tool | NWS API down or bad ZIP | Log warning, email skips forecast section |
| Activities tool | Web search returns nothing | Log warning, email skips activities section |
| Mews guests tool | API error or no guests found | **Hard stop** — no recipients means no email. Log error and exit. |
| Marketing agent | LLM failure | Retry once. If still fails, save raw data to `output/drafts/` for manual use. |
| Gmail draft | MCP not available | Fall back to local file only |

## Logging

All runs log to `logs/YYYY-MM-DD.log`:

- Timestamp (hotel-local timezone)
- Hotel name and location
- Guest count: found, filtered out (had reservations), final
- Weather summary (conditions for Fri/Sat/Sun)
- Activities count
- Email delivery method (Gmail draft vs. local file)
- Errors and warnings

## Dependencies

- `@anthropic-ai/claude-code` — Claude Code SDK (runs on subscription)
- `tsx` — TypeScript execution
- `dotenv` — .env loading
- No other external dependencies for weather (native fetch to NWS) or Mews (native fetch)

## Out of Scope

- Auto-sending emails (always draft-only)
- Non-US hotels (NWS is US-only, ZIP code table is US-only)
- Real-time geocoding (ZIP code table provides city-level accuracy)
- Multi-hotel support (single hotel per installation, configured via .env)
- Email template customization (handled by the marketing agent's prompt)
