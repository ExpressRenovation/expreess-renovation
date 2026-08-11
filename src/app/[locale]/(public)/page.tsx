import { getDictionary } from '@/lib/dictionaries';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { VisionSection } from '@/components/home/vision-section';
import { ServicesGrid } from '@/components/home/services-grid';
import { TransformationsSection } from '@/components/home/transformations-section';
import { ProcessSteps } from '@/components/home/process-steps';
import { LocationsGrid } from '@/components/home/locations-grid';
import { FaqSection } from '@/components/home/faq-section';
import { CtaSection } from '@/components/home/cta-section';
import { HeroSection } from '@/components/home/hero-section';



import { constructMetadata } from '@/i18n/seo-utils';
import { getTranslations } from 'next-intl/server';
import { JsonLd } from '@/components/seo/json-ld';
import { absoluteUrl, buildHomeGraph } from '@/lib/structured-data';
import { services } from '@/lib/services';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Read from the `metadata` namespace, not from `home.hero`: the hero heading
  // carries layout markup (<br/>, <span>) that was being served verbatim as the
  // page <title> and og:title.
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    ...constructMetadata({
      title: t('title'),
      description: t('description'),
      ogTitle: t('ogTitle'),
      ogDescription: t('ogDescription'),
      path: '/',
      locale,
    }),
    keywords: t('keywords'),
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale as any); // Cast because 'nl' might not be fully inferred yet in some IDEs or strict check

  const serviceList = services.map((service) => ({
    name: dict.services?.[service.id]?.title ?? service.id,
    description: dict.services?.[service.id]?.shortDescription ?? '',
    url: absoluteUrl('/services/[category]', locale, { category: service.id }),
  }));

  return (
    <>
      <JsonLd
        data={buildHomeGraph({
          locale,
          siteDescription: dict.home?.hero?.subtitle ?? '',
          services: serviceList,
          faqItems: dict.home?.faq?.items,
        })}
      />

      {/* Hero Section */}
      <HeroSection t={dict.home.hero} />

      <VisionSection t={dict.home.vision} />

      <ServicesGrid t={dict.home.servicesGrid} />

      <TransformationsSection t={dict.home.transformations} />

      <ProcessSteps t={dict.home.processSteps} />

      <LocationsGrid t={dict.home.locations} />

      <FaqSection t={dict.home.faq} />

      <CtaSection t={dict.home.cta} />

    </>
  );
}
