import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../lib/leafletSetup";

/**
 * Read-only pickup-location map shown on the food detail page, so an NGO
 * knows exactly where to go before sending a request. Pan/zoom still work
 * (useful to orient against nearby landmarks) but there's no pin-dragging or
 * click-to-set here — this is a display, not an editor.
 *
 * Renders nothing if coordinates aren't set (food.location defaults to
 * [0, 0] in the schema, which we treat as "no real location on file").
 */
export default function LocationMap({ latitude, longitude, label, className = "h-56" }) {
  if (!latitude || !longitude) return null;
  const position = [Number(latitude), Number(longitude)];

  return (
    <div className={`overflow-hidden rounded-xl2 border border-mint ${className}`}>
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        dragging={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>{label && <Popup>{label}</Popup>}</Marker>
      </MapContainer>
    </div>
  );
}
