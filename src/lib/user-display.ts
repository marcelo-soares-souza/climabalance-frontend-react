import type { TFunction } from 'i18next';

const PRIMARY_ACCOUNT_TYPES = ['individual', 'producer', 'legal_entity'] as const;

export function getNormalizedRoles(roles: string[] | undefined): string[] {
  return Array.from(new Set(roles ?? []));
}

export function getRoleLabel(role: string, t: TFunction): string {
  return t(`common.roles.${role}`, role);
}

export function getPrimaryAccountRole(roles: string[] | undefined): string | null {
  const normalizedRoles = getNormalizedRoles(roles);
  return PRIMARY_ACCOUNT_TYPES.find((role) => normalizedRoles.includes(role)) ?? null;
}

export function getPrimaryAccountType(roles: string[] | undefined, t: TFunction): string {
  const primaryRole = getPrimaryAccountRole(roles);
  return primaryRole ? getRoleLabel(primaryRole, t) : '-';
}

export function getRoleLabels(roles: string[] | undefined, t: TFunction): string[] {
  return getNormalizedRoles(roles).map((role) => getRoleLabel(role, t));
}

export function getAdditionalRoleLabels(roles: string[] | undefined, t: TFunction): string[] {
  const primaryRole = getPrimaryAccountRole(roles);
  return getNormalizedRoles(roles)
    .filter((role) => role !== primaryRole)
    .map((role) => getRoleLabel(role, t));
}
