import type { Area } from '@/types/area';

export interface AreaFilterValues {
  search?: string;
  country?: string;
  biome?: string;
}

function normalizeFilterValue(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

export function filterAreas(areas: Area[] | undefined, filters: AreaFilterValues): Area[] {
  if (!areas) return [];

  const normalizedSearch = normalizeFilterValue(filters.search);
  const normalizedCountry = normalizeFilterValue(filters.country);
  const normalizedBiome = normalizeFilterValue(filters.biome);

  return areas.filter((area) => {
    const name = area.name.toLowerCase();
    const country = normalizeFilterValue(area.countryCode ?? '');
    const biome = normalizeFilterValue(area.biome ?? '');

    const matchesSearch = !normalizedSearch
      || name.includes(normalizedSearch)
      || country.includes(normalizedSearch)
      || biome.includes(normalizedSearch);
    const matchesCountry = !normalizedCountry || country === normalizedCountry;
    const matchesBiome = !normalizedBiome || biome === normalizedBiome;

    return matchesSearch && matchesCountry && matchesBiome;
  });
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
