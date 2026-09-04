import React from "react";
import { siteConfig } from "@/config/site";

/**
 * Server-only JSON-LD injection.
 *
 * This component emits structured data for seorchable.ir's OWN pages. It is unrelated to
 * `src/lib/audit-engine/*` and `src/services/technical-seo-analyzer.ts`, which analyse
 * OTHER sites' structured data as part of the product.
 *
 * Usage (server components only - do not import from a "use client" module):
 *   <JsonLd data={organizationSchema()} />
 *   <JsonLd data={[softwareApplicationSchema(), productSchema(locale)]} />
 */
type JsonLdValue = Record<string, unknown>;

interface JsonLdProps {
  data: JsonLdValue | JsonLdValue[];
  /** Optional id, useful when several graphs render on one page. */
  id?: string;
}

export function JsonLd({ data, id }: JsonLdProps) {
  const payload = Array.isArray(data)
    ? { "@context": "https://schema.org", "@graph": data }
    : { "@context": "https://schema.org", ...data };

  return (
    <script
      id={id}
      type="application/ld+json"
      // JSON.stringify output is escaped for the `</script>` sequence to prevent breakout.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function organizationSchema(): JsonLdValue {
  return {
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/icon.svg`,
    },
    description: siteConfig.description,
    sameAs: [siteConfig.links.github],
  };
}

export function websiteSchema(locale: string): JsonLdValue {
  return {
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: `${siteConfig.url}/${locale}`,
    name: siteConfig.name,
    inLanguage: locale === "fa" ? "fa-IR" : "en-US",
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}

export function softwareApplicationSchema(): JsonLdValue {
  return {
    "@type": "SoftwareApplication",
    "@id": `${siteConfig.url}/#software`,
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "SEO / AEO / GEO Intelligence",
    operatingSystem: "Web",
    url: siteConfig.url,
    description: siteConfig.description,
    provider: { "@id": `${siteConfig.url}/#organization` },
  };
}

export interface PricingOffer {
  name: string;
  price: string;
  priceCurrency: string;
  description?: string;
}

/**
 * Product/Offer schema for the pricing page.
 * Offers MUST be derived from the same source of truth the pricing UI renders.
 * Never hard-code prices here.
 */
export function pricingSchema(offers: PricingOffer[], locale: string): JsonLdValue {
  return {
    "@type": "Product",
    "@id": `${siteConfig.url}/${locale}/pricing#product`,
    name: siteConfig.name,
    description: siteConfig.description,
    brand: { "@id": `${siteConfig.url}/#organization` },
    offers: offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      description: offer.description,
      url: `${siteConfig.url}/${locale}/pricing`,
      availability: "https://schema.org/InStock",
    })),
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function faqSchema(entries: FaqEntry[]): JsonLdValue {
  return {
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export function breadcrumbSchema(entries: BreadcrumbEntry[], locale: string): JsonLdValue {
  return {
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: `${siteConfig.url}/${locale}${entry.path}`,
    })),
  };
}
