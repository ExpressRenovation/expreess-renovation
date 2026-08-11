/**
 * Single source of truth for the company's public contact details.
 * Anything user-facing (pages, emails, schema.org markup) must read from here
 * so a change lands everywhere at once.
 */

/**
 * Canonical origin of the public site — no trailing slash.
 *
 * Must match the URL the site actually serves on, including `www`: canonical
 * tags, hreflang alternates, the sitemap and robots.txt are all resolved
 * against it, and pointing them at a host that redirects (or does not exist)
 * silently breaks indexing.
 */
export const SITE_URL = (
    process.env.NEXT_PUBLIC_APP_URL || 'https://www.expressrenovationmallorca.es'
).replace(/\/$/, '');

/** Brand name used in metadata, Open Graph and structured data. */
export const SITE_NAME = 'Express Renovation Mallorca';

/** Inbox that receives lead notifications from the public forms. */
export const ADMIN_NOTIFICATION_EMAIL = 'info@expressrenovationmallorca.es';

export const CONTACT_INFO = {
    email: 'info@expressrenovationmallorca.es',
    /** Display form, for rendering. */
    phone: '+34 643 00 30 13',
    /** E.164 form, for `tel:` links and structured data. */
    phoneHref: 'tel:+34643003013',
    address: {
        street: 'Calle Illes Baleares 29, Despacho Nº 13',
        postalCode: '07180',
        locality: 'Son Bugadellas',
        region: 'Illes Balears',
        country: 'ES',
    },
} as const;
