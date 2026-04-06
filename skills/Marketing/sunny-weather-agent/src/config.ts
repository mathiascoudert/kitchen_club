import "dotenv/config";

export interface HotelConfig {
  hotelName: string;
  hotelZip: string;
  hotelCity: string;
  hotelTimezone: string;
  mewsClientToken: string | null;
  mewsAccessToken: string | null;
  mewsBaseUrl: string;
  guestRadiusMiles: number;
}

export function loadConfig(): HotelConfig {
  const required = ["HOTEL_NAME", "HOTEL_ZIP", "HOTEL_CITY", "HOTEL_TIMEZONE"] as const;

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
    mewsClientToken: process.env.MEWS_CLIENT_TOKEN ?? null,
    mewsAccessToken: process.env.MEWS_ACCESS_TOKEN ?? null,
    mewsBaseUrl: process.env.MEWS_BASE_URL ?? "https://api.mews-demo.com",
    guestRadiusMiles: Number(process.env.GUEST_RADIUS_MILES ?? "100"),
  };
}

export function hasMewsCredentials(config: HotelConfig): boolean {
  return config.mewsClientToken !== null && config.mewsAccessToken !== null;
}
