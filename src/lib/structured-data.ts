import type {
    Article,
    BreadcrumbList,
    FAQPage,
    HomeAndConstructionBusiness,
    Service,
    Thing,
    WithContext,
} from 'schema-dts';
import { CONTACT_INFO, SITE_NAME, SITE_URL } from '@/lib/contact-info';
import { locations } from '@/lib/locations';
import { getLocalizedPath } from '@/i18n/seo-utils';

/** Absolute URL for a localized route template. Schema.org requires absolute URLs. */
export function absoluteUrl(
    pathTemplate: string,
    locale: string,
    params?: Record<string, string>
): string {
    return `${SITE_URL}${getLocalizedPath(pathTemplate, locale, params)}`;
}

/** Stable @id for the business node, so other nodes can reference it instead of repeating it. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * The company itself. Emitted once per page from the public layout.
 *
 * `HomeAndConstructionBusiness` is the schema.org type for a contractor and is
 * more specific than plain `LocalBusiness`, which matters for local search.
 */
export function buildLocalBusiness(locale: string): WithContext<HomeAndConstructionBusiness> {
    const { address } = CONTACT_INFO;

    return {
        '@context': 'https://schema.org',
        '@type': 'HomeAndConstructionBusiness',
        '@id': ORGANIZATION_ID,
        name: SITE_NAME,
        url: absoluteUrl('/', locale),
        image: `${SITE_URL}/images/og-default.jpg`,
        logo: `${SITE_URL}/images/logo-express-renovation.webp`,
        telephone: CONTACT_INFO.phoneHref.replace('tel:', ''),
        email: CONTACT_INFO.email,
        priceRange: '€€€',
        address: {
            '@type': 'PostalAddress',
            streetAddress: address.street,
            postalCode: address.postalCode,
            addressLocality: address.locality,
            addressRegion: address.region,
            addressCountry: address.country,
        },
        geo: {
            '@type': 'GeoCoordinates',
            // Matches the embedded map on the contact page.
            latitude: 39.530111,
            longitude: 2.503278,
        },
        areaServed: locations.map((name) => ({ '@type': 'Place' as const, name })),
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            telephone: CONTACT_INFO.phoneHref.replace('tel:', ''),
            email: CONTACT_INFO.email,
            availableLanguage: ['es', 'en', 'de', 'nl', 'ca'],
        },
    };
}

/** A single service or subservice offering. */
export function buildService({
    name,
    description,
    url,
    image,
    categoryName,
    priceRange,
}: {
    name: string;
    description: string;
    url: string;
    image?: string;
    categoryName?: string;
    /** Free-text market range, e.g. "600 - 1.100 €/m²". */
    priceRange?: string;
}): WithContext<Service> {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name,
        description,
        url,
        ...(image ? { image } : {}),
        ...(categoryName ? { serviceType: categoryName } : {}),
        ...(priceRange
            ? {
                  offers: {
                      '@type': 'Offer' as const,
                      priceCurrency: 'EUR',
                      description: priceRange,
                      url,
                      availability: 'https://schema.org/InStock',
                  },
              }
            : {}),
        provider: { '@id': ORGANIZATION_ID },
        areaServed: {
            '@type': 'AdministrativeArea',
            name: 'Mallorca, Illes Balears, España',
        },
    };
}

/** Mirrors the breadcrumb the user already sees, so it can appear in the SERP. */
export function buildBreadcrumbs(
    items: { name: string; url: string }[]
): WithContext<BreadcrumbList> {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Question/answer pairs.
 *
 * Only emit this when the questions are genuinely specific to the page — the
 * same FAQPage repeated across many URLs is treated as duplicate markup.
 */
export function buildFaqPage(
    items: { question: string; answer: string }[]
): WithContext<FAQPage> | null {
    if (!items?.length) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    };
}

/**
 * The graph for the home page: the site itself, the service catalogue and the
 * home FAQ.
 *
 * The FAQ here is unique to the home page (a different set from the per-service
 * one), so emitting `FAQPage` is safe.
 */
export function buildHomeGraph({
    locale,
    siteDescription,
    services,
    faqItems,
}: {
    locale: string;
    siteDescription: string;
    services: { name: string; description: string; url: string }[];
    faqItems?: { question: string; answer: string }[];
}): WithContext<Thing>[] {
    const graph: WithContext<Thing>[] = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            name: SITE_NAME,
            description: siteDescription,
            url: absoluteUrl('/', locale),
            inLanguage: locale,
            publisher: { '@id': ORGANIZATION_ID },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `Servicios de ${SITE_NAME}`,
            itemListElement: services.map((service, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: service.name,
                description: service.description,
                url: service.url,
            })),
        },
    ];

    const faq = buildFaqPage(faqItems ?? []);
    if (faq) graph.push(faq);

    return graph;
}

/** A blog post. */
export function buildArticle({
    title,
    description,
    url,
    image,
    datePublished,
    section,
}: {
    title: string;
    description: string;
    url: string;
    image: string;
    datePublished: string;
    section?: string;
}): WithContext<Article> {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        image,
        datePublished,
        dateModified: datePublished,
        ...(section ? { articleSection: section } : {}),
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        author: { '@id': ORGANIZATION_ID },
        publisher: { '@id': ORGANIZATION_ID },
    };
}
