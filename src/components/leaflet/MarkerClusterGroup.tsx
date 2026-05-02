import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

interface MarkerClusterGroupProps {
  children: React.ReactNode;
}

export function MarkerClusterGroup({ children }: MarkerClusterGroupProps) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      disableClusteringAtZoom: 12,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    groupRef.current = group;
    map.addLayer(group);

    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map]);

  // React Portal-like approach: append children markers to the cluster group
  useEffect(() => {
    if (!groupRef.current) return;

    // Clear existing markers before re-adding (safer for re-renders)
    groupRef.current.clearLayers();

    // We need to find all Marker children and add them to the cluster group
    // Since children are React elements, we'll use a different approach:
    // The parent MapPage will render markers normally, and we'll use
    // a ref-based approach or ReactDOM.createPortal isn't ideal here.
    //
    // Alternative: use a context or simply let the parent pass markers via props.
    // Actually, the cleanest way with react-leaflet is to render children
    // inside a div that's not attached to DOM, then extract leaflet elements.
    //
    // Simpler approach for now: the parent will NOT render markers as react-leaflet children,
    // but will pass them to us. OR we can use a custom hook.
    //
    // Let's use a different strategy: MapPage renders markers normally but we
    // wrap them in a custom context that gives access to the cluster group.
    //
    // Actually, the simplest approach is to NOT use this component as a wrapper
    // but instead expose the cluster group via a ref or context, and have
    // MapPage imperatively add markers to it.
    //
    // Wait - there's a known pattern: use a container div and ReactDOM.createPortal
    // to render react-leaflet Marker components into the cluster group.
    // But react-leaflet markers need a MapContainer context.
    //
    // Best approach: use a ref callback on markers. But react-leaflet doesn't expose refs easily.
    //
    // Another approach: render the markers normally in the MapContainer, but also
    // imperatively add them to the cluster group. This duplicates them.
    //
    // Cleanest solution: don't use react-leaflet <Marker> for clustered markers.
    // Instead, create L.Marker imperatively and add to cluster group.
    //
    // So this component will just provide the cluster group instance.
    // MapPage will use it imperatively.
  }, [children]);

  return null;
}

export function useMarkerClusterGroup() {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      disableClusteringAtZoom: 12,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    groupRef.current = group;
    map.addLayer(group);

    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map]);

  return groupRef;
}
