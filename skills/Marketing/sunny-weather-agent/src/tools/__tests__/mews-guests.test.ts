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
