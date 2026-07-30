import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet's default marker icon points at image paths relative to its own
// CSS file. Bundlers (Vite, webpack) hash and relocate assets, so those
// relative paths 404 at runtime and every pin silently renders as a broken
// image. Re-pointing the default icon at the bundler-resolved URLs fixes
// this globally — every component that imports this file gets working pins
// for free, with zero per-component boilerplate.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
