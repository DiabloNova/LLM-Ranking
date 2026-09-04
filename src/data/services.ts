import { ServicePageData } from "@/types/services";

const slugs = [
  "seo-audit",
  "ai-visibility-audit",
  "ai-citation-monitoring",
  "ai-brand-intelligence",
  "competitive-intelligence",
  "content-intelligence",
  "technical-seo",
  "knowledge-graph",
  "rag-intelligence",
];

const generatePlaceholderData = (slug: string): ServicePageData => {
  return {
    slug,
    hero: {
      title: { en: `Hero Title for ${slug}`, fa: `عنوان اصلی برای ${slug}` },
      subtitle: { en: `Hero Subtitle for ${slug}`, fa: `زیرعنوان برای ${slug}` },
      ctaText: { en: `Get Started`, fa: `شروع کنید` },
      visualPlaceholder: `Visual Placeholder for ${slug}`
    },
    capabilities: [
      { id: "cap1", title: { en: `Cap 1 for ${slug}`, fa: `قابلیت ۱ برای ${slug}` }, description: { en: `Desc 1`, fa: `توضیح ۱` }, iconName: "Search" },
      { id: "cap2", title: { en: `Cap 2 for ${slug}`, fa: `قابلیت ۲ برای ${slug}` }, description: { en: `Desc 2`, fa: `توضیح ۲` }, iconName: "Brain" },
      { id: "cap3", title: { en: `Cap 3 for ${slug}`, fa: `قابلیت ۳ برای ${slug}` }, description: { en: `Desc 3`, fa: `توضیح ۳` }, iconName: "ShieldCheck" },
    ],
    workflow: [
      { id: "step1", title: { en: `Step 1`, fa: `مرحله ۱` }, description: { en: `Step 1 Desc`, fa: `توضیح مرحله ۱` }, order: 1 },
      { id: "step2", title: { en: `Step 2`, fa: `مرحله ۲` }, description: { en: `Step 2 Desc`, fa: `توضیح مرحله ۲` }, order: 2 },
      { id: "step3", title: { en: `Step 3`, fa: `مرحله ۳` }, description: { en: `Step 3 Desc`, fa: `توضیح مرحله ۳` }, order: 3 },
    ],
    insights: [
      { id: "insight1", title: { en: `Insight 1`, fa: `بینش ۱` }, description: { en: `Insight 1 Desc`, fa: `توضیح بینش ۱` }, metric: { en: `+10%`, fa: `+۱۰٪` } },
      { id: "insight2", title: { en: `Insight 2`, fa: `بینش ۲` }, description: { en: `Insight 2 Desc`, fa: `توضیح بینش ۲` }, metric: { en: `+20%`, fa: `+۲۰٪` } },
    ],
    ctaTitle: { en: `Ready to start with ${slug}?`, fa: `آماده شروع با ${slug} هستید؟` },
    ctaSubtitle: { en: `Join us today.`, fa: `امروز به ما بپیوندید.` },
    ctaButtonText: { en: `Start Now`, fa: `اکنون شروع کنید` },
    metadataTitle: { en: `${slug} Service`, fa: `خدمات ${slug}` },
    metadataDescription: { en: `Description for ${slug} service`, fa: `توضیحات برای خدمات ${slug}` },
  };
};

export const servicesData: Record<string, ServicePageData> = slugs.reduce((acc, slug) => {
  acc[slug] = generatePlaceholderData(slug);
  return acc;
}, {} as Record<string, ServicePageData>);
