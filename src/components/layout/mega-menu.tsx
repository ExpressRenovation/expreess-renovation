'use client';

import * as React from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { services } from '@/lib/services';
import { ChevronDown, ArrowRight } from 'lucide-react';

export function MegaMenu({ t }: { t: any }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 200);
    };

    return (
        <nav className="flex items-center gap-6" onMouseLeave={handleMouseLeave}>
            <div className="" onMouseEnter={handleMouseEnter}>
                <button
                    className={cn(
                        "flex items-center gap-1 text-sm font-bold transition-colors hover:text-primary font-headline tracking-wide py-2 outline-none",
                        isOpen ? "text-primary" : "text-foreground/80"
                    )}
                    aria-expanded={isOpen}
                >
                    {t.header?.nav?.services || "Servicios"}
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isOpen ? "rotate-180" : ""
                        )}
                    />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed left-0 right-0 top-[10vh] w-full z-50 flex justify-center pointer-events-none"
                        >
                            <div className="w-full max-w-7xl mx-auto px-4 pointer-events-auto">
                                <div className="w-full rounded-2xl border border-white/20 bg-background/95 backdrop-blur-3xl shadow-2xl p-8 overflow-hidden relative">
                                    {/* Decorative gradient blob */}
                                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                                    <div className="grid grid-cols-12 gap-12 relative z-10">
                                        {/* Intro / Featured Side */}
                                        <div className="col-span-12 md:col-span-3 space-y-6 border-r border-border/50 pr-8">
                                            <div>
                                                <h3 className="font-headline text-xl font-bold text-primary mb-2">
                                                    {t.header?.megaMenu?.title || "Experiencia Dochevi"}
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {t.header?.megaMenu?.description || "Descubre nuestra gama de servicios premium diseñados para elevar tu calidad de vida. Desde la cimentación hasta el último detalle decorativo."}
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <Link
                                                    href="/services"
                                                    onClick={() => setIsOpen(false)}
                                                    className="inline-flex items-center text-sm font-bold text-foreground hover:text-primary transition-colors group"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-all">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </div>
                                                    {t.header?.megaMenu?.viewAll || "Ver todos los servicios"}
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Services Grid */}
                                        <div className="col-span-12 md:col-span-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {services.map((service) => (
                                                <Link
                                                    key={service.id}
                                                    href={{
                                                        pathname: '/services/[category]/[subcategory]',
                                                        params: {
                                                            category: service.id,
                                                            subcategory: service.subservices?.[0]?.id || 'general'
                                                        }
                                                    }}
                                                    onClick={() => setIsOpen(false)}
                                                    className="group flex items-start gap-4 p-3 rounded-xl transition-all hover:bg-muted/50 focus:bg-muted/50 outline-none -ml-3"
                                                >
                                                    <div className="mt-1 p-2 rounded-lg bg-secondary/30 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                        {service.icon}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-bold leading-none font-headline group-hover:text-primary transition-colors flex items-center">
                                                            {t.services?.[service.id]?.title || service.id}
                                                            <ArrowRight className="h-3 w-3 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                        </div>
                                                        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                                            {t.services?.[service.id]?.shortDescription}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Link href="/blog" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors font-headline tracking-wide">
                {t.header?.nav?.blog || "Blog"}
            </Link>

            <Link href="/contact" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors font-headline tracking-wide">
                {t.header?.nav?.contact || "Contacto"}
            </Link>
        </nav>
    );
}
