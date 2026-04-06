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
