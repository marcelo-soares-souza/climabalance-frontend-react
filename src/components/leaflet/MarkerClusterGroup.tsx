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

interface MarkerClusterGroupProps {
  children: React.ReactNode;
}

export function MarkerClusterGroup({ children }: MarkerClusterGroupProps) {
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

  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.clearLayers();

    // Cleanest solution: don't use react-leaflet <Marker> for clustered markers.
    // Instead, create L.Marker imperatively and add to cluster group.
    // So this component will just provide the cluster group instance.
    // MapPage will use it imperatively.
  }, [children]);

  return null;
}
