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

    // Tells search engines which version to serve when no declared locale
    // matches the user. Without it they pick one themselves, which is how
    // multilingual sites end up indexing the wrong language for a market.
    languages['x-default'] = getLocalizedPath(pathTemplate, routing.defaultLocale, params);

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
    /** Social-specific copy. Falls back to `title`/`description` when omitted. */
    ogTitle?: string;
    ogDescription?: string;
};

/** Open Graph expects `language_TERRITORY`, not a bare language code. */
const OG_LOCALES: Record<string, string> = {
    es: 'es_ES',
    en: 'en_US',
    de: 'de_DE',
    nl: 'nl_NL',
    ca: 'ca_ES',
};

/** Strips markup so display copy can never leak into a <title> or meta tag. */
function toPlainText(value: string): string {
    return value
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function constructMetadata({ title, description, image, path, locale, params, type = 'website', ogTitle, ogDescription }: MetadataProps): Metadata {
    const alternates = generateAlternates(path, locale, params);

    // Default Social Image if none provided
    const socialImage = image || '/images/og-default.jpg';

    // Headings in the dictionaries carry layout markup (<br/>, <span>) for the
    // hero. Anything reaching a meta tag must be plain text.
    const cleanTitle = toPlainText(title);
    const cleanDescription = toPlainText(description);

    return {
        title: cleanTitle,
        description: cleanDescription,
        alternates,
        openGraph: {
            title: ogTitle ? toPlainText(ogTitle) : cleanTitle,
            description: ogDescription ? toPlainText(ogDescription) : cleanDescription,
            url: alternates.canonical,
            siteName: 'Express Renovation Mallorca',
            images: [
                {
                    url: socialImage,
                    width: 1200,
                    height: 630,
                    alt: cleanTitle,
                },
            ],
            locale: OG_LOCALES[locale] ?? locale,
            type,
        },
        twitter: {
            card: 'summary_large_image',
            title: cleanTitle,
            description: cleanDescription,
            images: [socialImage],
            creator: '@ER_Mallorca', // Update with actual handle if available
        },
    };
}
