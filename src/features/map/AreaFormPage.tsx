import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { areasService } from '@/services/areas';
import { queryClient } from '@/config/query-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { LocateControl } from '@/components/leaflet/LocateControl';
import type { AreaStatus } from '@/types/area';
import {
  BRAZIL_STATES,
  findBrazilStateCode,
  getBrazilStateCenter,
  getBrazilCitiesByState,
} from '@/features/map/data/br-locations';
import { ArrowLeft } from 'lucide-react';

const BRASILIA_COORDINATES: [number, number] = [-15.793889, -47.882778];

type IpGeoResponse = {
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lon?: number | string;
};

function parseGeoCoordinate(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchIpBasedCoordinates(signal: AbortSignal): Promise<[number, number] | null> {
  const response = await fetch('https://ipapi.co/json/', {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as IpGeoResponse;
  const latitude = parseGeoCoordinate(payload.latitude ?? payload.lat);
  const longitude = parseGeoCoordinate(payload.longitude ?? payload.lon);
  if (latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return [latitude, longitude];
}

export function AreaFormPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEdit = !!areaId;

  const [form, setForm] = useState<Partial<{
    name: string;
    description: string;
    latitude: string;
    longitude: string;
    status: AreaStatus;
    biome: string;
    state: string;
    city: string;
    t_co2e_per_tree_per_year: string;
    price_per_tree: string;
    default_horizon_years: string;
  }>>({});
  const [error, setError] = useState<string | null>(null);
  const [ipBasedCenter, setIpBasedCenter] = useState<[number, number] | null>(null);

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
    biome: form.biome ?? existing?.biome ?? '',
    state: form.state ?? (existing?.state ? (findBrazilStateCode(existing.state) || existing.state) : ''),
    city: form.city ?? existing?.city ?? '',
    t_co2e_per_tree_per_year: form.t_co2e_per_tree_per_year ?? (existing?.tCO2ePerTreePerYear ? String(existing.tCO2ePerTreePerYear) : ''),
    price_per_tree: form.price_per_tree ?? (existing?.pricePerTree ? String(existing.pricePerTree) : ''),
    default_horizon_years: form.default_horizon_years ?? (existing?.defaultHorizonYears ? String(existing.defaultHorizonYears) : ''),
  };

  const biomeOptions = [
    { value: '', label: t('area.form.selectBiome') },
    { value: 'amazonia', label: t('map.biomes.amazonia') },
    { value: 'cerrado', label: t('map.biomes.cerrado') },
    { value: 'mata_atlantica', label: t('map.biomes.mataAtlantica') },
    { value: 'caatinga', label: t('map.biomes.caatinga') },
    { value: 'pampa', label: t('map.biomes.pampa') },
    { value: 'pantanal', label: t('map.biomes.pantanal') },
  ];
  const stateOptions = useMemo(
    () => [
      { value: '', label: t('area.form.selectState') },
      ...BRAZIL_STATES.map((state) => ({
        value: state.code,
        label: `${state.code} - ${state.name}`,
      })),
    ],
    [t]
  );
  const normalizedStateCode = findBrazilStateCode(formValues.state);

  const { data: cityOptions, isLoading: isCitiesLoading } = useQuery({
    queryKey: ['cities', normalizedStateCode],
    queryFn: ({ signal }) => getBrazilCitiesByState(normalizedStateCode!, signal),
    enabled: !!normalizedStateCode,
  });

  const fallbackCityOptions = useMemo(() => {
    if (!normalizedStateCode) return [];

    const state = BRAZIL_STATES.find((item) => item.code === normalizedStateCode);
    return state ? [state.capital] : [];
  }, [normalizedStateCode]);

  const citySelectOptions = useMemo(() => {
    if (!normalizedStateCode) {
      return [{ value: '', label: t('area.form.selectStateFirst') }];
    }

    const resolvedCities = cityOptions && cityOptions.length > 0 ? cityOptions : fallbackCityOptions;
    const placeholderLabel = isCitiesLoading && resolvedCities.length === 0
      ? t('area.form.loadingCities')
      : resolvedCities.length === 0
        ? t('area.form.noCitiesAvailable')
        : t('area.form.selectCity');
    const options = [{ value: '', label: placeholderLabel }];
    const mappedCities = resolvedCities.map((city) => ({ value: city, label: city }));
    const hasCurrentCity = mappedCities.some((city) => city.value === formValues.city);

    if (formValues.city && !hasCurrentCity) {
      mappedCities.unshift({ value: formValues.city, label: formValues.city });
    }

    return [...options, ...mappedCities];
  }, [normalizedStateCode, isCitiesLoading, cityOptions, fallbackCityOptions, formValues.city, t]);

  const mutation = useMutation({
    mutationFn: () => {
      const data = {
        name: formValues.name,
        description: formValues.description || undefined,
        latitude: parseFloat(formValues.latitude),
        longitude: parseFloat(formValues.longitude),
        status: isEdit && isAdmin ? (formValues.status as AreaStatus) : undefined,
        biome: formValues.biome || undefined,
        state: formValues.state || undefined,
        city: formValues.city || undefined,
        t_co2e_per_tree_per_year: parseFloat(formValues.t_co2e_per_tree_per_year) || undefined,
        price_per_tree: parseFloat(formValues.price_per_tree) || undefined,
        default_horizon_years: parseInt(formValues.default_horizon_years, 10) || undefined,
      };
      return isEdit ? areasService.updateArea(areaId!, data) : areasService.createArea(data);
    },
    onSuccess: (area) => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      navigate(`/areas/${area.id}`);
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
      | 'biome'
      | 'state'
      | 'city'
      | 't_co2e_per_tree_per_year'
      | 'price_per_tree'
      | 'default_horizon_years',
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
  const hasSelectedPosition = selectedPosition !== null;
  const hasManualCoordinates =
    (form.latitude?.trim().length ?? 0) > 0 || (form.longitude?.trim().length ?? 0) > 0;

  useEffect(() => {
    if (isEdit || hasSelectedPosition || hasManualCoordinates) return;

    let active = true;
    const controller = new AbortController();
    const applyCoordinates = (coordinates: [number, number]) => {
      if (!active) return;

      setIpBasedCenter(coordinates);
      setForm((prev) => {
        const hasLatitude = (prev.latitude?.trim().length ?? 0) > 0;
        const hasLongitude = (prev.longitude?.trim().length ?? 0) > 0;
        if (hasLatitude || hasLongitude) return prev;

        return {
          ...prev,
          latitude: coordinates[0].toFixed(6),
          longitude: coordinates[1].toFixed(6),
        };
      });
    };

    fetchIpBasedCoordinates(controller.signal)
      .then((coordinates) => {
        applyCoordinates(coordinates ?? BRASILIA_COORDINATES);
      })
      .catch(() => {
        applyCoordinates(BRASILIA_COORDINATES);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [isEdit, hasSelectedPosition, hasManualCoordinates, form.latitude, form.longitude]);

  const initialCenter = useMemo<[number, number]>(
    () => selectedPosition ?? ipBasedCenter ?? BRASILIA_COORDINATES,
    [selectedPosition, ipBasedCenter]
  );
  const initialZoom = selectedPosition ? 10 : ipBasedCenter ? 9 : 5;

  if (isEdit && isLoading) return <PageSkeleton />;

  return (
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
            <Select
              id="state"
              label={t('area.form.state')}
              value={normalizedStateCode ?? ''}
              options={stateOptions}
              onChange={(e) => {
                const nextStateCode = e.target.value;
                const previousStateCode = normalizedStateCode ?? '';
                update('state', nextStateCode);
                if (nextStateCode !== previousStateCode) {
                  update('city', '');
                  const stateCenter = getBrazilStateCenter(nextStateCode);
                  if (stateCenter) {
                    update('latitude', stateCenter[0].toFixed(6));
                    update('longitude', stateCenter[1].toFixed(6));
                  }
                }
              }}
            />
            <Select
              id="city"
              label={t('area.form.city')}
              value={formValues.city}
              options={citySelectOptions}
              disabled={!normalizedStateCode}
              onChange={(e) => update('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('area.form.pickOnMap')}</p>
            <p className="text-xs text-text-secondary">{t('area.form.mapHint')}</p>
            <div className="h-72 rounded-md overflow-hidden border border-gray-200">
              <MapContainer center={initialCenter} zoom={initialZoom} className="h-full w-full">
                <MapCenterController center={initialCenter} zoom={initialZoom} />
                <LocateControl title={t('map.locate.title')} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
              labelAdornment={
                <InfoTooltip
                  ariaLabel={t('tooltips.area.statusAria')}
                  content={<p>{t('tooltips.area.statusSummary')}</p>}
                />
              }
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
          <Select id="biome" label={t('area.form.biome')} labelAdornment={<InfoTooltip ariaLabel={t('tooltips.area.biomeAria')} content={<p>{t('tooltips.area.biome')}</p>} />} options={biomeOptions} value={formValues.biome} onChange={(e) => update('biome', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="tco2e_tree"
              type="number"
              step="any"
              label={t('area.form.tCO2ePerTree')}
              labelAdornment={
                <InfoTooltip
                  ariaLabel={t('tooltips.shared.tco2ePerTreeAria')}
                  content={<p>{t('tooltips.shared.tco2ePerTree')}</p>}
                />
              }
              value={formValues.t_co2e_per_tree_per_year}
              onChange={(e) => update('t_co2e_per_tree_per_year', e.target.value)}
            />
            <Input id="price_tree" type="number" step="any" label={t('area.form.pricePerTree')} labelAdornment={<InfoTooltip ariaLabel={t('tooltips.area.pricePerTreeAria')} content={<p>{t('tooltips.area.pricePerTree')}</p>} />} value={formValues.price_per_tree} onChange={(e) => update('price_per_tree', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Input
              id="default_horizon_years"
              type="number"
              step="1"
              label={t('area.form.defaultHorizonYears')}
              labelAdornment={
                <InfoTooltip
                  ariaLabel={t('tooltips.area.defaultHorizonYearsAria')}
                  content={<p>{t('tooltips.area.defaultHorizonYears')}</p>}
                />
              }
              value={formValues.default_horizon_years}
              onChange={(e) => update('default_horizon_years', e.target.value)}
            />
          </div>
        </CardContent></Card>
        <div className="flex gap-3 mt-4">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? t('common.save') : t('area.form.create')}</Button>
        </div>
      </form>
    </div>
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

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}
