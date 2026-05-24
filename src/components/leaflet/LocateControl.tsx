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
          '<span aria-hidden="true" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:16px;line-height:1">+</span>';

        Object.assign(button.style, {
          width: "34px",
          height: "34px",
          background: "#ffffff",
          border: "0",
          cursor: "pointer",
          color: "#0b5f4b",
          fontWeight: "700",
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
