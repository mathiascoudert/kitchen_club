import { describe, it, expect } from "vitest";
import { filterWeekendForecast, type DayForecast } from "../weather.js";

describe("filterWeekendForecast", () => {
  it("extracts Friday, Saturday, Sunday from NWS periods", () => {
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
