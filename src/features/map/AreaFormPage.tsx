import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapLayerControl } from '@/components/leaflet/MapLayerControl';
import { OSM_URL, OSM_ATTR, SATELLITE_URL, SATELLITE_ATTR } from '@/components/leaflet/map-layers';
import { areasService } from '@/services/areas';
import { locationsService } from '@/services/locations';
import { queryClient } from '@/config/query-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Combobox } from '@/components/ui/Combobox';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { LocateControl } from '@/components/leaflet/LocateControl';
import type { AreaStatus } from '@/types/area';
import { countries } from '@/lib/countries';
import { getCountryCenter } from '@/lib/country-coords';
import { getAreaDetailPath } from '@/lib/public-refs';
import { ArrowLeft } from 'lucide-react';

const DEFAULT_CENTER: [number, number] = [-15.793889, -47.882778];

const countryOptions = countries.map((c) => ({ value: c.code, label: c.name }));

export function AreaFormPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEdit = !!areaId;

  const [satellite, setSatellite] = useState(false);
  const [form, setForm] = useState<Partial<{
    name: string;
    description: string;
    latitude: string;
    longitude: string;
    status: AreaStatus;
    countryCode: string;
    biome: string;
    state: string;
    city: string;
    t_co2e_per_tree_per_year: string;
    price_per_tree: string;
    default_horizon_years: string;
    tree_species: string;
    external_link: string;
  }>>({});
  const [error, setError] = useState<string | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['areas', areaId],
    queryFn: () => areasService.getArea(areaId!),
    enabled: isEdit,
  });

  const formValues = {
    name: form.name ?? existing?.name ?? '',
    description: form.description ?? existing?.description ?? '',
    latitude: form.latitude ?? (existing ? String(existing.latitude) : ''),
    longitude: form.longitude ?? (existing ? String(existing.longitude) : ''),
    status: form.status ?? existing?.status ?? 'draft',
    countryCode: form.countryCode ?? existing?.countryCode ?? '',
    biome: form.biome ?? existing?.biome ?? '',
    state: form.state ?? existing?.state ?? '',
    city: form.city ?? existing?.city ?? '',
    t_co2e_per_tree_per_year: form.t_co2e_per_tree_per_year ?? (existing?.tCO2ePerTreePerYear != null ? String(existing.tCO2ePerTreePerYear) : '10'),
    price_per_tree: form.price_per_tree ?? (existing?.pricePerTree != null ? String(existing.pricePerTree) : '15'),
    default_horizon_years: form.default_horizon_years ?? (existing?.defaultHorizonYears != null ? String(existing.defaultHorizonYears) : '20'),
    tree_species: form.tree_species ?? existing?.treeSpecies ?? '',
    external_link: form.external_link ?? existing?.externalLink ?? '',
  };

  const { data: states = [], isLoading: loadingStates } = useQuery({
    queryKey: ['states', formValues.countryCode],
    queryFn: () => locationsService.listStates(formValues.countryCode),
    enabled: formValues.countryCode.length === 2,
  });

  const stateOptions = useMemo(() => {
    return [{ value: '', label: formValues.countryCode ? t('area.form.selectState') : t('area.form.selectCountryFirst') }, ...states.map((s: string) => ({ value: s, label: s }))];
  }, [states, formValues.countryCode, t]);

  const mutation = useMutation({
    mutationFn: () => {
      const data = {
        name: formValues.name,
        description: formValues.description || undefined,
        latitude: parseFloat(formValues.latitude),
        longitude: parseFloat(formValues.longitude),
        status: isEdit && isAdmin ? (formValues.status as AreaStatus) : undefined,
        countryCode: formValues.countryCode || undefined,
        biome: formValues.biome || undefined,
        state: formValues.state || undefined,
        city: formValues.city || undefined,
        t_co2e_per_tree_per_year: parseFloat(formValues.t_co2e_per_tree_per_year) || undefined,
        price_per_tree: parseFloat(formValues.price_per_tree) || undefined,
        default_horizon_years: parseInt(formValues.default_horizon_years, 10) || undefined,
        tree_species: formValues.tree_species || undefined,
        external_link: formValues.external_link || undefined,
      };
      return isEdit ? areasService.updateArea(existing?.id ?? areaId!, data) : areasService.createArea(data);
    },
    onSuccess: (area) => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      navigate(getAreaDetailPath(area));
    },
    onError: (err) => setError(err instanceof ApiError ? err.messageKey : 'area.form.error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  const update = (
    field:
      | 'name'
      | 'description'
      | 'latitude'
      | 'longitude'
      | 'status'
      | 'countryCode'
      | 'biome'
      | 'state'
      | 'city'
      | 't_co2e_per_tree_per_year'
      | 'price_per_tree'
      | 'default_horizon_years'
      | 'tree_species'
      | 'external_link',
    value: string
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const hasLatitudeInput = formValues.latitude.trim().length > 0;
  const hasLongitudeInput = formValues.longitude.trim().length > 0;
  const parsedLat = hasLatitudeInput ? Number(formValues.latitude) : Number.NaN;
  const parsedLng = hasLongitudeInput ? Number(formValues.longitude) : Number.NaN;
  const hasValidPosition =
    hasLatitudeInput
    && hasLongitudeInput
    && Number.isFinite(parsedLat)
    && Number.isFinite(parsedLng)
    && parsedLat >= -90
    && parsedLat <= 90
    && parsedLng >= -180
    && parsedLng <= 180;

  const selectedPosition = useMemo<[number, number] | null>(
    () => (hasValidPosition ? [parsedLat, parsedLng] : null),
    [hasValidPosition, parsedLat, parsedLng]
  );
  const countryCenter = useMemo(() => {
    if (formValues.countryCode) return getCountryCenter(formValues.countryCode);
    return null;
  }, [formValues.countryCode]);

  const initialCenter = useMemo<[number, number]>(
    () => selectedPosition ?? countryCenter ?? DEFAULT_CENTER,
    [selectedPosition, countryCenter]
  );
  const initialZoom = selectedPosition ? 10 : countryCenter ? 6 : 3;

  if (isEdit && isLoading) return <PageSkeleton />;

  return (
    <>
      <SEO title="Áreas" />
      <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold">{isEdit ? t('area.form.editTitle') : t('area.form.createTitle')}</h1>
      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}
      <form onSubmit={handleSubmit}>
        <Card><CardContent className="space-y-4 py-6">
          <Input id="name" label={t('area.form.name')} value={formValues.name} onChange={(e) => update('name', e.target.value)} required />
          <Textarea id="description" label={t('area.form.description')} value={formValues.description} onChange={(e) => update('description', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Combobox
              id="countryCode"
              label={t('area.form.country')}
              value={formValues.countryCode}
              required
              options={countryOptions}
              emptyLabel="—"
              placeholder={t('area.form.selectCountry')}
              onChange={(val) => {
                update('countryCode', val);
                update('state', '');
                update('city', '');
                const center = getCountryCenter(val);
                if (center) {
                  update('latitude', center[0].toFixed(6));
                  update('longitude', center[1].toFixed(6));
                }
              }}
            />
            <Select
              id="state"
              label={t('area.form.state')}
              value={formValues.state}
              options={stateOptions}
              disabled={!formValues.countryCode || loadingStates}
              onChange={(e) => {
                update('state', e.target.value);
                update('city', '');
              }}
            />
          </div>
          <Input
            id="city"
            label={t('area.form.city')}
            value={formValues.city}
            onChange={(e) => update('city', e.target.value)}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('area.form.pickOnMap')}</p>
            <p className="text-xs text-text-secondary">{t('area.form.mapHint')}</p>
            <div className="h-72 rounded-md overflow-hidden border border-gray-200">
              <MapContainer center={initialCenter} zoom={initialZoom} className="h-full w-full">
                <MapCenterController center={countryCenter ?? initialCenter} zoom={countryCenter ? 6 : initialZoom} />
                <LocateControl title={t('map.locate.title')} />
                <TileLayer
                  attribution={satellite ? SATELLITE_ATTR : OSM_ATTR}
                  url={satellite ? SATELLITE_URL : OSM_URL}
                />
                <MapLayerControl
                  satellite={satellite}
                  onToggle={() => setSatellite((s) => !s)}
                />
                <LocationPicker
                  position={selectedPosition}
                  onPick={(lat, lng) => {
                    update('latitude', lat.toFixed(6));
                    update('longitude', lng.toFixed(6));
                  }}
                />
              </MapContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="latitude" type="number" step="any" label={t('area.form.latitude')} labelAdornment={<InfoTooltip ariaLabel={t('tooltips.area.locationAria')} content={<p>{t('tooltips.area.location')}</p>} />} value={formValues.latitude} onChange={(e) => update('latitude', e.target.value)} required />
            <Input id="longitude" type="number" step="any" label={t('area.form.longitude')} labelAdornment={<InfoTooltip ariaLabel={t('tooltips.area.locationAria')} content={<p>{t('tooltips.area.location')}</p>} />} value={formValues.longitude} onChange={(e) => update('longitude', e.target.value)} required />
          </div>
          {isEdit && isAdmin && (
            <Select
              id="status"
              label={t('area.form.status')}
              labelAdornment={<InfoTooltip ariaLabel={t('tooltips.area.statusAria')} content={<p>{t('tooltips.area.statusSummary')}</p>} />}
              options={[
                { value: 'draft', label: t('area.status.draft') },
                { value: 'pending_audit', label: t('area.status.pending_audit') },
                { value: 'approved', label: t('area.status.approved') },
                { value: 'active', label: t('area.status.active') },
                { value: 'rejected', label: t('area.status.rejected') },
                { value: 'suspended', label: t('area.status.suspended') },
              ]}
              value={formValues.status}
              onChange={(e) => update('status', e.target.value)}
            />
          )}
          <Input id="biome" label={t('area.form.biome')} labelAdornment={<InfoTooltip ariaLabel={t('tooltips.area.biomeAria')} content={<p>{t('tooltips.area.biome')}</p>} />} value={formValues.biome} onChange={(e) => update('biome', e.target.value)} />
          <Textarea id="tree_species" label={t('area.form.treeSpecies')} labelAdornment={<InfoTooltip ariaLabel={t('tooltips.area.treeSpeciesAria')} content={<p>{t('tooltips.area.treeSpecies')}</p>} />} value={formValues.tree_species} onChange={(e) => update('tree_species', e.target.value)} rows={4} />
          <Input id="external_link" type="url" label={t('area.form.externalLink')} labelAdornment={<InfoTooltip ariaLabel={t('tooltips.area.externalLinkAria')} content={<p>{t('tooltips.area.externalLink')}</p>} />} value={formValues.external_link} onChange={(e) => update('external_link', e.target.value)} placeholder="https://" />
          <div className="grid grid-cols-2 gap-4">
            <Input id="tco2e_tree" type="number" step="any" label={t('area.form.tCO2ePerTree')}
              labelAdornment={<InfoTooltip ariaLabel={t('tooltips.shared.tco2ePerTreeAria')} content={<p>{t('tooltips.shared.tco2ePerTree')}</p>} />}
              value={formValues.t_co2e_per_tree_per_year} onChange={(e) => update('t_co2e_per_tree_per_year', e.target.value)} />
            <Input id="price_tree" type="number" step="any" label={t('area.form.pricePerTree')}
              labelAdornment={<InfoTooltip ariaLabel={t('tooltips.area.pricePerTreeAria')} content={<p>{t('tooltips.area.pricePerTree')}</p>} />}
              suffix="USD"
              value={formValues.price_per_tree} onChange={(e) => update('price_per_tree', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Input id="default_horizon_years" type="number" step="1" label={t('area.form.defaultHorizonYears')}
              labelAdornment={<InfoTooltip ariaLabel={t('tooltips.area.defaultHorizonYearsAria')} content={<p>{t('tooltips.area.defaultHorizonYears')}</p>} />}
              value={formValues.default_horizon_years} onChange={(e) => update('default_horizon_years', e.target.value)} />
          </div>
        </CardContent></Card>
        <div className="flex gap-3 mt-4">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? t('common.save') : t('area.form.create')}</Button>
        </div>
      </form>
    </div>
    </>
  );
}

const locationPinIcon = L.divIcon({
  className: '',
  html: '<div style="background:#0B5F4B;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function LocationPicker({
  position,
  onPick,
}: {
  position: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  useEffect(() => {
    if (!position) return;
    map.setView(position, Math.max(map.getZoom(), 10));
  }, [map, position]);

  return position ? <Marker position={position} icon={locationPinIcon} /> : null;
}

function MapCenterController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [map, center, zoom]);
  return null;
}
