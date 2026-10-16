/**
 * Google Places API (New) – Autocomplete for address suggestions.
 * Uses POST https://places.googleapis.com/v1/places:autocomplete
 */

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";

function getApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    ""
  );
}

export type PlaceSuggestion = {
  placeId: string;
  /** Full text to show and use for autofill (e.g. "123 Main St, City, State, USA"). */
  text: string;
};

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
    };
  }>;
};

const FIELD_MASK = "suggestions.placePrediction(placeId,text)";

/**
 * Fetches address/place suggestions from Google Places Autocomplete (New).
 * Returns at most `maxResults` place predictions (addresses and places).
 */
export async function fetchPlaceSuggestions(
  input: string,
  options?: {
    maxResults?: number;
    /** Two-letter region codes, e.g. ["us", "ca"]. */
    includedRegionCodes?: string[];
    /** Optional session token for billing. */
    sessionToken?: string;
  }
): Promise<PlaceSuggestion[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const trimmed = input?.trim() ?? "";
  if (trimmed.length < 2) return [];

  const body: Record<string, unknown> = {
    input: trimmed,
  };
  if (options?.includedRegionCodes?.length) {
    body.includedRegionCodes = options.includedRegionCodes;
  }
  if (options?.sessionToken) {
    body.sessionToken = options.sessionToken;
  }

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.warn("[Places Autocomplete]", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as AutocompleteResponse;
  const suggestions = data.suggestions ?? [];
  const maxResults = Math.min(20, Math.max(1, options?.maxResults ?? 20));

  return suggestions
    .filter(
      (s): s is { placePrediction: NonNullable<typeof s.placePrediction> } =>
        Boolean(s.placePrediction?.text?.text)
    )
    .slice(0, maxResults)
    .map((s) => ({
      placeId: s.placePrediction.placeId ?? "",
      text: s.placePrediction.text!.text!,
    }));
}
