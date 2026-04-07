import { readFileSync, writeFileSync } from "fs";

const raw = JSON.parse(
  readFileSync(new URL("./castellon_opendatasoft.geojson", import.meta.url), "utf8")
);

const optimized = {
  type: "FeatureCollection",
  features: raw.features.map((f) => {
    const name = f.properties.mun_name;
    let geometry = f.geometry;

    // Fix Castelló de la Plana: keep only the main polygon (largest),
    // remove Illes Columbretes (tiny islands 50km offshore that drag the centroid)
    if (name === "Castelló de la Plana" && geometry.type === "MultiPolygon") {
      // Find the largest polygon by vertex count
      let maxIdx = 0;
      let maxVertices = 0;
      geometry.coordinates.forEach((poly, i) => {
        const vertices = poly[0].length;
        if (vertices > maxVertices) {
          maxVertices = vertices;
          maxIdx = i;
        }
      });
      // Convert to single Polygon
      geometry = {
        type: "Polygon",
        coordinates: geometry.coordinates[maxIdx],
      };
      console.log(
        `Fixed Castelló de la Plana: kept polygon ${maxIdx} (${maxVertices} vertices), removed ${geometry.coordinates ? "" : ""}${f.geometry.coordinates.length - 1} island polygons`
      );
    }

    // Calculate proper centroid from geometry (not from potentially-wrong geo_point_2d)
    let center = f.properties.geo_point_2d;
    if (geometry.type === "Polygon") {
      const coords = geometry.coordinates[0];
      const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      const avgLon = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      center = { lat: avgLat, lon: avgLon };
    }

    return {
      type: "Feature",
      properties: {
        name,
        code: f.properties.mun_code,
        center,
      },
      geometry,
    };
  }),
};

const outPath = new URL("../data/castellon.json", import.meta.url);
writeFileSync(outPath, JSON.stringify(optimized));

const sizeKB = (Buffer.byteLength(JSON.stringify(optimized)) / 1024).toFixed(1);
console.log(`Written ${optimized.features.length} features (${sizeKB} KB)`);
