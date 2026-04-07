"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMapContext } from "./MapContext";
import {
  USM_DATA,
  CASTELLO_NAME,
  normalize,
  SEARCH_ALIASES,
  type SearchItem,
} from "@/data/usm-data";

interface SearchableItem extends SearchItem {
  searchTerms: string[]; // normalized alternative names for matching
}

function getAllSearchItems(): SearchableItem[] {
  const items: SearchableItem[] = [];

  // Build reverse alias map: official name → list of aliases
  const aliasMap = new Map<string, string[]>();
  for (const [alias, official] of Object.entries(SEARCH_ALIASES)) {
    const existing = aliasMap.get(official) || [];
    existing.push(alias);
    aliasMap.set(official, existing);
  }

  for (const usm of USM_DATA) {
    for (const m of usm.municipalities) {
      const aliases = aliasMap.get(m) || [];
      items.push({
        name: m,
        type: "municipality",
        usm,
        searchTerms: [normalize(m), ...aliases.map(normalize)],
      });
    }
    for (const z of usm.urbanZones) {
      items.push({
        name: z,
        type: "urbanZone",
        usm,
        parentMunicipality: CASTELLO_NAME,
        searchTerms: [normalize(z)],
      });
    }
  }

  // Add Castelló itself with aliases
  const castelloAliases = aliasMap.get(CASTELLO_NAME) || [];
  items.push({
    name: CASTELLO_NAME,
    type: "municipality",
    usm: USM_DATA[0],
    searchTerms: [normalize(CASTELLO_NAME), ...castelloAliases.map(normalize)],
  });

  return items;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { flyToMunicipality } = useMapContext();

  const allItems = useRef(getAllSearchItems());

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const norm = normalize(q);
    const filtered = allItems.current.filter((item) =>
      item.searchTerms.some((term) => term.includes(norm))
    );
    setResults(filtered.slice(0, 8));
  }, []);

  useEffect(() => {
    search(query);
    setFocusedIndex(-1);
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectItem(item: SearchItem) {
    const target =
      item.type === "urbanZone" ? CASTELLO_NAME : item.name;
    flyToMunicipality(target);
    setQuery(item.name);
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      selectItem(results[focusedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar municipi..."
          aria-label="Buscar municipi"
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none transition-shadow"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Netejar cerca"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50 max-h-[320px] overflow-y-auto"
        >
          {results.map((item, i) => (
            <li
              key={`${item.name}-${item.usm.id}`}
              role="option"
              aria-selected={i === focusedIndex}
              className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 text-sm transition-colors ${
                i === focusedIndex ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
              onClick={() => selectItem(item)}
              onMouseEnter={() => setFocusedIndex(i)}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.usm.color }}
              />
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {item.name}
                </div>
                {item.type === "urbanZone" && (
                  <div className="text-xs text-gray-500 truncate">
                    Zona de {CASTELLO_NAME} &middot; {item.usm.fullName}
                  </div>
                )}
                {item.type === "municipality" &&
                  item.name !== CASTELLO_NAME && (
                    <div className="text-xs text-gray-500 truncate">
                      {item.usm.fullName}
                    </div>
                  )}
                {item.name === CASTELLO_NAME && (
                  <div className="text-xs text-gray-500 truncate">
                    Dividit en 4 USM
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50">
          <p className="text-sm text-gray-500 text-center">
            No s&apos;ha trobat cap resultat
          </p>
        </div>
      )}
    </div>
  );
}
