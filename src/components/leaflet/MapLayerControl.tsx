import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

type MapLayerControlProps = {
  position?: L.ControlPosition;
  satellite: boolean;
  onToggle: () => void;
};

export function MapLayerControl({ position = 'topright', satellite, onToggle }: MapLayerControlProps) {
  const map = useMap();
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const onToggleRef = useRef(onToggle);

  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  useEffect(() => {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const button = L.DomUtil.create('a', '', container);
    button.href = '#';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    buttonRef.current = button;

    L.DomEvent.on(button, 'click', (e) => {
      L.DomEvent.preventDefault(e);
      onToggleRef.current();
    });

    const CustomControl = L.Control.extend({
      onAdd: () => container,
    });
    const control = new CustomControl({ position });
    control.addTo(map);

    return () => {
      buttonRef.current = null;
      map.removeControl(control);
    };
  }, [map, position]);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    button.title = satellite ? 'Street Map' : 'Satellite';
    button.innerHTML = satellite
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  }, [satellite]);

  return null;
}
