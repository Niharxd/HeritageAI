import { useEffect, useRef, useState } from "react";
import { getMapPins } from "../api";
import type { MapPin } from "../types";

const riskColor = { LOW: "#2d5a27", MEDIUM: "#b8860b", HIGH: "#8b1a1a" };

export function MapView({ onOpen }: { onOpen: (id: string) => void }) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletRef  = useRef<any>(null);
  const [pins, setPins]     = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MapPin | null>(null);

  useEffect(() => {
    getMapPins().then(p => { setPins(p); setLoading(false); });
  }, []);

  useEffect(() => {
    if (loading || !mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then(L => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (leafletRef.current) {
        leafletRef.current.remove();
      }

      const map = L.map(mapRef.current!, {
        center: [20, 0],
        zoom:   2,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      pins.forEach(pin => {
        const color = riskColor[pin.risk?.level ?? "LOW"];

        // Custom colored circle marker
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:18px;height:18px;border-radius:50%;
            background:${color};border:3px solid #f5ead6;
            box-shadow:0 2px 6px rgba(0,0,0,0.4);
          "></div>`,
          iconSize:   [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
        marker.on("click", () => setSelected(pin));
      });

      leafletRef.current = map;
    });

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, [pins, loading]);

  return (
    <div className="mapPage">
      <div className="mapHeader">
        <h2>Artifact Map</h2>
        <p>
          {pins.length} artifact{pins.length !== 1 ? "s" : ""} with location data.
          Assign locations to analyses from the Archive page.
        </p>
      </div>

      {loading ? (
        <div className="mapEmpty"><p>Loading map…</p></div>
      ) : pins.length === 0 ? (
        <div className="mapEmpty">
          <p>No artifacts have location data yet.</p>
          <p>Go to Archive, open a record, and assign a location to see it here.</p>
        </div>
      ) : null}

      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      <div ref={mapRef} className="mapContainer" />

      {/* Pin popup */}
      {selected && (
        <div className="mapPopup">
          <button type="button" className="mapPopupClose"
            onClick={() => setSelected(null)}>✕</button>
          <img src={selected.thumbnail} alt="Artifact" />
          <div className="mapPopupBody">
            <p className="mapPopupPlace">{selected.place_name}</p>
            <p className="mapPopupDomain">{selected.domain.toUpperCase()}</p>
            <p className="mapPopupRisk"
              style={{ color: riskColor[selected.risk?.level ?? "LOW"] }}>
              {selected.risk?.level} — {selected.risk?.score?.toFixed(1)}
            </p>
            <p className="mapPopupDate">{new Date(selected.timestamp).toLocaleString()}</p>
            <button type="button" className="primaryButton mapPopupBtn"
              onClick={() => { onOpen(selected.id); setSelected(null); }}>
              View Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
