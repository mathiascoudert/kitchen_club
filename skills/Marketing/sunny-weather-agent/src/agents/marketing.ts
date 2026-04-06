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
