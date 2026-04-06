---
name: sunny-weather-agent
description: Generate a weekend marketing email for a hotel. Fetches weather, local activities, and optionally Mews guest data. Outputs a ready-to-use HTML email and guest CSV.
---

# Sunny Weather Agent

Generate a weekend marketing email for a hotel, ready to import into any email platform.

## Setup — Check Config First

The config file is at `~/.claude/skills/sunny-weather-agent/config.json`.

1. Read `config.json`. If it doesn't exist or is missing required fields, ask the user for:
   - **Hotel name** (e.g. "The Grand Downtown Austin")
   - **Hotel ZIP code** (e.g. "78701") — US only
   - **Hotel city** (e.g. "Austin, TX")
   - **Hotel timezone** (e.g. "America/Chicago")
2. Optionally ask: "Do you have Mews PMS credentials? (skip if not)"
   - If yes, collect `mewsClientToken`, `mewsAccessToken`, `mewsBaseUrl` (default: `https://api.mews-demo.com`), `guestRadiusMiles` (default: 100)
3. Save to `config.json` and confirm to the user.

Config schema:
```json
{
  "hotelName": "The Grand Downtown Austin",
  "hotelZip": "78701",
  "hotelCity": "Austin, TX",
  "hotelTimezone": "America/Chicago",
  "mewsClientToken": null,
  "mewsAccessToken": null,
  "mewsBaseUrl": "https://api.mews-demo.com",
  "guestRadiusMiles": 100
}
```

## Pipeline

Run these steps sequentially. If a non-critical step fails, log a warning and continue.

### Step 1: Weather Forecast

Fetch the weekend weather for the hotel's ZIP code using the National Weather Service API.

1. Look up the ZIP code coordinates. Use WebSearch to find "ZIP code {zip} latitude longitude" if needed, or use known coordinates for common ZIPs.
2. Fetch `https://api.weather.gov/points/{lat},{lng}` (set User-Agent header to `SunnyWeatherAgent/1.0`)
3. From the response, get `properties.forecast` URL and fetch it
4. Extract Friday, Saturday, Sunday forecasts (high, low, condition, wind)

If this fails, continue without weather data.

### Step 2: Local Activities

Search for events and things to do in the hotel's city for the upcoming weekend (Friday-Sunday).

1. Use WebSearch to find events, festivals, concerts, markets, outdoor activities
2. Compile the top 5-8 results with: name, date, location, one-line description

If this fails, continue without activities.

### Step 3: Mews Guests (skip if no credentials)

Only run this if `mewsClientToken` and `mewsAccessToken` are set in config.

1. Fetch all customers from Mews:
   ```
   POST {mewsBaseUrl}/api/connector/v1/customers/getAll
   Body: { "ClientToken": "...", "AccessToken": "...", "Client": "SunnyWeatherAgent", "Extent": { "Customers": true, "Addresses": true }, "Limitation": { "Count": 1000 } }
   ```
   Paginate using `Cursor` from response until no more results.

2. Filter customers to those within `guestRadiusMiles` of the hotel ZIP (use haversine distance between ZIP code coordinates).

3. Fetch future reservations (next 90 days):
   ```
   POST {mewsBaseUrl}/api/connector/v1/reservations/getAll
   Body: { "ClientToken": "...", "AccessToken": "...", "Client": "SunnyWeatherAgent", "StartUtc": { "StartUtc": "{now}", "EndUtc": "{now+90days}" }, "Limitation": { "Count": 1000 } }
   ```

4. Exclude customers who already have a future reservation.

If this fails or is skipped, continue without guest data.

### Step 4: Draft the Email

Write a weekend marketing email for the hotel. Use ALL the data gathered above.

**Email requirements:**
- Warm, inviting tone — "come spend the weekend with us"
- Incorporate weather naturally (e.g. "Sunshine all weekend — highs near 82F")
- Highlight 3-4 of the best activities
- Concise and scannable (under 200 words body)
- Soft CTA like "Book your weekend escape" with placeholder `[BOOKING_LINK]`
- Do NOT start with "Dear Guest" — start with an engaging hook
- Produce both an HTML version (simple: paragraphs, bold, bullet points) and a plain text version

### Step 5: Save Output

Create a date-stamped output folder and save the files:

```
{project_root}/output/{YYYY-MM-DD}/
  weekend-email.html    <- Self-contained HTML email, ready to import
  weekend-email.txt     <- Plain text version
  guest-list.csv        <- Only if Mews data was available (name,email,city,distance_miles)
```

The HTML file must be a complete, valid HTML document:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject line}</title>
</head>
<body>
{html body content}
</body>
</html>
```

The CSV must have a header row: `name,email,city,distance_miles`

The `{project_root}` is the Kitchen Club project directory: `/Users/mathiascoudert/GitHub/Kitchen Club/sunny-weather-agent`.

### Step 6: Summary

Tell the user:
- What was generated and where the files are
- Weather summary (if available)
- Number of activities found
- Number of guests in CSV (if Mews was used)
- Remind them the HTML is ready to paste into their email platform (Mailchimp, Brevo, SendGrid, etc.) and the CSV can be imported as the recipient list
