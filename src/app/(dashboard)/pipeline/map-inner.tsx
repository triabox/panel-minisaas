"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

export type Pin = {
  id: string;
  negocio: string;
  estado: string;
  rubro: string | null;
  latitud: number;
  longitud: number;
};

const COLOR: Record<string, string> = {
  contactado: "#64748b",
  demo: "#0ea5e9",
  prueba: "#f59e0b",
  cerrado: "#10b981",
  descartado: "#ef4444",
};

export default function MapInner({ pins }: { pins: Pin[] }) {
  const center: [number, number] = pins[0]
    ? [pins[0].latitud, pins[0].longitud]
    : [-34.6037, -58.3816]; // Buenos Aires por defecto

  return (
    <MapContainer
      center={center}
      zoom={pins.length ? 11 : 5}
      style={{ height: "420px", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.latitud, p.longitud]}
          radius={9}
          pathOptions={{
            color: COLOR[p.estado] ?? "#64748b",
            fillColor: COLOR[p.estado] ?? "#64748b",
            fillOpacity: 0.7,
          }}
        >
          <Popup>
            <strong>{p.negocio}</strong>
            {p.rubro ? (
              <>
                <br />
                {p.rubro}
              </>
            ) : null}
            <br />
            <span style={{ textTransform: "capitalize" }}>{p.estado}</span>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
