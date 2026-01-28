import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: {
            header: (await import(`@/locales/${locale}/header.json`)).default,
            home: (await import(`@/locales/${locale}/home.json`)).default,
            budgetRequest: (await import(`@/locales/${locale}/budget-request.json`)).default,
            login: (await import(`@/locales/${locale}/login.json`)).default,
            signup: (await import(`@/locales/${locale}/signup.json`)).default,
            dashboard: (await import(`@/locales/${locale}/dashboard.json`)).default,
            services: (await import(`@/locales/${locale}/services.json`)).default,
            pricingSettings: (await import(`@/locales/${locale}/pricing-settings.json`)).default,
            blog: (await import(`@/locales/${locale}/blog.json`)).default,
            contact: (await import(`@/locales/${locale}/contact.json`)).default,
            metadata: (await import(`@/locales/${locale}/metadata.json`)).default
        }
    };
});
