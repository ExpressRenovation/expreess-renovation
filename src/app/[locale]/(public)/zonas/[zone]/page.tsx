import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/dictionaries';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { locations } from '@/lib/locations';
import { services } from '@/lib/services';
import { constructMetadata } from '@/i18n/seo-utils';
import { JsonLd } from '@/components/seo/json-ld';
import { absoluteUrl, buildBreadcrumbs, buildService } from '@/lib/structured-data';
import { CONTACT_INFO } from '@/lib/contact-info';

const toSlug = (name: string) =>
    name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

/** Turns the URL slug back into a display name, preferring the canonical spelling. */
function displayName(zone: string): string {
    const known = locations.find((l) => toSlug(l) === zone);
    if (known) return known;
    return zone.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function generateStaticParams() {
    return locations.map((loc) => ({ zone: toSlug(loc) }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; zone: string }> }): Promise<Metadata> {
    const { locale, zone } = await params;
    const locationName = displayName(zone);

    return constructMetadata({
        title: `Reformas en ${locationName} | Express Renovation Mallorca`,
        description: `Reformas integrales, obra nueva y piscinas en ${locationName}. Presupuesto cerrado por partidas y plazos garantizados por contrato.`,
        path: '/zonas/[zone]',
        locale,
        params: { zone },
    });
}

export default async function LocationPage({ params }: { params: Promise<{ locale: string; zone: string }> }) {
    const { locale, zone } = await params;
    const locationName = displayName(zone);
    const dict = await getDictionary(locale as any);

    const isKnown = locations.some((l) => toSlug(l) === zone);
    if (!isKnown) notFound();

    const ui = dict.services?.ui ?? {};
    const pageUrl = absoluteUrl('/zonas/[zone]', locale, { zone });
    const otherZones = locations.filter((l) => toSlug(l) !== zone);

    return (
        <>
            <JsonLd
                data={[
                    buildService({
                        name: `Reformas y construcción en ${locationName}`,
                        description: `Reformas integrales, obra nueva, piscinas y rehabilitación en ${locationName}, Mallorca.`,
                        url: pageUrl,
                    }),
                    buildBreadcrumbs([
                        { name: ui.breadcrumbHome ?? 'Inicio', url: absoluteUrl('/', locale) },
                        { name: locationName, url: pageUrl },
                    ]),
                ]}
            />

            <section className="relative overflow-hidden bg-stone-950 text-white pt-24 pb-24 md:pt-32 md:pb-32">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 18% 22%, hsl(var(--primary)) 0, transparent 42%), radial-gradient(circle at 82% 78%, hsl(var(--primary)) 0, transparent 38%)',
                    }}
                />
                <div className="relative container-limited">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-7">
                        <MapPin className="h-3.5 w-3.5" />
                        Mallorca
                    </span>

                    <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl text-balance">
                        Reformas en {locationName}
                    </h1>

                    <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl font-light leading-relaxed">
                        Ejecutamos proyectos de construcción, reforma integral y obra nueva en {locationName}
                        {' '}con acabados de alta gama, presupuesto cerrado por partidas y plazos garantizados por contrato.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4">
                        <Button asChild size="lg" className="font-bold text-base px-8">
                            <Link href="/budget-request">
                                {ui.sidebarCta ?? 'Calcular Precio Ahora'}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <a
                            href={CONTACT_INFO.phoneHref}
                            className="inline-flex items-center justify-center gap-2 text-white/70 hover:text-white transition-colors font-headline text-lg"
                        >
                            <Phone className="h-4 w-4" />
                            {CONTACT_INFO.phone}
                        </a>
                    </div>
                </div>
            </section>

            {/* Services available in this zone — the real reason this page exists */}
            <section className="py-20 md:py-28">
                <div className="container-limited">
                    <h2 className="font-headline text-2xl md:text-3xl font-bold mb-4 text-balance">
                        Qué hacemos en {locationName}
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mb-12 leading-relaxed">
                        Cubrimos el proyecto completo, desde la licencia hasta la entrega de llaves.
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {services.map((service) => {
                            const t = dict.services?.[service.id];
                            if (!t) return null;

                            return (
                                <Link
                                    key={service.id}
                                    href={{ pathname: '/services/[category]', params: { category: service.id } }}
                                    className="group rounded-2xl border border-border/60 bg-background p-7 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    <h3 className="font-headline text-lg font-bold mb-3 group-hover:text-primary-onLight transition-colors">
                                        {t.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                        {t.shortDescription ?? t.description}
                                    </p>
                                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-onLight">
                                        {ui.viewDetail ?? 'Ver detalle'}
                                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Why us, kept local */}
            <section className="py-16 md:py-20 bg-muted/25 border-y">
                <div className="container-limited grid md:grid-cols-2 gap-10 lg:gap-20 items-start">
                    <h2 className="font-headline text-2xl md:text-3xl font-bold text-balance">
                        Por qué trabajar con nosotros en {locationName}
                    </h2>
                    <ul className="space-y-5">
                        {[
                            'Equipo propio desplazado, sin subcontratas en cadena.',
                            'Presupuesto detallado por partidas, sin precios cerrados opacos.',
                            'Gestión de licencias ante el ayuntamiento correspondiente.',
                            'Garantía por escrito de todos los trabajos ejecutados.',
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-4">
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary-onLight">
                                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                </span>
                                <span className="text-muted-foreground leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Neighbouring zones — internal linking across the location silo */}
            {otherZones.length > 0 && (
                <section className="py-14 md:py-16">
                    <div className="container-limited text-center">
                        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground mb-7">
                            También trabajamos en
                        </h2>
                        <div className="flex flex-wrap justify-center gap-3">
                            {otherZones.map((loc) => (
                                <Link
                                    key={loc}
                                    href={{ pathname: '/zonas/[zone]', params: { zone: toSlug(loc) } }}
                                    className="text-sm text-muted-foreground hover:text-primary-onLight hover:border-primary/40 transition-colors border rounded-full px-4 py-1.5 bg-background"
                                >
                                    {loc}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
