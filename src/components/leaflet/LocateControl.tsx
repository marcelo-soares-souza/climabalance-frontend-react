import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  ensureLeafletLocateControlLoaded,
  getLeafletLocateControlFactory,
} from "@/lib/leaflet-locatecontrol";

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
    let cancelled = false;

    const mountLocateControl = async () => {
      const isLoaded = await ensureLeafletLocateControlLoaded();
      if (cancelled || !isLoaded || controlRef.current) return;

      const locateFactory = getLeafletLocateControlFactory();
      if (!locateFactory) return;

      const control = locateFactory({
        position,
        setView: "once",
        flyTo: true,
        keepCurrentZoomLevel: false,
        showCompass: true,
        locateOptions: {
          enableHighAccuracy: true,
          maxZoom: 16,
        },
        strings: {
          title,
        },
      });

      control.addTo(map);
      controlRef.current = control as L.Control;
    };

    mountLocateControl();

    return () => {
      cancelled = true;
      if (!controlRef.current) return;
      map.removeControl(controlRef.current);
      controlRef.current = null;
    };
  }, [map, position, title]);

  return null;
}
