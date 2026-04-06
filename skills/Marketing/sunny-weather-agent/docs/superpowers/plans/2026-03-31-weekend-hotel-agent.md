# Weekend Hotel Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-agent system that runs every Wednesday, fetching weekend weather/activities/nearby guests from Mews, then drafting a marketing email via Claude — saved locally and optionally as a Gmail draft.

**Architecture:** Hybrid approach using the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`). Three deterministic tools (weather, activities, Mews guests) feed data to a marketing sub-agent that composes the email. An orchestrator calls them sequentially. Scheduled via system cron tied to the hotel's timezone.

**Tech Stack:** TypeScript, Claude Agent SDK, NWS API, Mews Connector API, ZIP code lookup (Haversine), Gmail MCP (optional), cron

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/index.ts` (placeholder)
- Create: `src/config.ts`

- [ ] **Step 1: Initialize the project**

```bash
cd /Users/mathiascoudert/GitHub/weekend-hotel-agent
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "weekend-hotel-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Create .env.example**

```
HOTEL_NAME="The Grand Downtown Austin"
HOTEL_ZIP="78701"
HOTEL_CITY="Austin, TX"
HOTEL_TIMEZONE="America/Chicago"
MEWS_CLIENT_TOKEN="E0D439EE522F44368DC78E1BFB03710C-D24FB11DBE31D4621C4817E028D9E1D"
MEWS_ACCESS_TOKEN="C66EF7B239D24632943D115EDE9CB810-EA00F8FD8294692C940F6B5A8F9453D"
MEWS_BASE_URL="https://api.mews-demo.com"
GUEST_RADIUS_MILES=100
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
.env
logs/
output/drafts/
```

- [ ] **Step 6: Create src/config.ts**

```typescript
import "dotenv/config";

export interface HotelConfig {
  hotelName: string;
  hotelZip: string;
  hotelCity: string;
  hotelTimezone: string;
  mewsClientToken: string;
  mewsAccessToken: string;
  mewsBaseUrl: string;
  guestRadiusMiles: number;
}

export function loadConfig(): HotelConfig {
  const required = [
    "HOTEL_NAME",
    "HOTEL_ZIP",
    "HOTEL_CITY",
    "HOTEL_TIMEZONE",
    "MEWS_CLIENT_TOKEN",
    "MEWS_ACCESS_TOKEN",
  ] as const;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  return {
    hotelName: process.env.HOTEL_NAME!,
    hotelZip: process.env.HOTEL_ZIP!,
    hotelCity: process.env.HOTEL_CITY!,
    hotelTimezone: process.env.HOTEL_TIMEZONE!,
    mewsClientToken: process.env.MEWS_CLIENT_TOKEN!,
    mewsAccessToken: process.env.MEWS_ACCESS_TOKEN!,
    mewsBaseUrl: process.env.MEWS_BASE_URL ?? "https://api.mews-demo.com",
    guestRadiusMiles: Number(process.env.GUEST_RADIUS_MILES ?? "100"),
  };
}
```

- [ ] **Step 7: Create placeholder src/index.ts**

```typescript
import { loadConfig } from "./config.js";

async function main() {
  const config = loadConfig();
  console.log(`Weekend Hotel Agent starting for: ${config.hotelName}`);
}

main().catch(console.error);
```

- [ ] **Step 8: Install dependencies and verify**

```bash
cd /Users/mathiascoudert/GitHub/weekend-hotel-agent
npm install
```

- [ ] **Step 9: Create .env from example and verify run**

```bash
cp .env.example .env
npx tsx src/index.ts
```

Expected: `Weekend Hotel Agent starting for: The Grand Downtown Austin`

- [ ] **Step 10: Commit**

```bash
git add package.json tsconfig.json .env.example .gitignore src/config.ts src/index.ts
git commit -m "feat: project scaffolding with config loader"
```

---

### Task 2: ZIP Code Lookup & Haversine Distance

**Files:**
- Create: `src/data/zip-codes.json` (subset for testing — full file added later)
- Create: `src/utils/geo.ts`
- Create: `src/utils/__tests__/geo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/utils/__tests__/geo.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { haversineDistance, getZipCoordinates } from "../geo.js";

describe("haversineDistance", () => {
  it("calculates distance between Austin TX and Houston TX (~160 miles)", () => {
    const austin = { lat: 30.2672, lng: -97.7431 };
    const houston = { lat: 29.7604, lng: -95.3698 };
    const distance = haversineDistance(austin, houston);
    expect(distance).toBeGreaterThan(140);
    expect(distance).toBeLessThan(180);
  });

  it("returns 0 for same point", () => {
    const point = { lat: 40.7128, lng: -74.006 };
    expect(haversineDistance(point, point)).toBe(0);
  });
});

describe("getZipCoordinates", () => {
  it("returns coordinates for a known ZIP code", () => {
    const coords = getZipCoordinates("78701");
    expect(coords).not.toBeNull();
    expect(coords!.lat).toBeCloseTo(30.27, 0);
    expect(coords!.lng).toBeCloseTo(-97.74, 0);
  });

  it("returns null for unknown ZIP code", () => {
    expect(getZipCoordinates("00000")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/utils/__tests__/geo.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create a small test ZIP code dataset**

Create `src/data/zip-codes.json` with a subset (full dataset will be downloaded in a later step):

```json
{
  "78701": { "lat": 30.2672, "lng": -97.7431, "city": "Austin", "state": "TX" },
  "77001": { "lat": 29.7604, "lng": -95.3698, "city": "Houston", "state": "TX" },
  "10001": { "lat": 40.7484, "lng": -73.9967, "city": "New York", "state": "NY" },
  "11201": { "lat": 40.6944, "lng": -73.9907, "city": "Brooklyn", "state": "NY" },
  "94102": { "lat": 37.7791, "lng": -122.4193, "city": "San Francisco", "state": "CA" },
  "33101": { "lat": 25.7617, "lng": -80.1918, "city": "Miami", "state": "FL" }
}
```

- [ ] **Step 4: Implement geo utilities**

Create `src/utils/geo.ts`:

```typescript
import zipData from "../data/zip-codes.json" with { type: "json" };

interface Coordinates {
  lat: number;
  lng: number;
}

interface ZipEntry extends Coordinates {
  city: string;
  state: string;
}

const zipDatabase = zipData as Record<string, ZipEntry>;

export function getZipCoordinates(zip: string): Coordinates | null {
  const entry = zipDatabase[zip];
  if (!entry) return null;
  return { lat: entry.lat, lng: entry.lng };
}

export function getZipCity(zip: string): string | null {
  const entry = zipDatabase[zip];
  if (!entry) return null;
  return `${entry.city}, ${entry.state}`;
}

export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const calc =
    sinDLat * sinDLat +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(calc), Math.sqrt(1 - calc));
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/utils/__tests__/geo.test.ts
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/utils/geo.ts src/utils/__tests__/geo.test.ts src/data/zip-codes.json
git commit -m "feat: ZIP code lookup and Haversine distance calculation"
```

---

### Task 3: Weather Tool

**Files:**
- Create: `src/tools/weather.ts`
- Create: `src/tools/__tests__/weather.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tools/__tests__/weather.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { filterWeekendForecast, type DayForecast } from "../weather.js";

describe("filterWeekendForecast", () => {
  it("extracts Friday, Saturday, Sunday from NWS periods", () => {
    // NWS returns periods with names like "Friday", "Friday Night", "Saturday", etc.
    const periods = [
      { name: "Thursday", temperature: 75, shortForecast: "Sunny", windSpeed: "5 mph", isDaytime: true },
      { name: "Thursday Night", temperature: 60, shortForecast: "Clear", windSpeed: "3 mph", isDaytime: false },
      { name: "Friday", temperature: 82, shortForecast: "Sunny", windSpeed: "5 mph", isDaytime: true },
      { name: "Friday Night", temperature: 65, shortForecast: "Clear", windSpeed: "3 mph", isDaytime: false },
      { name: "Saturday", temperature: 78, shortForecast: "Partly Cloudy", windSpeed: "10 mph", isDaytime: true },
      { name: "Saturday Night", temperature: 62, shortForecast: "Mostly Clear", windSpeed: "5 mph", isDaytime: false },
      { name: "Sunday", temperature: 80, shortForecast: "Sunny", windSpeed: "8 mph", isDaytime: true },
      { name: "Sunday Night", temperature: 64, shortForecast: "Clear", windSpeed: "4 mph", isDaytime: false },
    ];

    const result = filterWeekendForecast(periods);

    expect(result.friday).toEqual({ high: 82, low: 65, condition: "Sunny", wind: "5 mph" });
    expect(result.saturday).toEqual({ high: 78, low: 62, condition: "Partly Cloudy", wind: "10 mph" });
    expect(result.sunday).toEqual({ high: 80, low: 64, condition: "Sunny", wind: "8 mph" });
  });

  it("returns null fields when weekend days are missing", () => {
    const periods = [
      { name: "Monday", temperature: 70, shortForecast: "Rainy", windSpeed: "15 mph", isDaytime: true },
      { name: "Monday Night", temperature: 55, shortForecast: "Rainy", windSpeed: "10 mph", isDaytime: false },
    ];

    const result = filterWeekendForecast(periods);
    expect(result.friday).toBeNull();
    expect(result.saturday).toBeNull();
    expect(result.sunday).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tools/__tests__/weather.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the weather tool**

Create `src/tools/weather.ts`:

```typescript
import { getZipCoordinates } from "../utils/geo.js";

export interface DayForecast {
  high: number;
  low: number;
  condition: string;
  wind: string;
}

export interface WeekendForecast {
  friday: DayForecast | null;
  saturday: DayForecast | null;
  sunday: DayForecast | null;
}

interface NWSPeriod {
  name: string;
  temperature: number;
  shortForecast: string;
  windSpeed: string;
  isDaytime: boolean;
}

export function filterWeekendForecast(periods: NWSPeriod[]): WeekendForecast {
  const days = ["Friday", "Saturday", "Sunday"] as const;
  const result: WeekendForecast = { friday: null, saturday: null, sunday: null };

  for (const day of days) {
    const daytime = periods.find((p) => p.name === day && p.isDaytime);
    const nighttime = periods.find((p) => p.name === `${day} Night` && !p.isDaytime);

    if (daytime) {
      const key = day.toLowerCase() as "friday" | "saturday" | "sunday";
      result[key] = {
        high: daytime.temperature,
        low: nighttime?.temperature ?? daytime.temperature - 15,
        condition: daytime.shortForecast,
        wind: daytime.windSpeed,
      };
    }
  }

  return result;
}

export async function getWeatherForecast(hotelZip: string): Promise<WeekendForecast> {
  const coords = getZipCoordinates(hotelZip);
  if (!coords) {
    throw new Error(`Unknown ZIP code: ${hotelZip}`);
  }

  // Step 1: Get the forecast grid endpoint for this location
  const pointsRes = await fetch(
    `https://api.weather.gov/points/${coords.lat},${coords.lng}`,
    { headers: { "User-Agent": "WeekendHotelAgent/1.0" } }
  );

  if (!pointsRes.ok) {
    throw new Error(`NWS points API error: ${pointsRes.status}`);
  }

  const pointsData = await pointsRes.json();
  const forecastUrl = pointsData.properties.forecast;

  // Step 2: Get the 7-day forecast
  const forecastRes = await fetch(forecastUrl, {
    headers: { "User-Agent": "WeekendHotelAgent/1.0" },
  });

  if (!forecastRes.ok) {
    throw new Error(`NWS forecast API error: ${forecastRes.status}`);
  }

  const forecastData = await forecastRes.json();
  return filterWeekendForecast(forecastData.properties.periods);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tools/__tests__/weather.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools/weather.ts src/tools/__tests__/weather.test.ts
git commit -m "feat: weather tool with NWS API and weekend filtering"
```

---

### Task 4: Mews Guests Tool

**Files:**
- Create: `src/tools/mews-guests.ts`
- Create: `src/tools/__tests__/mews-guests.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tools/__tests__/mews-guests.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { filterGuestsByProximity, type MewsCustomer, type NearbyGuest } from "../mews-guests.js";

describe("filterGuestsByProximity", () => {
  it("filters guests within radius of hotel ZIP", () => {
    const customers: MewsCustomer[] = [
      {
        Id: "1",
        FirstName: "Alice",
        LastName: "Smith",
        Email: "alice@example.com",
        Address: { Line1: "123 Main St", City: "Houston", PostalCode: "77001", CountryCode: "US" },
      },
      {
        Id: "2",
        FirstName: "Bob",
        LastName: "Jones",
        Email: "bob@example.com",
        Address: { Line1: "456 Oak Ave", City: "San Francisco", PostalCode: "94102", CountryCode: "US" },
      },
      {
        Id: "3",
        FirstName: "Charlie",
        LastName: "Brown",
        Email: null,
        Address: null,
      },
    ];

    // Austin TX (78701) to Houston TX (77001) is ~160 miles
    // Austin TX to SF (94102) is ~1700 miles
    const result = filterGuestsByProximity(customers, "78701", 200);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alice Smith");
    expect(result[0].email).toBe("alice@example.com");
    expect(result[0].distanceMiles).toBeGreaterThan(140);
    expect(result[0].distanceMiles).toBeLessThan(180);
  });

  it("excludes guests without address or postal code", () => {
    const customers: MewsCustomer[] = [
      {
        Id: "1",
        FirstName: "No",
        LastName: "Address",
        Email: "no@example.com",
        Address: null,
      },
    ];

    const result = filterGuestsByProximity(customers, "78701", 100);
    expect(result).toHaveLength(0);
  });

  it("excludes guests without email", () => {
    const customers: MewsCustomer[] = [
      {
        Id: "1",
        FirstName: "No",
        LastName: "Email",
        Email: null,
        Address: { Line1: "123 Main", City: "Austin", PostalCode: "78701", CountryCode: "US" },
      },
    ];

    const result = filterGuestsByProximity(customers, "78701", 100);
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tools/__tests__/mews-guests.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the Mews guests tool**

Create `src/tools/mews-guests.ts`:

```typescript
import { getZipCoordinates, haversineDistance } from "../utils/geo.js";
import type { HotelConfig } from "../config.js";

export interface MewsCustomer {
  Id: string;
  FirstName: string | null;
  LastName: string;
  Email: string | null;
  Address: {
    Line1: string | null;
    City: string | null;
    PostalCode: string | null;
    CountryCode: string | null;
  } | null;
}

export interface NearbyGuest {
  name: string;
  email: string;
  city: string;
  distanceMiles: number;
}

export interface MewsGuestResult {
  guests: NearbyGuest[];
  totalFound: number;
  filteredOut: number;
}

export function filterGuestsByProximity(
  customers: MewsCustomer[],
  hotelZip: string,
  radiusMiles: number
): NearbyGuest[] {
  const hotelCoords = getZipCoordinates(hotelZip);
  if (!hotelCoords) return [];

  const nearby: NearbyGuest[] = [];

  for (const customer of customers) {
    if (!customer.Email || !customer.Address?.PostalCode) continue;

    const guestCoords = getZipCoordinates(customer.Address.PostalCode);
    if (!guestCoords) continue;

    const distance = haversineDistance(hotelCoords, guestCoords);
    if (distance <= radiusMiles) {
      nearby.push({
        name: [customer.FirstName, customer.LastName].filter(Boolean).join(" "),
        email: customer.Email,
        city: customer.Address.City ?? "Unknown",
        distanceMiles: Math.round(distance),
      });
    }
  }

  return nearby;
}

async function fetchAllCustomers(config: HotelConfig): Promise<MewsCustomer[]> {
  const allCustomers: MewsCustomer[] = [];
  let cursor: string | null = null;

  do {
    const body: Record<string, unknown> = {
      ClientToken: config.mewsClientToken,
      AccessToken: config.mewsAccessToken,
      Client: "WeekendHotelAgent",
      Extent: { Customers: true, Addresses: true },
      Limitation: { Count: 1000, Cursor: cursor },
    };

    const res = await fetch(
      `${config.mewsBaseUrl}/api/connector/v1/customers/getAll`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      throw new Error(`Mews customers API error: ${res.status}`);
    }

    const data = await res.json();
    allCustomers.push(...data.Customers);
    cursor = data.Cursor;
  } while (cursor);

  return allCustomers;
}

async function fetchFutureReservationCustomerIds(config: HotelConfig): Promise<Set<string>> {
  const now = new Date().toISOString();
  const threeMonths = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const body = {
    ClientToken: config.mewsClientToken,
    AccessToken: config.mewsAccessToken,
    Client: "WeekendHotelAgent",
    StartUtc: { StartUtc: now, EndUtc: threeMonths },
    Limitation: { Count: 1000 },
  };

  const res = await fetch(
    `${config.mewsBaseUrl}/api/connector/v1/reservations/getAll`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(`Mews reservations API error: ${res.status}`);
  }

  const data = await res.json();
  const customerIds = new Set<string>();
  for (const reservation of data.Reservations ?? []) {
    if (reservation.CustomerId) {
      customerIds.add(reservation.CustomerId);
    }
  }
  return customerIds;
}

export async function getNearbyGuests(config: HotelConfig): Promise<MewsGuestResult> {
  const customers = await fetchAllCustomers(config);
  const nearbyAll = filterGuestsByProximity(customers, config.hotelZip, config.guestRadiusMiles);

  const reservedIds = await fetchFutureReservationCustomerIds(config);

  // We need customer IDs to cross-reference — re-map from the original list
  const customerByEmail = new Map(
    customers
      .filter((c) => c.Email)
      .map((c) => [c.Email!, c.Id])
  );

  const guests = nearbyAll.filter((g) => {
    const customerId = customerByEmail.get(g.email);
    return customerId && !reservedIds.has(customerId);
  });

  return {
    guests,
    totalFound: nearbyAll.length,
    filteredOut: nearbyAll.length - guests.length,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tools/__tests__/mews-guests.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools/mews-guests.ts src/tools/__tests__/mews-guests.test.ts
git commit -m "feat: Mews guests tool with proximity filter and reservation exclusion"
```

---

### Task 5: Activities Tool (Claude Agent SDK Web Search)

**Files:**
- Create: `src/tools/activities.ts`

- [ ] **Step 1: Implement the activities tool**

Create `src/tools/activities.ts`:

```typescript
import { query, ClaudeAgentOptions, ResultMessage } from "@anthropic-ai/claude-agent-sdk";

export interface Activity {
  name: string;
  date: string;
  location: string;
  description: string;
}

export async function searchLocalActivities(hotelCity: string): Promise<Activity[]> {
  const now = new Date();
  const friday = new Date(now);
  friday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);

  const dateRange = `${friday.toLocaleDateString("en-US", { month: "long", day: "numeric" })} to ${sunday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  const prompt = `Search for events, activities, and things to do in ${hotelCity} from ${dateRange}. Return ONLY a JSON array of the top 5-8 results. Each item must have these exact fields: "name", "date", "location", "description" (one sentence). No markdown, no explanation — just the JSON array.`;

  let result = "";

  for await (const message of query({
    prompt,
    options: {
      allowedTools: ["WebSearch", "WebFetch"],
      maxTurns: 5,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    if ("result" in message) {
      result = message.result;
    }
  }

  try {
    // Extract JSON array from the response (handle potential surrounding text)
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]) as Activity[];
  } catch {
    console.warn("Failed to parse activities response:", result.slice(0, 200));
    return [];
  }
}
```

- [ ] **Step 2: Commit**

No automated test for this tool — it requires a live Claude session with web search. Will be tested via integration in the orchestrator.

```bash
git add src/tools/activities.ts
git commit -m "feat: activities tool using Claude Agent SDK web search"
```

---

### Task 6: Marketing Agent

**Files:**
- Create: `src/agents/marketing.ts`

- [ ] **Step 1: Implement the marketing agent**

Create `src/agents/marketing.ts`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { WeekendForecast } from "../tools/weather.js";
import type { Activity } from "../tools/activities.js";

export interface EmailDraft {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export async function draftMarketingEmail(
  forecast: WeekendForecast,
  activities: Activity[],
  hotelName: string,
  hotelCity: string
): Promise<EmailDraft> {
  const forecastSummary = Object.entries(forecast)
    .filter(([, v]) => v !== null)
    .map(([day, f]) => `${day}: ${f!.high}°F high, ${f!.low}°F low, ${f!.condition}, wind ${f!.wind}`)
    .join("\n");

  const activitiesSummary = activities.length > 0
    ? activities.map((a) => `- ${a.name} (${a.date}, ${a.location}): ${a.description}`).join("\n")
    : "No specific events found for this weekend.";

  const prompt = `You are a marketing copywriter for ${hotelName} in ${hotelCity}. Draft a weekend getaway email.

WEATHER FORECAST:
${forecastSummary || "Weather data unavailable."}

LOCAL ACTIVITIES:
${activitiesSummary}

REQUIREMENTS:
- Warm, inviting tone — this is a "come spend the weekend with us" email
- Incorporate the weather naturally (e.g., "Sunshine all weekend — highs near 82°F")
- Highlight 3-4 of the best activities
- Keep it concise and scannable (under 200 words for the body)
- Include a soft CTA like "Book your weekend escape" with a placeholder link [BOOKING_LINK]
- Do NOT include a greeting line (no "Dear Guest") — start with an engaging hook

Return ONLY a JSON object with these exact fields:
- "subject": email subject line (under 60 chars)
- "htmlBody": the email body in simple HTML (paragraphs, bold, bullet points)
- "textBody": plain text version of the same email

No markdown wrapping, no explanation — just the JSON object.`;

  let result = "";

  for await (const message of query({
    prompt,
    options: {
      allowedTools: [],
      maxTurns: 1,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    if ("result" in message) {
      result = message.result;
    }
  }

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in marketing agent response");
    return JSON.parse(jsonMatch[0]) as EmailDraft;
  } catch (e) {
    throw new Error(`Failed to parse marketing email: ${e}`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/agents/marketing.ts
git commit -m "feat: marketing agent for email composition via Claude Agent SDK"
```

---

### Task 7: Email Output (Gmail MCP + Local File)

**Files:**
- Create: `src/output/gmail.ts`
- Create: `src/output/__tests__/gmail.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/output/__tests__/gmail.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildLocalDraftContent } from "../gmail.js";

describe("buildLocalDraftContent", () => {
  it("formats email draft with metadata", () => {
    const content = buildLocalDraftContent(
      { subject: "Weekend in Austin", htmlBody: "<p>Hello</p>", textBody: "Hello" },
      12,
      "The Grand Downtown Austin",
      { friday: { high: 82, low: 65, condition: "Sunny", wind: "5 mph" }, saturday: null, sunday: null }
    );

    expect(content).toContain("Subject: Weekend in Austin");
    expect(content).toContain("Guest Count: 12");
    expect(content).toContain("The Grand Downtown Austin");
    expect(content).toContain("Hello");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/output/__tests__/gmail.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement email output**

Create `src/output/gmail.ts`:

```typescript
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { EmailDraft } from "../agents/marketing.js";
import type { WeekendForecast } from "../tools/weather.js";
import type { NearbyGuest } from "../tools/mews-guests.js";

export function buildLocalDraftContent(
  draft: EmailDraft,
  guestCount: number,
  hotelName: string,
  forecast: WeekendForecast
): string {
  const now = new Date();
  const weatherSummary = Object.entries(forecast)
    .filter(([, v]) => v !== null)
    .map(([day, f]) => `  ${day}: ${f!.high}°F / ${f!.low}°F — ${f!.condition}`)
    .join("\n");

  return `# Weekend Marketing Email Draft
Generated: ${now.toISOString()}
Hotel: ${hotelName}

## Metadata
- Guest Count: ${guestCount}
- Weather Summary:
${weatherSummary || "  No weather data available"}

## Email
Subject: ${draft.subject}

### Text Version
${draft.textBody}

### HTML Version
${draft.htmlBody}
`;
}

export function saveLocalDraft(content: string, projectRoot: string): string {
  const date = new Date().toISOString().split("T")[0];
  const dir = join(projectRoot, "output", "drafts");
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${date}-weekend-email.md`);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

export async function createGmailDraft(
  draft: EmailDraft,
  guests: NearbyGuest[]
): Promise<boolean> {
  const bccList = guests.map((g) => g.email).join(", ");

  try {
    let success = false;

    for await (const message of query({
      prompt: `Create a Gmail draft email with the following details:
- Subject: ${draft.subject}
- BCC: ${bccList}
- Body (HTML): ${draft.htmlBody}

Use the gmail_create_draft tool to create this draft. Do not send it — only create a draft.`,
      options: {
        allowedTools: ["mcp__claude_ai_Gmail__gmail_create_draft"],
        maxTurns: 3,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
      },
    })) {
      if ("result" in message) {
        success = true;
      }
    }

    return success;
  } catch (e) {
    console.warn("Gmail MCP not available:", e);
    return false;
  }
}

export async function deliverEmail(
  draft: EmailDraft,
  guests: NearbyGuest[],
  hotelName: string,
  forecast: WeekendForecast,
  projectRoot: string
): Promise<{ localPath: string; gmailDraft: boolean }> {
  // Step 1: Always save locally
  const content = buildLocalDraftContent(draft, guests.length, hotelName, forecast);
  const localPath = saveLocalDraft(content, projectRoot);
  console.log(`Email draft saved: ${localPath}`);

  // Step 2: Try Gmail draft
  const gmailDraft = await createGmailDraft(draft, guests);
  if (gmailDraft) {
    console.log("Gmail draft created successfully");
  } else {
    console.log("Gmail MCP not configured — email saved locally only");
  }

  return { localPath, gmailDraft };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/output/__tests__/gmail.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/output/gmail.ts src/output/__tests__/gmail.test.ts
git commit -m "feat: email output with Gmail MCP draft and local file fallback"
```

---

### Task 8: Logging Utility

**Files:**
- Create: `src/utils/logger.ts`

- [ ] **Step 1: Implement logger**

Create `src/utils/logger.ts`:

```typescript
import { writeFileSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";

export class Logger {
  private logPath: string;
  private entries: string[] = [];

  constructor(projectRoot: string, timezone: string) {
    const dir = join(projectRoot, "logs");
    mkdirSync(dir, { recursive: true });

    const now = new Date().toLocaleDateString("en-CA", { timeZone: timezone });
    this.logPath = join(dir, `${now}.log`);
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}`;
    this.entries.push(line);
    console.log(line);
  }

  warn(message: string): void {
    this.log(`WARN: ${message}`);
  }

  error(message: string): void {
    this.log(`ERROR: ${message}`);
  }

  flush(): void {
    if (this.entries.length > 0) {
      appendFileSync(this.logPath, this.entries.join("\n") + "\n", "utf-8");
      this.entries = [];
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/logger.ts
git commit -m "feat: logging utility with timezone-aware file output"
```

---

### Task 9: Orchestrator

**Files:**
- Create: `src/orchestrator.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Implement the orchestrator**

Create `src/orchestrator.ts`:

```typescript
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { HotelConfig } from "./config.js";
import { getWeatherForecast, type WeekendForecast } from "./tools/weather.js";
import { searchLocalActivities, type Activity } from "./tools/activities.js";
import { getNearbyGuests, type MewsGuestResult } from "./tools/mews-guests.js";
import { draftMarketingEmail } from "./agents/marketing.js";
import { deliverEmail } from "./output/gmail.js";
import { Logger } from "./utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(__dirname);

export async function runOrchestrator(config: HotelConfig): Promise<void> {
  const logger = new Logger(PROJECT_ROOT, config.hotelTimezone);

  logger.log(`Starting Weekend Hotel Agent for: ${config.hotelName} (${config.hotelCity})`);

  // Step 1: Weather
  let forecast: WeekendForecast = { friday: null, saturday: null, sunday: null };
  try {
    logger.log("Fetching weather forecast...");
    forecast = await getWeatherForecast(config.hotelZip);
    const days = [forecast.friday, forecast.saturday, forecast.sunday].filter(Boolean);
    logger.log(`Weather: ${days.length} weekend days retrieved`);
  } catch (e) {
    logger.warn(`Weather fetch failed: ${e}. Email will skip forecast section.`);
  }

  // Step 2: Activities
  let activities: Activity[] = [];
  try {
    logger.log("Searching for local activities...");
    activities = await searchLocalActivities(config.hotelCity);
    logger.log(`Activities: ${activities.length} events found`);
  } catch (e) {
    logger.warn(`Activities search failed: ${e}. Email will skip activities section.`);
  }

  // Step 3: Mews Guests (hard stop if this fails)
  let guestResult: MewsGuestResult;
  try {
    logger.log("Fetching nearby guests from Mews...");
    guestResult = await getNearbyGuests(config);
    logger.log(
      `Guests: ${guestResult.guests.length} nearby (${guestResult.totalFound} total, ${guestResult.filteredOut} filtered out)`
    );
  } catch (e) {
    logger.error(`Mews guest fetch failed: ${e}. Aborting — no recipients.`);
    logger.flush();
    throw e;
  }

  if (guestResult.guests.length === 0) {
    logger.error("No nearby guests without future reservations. Aborting.");
    logger.flush();
    return;
  }

  // Step 4: Marketing Agent
  let emailDraft;
  try {
    logger.log("Drafting marketing email...");
    emailDraft = await draftMarketingEmail(forecast, activities, config.hotelName, config.hotelCity);
    logger.log(`Email drafted: "${emailDraft.subject}"`);
  } catch (e) {
    // Retry once
    logger.warn(`Marketing agent failed: ${e}. Retrying...`);
    try {
      emailDraft = await draftMarketingEmail(forecast, activities, config.hotelName, config.hotelCity);
      logger.log(`Email drafted on retry: "${emailDraft.subject}"`);
    } catch (retryError) {
      logger.error(`Marketing agent failed on retry: ${retryError}. Saving raw data.`);
      // Save raw data as fallback
      const { saveLocalDraft, buildLocalDraftContent } = await import("./output/gmail.js");
      const rawContent = `# RAW DATA (Marketing Agent Failed)\n\n## Weather\n${JSON.stringify(forecast, null, 2)}\n\n## Activities\n${JSON.stringify(activities, null, 2)}\n\n## Guests\n${guestResult.guests.length} guests available\n`;
      saveLocalDraft(rawContent, PROJECT_ROOT);
      logger.flush();
      return;
    }
  }

  // Step 5: Deliver Email
  logger.log("Delivering email...");
  const delivery = await deliverEmail(
    emailDraft,
    guestResult.guests,
    config.hotelName,
    forecast,
    PROJECT_ROOT
  );

  logger.log(`Delivery: local=${delivery.localPath}, gmail=${delivery.gmailDraft}`);
  logger.log("Weekend Hotel Agent completed successfully.");
  logger.flush();
}
```

- [ ] **Step 2: Update src/index.ts**

```typescript
import { loadConfig } from "./config.js";
import { runOrchestrator } from "./orchestrator.js";

async function main() {
  const config = loadConfig();
  await runOrchestrator(config);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/orchestrator.ts src/index.ts
git commit -m "feat: orchestrator connecting weather, activities, Mews, marketing, and email output"
```

---

### Task 10: Cron Setup Script

**Files:**
- Create: `scripts/install-cron.sh`

- [ ] **Step 1: Create the cron install script**

Create `scripts/install-cron.sh`:

```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Read HOTEL_TIMEZONE from .env
TIMEZONE=$(grep '^HOTEL_TIMEZONE=' "$ENV_FILE" | cut -d'"' -f2)
if [ -z "$TIMEZONE" ]; then
  echo "Error: HOTEL_TIMEZONE not set in .env"
  exit 1
fi

# Convert 9:00 AM in hotel timezone to UTC hour
# Uses Python for reliable timezone conversion
UTC_HOUR=$(python3 -c "
from datetime import datetime
import subprocess, json

# Get UTC offset for the timezone at next Wednesday 9am
result = subprocess.run(
    ['date', '-j', '-f', '%Y-%m-%d %H:%M:%S', '2026-04-01 09:00:00', '+%s'],
    capture_output=True, text=True
)

# Use the TZ environment variable approach
import os
os.environ['TZ'] = '$TIMEZONE'
import time
time.tzset()

# Get the UTC offset in hours
local_time = time.mktime(time.strptime('2026-04-01 09:00:00', '%Y-%m-%d %H:%M:%S'))
utc_time = time.mktime(time.gmtime(local_time))
offset_hours = int((local_time - utc_time) / 3600)
utc_hour = (9 - offset_hours) % 24
print(utc_hour)
")

CRON_LINE="0 $UTC_HOUR * * 3 cd $PROJECT_DIR && npx tsx src/index.ts >> logs/cron.log 2>&1"
CRON_MARKER="# weekend-hotel-agent"

case "${1:-install}" in
  install)
    # Remove existing entry if present, then add new one
    (crontab -l 2>/dev/null | grep -v "$CRON_MARKER") | { cat; echo "$CRON_LINE $CRON_MARKER"; } | crontab -
    echo "Cron job installed: every Wednesday at 9:00 AM $TIMEZONE (UTC hour: $UTC_HOUR)"
    echo "Entry: $CRON_LINE"
    ;;
  remove)
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | crontab -
    echo "Cron job removed."
    ;;
  *)
    echo "Usage: $0 [install|remove]"
    exit 1
    ;;
esac
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x scripts/install-cron.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/install-cron.sh
git commit -m "feat: cron setup script with hotel timezone support"
```

---

### Task 11: Full ZIP Code Dataset

**Files:**
- Modify: `src/data/zip-codes.json`

- [ ] **Step 1: Download a comprehensive US ZIP code dataset**

Use a Claude Agent SDK session to fetch and process a ZIP code dataset. Alternatively, use a publicly available dataset:

```bash
cd /Users/mathiascoudert/GitHub/weekend-hotel-agent
# Download a free US ZIP code CSV and convert to JSON
# Source: https://github.com/scpike/us-state-county-zip (public domain)
npx tsx -e "
import { writeFileSync } from 'fs';

// We'll generate from a known source or use a pre-built dataset
// For now, let's fetch one
const res = await fetch('https://raw.githubusercontent.com/scpike/us-state-county-zip/master/geo-data.csv');
const csv = await res.text();
const lines = csv.trim().split('\n').slice(1);
const zips: Record<string, { lat: number; lng: number; city: string; state: string }> = {};

for (const line of lines) {
  const parts = line.split(',');
  if (parts.length >= 5) {
    const [state, , , zip, , lat, lng, city] = parts;
    if (zip && lat && lng) {
      zips[zip] = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        city: city || '',
        state: state || '',
      };
    }
  }
}

writeFileSync('src/data/zip-codes.json', JSON.stringify(zips, null, 0));
console.log('ZIP codes:', Object.keys(zips).length);
"
```

If this specific source doesn't match the CSV format, adapt the parsing or use an alternative free ZIP code dataset. The key requirement is a JSON file mapping ZIP → `{lat, lng, city, state}`.

- [ ] **Step 2: Verify tests still pass with the full dataset**

```bash
npx vitest run
```

Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add src/data/zip-codes.json
git commit -m "feat: full US ZIP code dataset for geolocation lookup"
```

---

### Task 12: Integration Test (Manual Run)

**Files:**
- No new files — testing the full flow

- [ ] **Step 1: Ensure .env is configured with Mews demo credentials**

```bash
cat .env
```

Verify it contains valid Mews demo tokens and a real US hotel ZIP code.

- [ ] **Step 2: Run the full agent**

```bash
cd /Users/mathiascoudert/GitHub/weekend-hotel-agent
npx tsx src/index.ts
```

Expected output:
```
[timestamp] Starting Weekend Hotel Agent for: The Grand Downtown Austin (Austin, TX)
[timestamp] Fetching weather forecast...
[timestamp] Weather: 3 weekend days retrieved
[timestamp] Searching for local activities...
[timestamp] Activities: N events found
[timestamp] Fetching nearby guests from Mews...
[timestamp] Guests: N nearby (M total, K filtered out)
[timestamp] Drafting marketing email...
[timestamp] Email drafted: "..."
[timestamp] Delivering email...
[timestamp] Delivery: local=output/drafts/2026-03-31-weekend-email.md, gmail=false
[timestamp] Weekend Hotel Agent completed successfully.
```

- [ ] **Step 3: Verify the local draft**

```bash
cat output/drafts/2026-03-31-weekend-email.md
```

Should contain a complete email with subject, body, guest count, and weather summary.

- [ ] **Step 4: Check the log file**

```bash
cat logs/2026-03-31.log
```

Should mirror the console output.

- [ ] **Step 5: Commit any fixes from integration testing**

```bash
git add -A
git commit -m "fix: integration test adjustments"
```

---

### Task 13: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and usage instructions"
```
