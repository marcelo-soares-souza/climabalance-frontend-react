import type { TFunction } from 'i18next';
import type { Area } from '@/types/area';

export interface AreaFilterValues {
  search?: string;
  city?: string;
  state?: string;
  status?: string;
  biome?: string;
}

function normalizeFilterValue(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

export function filterAreas(areas: Area[] | undefined, filters: AreaFilterValues): Area[] {
  if (!areas) return [];

  const normalizedSearch = normalizeFilterValue(filters.search);
  const normalizedCity = normalizeFilterValue(filters.city);
  const normalizedState = normalizeFilterValue(filters.state);
  const normalizedStatus = normalizeFilterValue(filters.status);
  const normalizedBiome = normalizeFilterValue(filters.biome);

  return areas.filter((area) => {
    const name = area.name.toLowerCase();
    const city = normalizeFilterValue(area.city ?? '');
    const state = normalizeFilterValue(area.state ?? '');
    const biome = normalizeFilterValue(area.biome ?? '');
    const status = normalizeFilterValue(area.status);

    const matchesSearch = !normalizedSearch
      || name.includes(normalizedSearch)
      || city.includes(normalizedSearch)
      || state.includes(normalizedSearch)
      || biome.includes(normalizedSearch);
    const matchesCity = !normalizedCity || city.includes(normalizedCity);
    const matchesState = !normalizedState || state.includes(normalizedState);
    const matchesStatus = !normalizedStatus || status === normalizedStatus;
    const matchesBiome = !normalizedBiome || biome === normalizedBiome;

    return matchesSearch && matchesCity && matchesState && matchesStatus && matchesBiome;
  });
}

export function getBiomeOptions(t: TFunction, options?: { includeAll?: boolean }) {
  const entries = [
    { value: 'amazonia', label: t('map.biomes.amazonia') },
    { value: 'cerrado', label: t('map.biomes.cerrado') },
    { value: 'mata_atlantica', label: t('map.biomes.mataAtlantica') },
    { value: 'caatinga', label: t('map.biomes.caatinga') },
    { value: 'pampa', label: t('map.biomes.pampa') },
    { value: 'pantanal', label: t('map.biomes.pantanal') },
  ];

  if (options?.includeAll) {
    return [{ value: '', label: t('map.allBiomes') }, ...entries];
  }

  return entries;
}

export function getAreaStatusOptions(
  t: TFunction,
  options?: { includeAll?: boolean; includeRejected?: boolean },
) {
  const entries = [
    { value: 'draft', label: t('common.status.draft') },
    { value: 'pending_audit', label: t('common.status.pending_audit') },
    { value: 'approved', label: t('common.status.approved') },
    { value: 'active', label: t('common.status.active') },
    ...(options?.includeRejected ? [{ value: 'rejected', label: t('common.status.rejected') }] : []),
    { value: 'suspended', label: t('common.status.suspended') },
  ];

  if (options?.includeAll) {
    return [{ value: '', label: t('common.allStatuses') }, ...entries];
  }

  return entries;
}
