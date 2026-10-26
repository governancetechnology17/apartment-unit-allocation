import "server-only";

import { apartments as apartmentMetadata } from "./data";
import type { Apartment, ProjectAllocation } from "./types";
import { BaseURL, LOCAL_ESUB_DOMAIN } from "./constants/auth-keys";

const ALLOCATIONS_URL = `${BaseURL}/developers/project-allocations-with-owner/3457/`;
const storeCheckUrl = `${BaseURL}/billing/esub/domain/${encodeURIComponent(LOCAL_ESUB_DOMAIN)}/`;

interface AllocationsResponse {
  data?: unknown;
}

function isProjectAllocation(value: unknown): value is ProjectAllocation {
  if (!value || typeof value !== "object") return false;
  const allocation = value as Record<string, unknown>;
  return (
    typeof allocation.id === "number" &&
    typeof allocation.name === "string" &&
    typeof allocation.unit === "number" &&
    typeof allocation.unit_name === "string" &&
    typeof allocation.allocated === "boolean" &&
    typeof allocation.generating_revenue === "boolean" &&
    typeof allocation.archived === "boolean"
  );
}

export function mergeApartmentAllocations(metadata: Apartment[], allocations: ProjectAllocation[]): Apartment[] {
  const allocationsByUnitName = new Map<string, ProjectAllocation>();

  for (const allocation of allocations) {
    if (allocationsByUnitName.has(allocation.name)) {
      throw new Error(`The backend returned more than one allocation named "${allocation.name}".`);
    }

    allocationsByUnitName.set(allocation.name, allocation);
  }

  return metadata.map((unit) => {
    const allocation = allocationsByUnitName.get(unit.number);

    if (!allocation) {
      throw new Error(`No backend allocation matched local unit number "${unit.number}".`);
    }

    return {
      ...unit,
      ...allocation,
      status: allocation.allocated ? "sold" : "available",
    };
  });
}

export async function getApartments(): Promise<Apartment[]> {
  const response = await fetch(ALLOCATIONS_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load apartment allocations (${response.status} ${response.statusText}).`);

  const payload = (await response.json()) as AllocationsResponse;
  if (!Array.isArray(payload.data) || !payload.data.every(isProjectAllocation)) {
    throw new Error("The apartment allocations response has an unexpected format.");
  }

  return mergeApartmentAllocations(apartmentMetadata, payload.data);
}

export async function getEsubDetails(): Promise<any> {
  const response = await fetch(storeCheckUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load apartment allocations (${response.status} ${response.statusText}).`);

  const payload = (await response.json()) as any;
  return payload;
}
