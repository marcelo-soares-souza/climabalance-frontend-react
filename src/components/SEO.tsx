import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_SITE_URL || "https://climabalance.org";
const DEFAULT_OG_IMAGE = `${BASE_URL}/logo.png`;
const SITE_NAME = "ClimaBalance";
const NON_INDEXABLE_PATTERNS = [
  /^\/access-denied$/,
  /^\/admin(?:\/|$)/,
  /^\/audit(?:\/|$)/,
  /^\/compensation(?:\/|$)/,
  /^\/confirm-email$/,
  /^\/contact$/,
  /^\/demo\/embed-calculator$/,
  /^\/embed(?:\/|$)/,
  /^\/footprint(?:\/|$)/,
  /^\/how-to-use\/stripe-platform-setup$/,
  /^\/how-to-use\/stripe-setup$/,
  /^\/login$/,
  /^\/onboarding$/,
  /^\/password-reset(?:\/|$)/,
  /^\/payment\/pix\/[^/]+$/,
  /^\/privacy$/,
  /^\/profile(?:\/|$)/,
  /^\/register$/,
  /^\/areas$/,
  /^\/areas\/available$/,
  /^\/areas\/create$/,
  /^\/areas\/edit\/[^/]+$/,
  /^\/areas\/[^/]+\/plant-trees$/,
  /^\/users\/[^/]+\/certificates$/,
  /^\/users\/[^/]+\/impact(?:\/|$)/,
  /^\/users\/[^/]+\/profile(?:\/edit)?$/,
  /^\/users\/[^/]+\/sessions$/,
];

interface SEOProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

export function SEO({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  canonicalUrl,
  noIndex,
  noFollow,
}: SEOProps) {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const fullTitle = `${title} | ${SITE_NAME}`;
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const resolvedOgImage = ogImage || DEFAULT_OG_IMAGE;
  const inferredNoIndex = NON_INDEXABLE_PATTERNS.some((pattern) =>
    pattern.test(pathname),
  );
  const resolvedNoIndex = noIndex ?? inferredNoIndex;
  const resolvedNoFollow = noFollow ?? resolvedNoIndex;
  const resolvedCanonicalUrl =
    canonicalUrl || (resolvedNoIndex ? undefined : `${BASE_URL}${pathname}`);
  const resolvedLocale = i18n.language.replace("-", "_");
  const robots = [];
  if (resolvedNoIndex) robots.push("noindex");
  if (resolvedNoFollow) robots.push("nofollow");
  const robotsContent = robots.length > 0 ? robots.join(", ") : undefined;

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {robotsContent && <meta name="robots" content={robotsContent} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={resolvedLocale} />
      <meta property="og:title" content={resolvedOgTitle} />
      {resolvedOgDescription && (
        <meta property="og:description" content={resolvedOgDescription} />
      )}
      <meta property="og:image" content={resolvedOgImage} />
      {resolvedCanonicalUrl && (
        <meta property="og:url" content={resolvedCanonicalUrl} />
      )}
      {resolvedCanonicalUrl && (
        <link rel="canonical" href={resolvedCanonicalUrl} />
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      {resolvedOgDescription && (
        <meta name="twitter:description" content={resolvedOgDescription} />
      )}
      <meta name="twitter:image" content={resolvedOgImage} />
    </Helmet>
  );
}
