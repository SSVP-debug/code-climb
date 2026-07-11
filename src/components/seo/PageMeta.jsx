/**
 * PageMeta — reusable SEO head component.
 *
 * Wraps react-helmet-async's Helmet to set:
 *   - <title>
 *   - meta description
 *   - Open Graph tags (og:title, og:description, og:type, og:url)
 *   - Twitter card tags
 *
 * Usage:
 *   <PageMeta
 *     title="Two Sum · Code Club"
 *     description="Solve Two Sum with Python, JavaScript, Java or C++. Hints and AI coaching included."
 *     path="/problems/two-sum"
 *   />
 *
 * Requirements:
 *   - <HelmetProvider> must wrap the app in main.jsx (added by this commit)
 */

import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../config/site.js";

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`; // add this asset later

export default function PageMeta({
  title = "Code Club — DSA Practice for Placement Season",
  description = "Solve curated DSA problems in themed universes. Track streaks, earn XP, get AI coaching. Built for Indian engineering students preparing for placement season.",
  path = "",
  image = DEFAULT_OG_IMAGE,
  type = "website",
}) {
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:url"         content={url} />
      <meta property="og:title"       content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={image} />
      <meta property="og:site_name"   content="Code Club" />

      {/* Twitter */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />

      {/* Robots — index all pages by default */}
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
}