import type { TFunction } from 'i18next';

const PRIMARY_ACCOUNT_TYPES = ['individual', 'producer', 'legal_entity'] as const;

export function getRoleLabel(role: string, t: TFunction): string {
  return t(`common.roles.${role}`, role);
}

export function getPrimaryAccountType(roles: string[] | undefined, t: TFunction): string {
  const primaryRole = PRIMARY_ACCOUNT_TYPES.find((role) => roles?.includes(role));
  return primaryRole ? getRoleLabel(primaryRole, t) : '-';
}

export function getRoleLabels(roles: string[] | undefined, t: TFunction): string[] {
  return (roles ?? []).map((role) => getRoleLabel(role, t));
}
