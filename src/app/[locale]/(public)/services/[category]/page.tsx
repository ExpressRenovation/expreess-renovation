import { services } from '@/lib/services';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/dictionaries';
import { constructMetadata } from '@/i18n/seo-utils';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight, Check } from 'lucide-react';
import { ProcessTimeline } from '@/components/services/process-timeline';
import { FAQSection } from '@/components/services/faq-section';
import { InterlinkingCloud } from '@/components/seo/interlinking-cloud';
import { JsonLd } from '@/components/seo/json-ld';
import { absoluteUrl, buildBreadcrumbs, buildService } from '@/lib/structured-data';
import { CONTACT_INFO } from '@/lib/contact-info';
import type { Metadata } from 'next';

const LOCALES = ['es', 'en', 'de', 'nl', 'ca'];

export async function generateStaticParams() {
    return services.flatMap((service) =>
        LOCALES.map((locale) => ({ locale, category: service.id }))
    );
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string; locale: string }>;
}): Promise<Metadata> {
    const { category, locale } = await params;
    const service = services.find((s) => s.id === category);
    const dict = await getDictionary(locale as any);
    const t = dict.services?.[category];

    if (!service || !t) return {};

    return constructMetadata({
        title: `${t.title} en Mallorca`,
        description: t.shortDescription || t.description,
        image: service.image,
        path: '/services/[category]',
        locale,
        params: { category },
    });
}

export default async function ServiceCategoryPage({
    params,
}: {
    params: Promise<{ category: string; locale: string }>;
}) {
    const { category, locale } = await params;
    const service = services.find((s) => s.id === category);
    const dict = await getDictionary(locale as any);

    if (!service) notFound();

    const t = dict.services?.[category];
    if (!t) notFound();

    const tCta = dict.services?.cta ?? {};
    const tCommon = dict.services?.common ?? {};
    const ui = dict.services?.ui ?? {};
    const subservices = service.subservices ?? [];

    /**
     * Fills the {category} placeholder. Names containing an acronym keep their
     * casing so "SATE" or "LED" are never mangled into lowercase.
     */
    const fillCategory = (template: string = '') =>
        template.replace(
            '{category}',
            /\b[A-ZÁÉÍÓÚÑ]{2,}\b/.test(t.title) ? t.title : t.title.toLowerCase()
        );

    const pageUrl = absoluteUrl('/services/[category]', locale, { category });

    return (
        <>
            <JsonLd
                data={[
                    buildService({
                        name: t.title,
                        description: t.description || t.shortDescription,
                        url: pageUrl,
                        image: service.image,
                    }),
                    buildBreadcrumbs([
                        { name: ui.breadcrumbHome ?? 'Inicio', url: absoluteUrl('/', locale) },
                        { name: dict.header?.nav?.services ?? 'Servicios', url: absoluteUrl('/services', locale) },
                        { name: t.title, url: pageUrl },
                    ]),
                ]}
            />

            {/* Hero — editorial, image carries the weight, type sits on a calm field */}
            <section className="relative min-h-[62vh] w-full flex items-end pb-16 md:pb-24">
                <Image
                    src={service.image}
                    alt={`${t.title} en Mallorca`}
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/25" />

                <div className="relative container-limited w-full text-white">
                    <nav aria-label="Migas de pan" className="flex items-center gap-2 text-sm text-white/70 mb-6">
                        <Link href="/" className="hover:text-white transition-colors">{ui.breadcrumbHome ?? 'Inicio'}</Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <Link href={{ pathname: '/services' }} className="hover:text-white transition-colors">
                            {dict.header?.nav?.services ?? 'Servicios'}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="text-white/95">{t.title}</span>
                    </nav>

                    <div className="h-px w-16 bg-primary mb-8" />

                    <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl text-balance">
                        {t.title}
                    </h1>

                    {t.subtitle && (
                        <p className="mt-6 text-lg md:text-2xl text-white/75 max-w-2xl font-light leading-relaxed">
                            {t.subtitle}
                        </p>
                    )}
                </div>
            </section>

            {/* Description + key features */}
            <section className="py-20 md:py-28">
                <div className="container-limited grid lg:grid-cols-12 gap-12 lg:gap-20">
                    <div className="lg:col-span-7">
                        <h2 className="font-headline text-2xl md:text-3xl font-bold mb-6">
                            {tCta.descriptionTitle ?? 'Descripción del Servicio'}
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
                            {t.description}
                        </p>
                    </div>

                    {Array.isArray(t.features) && t.features.length > 0 && (
                        <aside className="lg:col-span-5">
                            <div className="rounded-2xl border bg-muted/25 p-8">
                                <h2 className="font-headline text-xl font-bold mb-6">
                                    {tCta.featuresTitle ?? 'Características Clave'}
                                </h2>
                                <ul className="space-y-4">
                                    {t.features.map((feature: string) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary-onLight">
                                                <Check className="h-3 w-3" strokeWidth={3} />
                                            </span>
                                            <span className="text-muted-foreground leading-relaxed">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>
                    )}
                </div>
            </section>

            {/* Subservices — the silo's internal links, and the reason this page exists */}
            {subservices.length > 0 && (
                <section className="pb-20 md:pb-28">
                    <div className="container-limited">
                        <div className="flex items-end justify-between gap-6 mb-10">
                            <h2 className="font-headline text-2xl md:text-3xl font-bold">
                                {fillCategory(ui.categoryAll)}
                            </h2>
                            <div className="hidden md:block flex-1 h-px bg-border" />
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {subservices.map((sub) => {
                                const subT = t.subservices?.[sub.id];
                                if (!subT) return null;

                                return (
                                    <Link
                                        key={sub.id}
                                        href={{
                                            pathname: '/services/[category]/[subcategory]',
                                            params: { category, subcategory: sub.id },
                                        }}
                                        className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-background p-7 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        <div>
                                            <h3 className="font-headline text-lg font-bold leading-snug mb-3 group-hover:text-primary-onLight transition-colors">
                                                {subT.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                                {subT.description}
                                            </p>
                                        </div>
                                        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-onLight">
                                            {ui.viewDetail}
                                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {tCommon.process && <ProcessTimeline t={tCommon.process} />}

            <div className="bg-muted/10 border-t">
                {tCommon.faq && <FAQSection t={tCommon.faq} subtitle={ui.faqSubtitle} />}
                <InterlinkingCloud serviceName={t.title} categorySlug={category} title={ui.zonesTitle} />
            </div>

            {/* Closing CTA */}
            <section className="relative overflow-hidden py-20 md:py-28 bg-stone-950 text-white">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 20% 20%, hsl(var(--primary)) 0, transparent 45%), radial-gradient(circle at 80% 70%, hsl(var(--primary)) 0, transparent 40%)',
                    }}
                />
                <div className="relative container-limited text-center max-w-3xl">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold text-balance">
                        {(tCta.title ?? '¿Listo para empezar tu proyecto de {serviceName}?').replace(
                            '{serviceName}',
                            t.title.toLowerCase()
                        )}
                    </h2>
                    <p className="mt-5 text-lg text-white/65 font-light">{tCta.subtitle}</p>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="font-bold text-base px-8">
                            <Link href={{ pathname: '/budget-request', query: { service: category } }}>
                                {tCta.button ?? 'Presupuesto al instante'}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <a
                            href={CONTACT_INFO.phoneHref}
                            className="text-white/70 hover:text-white transition-colors font-headline text-lg"
                        >
                            {CONTACT_INFO.phone}
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
