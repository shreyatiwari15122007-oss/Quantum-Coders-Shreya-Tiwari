import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../lib/leafletSetup";

// Ahmedabad — matches this project's seed/demo data, used only as a starting
// view before the donor has picked (or auto-detected) a real pickup point.
const DEFAULT_CENTER = [23.0225, 72.5714];

// Imperatively recenters the map whenever the controlled lat/lng props
// change (e.g. after "Use my location" fires), without remounting the map —
// remounting would flash the tiles and reset zoom/pan on every keystroke-free
// coordinate update.
function RecenterOnChange({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
    }
    // Only recenter in response to the coordinates actually changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

// Listens for map clicks and reports the clicked point back to the parent —
// this is what lets a donor "drop a pin" instead of typing raw coordinates.
function ClickToSetMarker({ onChange }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Interactive pickup-location picker used on the "List surplus food" form.
 *
 * Fully controlled: the parent owns latitude/longitude state and this
 * component only ever reports change events via onChange(lat, lng) — it
 * never mutates anything itself. That keeps it easy to wire up alongside
 * an existing "Use my location" button (both just call the same setter).
 *
 * Interaction model:
 *  - Click anywhere on the map to drop/move the pin.
 *  - Drag the pin to fine-tune once it's placed.
 */
export default function LocationPicker({ latitude, longitude, onChange, className = "h-64" }) {
  const hasPoint = Boolean(latitude && longitude);
  const position = hasPoint ? [Number(latitude), Number(longitude)] : DEFAULT_CENTER;
  const markerRef = useRef(null);

  return (
    <div className={`relative overflow-hidden rounded-xl2 border border-mint ${className}`}>
      <MapContainer
        center={position}
        zoom={hasPoint ? 15 : 12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasPoint && (
          <Marker
            position={position}
            draggable
            ref={markerRef}
            eventHandlers={{
              dragend: () => {
                const latlng = markerRef.current?.getLatLng();
                if (latlng) onChange(latlng.lat, latlng.lng);
              },
            }}
          />
        )}
        <ClickToSetMarker onChange={onChange} />
        <RecenterOnChange lat={latitude} lng={longitude} />
      </MapContainer>

      {!hasPoint && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-ink/80 px-3 py-2 text-center text-xs font-medium text-paper">
          Tap the map to drop a pickup pin
        </div>
      )}
    </div>
  );
}
