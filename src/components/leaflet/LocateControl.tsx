import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

type LocateControlProps = {
  position?: L.ControlPosition;
  title: string;
};

export function LocateControl({
  position = "topright",
  title,
}: LocateControlProps) {
  const map = useMap();
  const controlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    if (controlRef.current) return;

    const LocateButtonControl = L.Control.extend({
      onAdd() {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control",
        );
        const button = L.DomUtil.create(
          "button",
          "climabalance-locate-control",
          container,
        ) as HTMLButtonElement;

        button.type = "button";
        button.title = title;
        button.setAttribute("aria-label", title);
        button.innerHTML =
          '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>';

        Object.assign(button.style, {
          width: "34px",
          height: "34px",
          background: "#ffffff",
          border: "0",
          cursor: "pointer",
          color: "#0b5f4b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        });

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        L.DomEvent.on(button, "click", () => {
          if (!navigator.geolocation) return;
          button.disabled = true;
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              const latLng = L.latLng(coords.latitude, coords.longitude);
              map.flyTo(latLng, Math.max(map.getZoom(), 15), {
                duration: 1.2,
              });
              L.circleMarker(latLng, {
                radius: 8,
                weight: 2,
                color: "#ffffff",
                fillColor: "#0b5f4b",
                fillOpacity: 0.9,
              }).addTo(map);
              button.disabled = false;
            },
            () => {
              button.disabled = false;
            },
            {
              enableHighAccuracy: true,
              maximumAge: 30000,
              timeout: 10000,
            },
          );
        });

        return container;
      },
    });

    const control = new LocateButtonControl({ position }) as L.Control;
    control.addTo(map);
    controlRef.current = control;

    return () => {
      if (!controlRef.current) return;
      map.removeControl(controlRef.current);
      controlRef.current = null;
    };
  }, [map, position, title]);

  return null;
}
