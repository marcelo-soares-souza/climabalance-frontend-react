type RefEntity = {
  id?: string | null;
  slug?: string | null;
};

function sanitizeRef(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getPublicRef(entity?: RefEntity | null): string {
  return sanitizeRef(entity?.slug) ?? sanitizeRef(entity?.id) ?? "";
}

export function getAreaPublicRef(area?: RefEntity | null): string {
  return getPublicRef(area);
}

export function getUserPublicRef(user?: RefEntity | null): string {
  return getPublicRef(user);
}

export function matchesPublicRef(
  ref: string | null | undefined,
  entity?: RefEntity | null,
): boolean {
  const normalizedRef = sanitizeRef(ref);
  if (!normalizedRef) return false;
  return (
    normalizedRef === sanitizeRef(entity?.slug) ||
    normalizedRef === sanitizeRef(entity?.id)
  );
}

export function getUserProfilePath(user?: RefEntity | null): string {
  const ref = getUserPublicRef(user);
  return ref ? `/users/${ref}/profile` : "/profile";
}

export function getUserProfileEditPath(user?: RefEntity | null): string {
  const ref = getUserPublicRef(user);
  return ref ? `/users/${ref}/profile/edit` : "/profile/edit";
}

export function getUserCertificatesPath(user?: RefEntity | null): string {
  const ref = getUserPublicRef(user);
  return ref ? `/users/${ref}/certificates` : "/profile/certificates";
}

export function getUserSessionsPath(user?: RefEntity | null): string {
  const ref = getUserPublicRef(user);
  return ref ? `/users/${ref}/sessions` : "/profile/sessions";
}

export function getUserImpactPath(user?: RefEntity | null): string {
  const ref = getUserPublicRef(user);
  return ref ? `/users/${ref}/impact` : "/footprint/history";
}

export function getUserNewCalculationPath(user?: RefEntity | null): string {
  const ref = getUserPublicRef(user);
  return ref
    ? `/users/${ref}/impact/calculations/new`
    : "/footprint/calculator";
}

export function getUserCalculationPath(
  calculationId: string,
  user?: RefEntity | null,
): string {
  const ref = getUserPublicRef(user);
  return ref
    ? `/users/${ref}/impact/calculations/${calculationId}`
    : `/footprint/calculation/${calculationId}`;
}

export function getUserCalculationEditPath(
  calculationId: string,
  user?: RefEntity | null,
): string {
  const ref = getUserPublicRef(user);
  return ref
    ? `/users/${ref}/impact/calculations/${calculationId}/edit`
    : `/footprint/calculator?draftId=${encodeURIComponent(calculationId)}`;
}

export function getAreaDetailPath(area?: RefEntity | null): string {
  const ref = getAreaPublicRef(area);
  return ref ? `/areas/${ref}` : "/areas";
}

export function getAreaEditPath(area?: RefEntity | null): string {
  const ref = getAreaPublicRef(area);
  return ref ? `/areas/edit/${ref}` : "/areas";
}

export function getAreaPlantTreesPath(area?: RefEntity | null): string {
  const ref = getAreaPublicRef(area);
  return ref ? `/areas/${ref}/plant-trees` : "/areas";
}

export function getAreaAuditPath(area?: RefEntity | null): string {
  const ref = getAreaPublicRef(area);
  return ref ? `/audit/area/${ref}` : "/audit/pending-areas";
}
