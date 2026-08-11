/**
 * Central registry of remote media used across the public site.
 *
 * Everything here is a **temporary stock placeholder** from Unsplash. The
 * previous images pointed at `local-digital-eye/business/rm-construcciones`,
 * a different company's Firebase bucket, and several did not match the service
 * they illustrated.
 *
 * TODO: replace each entry with the real photograph from the
 * `express-renovation` bucket. Only this file needs to change — no component
 * references an image URL directly.
 */

/** Unsplash delivery params: wide crop, sensible quality, auto format. */
const STOCK = (id: string, w = 2000) =>
    `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

/** Hero image per service category, keyed by the service id in `services.tsx`. */
export const SERVICE_IMAGES: Record<string, string> = {
    // TODO: replace with own photography of a completed Mallorca build.
    'construccion-y-reformas': STOCK('1600585154340-be6161a56a0c'),
    // TODO: replace with own pool project.
    'piscinas': STOCK('1600596542815-ffad4c1539a9'),
    // TODO: replace with own interior renovation.
    'reformas-de-interiores': STOCK('1600607687939-ce8a6c25118c'),
    // TODO: replace with own façade / SATE project.
    'paramentos-verticales': STOCK('1737205785859-3727c4145aed'),
    // TODO: replace with own electrical installation.
    'electricidad': STOCK('1621905251189-08b45d6a269e'),
    // TODO: replace with own joinery work.
    'carpinteria': STOCK('1590725140246-20acdee442be'),
    // TODO: replace with own plumbing installation.
    'fontaneria': STOCK('1607472586893-edb57bdc0e39'),
    // TODO: replace with own painting work.
    'pintura': STOCK('1562259949-e8e7689d7828'),
    // TODO: replace with own roofing / waterproofing job.
    'impermeabilizacion': STOCK('1632759145351-1d592919f522'),
};

/** Locally hosted brand assets — these are already correct. */
export const BRAND_ASSETS = {
    logo: '/images/logo-express-renovation.webp',
    ogDefault: '/images/og-default.jpg',
};

/** Home page videos, served from the project's own Firebase bucket. */
export const HOME_VIDEOS = {
    corporate:
        'https://firebasestorage.googleapis.com/v0/b/express-renovation.firebasestorage.app/o/web%2Fvideo%2FExpress_Corporativo.mp4?alt=media&token=bfeb5871-f704-4969-b6f6-599034995d9a',
    beforeAfter:
        'https://firebasestorage.googleapis.com/v0/b/express-renovation.firebasestorage.app/o/web%2Fvideo%2FAI%20Render%20%23animation%20%23rendering.mp4?alt=media&token=ed338f2c-f713-47d4-95f7-1c456e5f2355',
};
