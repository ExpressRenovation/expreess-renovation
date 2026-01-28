'use client';

import {
    Hammer,
    ChefHat,
    Droplets,
    Trees,
    ArrowRight,
    Paintbrush,
    Layers,
    Wrench,
    Waves,
    Home,
    Shield,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { services } from '@/lib/services';

export function ServicesGrid({ t }: { t: any }) {
    if (!t) return null;

    // Map icons to match the services array order if needed, 
    // or better yet, use the icons from the services array directly if possible.
    // Since services array has React Nodes for icons, we can try to use them or map by ID.
    // For now, let's keep the manual mapping or try to sync with the services array.
    // The services export has 'icon' property which is a ReactNode.

    // Check if services array length matches t.items length
    // const safeServices = services.slice(0, t.items.length);

    // Bento Grid Layout definition
    const getGridClass = (index: number) => {
        if (index === 0) return "md:col-span-2 md:row-span-2 min-h-[300px] md:min-h-[500px]"; // Taller for first item
        return "md:col-span-1 md:row-span-1 min-h-[250px]";
    };

    return (
        <section className="py-24 bg-muted/20 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="container-limited relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <span className="text-primary font-bold tracking-wider uppercase text-sm">{t.label}</span>
                        <h2 className="font-headline text-4xl md:text-5xl font-bold">{t.title}</h2>
                        <p className="text-muted-foreground text-lg">
                            {t.subtitle}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
                    {t.items.map((item: any, index: number) => {
                        // Find corresponding service in our config to retrieve ID and Image
                        // We assume the order in JSON matches the order in services.tsx
                        // A safer way would be to match by some key, but for now index reliance is the standard pattern used here.
                        const serviceConfig = services[index];
                        const link = serviceConfig
                            ? {
                                pathname: '/services/[category]/[subcategory]',
                                params: {
                                    category: serviceConfig.id,
                                    subcategory: serviceConfig.subservices[0]?.id || 'general'
                                }
                            }
                            : { pathname: '/services' };

                        const isMainCard = index === 0;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={cn(
                                    "group relative overflow-hidden rounded-3xl border border-white/20 shadow-sm transition-all duration-500",
                                    isMainCard
                                        ? "shadow-2xl md:col-span-2 md:row-span-2"
                                        : "bg-background hover:shadow-2xl",
                                    getGridClass(index)
                                )}
                            >
                                {/** 
                                 * BACKGROUND IMAGE LOGIC 
                                 * Main Card: Always visible, elegant overlay.
                                 * Other Cards: Hover reveal.
                                 **/}
                                <div className={cn(
                                    "absolute inset-0 transition-opacity duration-500 z-0",
                                    isMainCard ? "opacity-100" : "opacity-0 group-hover:opacity-100 bg-primary/90"
                                )}>
                                    {serviceConfig?.image && (
                                        <div
                                            className={cn(
                                                "absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105",
                                                isMainCard ? "" : "opacity-20 mix-blend-overlay"
                                            )}
                                            style={{ backgroundImage: `url('${serviceConfig.image}')` }}
                                        />
                                    )}
                                    {/* Overlay for Main Card to ensure text readability */}
                                    {isMainCard && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                    )}
                                </div>

                                {/* Default Background Gradient for non-main cards (hidden on hover) */}
                                {!isMainCard && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-secondary/30 z-0 transition-opacity duration-500 group-hover:opacity-0" />
                                )}

                                <div className="relative z-10 w-full h-full p-8 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className={cn(
                                            "p-3 rounded-2xl transition-all duration-300 backdrop-blur-md",
                                            isMainCard
                                                ? "bg-white/20 text-white"
                                                : "bg-secondary/50 text-primary group-hover:bg-white/20 group-hover:text-white"
                                        )}>
                                            {serviceConfig?.icon || <Hammer className="h-6 w-6" />}
                                        </div>
                                        <div className={cn(
                                            "w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300",
                                            isMainCard
                                                ? "border-white/40 text-white opacity-100"
                                                : "border-primary/20 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 text-white"
                                        )}>
                                            <ArrowRight className={cn(
                                                "h-5 w-5 transition-transform duration-300",
                                                isMainCard ? "rotate-0" : "-rotate-45 group-hover:rotate-0"
                                            )} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className={cn(
                                            "font-headline font-bold transition-colors duration-300",
                                            isMainCard ? "text-3xl text-white" : "text-xl text-foreground group-hover:text-white"
                                        )}>
                                            {item.title}
                                        </h3>

                                        <p className={cn(
                                            "transition-colors duration-300 leading-relaxed",
                                            isMainCard
                                                ? "text-base text-white/90 line-clamp-3 md:line-clamp-4"
                                                : "text-sm text-muted-foreground group-hover:text-white/80 line-clamp-3"
                                        )}>
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                <Link href={link as any} className="absolute inset-0 z-20">
                                    <span className="sr-only">{t.cta}</span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
