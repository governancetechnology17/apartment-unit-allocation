import { useEffect, useState } from "react";

/**
 * Returns a debounced version of the given value, updated after `delay` ms
 * of no changes. Useful for search inputs that will trigger backend or
 * expensive filtering.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
