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

  const pointsRes = await fetch(
    `https://api.weather.gov/points/${coords.lat},${coords.lng}`,
    { headers: { "User-Agent": "WeekendHotelAgent/1.0" } }
  );

  if (!pointsRes.ok) {
    throw new Error(`NWS points API error: ${pointsRes.status}`);
  }

  const pointsData = await pointsRes.json();
  const forecastUrl = pointsData.properties.forecast;

  const forecastRes = await fetch(forecastUrl, {
    headers: { "User-Agent": "WeekendHotelAgent/1.0" },
  });

  if (!forecastRes.ok) {
    throw new Error(`NWS forecast API error: ${forecastRes.status}`);
  }

  const forecastData = await forecastRes.json();
  return filterWeekendForecast(forecastData.properties.periods);
}
