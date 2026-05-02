import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const CLUSTER_OPTIONS: L.MarkerClusterGroupOptions = {
  disableClusteringAtZoom: 12,
  maxClusterRadius: 40,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
};

export function useMarkerClusterGroup() {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group = L.markerClusterGroup(CLUSTER_OPTIONS);

    groupRef.current = group;
    map.addLayer(group);

    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map]);

  return groupRef;
}