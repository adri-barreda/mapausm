"use client";

import { useState } from "react";
import { useMapContext } from "./MapContext";
import { USM_DATA, CASTELLO_NAME, type USMUnit } from "@/data/usm-data";

function USMCard({
  usm,
  isSelected,
  onToggle,
  onMunicipalityClick,
  compact,
}: {
  usm: USMUnit;
  isSelected: boolean;
  onToggle: () => void;
  onMunicipalityClick: (name: string) => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const allLocations = [
    ...usm.municipalities,
    ...usm.urbanZones.map((z) => `${z}*`),
  ];

  return (
    <div
      className={`rounded-xl border-2 transition-colors bg-white ${
        isSelected
          ? "border-gray-400 shadow-sm"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-3 flex items-center gap-3 text-left"
        aria-label={`Filtrar per ${usm.fullName}`}
      >
        <span
          className="w-5 h-5 rounded-lg flex-shrink-0 border border-black/10"
          style={{ backgroundColor: usm.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 leading-tight">
            {usm.fullName}
          </div>
          <a
            href={`tel:${usm.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {usm.phone}
          </a>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 rounded-full px-2 py-0.5 flex-shrink-0">
          {allLocations.length}
        </span>
      </button>

      {/* Expandable municipality list */}
      {!compact && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 py-1"
            aria-label={expanded ? "Amagar municipis" : "Mostrar municipis"}
          >
            <svg
              className={`w-3 h-3 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {expanded ? "Amagar" : "Vore municipis"}
          </button>

          {expanded && (
            <ul className="mt-1 space-y-0.5 max-h-48 overflow-y-auto">
              {allLocations.map((loc) => {
                const isUrban = loc.endsWith("*");
                const displayName = isUrban ? loc.slice(0, -1) : loc;
                return (
                  <li key={loc}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMunicipalityClick(
                          isUrban ? CASTELLO_NAME : displayName
                        );
                      }}
                      className="text-xs text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg w-full text-left transition-colors"
                    >
                      {displayName}
                      {isUrban && (
                        <span className="text-gray-400 ml-1">(Castelló)</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function LegendContent({ compact }: { compact?: boolean }) {
  const { selectedUSM, setSelectedUSM, flyToMunicipality } = useMapContext();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Llegenda
        </h2>
        {selectedUSM && (
          <button
            type="button"
            onClick={() => setSelectedUSM(null)}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Mostrar totes
          </button>
        )}
      </div>

      {USM_DATA.map((usm) => (
        <USMCard
          key={usm.id}
          usm={usm}
          isSelected={selectedUSM === usm.id}
          onToggle={() =>
            setSelectedUSM(selectedUSM === usm.id ? null : usm.id)
          }
          onMunicipalityClick={flyToMunicipality}
          compact={compact}
        />
      ))}

      {!compact && (
        <p className="text-[10px] text-gray-400 pt-1 leading-tight">
          * Zones urbanes de Castelló de la Plana
        </p>
      )}
    </div>
  );
}

// Desktop sidebar
export function LegendSidebar() {
  return (
    <aside className="hidden md:block w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto p-4">
      <LegendContent />
    </aside>
  );
}

// Mobile: bottom bar as layout element (not fixed) + expandable full legend
export function LegendMobile() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { selectedUSM, setSelectedUSM } = useMapContext();

  return (
    <div className="md:hidden flex-shrink-0 bg-white border-t border-gray-200 z-30 relative">
      {/* Quick USM strip - always visible */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto">
        {USM_DATA.map((usm) => (
          <button
            key={usm.id}
            type="button"
            onClick={() =>
              setSelectedUSM(selectedUSM === usm.id ? null : usm.id)
            }
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
              selectedUSM === usm.id
                ? "text-white shadow-sm"
                : "bg-gray-100 text-gray-700 active:bg-gray-200"
            }`}
            style={
              selectedUSM === usm.id
                ? { backgroundColor: usm.color }
                : undefined
            }
            aria-label={`Filtrar ${usm.fullName}`}
          >
            {selectedUSM !== usm.id && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: usm.color }}
              />
            )}
            <span className="whitespace-nowrap">{usm.name}</span>
          </button>
        ))}

        {/* Expand button */}
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex-shrink-0 ml-1 flex items-center gap-1 px-3 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold active:bg-blue-100"
          aria-label="Obrir llegenda completa"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          Detall
        </button>
      </div>

      {/* Selected USM quick info bar */}
      {selectedUSM && (
        <div className="px-3 pb-2.5 pt-0">
          {USM_DATA.filter((u) => u.id === selectedUSM).map((usm) => (
            <div
              key={usm.id}
              className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5"
            >
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {usm.fullName}
                </div>
                <a
                  href={`tel:${usm.phone}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {usm.phone}
                </a>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUSM(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Tancar filtre"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Full legend bottom sheet (portal-like overlay) */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl flex flex-col z-50"
            style={{ maxHeight: "80dvh" }}
          >
            {/* Handle + close */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
                aria-label="Tancar llegenda"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-4 pb-8 overscroll-contain">
              <LegendContent />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
