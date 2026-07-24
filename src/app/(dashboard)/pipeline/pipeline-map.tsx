"use client";

import dynamic from "next/dynamic";

import type { Pin } from "./map-inner";

// Leaflet toca `window` → sólo cliente, sin SSR.
const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-xl border border-primary-100 bg-primary-50/40 text-sm text-muted-foreground">
      Cargando mapa…
    </div>
  ),
});

export function PipelineMap({ pins }: { pins: Pin[] }) {
  if (pins.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-primary-200 bg-white text-center text-sm text-muted-foreground">
        Todavía no hay prospectos geolocalizados. Cargá una dirección y el mapa
        los ubica solo.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-primary-100">
      <MapInner pins={pins} />
    </div>
  );
}
