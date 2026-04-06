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
