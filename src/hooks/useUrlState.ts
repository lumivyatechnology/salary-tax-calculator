"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface UseUrlStateOptions<T> {
  /** Default values when URL has no params */
  defaultValues: T;
  /** Keys to sync with URL (subset of T keys) */
  keys: (keyof T)[];
  /** Debounce delay in ms for URL updates */
  debounceMs?: number;
}

/**
 * Hook to sync state with URL query parameters
 * Enables shareable calculation URLs
 */
export function useUrlState<T extends object>({
  defaultValues,
  keys,
  debounceMs = 300,
}: UseUrlStateOptions<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL or defaults
  const getInitialState = useCallback((): T => {
    const state = { ...defaultValues };

    for (const key of keys) {
      const urlValue = searchParams.get(String(key));
      if (urlValue !== null) {
        // Parse based on default value type
        const defaultValue = defaultValues[key];
        if (typeof defaultValue === "number") {
          const parsed = parseFloat(urlValue);
          if (!isNaN(parsed)) {
            (state as Record<string, unknown>)[String(key)] = parsed;
          }
        } else if (typeof defaultValue === "boolean") {
          (state as Record<string, unknown>)[String(key)] = urlValue === "true";
        } else {
          (state as Record<string, unknown>)[String(key)] = urlValue;
        }
      }
    }

    return state;
  }, [defaultValues, keys, searchParams]);

  const [state, setState] = useState<T>(getInitialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Re-initialize when searchParams change externally
  useEffect(() => {
    if (!isInitialized) {
      setState(getInitialState());
      setIsInitialized(true);
    }
  }, [getInitialState, isInitialized]);

  // Update URL when state changes (debounced)
  useEffect(() => {
    if (!isInitialized) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams();

      for (const key of keys) {
        const value = state[key];
        const defaultValue = defaultValues[key];

        // Only include non-default values
        if (value !== defaultValue && value !== undefined && value !== null) {
          params.set(String(key), String(value));
        }
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Use replace to avoid adding to history for every keystroke
      router.replace(newUrl, { scroll: false });
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [state, keys, defaultValues, pathname, router, debounceMs, isInitialized]);

  // Update a single field
  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Update multiple fields at once
  const setFields = useCallback((updates: Partial<T>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset to defaults
  const reset = useCallback(() => {
    setState(defaultValues);
  }, [defaultValues]);

  // Get shareable URL
  const getShareableUrl = useCallback(() => {
    if (typeof window === "undefined") return "";

    const params = new URLSearchParams();
    for (const key of keys) {
      const value = state[key];
      if (value !== undefined && value !== null) {
        params.set(String(key), String(value));
      }
    }

    const queryString = params.toString();
    return `${window.location.origin}${pathname}${queryString ? `?${queryString}` : ""}`;
  }, [state, keys, pathname]);

  return {
    state,
    setState,
    setField,
    setFields,
    reset,
    getShareableUrl,
    isInitialized,
  };
}
