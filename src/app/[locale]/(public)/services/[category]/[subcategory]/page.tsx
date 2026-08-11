import { services } from '@/lib/services';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/dictionaries';
import { InterlinkingCloud } from '@/components/seo/interlinking-cloud';
import { ProcessTimeline } from '@/components/services/process-timeline';
import { FAQSection } from '@/components/services/faq-section';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ChevronRight, Check, Phone } from 'lucide-react';
import { CONTACT_INFO } from '@/lib/contact-info';
import { JsonLd } from '@/components/seo/json-ld';
import { absoluteUrl, buildBreadcrumbs, buildService } from '@/lib/structured-data';
import { constructMetadata } from '@/i18n/seo-utils';
import type { Metadata } from 'next';

const LOCALES = ['es', 'en', 'de', 'nl', 'ca'];

export async function generateStaticParams() {
    return services.flatMap((service) =>
        (service.subservices ?? []).flatMap((sub) =>
            LOCALES.map((locale) => ({ locale, category: service.id, subcategory: sub.id }))
        )
    );
}

export async function generateMetadata({ params }: { params: Promise<{ category: string, subcategory: string, locale: string }> }): Promise<Metadata> {
    const { category, subcategory, locale } = await params;
    const service = services.find((s) => s.id === category);
    const dict = await getDictionary(locale as any);

    if (!service) return {};

    const categoryTranslation = dict.services[category];
    const subserviceTranslation = categoryTranslation?.subservices?.[subcategory];

    if (!subserviceTranslation) return {};

    return constructMetadata({
        title: `${subserviceTranslation.title} | ${categoryTranslation.title} en Mallorca`,
        description: subserviceTranslation.description,
        image: service.image,
        path: '/services/[category]/[subcategory]',
        locale,
        params: { category, subcategory }
    });
}

export default async function SubServicePage({ params }: { params: Promise<{ category: string, subcategory: string, locale: string }> }) {
    const { category, subcategory, locale } = await params;
    const service = services.find((s) => s.id === category);
    const dict = await getDictionary(locale as any);

    if (!service) notFound();

    const categoryTranslation = dict.services[category];
    const subserviceTranslation = categoryTranslation?.subservices?.[subcategory];

    if (!subserviceTranslation) {
        notFound();
    }

    const pageUrl = absoluteUrl('/services/[category]/[subcategory]', locale, { category, subcategory });

    const ui = dict.services?.ui ?? {};

    /**
     * Lowercases a service name for mid-sentence use, but leaves it alone when
     * it contains an acronym — "Aislamiento SATE" must not become
     * "aislamiento sate", and the same goes for LED, PVC or SATE elsewhere.
     */
    const forSentence = (name: string) =>
        /\b[A-ZÁÉÍÓÚÑ]{2,}\b/.test(name) ? name : name.toLowerCase();

    /** Fills {service} / {category} placeholders in the localized UI strings. */
    const fill = (template: string = '') =>
        template
            .replace('{service}', forSentence(subserviceTranslation.title))
            .replace('{category}', forSentence(categoryTranslation.title));

    const siblings = (service.subservices ?? []).filter((s) => s.id !== subcategory);

    const structuredData = [
        buildService({
            name: subserviceTranslation.title,
            description: subserviceTranslation.description,
            url: pageUrl,
            image: service.image,
            categoryName: categoryTranslation.title,
            priceRange: subserviceTranslation.priceRange,
        }),
        buildBreadcrumbs([
            { name: ui.breadcrumbHome ?? 'Inicio', url: absoluteUrl('/', locale) },
            { name: categoryTranslation.title, url: absoluteUrl('/services/[category]', locale, { category }) },
            { name: subserviceTranslation.title, url: pageUrl },
        ]),
    ];

    return (
        <>
            <JsonLd data={structuredData} />

            {/* Hero — the image carries the weight; type sits on a calm left field */}
            <section className="relative min-h-[58vh] md:min-h-[66vh] w-full flex items-end pb-14 md:pb-20">
                <Image
                    src={service.image}
                    alt={`${subserviceTranslation.title} en Mallorca`}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-stone-950/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-950/20 to-transparent" />

                <div className="relative container-limited w-full text-white">
                    <nav aria-label="Migas de pan" className="flex items-center gap-2 text-sm text-white/65 mb-6 flex-wrap">
                        <Link href="/" className="hover:text-white transition-colors">
                            {ui.breadcrumbHome ?? 'Inicio'}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <Link
                            href={{ pathname: '/services/[category]', params: { category } }}
                            className="hover:text-white transition-colors"
                        >
                            {categoryTranslation.title}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-white/95">{subserviceTranslation.title}</span>
                    </nav>

                    <div className="h-px w-16 bg-primary mb-7" />

                    <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl text-balance">
                        {subserviceTranslation.title}
                    </h1>

                    <p className="mt-6 text-lg md:text-xl text-white/75 max-w-2xl font-light leading-relaxed">
                        {subserviceTranslation.description}
                    </p>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="container-limited grid lg:grid-cols-12 gap-12 lg:gap-16">

                    {/* Main column */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* Direct-answer block. Sits high on the page and in plain prose
                            so answer engines can lift it verbatim. */}
                        {subserviceTranslation.answer && (
                            <div className="rounded-3xl border border-primary/20 bg-primary/[0.04] p-8 md:p-10">
                                <h2 className="font-headline text-xl md:text-2xl font-bold mb-4 text-balance">
                                    {fill(ui.answerTitle)}
                                </h2>
                                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                                    {subserviceTranslation.answer}
                                </p>

                                {subserviceTranslation.priceRange && (
                                    <div className="mt-7 pt-7 border-t border-primary/15">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
                                            {ui.priceLabel}
                                        </span>
                                        <span className="font-headline text-2xl md:text-3xl font-bold text-primary-onLight">
                                            {subserviceTranslation.priceRange}
                                        </span>
                                    </div>
                                )}

                                <p className="mt-4 text-xs text-muted-foreground/75 leading-relaxed">
                                    {ui.priceDisclaimer}
                                </p>
                            </div>
                        )}

                        <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
                            {fill(ui.intro)}
                        </p>

                        {/* Why us */}
                        {Array.isArray(ui.whyUs) && ui.whyUs.length > 0 && (
                            <div>
                                <h2 className="font-headline text-2xl md:text-3xl font-bold mb-8 text-balance">
                                    {ui.whyUsTitle}
                                </h2>
                                <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                    {ui.whyUs.map((reason: string) => (
                                        <li key={reason} className="flex items-start gap-4">
                                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary-onLight">
                                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                            </span>
                                            <span className="text-muted-foreground leading-relaxed">{fill(reason)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4">
                        <div className="lg:sticky lg:top-28 space-y-8">
                            <div className="rounded-3xl border bg-background p-7 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.18)]">
                                <h2 className="font-headline text-xl font-bold mb-2 text-balance">
                                    {fill(ui.sidebarTitle)}
                                </h2>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                    {ui.sidebarSubtitle}
                                </p>

                                <Button asChild size="lg" className="w-full font-bold text-base py-6 shadow-md hover:shadow-xl transition-all">
                                    <Link href={{ pathname: '/budget-request', query: { service: category } }}>
                                        {ui.sidebarCta}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>

                                <div className="mt-6 pt-6 border-t text-center">
                                    <p className="text-xs text-muted-foreground mb-2">{ui.callUs}</p>
                                    <a
                                        href={CONTACT_INFO.phoneHref}
                                        className="inline-flex items-center gap-2 font-headline font-bold text-lg hover:text-primary-onLight transition-colors"
                                    >
                                        <Phone className="h-4 w-4" />
                                        {CONTACT_INFO.phone}
                                    </a>
                                </div>
                            </div>

                            {siblings.length > 0 && (
                                <div className="rounded-3xl border bg-muted/25 p-7">
                                    <h2 className="font-bold text-xs uppercase tracking-[0.14em] text-muted-foreground mb-5">
                                        {(ui.moreIn ?? 'Más en {category}').replace('{category}', categoryTranslation.title)}
                                    </h2>
                                    <ul className="space-y-1">
                                        {siblings.map((sibling) => (
                                            <li key={sibling.id}>
                                                <Link
                                                    href={{
                                                        pathname: '/services/[category]/[subcategory]',
                                                        params: { category, subcategory: sibling.id },
                                                    }}
                                                    className="group flex items-center justify-between gap-3 -mx-3 px-3 py-2.5 rounded-xl hover:bg-background transition-colors"
                                                >
                                                    <span className="text-sm leading-snug group-hover:text-primary-onLight transition-colors">
                                                        {categoryTranslation.subservices?.[sibling.id]?.title || sibling.id}
                                                    </span>
                                                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary-onLight transition-all" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </section>

            {dict.services.common?.process && <ProcessTimeline t={dict.services.common.process} />}

            <div className="bg-muted/10 border-t">
                {dict.services.common?.faq && (
                    <FAQSection t={dict.services.common.faq} subtitle={ui.faqSubtitle} />
                )}

                <InterlinkingCloud
                    serviceName={subserviceTranslation.title}
                    categorySlug={category}
                    title={ui.zonesTitle}
                />
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
                        {fill(ui.closingTitle)}
                    </h2>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="font-bold text-base px-8">
                            <Link href={{ pathname: '/budget-request', query: { service: category } }}>
                                {ui.sidebarCta}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="border-white/25 bg-transparent text-white hover:bg-white hover:text-stone-950"
                        >
                            <Link href="/contact">{ui.closingCta}</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
