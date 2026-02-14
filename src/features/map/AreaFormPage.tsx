import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { areasService } from '@/services/areas';
import { queryClient } from '@/config/query-client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { ApiError } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';

export function AreaFormPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = !!areaId;

  const [form, setForm] = useState<Partial<{
    name: string;
    description: string;
    latitude: string;
    longitude: string;
    biome: string;
    state: string;
    city: string;
    total_capacity_t_co2e: string;
    t_co2e_per_tree_per_year: string;
    price_per_tree: string;
    price_per_t_co2e: string;
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
    biome: form.biome ?? existing?.biome ?? '',
    state: form.state ?? existing?.state ?? '',
    city: form.city ?? existing?.city ?? '',
    total_capacity_t_co2e: form.total_capacity_t_co2e ?? (existing?.totalCapacityTCO2e ? String(existing.totalCapacityTCO2e) : ''),
    t_co2e_per_tree_per_year: form.t_co2e_per_tree_per_year ?? (existing?.tCO2ePerTreePerYear ? String(existing.tCO2ePerTreePerYear) : ''),
    price_per_tree: form.price_per_tree ?? (existing?.pricePerTree ? String(existing.pricePerTree) : ''),
    price_per_t_co2e: form.price_per_t_co2e ?? (existing?.pricePerTCO2e ? String(existing.pricePerTCO2e) : ''),
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

  const mutation = useMutation({
    mutationFn: () => {
      const data = {
        name: formValues.name,
        description: formValues.description || undefined,
        latitude: parseFloat(formValues.latitude),
        longitude: parseFloat(formValues.longitude),
        biome: formValues.biome || undefined,
        state: formValues.state || undefined,
        city: formValues.city || undefined,
        total_capacity_t_co2e: parseFloat(formValues.total_capacity_t_co2e) || undefined,
        t_co2e_per_tree_per_year: parseFloat(formValues.t_co2e_per_tree_per_year) || undefined,
        price_per_tree: parseFloat(formValues.price_per_tree) || undefined,
        price_per_t_co2e: parseFloat(formValues.price_per_t_co2e) || undefined,
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
      | 'biome'
      | 'state'
      | 'city'
      | 'total_capacity_t_co2e'
      | 't_co2e_per_tree_per_year'
      | 'price_per_tree'
      | 'price_per_t_co2e',
    value: string
  ) => setForm((prev) => ({ ...prev, [field]: value }));

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
            <Input id="latitude" type="number" step="any" label={t('area.form.latitude')} value={formValues.latitude} onChange={(e) => update('latitude', e.target.value)} required />
            <Input id="longitude" type="number" step="any" label={t('area.form.longitude')} value={formValues.longitude} onChange={(e) => update('longitude', e.target.value)} required />
          </div>
          <Select id="biome" label={t('area.form.biome')} options={biomeOptions} value={formValues.biome} onChange={(e) => update('biome', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="state" label={t('area.form.state')} value={formValues.state} onChange={(e) => update('state', e.target.value)} />
            <Input id="city" label={t('area.form.city')} value={formValues.city} onChange={(e) => update('city', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="capacity" type="number" step="any" label={t('area.form.totalCapacity')} value={formValues.total_capacity_t_co2e} onChange={(e) => update('total_capacity_t_co2e', e.target.value)} />
            <Input id="tco2e_tree" type="number" step="any" label={t('area.form.tCO2ePerTree')} value={formValues.t_co2e_per_tree_per_year} onChange={(e) => update('t_co2e_per_tree_per_year', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="price_tree" type="number" step="any" label={t('area.form.pricePerTree')} value={formValues.price_per_tree} onChange={(e) => update('price_per_tree', e.target.value)} />
            <Input id="price_tco2e" type="number" step="any" label={t('area.form.pricePerTCO2e')} value={formValues.price_per_t_co2e} onChange={(e) => update('price_per_t_co2e', e.target.value)} />
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
