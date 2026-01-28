import { services } from '@/lib/services';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/dictionaries';
import { InterlinkingCloud } from '@/components/seo/interlinking-cloud';
import { ProcessTimeline } from '@/components/services/process-timeline';
import { FAQSection } from '@/components/services/faq-section';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
// generateAlternates replaced by constructMetadata

export async function generateStaticParams() {
    const params: { locale: string; category: string; subcategory: string }[] = [];

    // Hardcoded locales for now to avoid async config reading issues in build
    const locales = ['es', 'en', 'de', 'nl', 'ca'];

    services.forEach((service) => {
        if (service.subservices) {
            service.subservices.forEach((sub) => {
                locales.forEach(locale => {
                    params.push({
                        locale,
                        category: service.id,
                        subcategory: sub.id
                    });
                });
            });
        }
    });

    return params;
}

import { constructMetadata } from '@/i18n/seo-utils';

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

    return (
        <>
            <main className="flex-1">
                {/* Breadcrumb / Hero */}
                <section className="relative h-[40vh] min-h-[400px] w-full flex items-end pb-12">
                    <Image
                        src={service.image}
                        alt={`Imagen decorativa para ${subserviceTranslation.title}`}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

                    <div className="relative container-limited w-full text-white space-y-4">
                        <nav className="flex items-center text-sm md:text-base text-white/80 space-x-2 mb-4">
                            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
                            <ChevronRight className="h-4 w-4" />
                            <Link href={{ pathname: '/services' }} className="hover:text-white transition-colors">
                                {categoryTranslation.title}
                            </Link>
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-white font-medium truncate max-w-[200px] md:max-w-none">
                                {subserviceTranslation.title}
                            </span>
                        </nav>

                        <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl">
                            {subserviceTranslation.title}
                        </h1>
                    </div>
                </section>

                <section className="py-16 md:py-24">
                    <div className="container-limited">
                        <div className="grid md:grid-cols-12 gap-12">

                            {/* Main Content */}
                            <div className="md:col-span-8 space-y-8">
                                <div className="prose prose-lg prose-slate max-w-none">
                                    <p className="lead text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
                                        {subserviceTranslation.description}
                                    </p>

                                    <p>
                                        En <strong>ExpressRenovationMallorca</strong>, entendemos que {subserviceTranslation.title.toLowerCase()} es una inversión importante.
                                        Nuestro equipo de especialistas se encarga de cada detalle, garantizando acabados de lujo y durabilidad.
                                    </p>
                                </div>

                                <div className="bg-muted/30 p-8 rounded-2xl border border-muted mt-8">
                                    <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="text-primary h-6 w-6" />
                                        ¿Por qué elegirnos para este servicio?
                                    </h3>
                                    <ul className="grid sm:grid-cols-2 gap-4">
                                        <li className="flex items-start gap-3">
                                            <span className="h-2 w-2 rounded-full bg-primary mt-2" />
                                            <span className="text-muted-foreground">Expertos certificados en {categoryTranslation.title.toLowerCase()}.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="h-2 w-2 rounded-full bg-primary mt-2" />
                                            <span className="text-muted-foreground">Materiales de primera calidad garantizados.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="h-2 w-2 rounded-full bg-primary mt-2" />
                                            <span className="text-muted-foreground">Plazos de ejecución cerrados bajo contrato.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="h-2 w-2 rounded-full bg-primary mt-2" />
                                            <span className="text-muted-foreground">Presupuestos transparentes sin sorpresas.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Sidebar / CTA */}
                            <aside className="md:col-span-4 space-y-8">
                                <div className="bg-background border rounded-2xl p-6 shadow-lg sticky top-24">
                                    <h3 className="font-headline text-xl font-bold mb-2">
                                        ¿Interesado en {subserviceTranslation.title}?
                                    </h3>
                                    <p className="text-muted-foreground text-sm mb-6">
                                        Obtén una estimación de precio inmediata y personalizada para tu proyecto.
                                    </p>

                                    <Button asChild className="w-full font-bold text-base py-6 shadow-md hover:shadow-xl transition-all">
                                        <Link href={{ pathname: '/budget-request', query: { service: category } }}>
                                            Calcular Precio Ahora
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                    </Button>

                                    <div className="mt-6 pt-6 border-t text-center">
                                        <p className="text-xs text-muted-foreground mb-2">O llámanos directamente</p>
                                        <a href="tel:+34971000000" className="font-headline font-bold text-lg hover:text-primary transition-colors">
                                            +34 971 000 000
                                        </a>
                                    </div>
                                </div>

                                <div className="pl-2">
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                                        Más en {categoryTranslation.title}
                                    </h4>
                                    <ul className="space-y-3">
                                        {service.subservices?.filter(s => s.id !== subcategory).map(sibling => (
                                            <li key={sibling.id}>
                                                <Link
                                                    href={{
                                                        pathname: '/services/[category]/[subcategory]',
                                                        params: { category, subcategory: sibling.id }
                                                    }}
                                                    className="text-foreground hover:text-primary transition-colors flex justify-between items-center group"
                                                >
                                                    <span className="text-sm">
                                                        {categoryTranslation.subservices?.[sibling.id]?.title || sibling.id}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </aside>
                        </div>
                    </div>
                </section>

                {/* Process Section */}
                {dict.services.common?.process && (
                    <ProcessTimeline t={dict.services.common.process} />
                )}

                {/* FAQ Section and Interlinking */}
                <div className="bg-muted/10 border-t">
                    {dict.services.common?.faq && (
                        <FAQSection t={dict.services.common.faq} />
                    )}

                    <InterlinkingCloud
                        serviceName={subserviceTranslation.title}
                        categorySlug={category}
                    />
                </div>

                <section className="w-full py-16 bg-secondary/30 border-t">
                    <div className="container-limited text-center">
                        <h2 className="font-headline text-3xl font-bold mb-4">
                            Comienza tu {subserviceTranslation.title.toLowerCase()} hoy mismo
                        </h2>
                        <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white">
                            <Link href="/contact">
                                Contactar con un Agente
                            </Link>
                        </Button>
                    </div>
                </section>
            </main >
        </>
    );
}
