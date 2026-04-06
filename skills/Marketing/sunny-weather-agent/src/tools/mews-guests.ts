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
  if (!config.mewsClientToken || !config.mewsAccessToken) {
    throw new Error("Mews credentials not configured");
  }

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
  if (!config.mewsClientToken || !config.mewsAccessToken) {
    throw new Error("Mews credentials not configured");
  }

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
