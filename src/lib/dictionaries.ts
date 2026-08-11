type Locale = 'es' | 'en' | 'de' | 'ca' | 'nl';

const dictionaries: Record<Locale, () => Promise<any>> = {
  en: async () => {
    const header = await import('@/locales/en/header.json').then((module) => module.default);
    const home = await import('@/locales/en/home.json').then((module) => module.default);
    const budgetRequest = await import('@/locales/en/budget-request.json').then((module) => module.default);
    const login = await import('@/locales/en/login.json').then((module) => module.default);
    const signup = await import('@/locales/en/signup.json').then((module) => module.default);
    const dashboard = await import('@/locales/en/dashboard.json').then((module) => module.default);
    const services = await import('@/locales/en/services.json').then((module) => module.default);
    const pricingSettings = await import('@/locales/en/pricing-settings.json').then((module) => module.default);
    const blog = await import('@/locales/en/blog.json').then((module) => module.default);
    const contact = await import('@/locales/en/contact.json').then((module) => module.default);
    return { header, home, budgetRequest, login, signup, dashboard, services, pricingSettings, blog, contact };
  },
  de: async () => {
    const header = await import('@/locales/de/header.json').then((module) => module.default);
    const home = await import('@/locales/de/home.json').then((module) => module.default);
    const budgetRequest = await import('@/locales/de/budget-request.json').then((module) => module.default);
    const login = await import('@/locales/de/login.json').then((module) => module.default);
    const signup = await import('@/locales/de/signup.json').then((module) => module.default);
    const dashboard = await import('@/locales/de/dashboard.json').then((module) => module.default);
    const services = await import('@/locales/de/services.json').then((module) => module.default);
    const pricingSettings = await import('@/locales/de/pricing-settings.json').then((module) => module.default);
    const blog = await import('@/locales/de/blog.json').then((module) => module.default);
    const contact = await import('@/locales/de/contact.json').then((module) => module.default);
    return { header, home, budgetRequest, login, signup, dashboard, services, pricingSettings, blog, contact };
  },
  es: async () => {
    const header = await import('@/locales/es/header.json').then((module) => module.default);
    const home = await import('@/locales/es/home.json').then((module) => module.default);
    const budgetRequest = await import('@/locales/es/budget-request.json').then((module) => module.default);
    const login = await import('@/locales/es/login.json').then((module) => module.default);
    const signup = await import('@/locales/es/signup.json').then((module) => module.default);
    const dashboard = await import('@/locales/es/dashboard.json').then((module) => module.default);
    const services = await import('@/locales/es/services.json').then((module) => module.default);
    const pricingSettings = await import('@/locales/es/pricing-settings.json').then((module) => module.default);
    const blog = await import('@/locales/es/blog.json').then((module) => module.default);
    const contact = await import('@/locales/es/contact.json').then((module) => module.default);
    return { header, home, budgetRequest, login, signup, dashboard, services, pricingSettings, blog, contact };
  },
  ca: async () => {
    const header = await import('@/locales/ca/header.json').then((module) => module.default);
    const home = await import('@/locales/ca/home.json').then((module) => module.default);
    const budgetRequest = await import('@/locales/ca/budget-request.json').then((module) => module.default);
    const login = await import('@/locales/ca/login.json').then((module) => module.default);
    const signup = await import('@/locales/ca/signup.json').then((module) => module.default);
    const dashboard = await import('@/locales/ca/dashboard.json').then((module) => module.default);
    const services = await import('@/locales/ca/services.json').then((module) => module.default);
    const pricingSettings = await import('@/locales/ca/pricing-settings.json').then((module) => module.default);
    const blog = await import('@/locales/ca/blog.json').then((module) => module.default);
    const contact = await import('@/locales/ca/contact.json').then((module) => module.default);
    return { header, home, budgetRequest, login, signup, dashboard, services, pricingSettings, blog, contact };
  },
  nl: async () => {
    const header = await import('@/locales/nl/header.json').then((module) => module.default);
    const home = await import('@/locales/nl/home.json').then((module) => module.default);
    const budgetRequest = await import('@/locales/nl/budget-request.json').then((module) => module.default);
    const login = await import('@/locales/nl/login.json').then((module) => module.default);
    const signup = await import('@/locales/nl/signup.json').then((module) => module.default);
    const dashboard = await import('@/locales/nl/dashboard.json').then((module) => module.default);
    const services = await import('@/locales/nl/services.json').then((module) => module.default);
    const pricingSettings = await import('@/locales/nl/pricing-settings.json').then((module) => module.default);
    const blog = await import('@/locales/nl/blog.json').then((module) => module.default);
    const contact = await import('@/locales/nl/contact.json').then((module) => module.default);
    return { header, home, budgetRequest, login, signup, dashboard, services, pricingSettings, blog, contact };
  },
};

const DEFAULT_LOCALE: Locale = 'es';

/**
 * Recursively fills gaps in `target` with values from `base`.
 *
 * Arrays and primitives are taken whole — a translated array is never merged
 * element-by-element with the base one, which would produce a mix of languages.
 */
function withFallback<T>(base: T, target: unknown): T {
  if (target === undefined || target === null) return base;
  if (Array.isArray(base) || Array.isArray(target)) return target as T;
  if (typeof base !== 'object' || typeof target !== 'object') return target as T;

  const merged: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(target as Record<string, unknown>)) {
    merged[key] = key in merged ? withFallback(merged[key], value) : value;
  }
  return merged as T;
}

/**
 * Loads a locale's dictionary, backfilled with the default locale.
 *
 * Translation files drift: `ca` shipped with no subservice entries at all,
 * which made every Catalan subservice URL `notFound()` while still being listed
 * in the sitemap and hreflang alternates. Backfilling means an untranslated key
 * degrades to Spanish instead of taking the page down.
 */
export const getDictionary = async (locale: Locale) => {
  const base = await dictionaries[DEFAULT_LOCALE]();
  if (locale === DEFAULT_LOCALE || !dictionaries[locale]) return base;

  return withFallback(base, await dictionaries[locale]());
};
