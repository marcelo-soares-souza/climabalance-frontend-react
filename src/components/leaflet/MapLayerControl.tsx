import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAPBOX_TOKEN } from './map-layers';

type MapLayerControlProps = {
  position?: L.ControlPosition;
  satellite: boolean;
  onToggle: () => void;
};

export function MapLayerControl({ position = 'topright', satellite, onToggle }: MapLayerControlProps) {
  const { t } = useTranslation();
  const map = useMap();
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const onToggleRef = useRef(onToggle);

  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  useEffect(() => {
    if (!MAPBOX_TOKEN) return;

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
    button.title = satellite ? t('map.streetMap') : t('map.satelliteView');

    while (button.firstChild) button.removeChild(button.firstChild);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    if (satellite) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z');
      svg.appendChild(path);
      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', '9 22 9 12 15 12 15 22');
      svg.appendChild(polyline);
    } else {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12'); circle.setAttribute('cy', '12'); circle.setAttribute('r', '5');
      svg.appendChild(circle);
      const lines = [
        [12, 1, 12, 3], [12, 21, 12, 23],
        [4.22, 4.22, 5.64, 5.64], [18.36, 18.36, 19.78, 19.78],
        [1, 12, 3, 12], [21, 12, 23, 12],
        [4.22, 19.78, 5.64, 18.36], [18.36, 5.64, 19.78, 4.22],
      ];
      for (const [x1, y1, x2, y2] of lines) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(x1)); line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2));
        svg.appendChild(line);
      }
    }

    button.appendChild(svg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satellite]);

  if (!MAPBOX_TOKEN) return null;
  return null;
}
