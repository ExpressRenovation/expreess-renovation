import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/dictionaries';
import { ServicesGrid } from '@/components/home/services-grid';

import i18nConfig from '../../../../../i18nConfig';

export async function generateStaticParams() {
    return i18nConfig.locales.map(locale => ({ locale }));
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const dict = await getDictionary(locale as any);

    return (
        <>
            <Header t={dict} />
            <main className="flex-1 pt-20">
                <div className="container-limited py-12 text-center">
                    <h1 className="font-headline text-5xl font-bold mb-4">{dict.header.nav.services}</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Explora nuestras soluciones integrales para transformar tu hogar.
                    </p>
                </div>
                <ServicesGrid t={dict.home.servicesGrid} />
            </main>
            <Footer t={dict} />
        </>
    );
}
