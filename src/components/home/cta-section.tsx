'use client';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { useWidgetContext } from '@/context/budget-widget-context';

export function CtaSection({ t }: { t: any }) {
    const { openWidget } = useWidgetContext();
    if (!t) return null;

    return (
        <section className="py-32 bg-primary relative overflow-hidden text-white pattern-grid">
            {/* Abstract circular shapes for background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="container-limited relative z-10 text-center space-y-8">
                <h2 className="font-headline text-4xl md:text-6xl font-bold">
                    {t.title}
                </h2>
                <p className="text-white/90 text-xl md:text-2xl max-w-3xl mx-auto font-light">
                    {t.subtitle}
                </p>
                <div className="pt-8 flex flex-col sm:flex-row gap-6 justify-center">
                    <Button
                        size="lg"
                        onClick={() => openWidget('general')}
                        className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-7 rounded-full shadow-2xl font-bold cursor-pointer"
                    >
                        {t.buttonPrimary}
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-white text-white bg-transparent hover:bg-white/10 text-lg px-10 py-7 rounded-full backdrop-blur-sm">
                        <Link href="/services">{t.buttonSecondary} <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                </div>
                <p className="text-sm text-white/60 pt-8 uppercase tracking-widest">
                    {t.note}
                </p>
            </div>
        </section>
    );
}
