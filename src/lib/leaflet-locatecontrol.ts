import L from "leaflet";

export type LocateControlFactory = (
  options?: Record<string, unknown>,
) => L.Control;

type LeafletControlWithLocate = typeof L.control & {
  locate?: LocateControlFactory;
};

type LeafletWithLocate = typeof L & {
  control: LeafletControlWithLocate;
};

const LOCATE_CONTROL_JS =
  "https://cdn.jsdelivr.net/npm/leaflet.locatecontrol@0.88.0/dist/L.Control.Locate.min.js";
const LOCATE_CONTROL_CSS =
  "https://cdn.jsdelivr.net/npm/leaflet.locatecontrol@0.88.0/dist/L.Control.Locate.min.css";
const LOCATE_CONTROL_SCRIPT_ID = "leaflet-locatecontrol-script";
const LOCATE_CONTROL_STYLE_ID = "leaflet-locatecontrol-style";

let loadPromise: Promise<boolean> | null = null;

export function getLeafletLocateControlFactory(): LocateControlFactory | null {
  const control = (L as LeafletWithLocate).control;
  return typeof control.locate === "function" ? control.locate : null;
}

function ensureStyleTag(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(LOCATE_CONTROL_STYLE_ID)) return;

  const link = document.createElement("link");
  link.id = LOCATE_CONTROL_STYLE_ID;
  link.rel = "stylesheet";
  link.href = LOCATE_CONTROL_CSS;
  document.head.appendChild(link);
}

export async function ensureLeafletLocateControlLoaded(): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  if (getLeafletLocateControlFactory()) {
    return true;
  }

  if (loadPromise) {
    return loadPromise;
  }

  ensureStyleTag();
  (window as Window & { L?: typeof L }).L = L;

  loadPromise = new Promise<boolean>((resolve) => {
    const existingScript = document.getElementById(
      LOCATE_CONTROL_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (getLeafletLocateControlFactory()) {
        resolve(true);
        return;
      }

      const onLoad = () => resolve(Boolean(getLeafletLocateControlFactory()));
      const onError = () => resolve(false);
      existingScript.addEventListener("load", onLoad, { once: true });
      existingScript.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = LOCATE_CONTROL_SCRIPT_ID;
    script.src = LOCATE_CONTROL_JS;
    script.async = true;
    script.onload = () => resolve(Boolean(getLeafletLocateControlFactory()));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return loadPromise;
}
