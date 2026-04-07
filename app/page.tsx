"use client";

import { MapProvider } from "./components/MapContext";
import MapWrapper from "./components/MapWrapper";
import SearchBar from "./components/SearchBar";
import { LegendSidebar, LegendMobile } from "./components/Legend";

export default function Home() {
  return (
    <MapProvider>
      <div className="flex flex-col h-dvh">
        {/* Header with search */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-20 flex-shrink-0">
          <div className="flex-shrink-0 hidden sm:block">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">
              USM Castelló
            </h1>
            <p className="text-[10px] text-gray-500 leading-tight">
              Unitats de Salut Mental &middot; Àrea 2
            </p>
          </div>
          <div className="flex-1 sm:max-w-md sm:ml-auto">
            <SearchBar />
          </div>
        </header>

        {/* Main content: Map + Legend sidebar */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main className="flex-1 relative z-0 overflow-hidden">
            <MapWrapper />
          </main>
          <LegendSidebar />
        </div>

        {/* Mobile bottom bar (part of layout, not fixed overlay) */}
        <LegendMobile />
      </div>
    </MapProvider>
  );
}
