import { query } from "@anthropic-ai/claude-agent-sdk";

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
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]) as Activity[];
  } catch {
    console.warn("Failed to parse activities response:", result.slice(0, 200));
    return [];
  }
}
