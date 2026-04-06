import { fileURLToPath } from "url";
import { dirname } from "path";
import type { HotelConfig } from "./config.js";
import { hasMewsCredentials } from "./config.js";
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

  // Step 3: Mews Guests (optional — skipped if no credentials)
  let guestResult: MewsGuestResult = { guests: [], totalFound: 0, filteredOut: 0 };
  if (hasMewsCredentials(config)) {
    try {
      logger.log("Fetching nearby guests from Mews...");
      guestResult = await getNearbyGuests(config);
      logger.log(
        `Guests: ${guestResult.guests.length} nearby (${guestResult.totalFound} total, ${guestResult.filteredOut} filtered out)`
      );
    } catch (e) {
      logger.warn(`Mews guest fetch failed: ${e}. Continuing without guest list.`);
    }
  } else {
    logger.log("Mews not configured — skipping guest list. Email will be generated without recipients.");
  }

  // Step 4: Marketing Agent
  let emailDraft;
  try {
    logger.log("Drafting marketing email...");
    emailDraft = await draftMarketingEmail(forecast, activities, config.hotelName, config.hotelCity);
    logger.log(`Email drafted: "${emailDraft.subject}"`);
  } catch (e) {
    logger.warn(`Marketing agent failed: ${e}. Retrying...`);
    try {
      emailDraft = await draftMarketingEmail(forecast, activities, config.hotelName, config.hotelCity);
      logger.log(`Email drafted on retry: "${emailDraft.subject}"`);
    } catch (retryError) {
      logger.error(`Marketing agent failed on retry: ${retryError}. Saving raw data.`);
      const { saveLocalDraft } = await import("./output/gmail.js");
      const rawContent = `# RAW DATA (Marketing Agent Failed)\n\n## Weather\n${JSON.stringify(forecast, null, 2)}\n\n## Activities\n${JSON.stringify(activities, null, 2)}\n\n## Guests\n${guestResult.guests.length} guests available\n`;
      saveLocalDraft(rawContent, PROJECT_ROOT);
      logger.flush();
      return;
    }
  }

  // Step 5: Deliver — always produces HTML + text files, optionally CSV + Gmail draft
  logger.log("Saving email files...");
  const delivery = await deliverEmail(
    emailDraft,
    guestResult.guests,
    config.hotelName,
    forecast,
    PROJECT_ROOT
  );

  logger.log(`Output: html=${delivery.htmlPath}, text=${delivery.textPath}`);
  if (delivery.csvPath) {
    logger.log(`Guest list: ${delivery.csvPath}`);
  }
  if (delivery.gmailDraft) {
    logger.log("Gmail draft created successfully");
  }
  logger.log("Weekend Hotel Agent completed successfully.");
  logger.flush();
}
