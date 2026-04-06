# Weekend Hotel Agent

A multi-agent system that runs every Wednesday morning, automatically drafting a weekend marketing email for a hotel. It fetches the weekend weather forecast, discovers local activities, identifies nearby past guests (via Mews PMS), and composes a personalized email.

Built with the Claude Agent SDK, running on your Claude subscription.

## Quick Start

1. Clone and install:
   ```bash
   npm install
   ```

2. Configure your hotel:
   ```bash
   cp .env.example .env
   # Edit .env with your hotel details and Mews API tokens
   ```

3. Run manually:
   ```bash
   npm start
   ```

4. Schedule weekly (every Wednesday at 9 AM hotel time):
   ```bash
   ./scripts/install-cron.sh install
   ```

## How It Works

1. **Weather** — Fetches Fri/Sat/Sun forecast from the National Weather Service API
2. **Activities** — Uses Claude web search to find local events this weekend
3. **Mews Guests** — Pulls guests within the configured radius who don't have future reservations
4. **Marketing Email** — Claude composes a personalized email with weather + activities
5. **Delivery** — Saves locally + creates a Gmail draft (if Gmail MCP is configured)

## Configuration

See `.env.example` for all options. Key settings:

- `HOTEL_ZIP` — Used for weather and guest proximity calculations
- `HOTEL_TIMEZONE` — Drives the cron schedule
- `GUEST_RADIUS_MILES` — How far to search for nearby guests (default: 100)

## Email Output

- **Always**: saved to `output/drafts/YYYY-MM-DD-weekend-email.md`
- **Optional**: Gmail draft (requires Gmail MCP in your Claude configuration)

## Requirements

- Node.js 18+
- Claude Code CLI (with active Claude subscription)
- Mews PMS API credentials (demo or production)
