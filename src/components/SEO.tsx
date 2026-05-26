import { Helmet } from "react-helmet-async";

const BASE_URL = import.meta.env.VITE_SITE_URL || "https://climabalance.org";
const DEFAULT_OG_IMAGE = `${BASE_URL}/logo.png`;
const SITE_NAME = "ClimaBalance";

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
  const fullTitle = `${title} | ${SITE_NAME}`;
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const resolvedOgImage = ogImage || DEFAULT_OG_IMAGE;
  const robots = [];
  if (noIndex) robots.push("noindex");
  if (noFollow) robots.push("nofollow");
  const robotsContent = robots.length > 0 ? robots.join(", ") : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {robotsContent && <meta name="robots" content={robotsContent} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={resolvedOgTitle} />
      {resolvedOgDescription && (
        <meta property="og:description" content={resolvedOgDescription} />
      )}
      <meta property="og:image" content={resolvedOgImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      {resolvedOgDescription && (
        <meta name="twitter:description" content={resolvedOgDescription} />
      )}
      <meta name="twitter:image" content={resolvedOgImage} />
    </Helmet>
  );
}
