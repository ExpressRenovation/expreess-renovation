import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/dictionaries';
import { ContactFab } from '@/components/contact-fab';
import { JsonLd } from '@/components/seo/json-ld';
import { buildLocalBusiness } from '@/lib/structured-data';

export default async function PublicLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const dict = await getDictionary(locale as any);

    return (
        <>
            <JsonLd data={buildLocalBusiness(locale)} />
            <Header t={dict} />
            <main className="flex-1">
                {children}
            </main>
            <Footer t={dict} />
            {/* <ContactFab /> */}
        </>
    );
}
