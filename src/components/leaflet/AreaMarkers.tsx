import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getCountryName } from "@/lib/countries";
import { formatCurrency, formatKgCO2e, formatNumber } from "@/lib/format";
import type { Area } from "@/types/area";

function safeImageUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    const sameOriginApi =
      url.origin === window.location.origin &&
      url.pathname.startsWith("/api/v1/");
    const allowedHttps = url.protocol === "https:";
    return sameOriginApi || allowedHttps ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function appendText(
  parent: HTMLElement,
  tagName: keyof HTMLElementTagNameMap,
  text: string,
  styles: Partial<CSSStyleDeclaration>,
): HTMLElement {
  const element = document.createElement(tagName);
  element.textContent = text;
  Object.assign(element.style, styles);
  parent.appendChild(element);
  return element;
}

function areaIcon(hasContributions: boolean, thumbnailUrl?: string): L.DivIcon {
  const size = 36;
  const half = size / 2;
  const safeThumbnailUrl = safeImageUrl(thumbnailUrl);

  if (safeThumbnailUrl) {
    return L.divIcon({
      className: "",
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);overflow:hidden;background:#e5e7eb;"><img src="${escapeAttribute(safeThumbnailUrl)}" style="width:100%;height:100%;object-fit:cover;display:block;" alt="" /></div>`,
      iconSize: [size, size],
      iconAnchor: [half, half],
    });
  }

  const color = hasContributions ? "#2563EB" : "#0B5F4B";
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3 7 10h3l-2 4h3v5h2v-5h3l-2-4h3L12 3Z" fill="white"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface AreaMarkersProps {
  areas: Area[];
  t: (key: string, options?: Record<string, unknown>) => string;
  onSelectArea: (area: Area) => void;
  onNavigateToArea: (area: Area) => void;
}

export function AreaMarkers({
  areas,
  t,
  onSelectArea,
  onNavigateToArea,
}: AreaMarkersProps) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    const mcg = L.markerClusterGroup({
      disableClusteringAtZoom: 12,
      maxClusterRadius: 20,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    clusterRef.current = mcg;
    map.addLayer(mcg);

    const markersMap = markersRef.current;

    return () => {
      map.removeLayer(mcg);
      clusterRef.current = null;
      markersMap.clear();
    };
  }, [map]);

  const buildPopupContent = useCallback(
    (area: Area): HTMLElement => {
      const container = document.createElement("div");
      container.style.minWidth = "220px";

      const hasContributions = (area.totalCompensatedTreesCount ?? 0) > 0;
      const color = hasContributions ? "#2563EB" : "#0B5F4B";
      const safeThumbnailUrl = safeImageUrl(area.thumbnailUrl);

      if (safeThumbnailUrl) {
        const image = document.createElement("img");
        image.src = safeThumbnailUrl;
        image.alt = "";
        Object.assign(image.style, {
          width: "calc(100% + 16px)",
          height: "112px",
          objectFit: "cover",
          borderRadius: "6px 6px 0 0",
          margin: "-8px -8px 8px -8px",
          display: "block",
        });
        container.appendChild(image);
      }

      appendText(container, "h3", area.name, {
        fontWeight: "600",
        fontSize: "1.125rem",
        marginBottom: "6px",
        lineHeight: "1.25",
        color: "#111",
      });

      const location =
        [area.city, area.state, getCountryName(area.countryCode ?? "")]
          .filter(Boolean)
          .join(", ") || "-";
      appendText(container, "p", location, {
        color: "#6b7280",
        fontSize: "0.875rem",
        marginBottom: "8px",
      });

      if (area.description) {
        appendText(container, "p", area.description, {
          fontSize: "0.875rem",
          color: "#6b7280",
          marginBottom: "8px",
          display: "-webkit-box",
          webkitLineClamp: "4",
          webkitBoxOrient: "vertical",
          overflow: "hidden",
        });
      }

      if (
        area.pricePerTree != null ||
        area.estimatedKgCO2PerTreePerYear != null
      ) {
        const metrics = document.createElement("div");
        Object.assign(metrics.style, {
          display: "flex",
          gap: "16px",
          marginBottom: "8px",
        });
        if (area.pricePerTree != null) {
          appendText(
            metrics,
            "p",
            `${t("area.form.pricePerTree")}: ${formatCurrency(area.pricePerTree)}`,
            { fontSize: "0.875rem" },
          );
        }
        if (area.estimatedKgCO2PerTreePerYear != null) {
          appendText(
            metrics,
            "p",
            `${t("compensation.review.estimatedCO2")}: ${formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}`,
            { fontSize: "0.875rem" },
          );
        }
        container.appendChild(metrics);
      }

      if (
        area.plantedTreesCount != null ||
        area.totalCompensatedTreesCount != null
      ) {
        const trees = document.createElement("div");
        Object.assign(trees.style, {
          display: "flex",
          gap: "12px",
          marginBottom: "12px",
          fontSize: "0.75rem",
          color: "#6b7280",
        });
        if (area.plantedTreesCount != null) {
          appendText(
            trees,
            "span",
            `${t("map.treesPlanted")}: ${formatNumber(area.plantedTreesCount, "pt-BR", 0)}`,
            {},
          );
        }
        if (area.totalCompensatedTreesCount != null) {
          appendText(
            trees,
            "span",
            `${t("map.treesCompensated")}: ${formatNumber(area.totalCompensatedTreesCount, "pt-BR", 0)}`,
            {},
          );
        }
        container.appendChild(trees);
      }

      const actions = document.createElement("div");
      Object.assign(actions.style, {
        display: "flex",
        gap: "8px",
        marginTop: "8px",
      });

      const detailsButton = document.createElement("button");
      detailsButton.type = "button";
      detailsButton.className = "cb-details-btn";
      detailsButton.dataset.areaId = area.id;
      detailsButton.textContent = t("common.details");
      Object.assign(detailsButton.style, {
        flex: "1",
        padding: "6px 12px",
        fontSize: "0.875rem",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        background: "#fff",
        cursor: "pointer",
        color: "#374151",
      });

      const compensateButton = document.createElement("button");
      compensateButton.type = "button";
      compensateButton.className = "cb-compensate-btn";
      compensateButton.dataset.areaId = area.id;
      compensateButton.textContent = t("map.compensate");
      Object.assign(compensateButton.style, {
        flex: "1",
        padding: "6px 12px",
        fontSize: "0.875rem",
        border: "none",
        borderRadius: "6px",
        background: color,
        color: "#fff",
        cursor: "pointer",
        fontWeight: "500",
      });

      actions.appendChild(detailsButton);
      actions.appendChild(compensateButton);
      container.appendChild(actions);

      container
        .querySelector(".cb-details-btn")
        ?.addEventListener("click", (e) => {
          e.stopPropagation();
          onNavigateToArea(area);
        });

      container
        .querySelector(".cb-compensate-btn")
        ?.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectArea(area);
        });

      return container;
    },
    [t, onSelectArea, onNavigateToArea],
  );

  useEffect(() => {
    if (!clusterRef.current) return;

    const mcg = clusterRef.current;
    const currentMarkers = markersRef.current;
    const newMarkerIds = new Set<string>();

    for (const area of areas) {
      newMarkerIds.add(area.id);

      if (currentMarkers.has(area.id)) {
        const existingMarker = currentMarkers.get(area.id)!;
        const currentLatLng = existingMarker.getLatLng();
        if (
          currentLatLng.lat !== area.latitude ||
          currentLatLng.lng !== area.longitude
        ) {
          existingMarker.setLatLng([area.latitude, area.longitude]);
        }
        const hasContributions = (area.totalCompensatedTreesCount ?? 0) > 0;
        existingMarker.setIcon(areaIcon(hasContributions, area.thumbnailUrl));
        continue;
      }

      const hasContributions = (area.totalCompensatedTreesCount ?? 0) > 0;
      const marker = L.marker([area.latitude, area.longitude], {
        icon: areaIcon(hasContributions, area.thumbnailUrl),
      });

      const popupContent = buildPopupContent(area);
      marker.bindPopup(popupContent, { minWidth: 240 });

      currentMarkers.set(area.id, marker);
      mcg.addLayer(marker);
    }

    for (const [id, marker] of currentMarkers) {
      if (!newMarkerIds.has(id)) {
        mcg.removeLayer(marker);
        currentMarkers.delete(id);
      }
    }
  }, [areas, buildPopupContent]);

  return null;
}
