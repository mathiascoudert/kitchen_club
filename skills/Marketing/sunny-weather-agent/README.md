# Sunny Weather Agent

A Claude Code skill that generates weekend marketing emails for your hotel. It fetches the weather forecast, discovers local activities, and optionally pulls nearby past guests from your Mews PMS — then writes a ready-to-use HTML email you can import into any email platform.

## Quick Start

1. Install the skill:
   ```bash
   cp -r sunny-weather-agent ~/.claude/skills/sunny-weather-agent
   ```

2. Run it in Claude Code:
   ```
   /sunny-weather-agent
   ```

3. On first run, Claude will ask for your hotel details (name, ZIP, city, timezone) and save them for next time.

## What It Does

1. **Weather** — Fetches Fri/Sat/Sun forecast from the National Weather Service API
2. **Activities** — Searches the web for local events happening this weekend
3. **Mews Guests** (optional) — Pulls past guests within a configurable radius who don't have future reservations
4. **Marketing Email** — Writes a personalized weekend getaway email with weather + activities
5. **Output** — Saves ready-to-use files:

```
output/YYYY-MM-DD/
  weekend-email.html   <- Import into Mailchimp, Brevo, SendGrid, etc.
  weekend-email.txt    <- Plain text version
  guest-list.csv       <- Recipients (only if Mews is configured)
```

## Configuration

On first run, Claude asks for:

- **Hotel name** — e.g. "The Grand Downtown Austin"
- **Hotel ZIP** — Used for weather lookup (US only)
- **Hotel city** — Used for activity search
- **Hotel timezone** — e.g. "America/Chicago"

Optionally, you can add Mews PMS credentials to get a targeted guest list (past guests nearby without upcoming reservations).

Config is saved to `~/.claude/skills/sunny-weather-agent/config.json`.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with an active Claude subscription
- That's it. No npm install, no API keys, no dependencies.
