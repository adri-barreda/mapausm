"use client";

import { useEffect, useCallback, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import { useMapContext } from "./MapContext";
import {
  USM_DATA,
  CASTELLO_NAME,
  CASTELLO_COLOR,
  CASTELLO_COLOR_LIGHT,
  getUSMForMunicipality,
} from "@/data/usm-data";
import castellonGeo from "@/data/castellon.json";

const CASTELLON_CENTER: L.LatLngExpression = [40.05, -0.08];
const DEFAULT_ZOOM = 9;
const LARGE_POP_THRESHOLD = 3000;

// Fix Leaflet default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function getFeatureColor(name: string, selectedUSM: string | null): string {
  if (name === CASTELLO_NAME) {
    if (selectedUSM) {
      const hasZones = USM_DATA.find((u) => u.id === selectedUSM)?.urbanZones.length;
      return hasZones ? CASTELLO_COLOR_LIGHT : "#e2e8f0";
    }
    return CASTELLO_COLOR_LIGHT;
  }
  const usm = getUSMForMunicipality(name);
  if (!usm) {
    return "#e2e8f0"; // gray for unassigned
  }
  if (selectedUSM && usm.id !== selectedUSM) {
    return "#e2e8f0";
  }
  return usm.colorLight;
}

function getFeatureOpacity(name: string, selectedUSM: string | null): number {
  if (!selectedUSM) {
    if (name === CASTELLO_NAME) return 0.7;
    return getUSMForMunicipality(name) ? 0.6 : 0.25;
  }
  if (name === CASTELLO_NAME) {
    const hasZones = USM_DATA.find((u) => u.id === selectedUSM)?.urbanZones.length;
    return hasZones ? 0.7 : 0.15;
  }
  const usm = getUSMForMunicipality(name);
  if (!usm) return 0.1;
  return usm.id === selectedUSM ? 0.7 : 0.15;
}

function PopupContent({ name }: { name: string }) {
  if (name === CASTELLO_NAME) {
    return (
      <div className="p-4 max-h-[300px] overflow-y-auto">
        <h3 className="text-base font-bold text-gray-900 mb-1">
          {CASTELLO_NAME}
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Municipi dividit en 4 USM
        </p>
        {USM_DATA.filter((usm) => usm.urbanZones.length > 0).map((usm) => (
          <div key={usm.id} className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: usm.color }}
              />
              <span className="text-sm font-semibold text-gray-800">
                {usm.fullName}
              </span>
            </div>
            <a
              href={`tel:${usm.phone}`}
              className="text-xs text-blue-600 hover:underline ml-5 block mb-1"
            >
              {usm.phone}
            </a>
            <p className="text-xs text-gray-600 ml-5">
              {usm.urbanZones.join(", ")}
            </p>
          </div>
        ))}
      </div>
    );
  }

  const usm = getUSMForMunicipality(name);
  if (!usm) {
    return (
      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 mb-1">{name}</h3>
        <p className="text-xs text-gray-500">
          Fora de l&apos;Àrea 2 de Salut Mental
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-base font-bold text-gray-900 mb-2">{name}</h3>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: usm.color }}
        />
        <span className="text-sm font-semibold text-gray-700">
          {usm.fullName}
        </span>
      </div>
      <a
        href={`tel:${usm.phone}`}
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
      >
        <svg
          className="w-4 h-4"
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
  );
}

function MapController() {
  const map = useMap();
  const { registerFlyTo, selectedUSM } = useMapContext();
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Register flyTo function
  useEffect(() => {
    registerFlyTo((name: string) => {
      const geo = castellonGeo as FeatureCollection;
      const feature = geo.features.find(
        (f) => f.properties?.name === name
      );
      if (feature) {
        const layer = L.geoJSON(feature as Feature);
        const bounds = layer.getBounds();
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 12 });

        // Open popup for this feature
        geoJsonLayerRef.current?.eachLayer((l) => {
          const geoLayer = l as L.Layer & { feature?: Feature };
          if (geoLayer.feature?.properties?.name === name) {
            (l as L.Layer & { openPopup: () => void }).openPopup();
          }
        });
      }
    });
  }, [map, registerFlyTo]);

  // Store ref to GeoJSON layer for popup opening
  useEffect(() => {
    map.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        geoJsonLayerRef.current = layer;
      }
    });
  });

  // Handle zoom-dependent labels
  useEffect(() => {
    function updateLabels() {
      const zoom = map.getZoom();
      map.getPane("tooltipPane")?.querySelectorAll(".municipality-label").forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (zoom < 10) {
          htmlEl.classList.add("leaflet-zoom-hide");
        } else {
          htmlEl.classList.remove("leaflet-zoom-hide");
        }
      });
    }
    map.on("zoomend", updateLabels);
    updateLabels();
    return () => {
      map.off("zoomend", updateLabels);
    };
  }, [map]);

  // Force GeoJSON re-style when selectedUSM changes
  useEffect(() => {
    geoJsonLayerRef.current?.eachLayer((layer) => {
      const geoLayer = layer as L.Path & { feature?: Feature };
      const name = geoLayer.feature?.properties?.name;
      if (name) {
        geoLayer.setStyle({
          fillColor: getFeatureColor(name, selectedUSM),
          fillOpacity: getFeatureOpacity(name, selectedUSM),
        });
      }
    });
  }, [selectedUSM]);

  return null;
}

export default function Map() {
  const { selectedUSM } = useMapContext();

  const style = useCallback(
    (feature?: Feature) => {
      const name = feature?.properties?.name ?? "";
      const isCastello = name === CASTELLO_NAME;
      const usm = getUSMForMunicipality(name);
      const isAssigned = !!usm || isCastello;

      return {
        fillColor: getFeatureColor(name, selectedUSM),
        fillOpacity: getFeatureOpacity(name, selectedUSM),
        color: isCastello ? "#7c5a9e" : isAssigned ? "#555" : "#ccc",
        weight: isCastello ? 2 : isAssigned ? 1.5 : 0.8,
        dashArray: isCastello ? "6 4" : undefined,
      };
    },
    [selectedUSM]
  );

  const onEachFeature = useCallback(
    (feature: Feature, layer: L.Layer) => {
      const name = feature.properties?.name ?? "";
      const pop = feature.properties?.center;
      const pathLayer = layer as L.Path;

      // Bind popup
      const container = L.DomUtil.create("div");
      // We'll render React content via innerHTML for simplicity in Leaflet
      const usm = getUSMForMunicipality(name);
      const isCastello = name === CASTELLO_NAME;

      if (isCastello) {
        const sections = USM_DATA.filter((u) => u.urbanZones.length > 0)
          .map(
            (u) => `
          <div style="margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="width:10px;height:10px;border-radius:50%;background:${u.color};flex-shrink:0"></span>
              <strong style="font-size:13px;color:#1a202c">${u.fullName}</strong>
            </div>
            <a href="tel:${u.phone}" style="font-size:12px;color:#2563eb;margin-left:16px;display:block;margin-bottom:2px">${u.phone}</a>
            <p style="font-size:11px;color:#4a5568;margin-left:16px;margin:0">${u.urbanZones.join(", ")}</p>
          </div>
        `
          )
          .join("");

        container.innerHTML = `
        <div style="padding:14px;max-height:280px;overflow-y:auto">
          <h3 style="font-size:15px;font-weight:700;color:#1a202c;margin:0 0 2px">${CASTELLO_NAME}</h3>
          <p style="font-size:11px;color:#718096;margin:0 0 10px">Municipi dividit en 4 USM</p>
          ${sections}
        </div>
      `;
      } else if (usm) {
        container.innerHTML = `
        <div style="padding:14px">
          <h3 style="font-size:15px;font-weight:700;color:#1a202c;margin:0 0 8px">${name}</h3>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <span style="width:10px;height:10px;border-radius:50%;background:${usm.color};flex-shrink:0"></span>
            <span style="font-size:13px;font-weight:600;color:#4a5568">${usm.fullName}</span>
          </div>
          <a href="tel:${usm.phone}" style="display:inline-flex;align-items:center;gap:4px;font-size:14px;color:#2563eb;font-weight:500;text-decoration:none">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            ${usm.phone}
          </a>
        </div>
      `;
      } else {
        container.innerHTML = `
        <div style="padding:14px">
          <h3 style="font-size:15px;font-weight:700;color:#1a202c;margin:0 0 4px">${name}</h3>
          <p style="font-size:12px;color:#718096;margin:0">Fora de l'Àrea 2 de Salut Mental</p>
        </div>
      `;
      }

      layer.bindPopup(container, { maxWidth: 300, closeButton: true });

      // Bind permanent tooltip for municipality name
      const isLarge = (feature.properties as Record<string, unknown>)?.pop
        ? Number((feature.properties as Record<string, unknown>).pop) > LARGE_POP_THRESHOLD
        : false;
      const labelClass = isLarge ? "municipality-label-large" : "municipality-label";

      layer.bindTooltip(name, {
        permanent: true,
        direction: "center",
        className: labelClass,
      });

      // Hover effects
      pathLayer.on("mouseover", () => {
        pathLayer.setStyle({
          fillOpacity: 0.85,
          weight: 3,
        });
        pathLayer.bringToFront();
      });

      pathLayer.on("mouseout", () => {
        const n = feature.properties?.name ?? "";
        pathLayer.setStyle({
          fillOpacity: getFeatureOpacity(n, null),
          weight: n === CASTELLO_NAME ? 2 : getUSMForMunicipality(n) ? 1.5 : 0.8,
        });
      });
    },
    []
  );

  const geoData = useMemo(() => castellonGeo as FeatureCollection, []);

  return (
    <MapContainer
      center={CASTELLON_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={8}
      maxZoom={15}
      className="w-full h-full z-0"
      zoomControl={false}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <GeoJSON
        data={geoData}
        style={style}
        onEachFeature={onEachFeature}
        key={`geojson-${selectedUSM}`}
      />
      <MapController />
    </MapContainer>
  );
}
