import { routing } from '@/i18n/routing';

export function getLocalizedPath(pathTemplate: string, locale: string, params?: Record<string, string>) {
    let path = pathTemplate;
    const mapping = routing.pathnames[pathTemplate as keyof typeof routing.pathnames];

    if (mapping && typeof mapping === 'object' && locale in mapping) {
        path = (mapping as any)[locale];
    } else if (typeof mapping === 'string') {
        path = mapping;
    }

    // Replace params
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`[${key}]`, value);
        });
    }

    // Handle root
    if (path === '/') return `/${locale}`;

    return `/${locale}${path}`;
}

export function generateAlternates(pathTemplate: string, currentLocale: string, params?: Record<string, string>) {
    const canonical = getLocalizedPath(pathTemplate, currentLocale, params);

    const languages = routing.locales.reduce((acc, loc) => {
        acc[loc] = getLocalizedPath(pathTemplate, loc, params);
        return acc;
    }, {} as Record<string, string>);

    return {
        canonical,
        languages
    };
}

import type { Metadata } from 'next';

type MetadataProps = {
    title: string;
    description: string;
    image?: string;
    path: string;
    locale: string;
    params?: Record<string, string>;
    type?: 'website' | 'article';
};

export function constructMetadata({ title, description, image, path, locale, params, type = 'website' }: MetadataProps): Metadata {
    const alternates = generateAlternates(path, locale, params);

    // Default Social Image if none provided
    const socialImage = image || '/images/og-default.jpg';

    return {
        title,
        description,
        alternates,
        openGraph: {
            title,
            description,
            url: alternates.canonical,
            siteName: 'Express Renovation Mallorca',
            images: [
                {
                    url: socialImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            locale: locale === 'en' ? 'en_US' : locale === 'es' ? 'es_ES' : locale,
            type,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [socialImage],
            creator: '@ER_Mallorca', // Update with actual handle if available
        },
    };
}
