"use client";

import { fetchPlaceSuggestions, type PlaceSuggestion } from "@/lib/api/places";
import { useDebouncedValue } from "@/lib/constants/useDebouncedValue";
import { Box, Input, InputProps } from "@chakra-ui/react";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";

const DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 20;
const DROPDOWN_MAX_HEIGHT = "320px";
const DROPDOWN_Z_INDEX = 1500;

type DropdownPosition = { top: number; left: number; width: number } | null;

export type AddressAutocompleteInputProps = Omit<
    InputProps,
    "onChange" | "value"
> & {
    value: string;
    onChange: (value: string) => void;
    /** Optional region codes, e.g. ["us", "ca"]. */
    regionCodes?: string[];
};

export function AddressAutocompleteInput({
    value,
    onChange,
    regionCodes,
    ...inputProps
}: AddressAutocompleteInputProps) {
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [dropdownPosition, setDropdownPosition] =
        useState<DropdownPosition>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const skipNextFetchRef = useRef(false);

    const debouncedQuery = useDebouncedValue(value, DEBOUNCE_MS);

    const updateDropdownPosition = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
        });
    }, []);

    useLayoutEffect(() => {
        if (!open) {
            setDropdownPosition(null);
            return;
        }
        updateDropdownPosition();
    }, [open, updateDropdownPosition, suggestions.length, loading]);

    useEffect(() => {
        if (!open) return;
        const onScrollOrResize = () => updateDropdownPosition();
        window.addEventListener("scroll", onScrollOrResize, true);
        window.addEventListener("resize", onScrollOrResize);
        return () => {
            window.removeEventListener("scroll", onScrollOrResize, true);
            window.removeEventListener("resize", onScrollOrResize);
        };
    }, [open, updateDropdownPosition]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            if (
                containerRef.current?.contains(target) ||
                listRef.current?.contains(target)
            ) {
                return;
            }
            setOpen(false);
        };
        if (!open) return;
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [open]);

    useEffect(() => {
        if (skipNextFetchRef.current) {
            skipNextFetchRef.current = false;
            setSuggestions([]);
            setOpen(false);
            return;
        }

        const query = (debouncedQuery ?? "").trim();
        if (query.length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        fetchPlaceSuggestions(query, {
            maxResults: MAX_SUGGESTIONS,
            includedRegionCodes: regionCodes,
        })
            .then((results) => {
                if (!cancelled) {
                    setSuggestions(results);
                    if (focused) setOpen(results.length > 0);
                    setHighlightedIndex(-1);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, regionCodes]);

    const selectSuggestion = useCallback(
        (suggestion: PlaceSuggestion) => {
            skipNextFetchRef.current = true;
            onChange(suggestion.text);
            setOpen(false);
            setSuggestions([]);
        },
        [onChange]
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open || suggestions.length === 0) {
            if (e.key === "Escape") setOpen(false);
            return;
        }
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((i) => (i < suggestions.length - 1 ? i + 1 : i));
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((i) => (i > 0 ? i - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                    selectSuggestion(suggestions[highlightedIndex]);
                }
                break;
            case "Escape":
                setOpen(false);
                setHighlightedIndex(-1);
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        if (!open || highlightedIndex < 0) return;
        const el = listRef.current?.children[highlightedIndex] as HTMLElement;
        el?.scrollIntoView({ block: "nearest" });
    }, [highlightedIndex, open]);

    const dropdownContent =
        open && (suggestions.length > 0 || loading) && dropdownPosition ? (
            <Box
                id="address-suggestions"
                role="listbox"
                ref={listRef}
                position="fixed"
                top={`${dropdownPosition.top}px`}
                left={`${dropdownPosition.left}px`}
                w={`${dropdownPosition.width}px`}
                zIndex={DROPDOWN_Z_INDEX}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                boxShadow="md"
                maxH={DROPDOWN_MAX_HEIGHT}
                overflowY="auto"
                overflowX="hidden"
                py={1}
            >
                {loading && suggestions.length === 0 ? (
                    <Box px={3} py={2} fontSize="14px" color="gray.500">
                        Searching…
                    </Box>
                ) : (
                    suggestions.map((s, i) => (
                        <Box
                            key={s.placeId}
                            id={`address-suggestion-${i}`}
                            role="option"
                            aria-selected={highlightedIndex === i}
                            px={3}
                            py={2}
                            fontSize="14px"
                            cursor="pointer"
                            bg={highlightedIndex === i ? "gray.100" : "transparent"}
                            _hover={{ bg: "gray.50" }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectSuggestion(s);
                            }}
                        >
                            {s.text}
                        </Box>
                    ))
                )}
            </Box>
        ) : null;

    return (
        <Box ref={containerRef} position="relative" w="full">
            <Input
                autoFocus={false}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls="address-suggestions"
                aria-activedescendant={
                    highlightedIndex >= 0 && suggestions[highlightedIndex]
                        ? `address-suggestion-${highlightedIndex}`
                        : undefined
                }
                {...inputProps}
                fontSize={"16px !important"}
                onBlur={() => setFocused(false)}
            />
            {typeof document !== "undefined" &&
                open &&
                createPortal(dropdownContent, document.body)}
        </Box>
    );
}
