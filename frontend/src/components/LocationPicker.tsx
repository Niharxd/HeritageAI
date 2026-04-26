import { useState } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { geocode, setLocation } from "../api";
import type { GeoResult } from "../types";

export function LocationPicker({
  recordId,
  current,
  onSaved,
}: {
  recordId: string;
  current?: { place_name: string; lat: number; lng: number } | null;
  onSaved: (loc: GeoResult) => void;
}) {
  const [query,    setQuery]   = useState(current?.place_name ?? "");
  const [results,  setResults] = useState<GeoResult[]>([]);
  const [loading,  setLoading] = useState(false);
  const [saved,    setSaved]   = useState(!!current);
  const [error,    setError]   = useState("");

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const data = await geocode(query.trim());
      if (data.results.length === 0) setError("No locations found. Try a different name.");
      else setResults(data.results.slice(0, 5));
    } catch {
      setError("Geocoding failed. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  async function pick(loc: GeoResult) {
    await setLocation(recordId, loc);
    setResults([]);
    setQuery(loc.place_name.split(",")[0]);
    setSaved(true);
    onSaved(loc);
  }

  return (
    <div className="locationPicker">
      <div className="locationPickerHeader">
        <MapPin size={15} />
        <span>Artifact Location</span>
        {saved && <span className="locationSavedBadge">Saved</span>}
      </div>

      <div className="locationSearchRow">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSaved(false); }}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="e.g. Konark, Odisha or Colosseum, Rome"
          className="locationInput"
        />
        <button type="button" className="locationSearchBtn" onClick={search} disabled={loading}>
          {loading ? <Loader2 size={15} className="spin" /> : <Search size={15} />}
        </button>
      </div>

      {error && <p className="locationError">{error}</p>}

      {results.length > 0 && (
        <ul className="locationResults">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => pick(r)}>
                <MapPin size={12} />
                <span>{r.place_name}</span>
                <small>{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
