"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Carregant mapa...</div>
    </div>
  ),
  ssr: false,
});

export default function MapWrapper() {
  return <Map />;
}
