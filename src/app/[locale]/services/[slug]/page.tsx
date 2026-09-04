import React, { use } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { servicesData } from "@/data/services";
import { ServiceHero } from "@/components/marketing/services/ServiceHero";
import { ServiceCapabilities } from "@/components/marketing/services/ServiceCapabilities";
import { ServiceWorkflow } from "@/components/marketing/services/ServiceWorkflow";
import { ServiceInsights } from "@/components/marketing/services/ServiceInsights";
import { ServiceCTA } from "@/components/marketing/services/ServiceCTA";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { siteConfig } from "@/config/site";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale, slug } = resolvedParams;
  const data = servicesData[slug];
  const isFa = locale === "fa";

  if (!data) {
    return {
      title: "Service Not Found",
    };
  }

  const title = isFa ? data.metadataTitle.fa : data.metadataTitle.en;
  const description = isFa ? data.metadataDescription.fa : data.metadataDescription.en;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/${locale}/services/${slug}`,
      siteName: siteConfig.name,
      type: "website",
    },
    alternates: {
      canonical: `${siteConfig.url}/${locale}/services/${slug}`,
    }
  };
}

export default function ServicePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { locale, slug } = resolvedParams;
  const isFa = locale === "fa";
  const data = servicesData[slug];

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      <AppSidebar />
      <Header />

      <main className="flex-1">
        <ServiceHero data={data.hero} isFa={isFa} />
        <ServiceCapabilities capabilities={data.capabilities} isFa={isFa} />
        <ServiceWorkflow workflow={data.workflow} isFa={isFa} />
        <ServiceInsights insights={data.insights} isFa={isFa} />
        <ServiceCTA data={data} isFa={isFa} />
      </main>

      <LandingFooter />
    </div>
  );
}
