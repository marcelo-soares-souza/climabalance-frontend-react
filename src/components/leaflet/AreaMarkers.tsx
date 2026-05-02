import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getCountryName } from "@/lib/countries";
import { formatCurrency, formatKgCO2e, formatNumber } from "@/lib/format";
import type { Area } from "@/types/area";

function areaIcon(hasContributions: boolean, thumbnailUrl?: string): L.DivIcon {
  const size = 36;
  const half = size / 2;

  if (thumbnailUrl) {
    return L.divIcon({
      className: "",
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);overflow:hidden;background:#e5e7eb;"><img src="${thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" alt="" onerror="this.style.display='none';this.parentElement.style.background='${hasContributions ? "#2563EB" : "#0B5F4B"}';this.parentElement.innerHTML='<svg width=18 height=18 viewBox=\\'0 0 24 24\\' fill=\\'none\\'><path d=\\'M12 3 7 10h3l-2 4h3v5h2v-5h3l-2-4h3L12 3Z\\' fill=\\'white\\'/></svg>';this.parentElement.style.display=\\'flex\\';this.parentElement.style.alignItems=\\'center\\';this.parentElement.style.justifyContent=\\'center\\';" /></div>`,
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
  onNavigateToArea: (areaId: string) => void;
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

    return () => {
      map.removeLayer(mcg);
      clusterRef.current = null;
      const markers = markersRef.current;
      if (markers) markers.clear();
    };
  }, [map]);

  const buildPopupContent = useCallback(
    (area: Area): HTMLElement => {
      const container = document.createElement("div");
      container.style.minWidth = "220px";

      const hasContributions = (area.totalCompensatedTreesCount ?? 0) > 0;
      const color = hasContributions ? "#2563EB" : "#0B5F4B";

      let html = "";

      if (area.thumbnailUrl) {
        html += `<img src="${area.thumbnailUrl}" alt="" style="width:calc(100% + 16px);height:112px;object-fit:cover;border-radius:6px 6px 0 0;margin:-8px -8px 8px -8px;display:block;" />`;
      }

      html += `<h3 style="font-weight:600;font-size:1.125rem;margin-bottom:6px;line-height:1.25;color:#111;">${area.name}</h3>`;

      const location =
        [area.city, area.state, getCountryName(area.countryCode ?? "")]
          .filter(Boolean)
          .join(", ") || "-";
      html += `<p style="color:#6b7280;font-size:0.875rem;margin-bottom:8px;">${location}</p>`;

      if (area.description) {
        html += `<p style="font-size:0.875rem;color:#6b7280;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;">${area.description}</p>`;
      }

      if (
        area.pricePerTree != null ||
        area.estimatedKgCO2PerTreePerYear != null
      ) {
        html += `<div style="display:flex;gap:16px;margin-bottom:8px;">`;
        if (area.pricePerTree != null) {
          html += `<p style="font-size:0.875rem;"><span style="color:#6b7280;">${t("area.form.pricePerTree")}:</span> <span style="font-weight:500;">${formatCurrency(area.pricePerTree)}</span></p>`;
        }
        html += `<p style="font-size:0.875rem;"><span style="color:#6b7280;">${t("compensation.review.estimatedCO2")}:</span> <span style="font-weight:500;">${formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}</span></p>`;
        html += `</div>`;
      }

      if (
        area.plantedTreesCount != null ||
        area.totalCompensatedTreesCount != null
      ) {
        html += `<div style="display:flex;gap:12px;margin-bottom:12px;font-size:0.75rem;color:#6b7280;">`;
        if (area.plantedTreesCount != null) {
          html += `<span>🌲 ${t("map.treesPlanted")}: ${formatNumber(area.plantedTreesCount, "pt-BR", 0)}</span>`;
        }
        if (area.totalCompensatedTreesCount != null) {
          html += `<span>🌱 ${t("map.treesCompensated")}: ${formatNumber(area.totalCompensatedTreesCount, "pt-BR", 0)}</span>`;
        }
        html += `</div>`;
      }

      html += `<div style="display:flex;gap:8px;margin-top:8px;">`;
      html += `<button class="cb-details-btn" data-area-id="${area.id}" style="flex:1;padding:6px 12px;font-size:0.875rem;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;color:#374151;">${t("common.details")}</button>`;
      html += `<button class="cb-compensate-btn" data-area-id="${area.id}" style="flex:1;padding:6px 12px;font-size:0.875rem;border:none;border-radius:6px;background:${color};color:#fff;cursor:pointer;font-weight:500;">${t("map.compensate")}</button>`;
      html += `</div>`;

      container.innerHTML = html;

      container
        .querySelector(".cb-details-btn")
        ?.addEventListener("click", (e) => {
          e.stopPropagation();
          onNavigateToArea(area.id);
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
