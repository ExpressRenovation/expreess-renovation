import Link from 'next/link';
import { cn } from '@/lib/utils'; // Assuming utils exists, if not I'll remove it

const LOCATIONS = [
    'Palma', 'Calvià', 'Andratx', 'Santa Ponsa', 'Llucmajor',
    'Inca', 'Manacor', 'Soller', 'Portals Nous', 'Son Vida'
];

interface InterlinkingCloudProps {
    serviceName: string;
    categorySlug: string;
    className?: string;
}

export function InterlinkingCloud({ serviceName, categorySlug, className }: InterlinkingCloudProps) {
    return (
        <section className={cn("py-12 border-t bg-slate-50", className)}>
            <div className="container-limited text-center">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">
                    {serviceName} en Mallorca - Zonas de Actuación
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                    {LOCATIONS.map((loc) => (
                        <Link
                            key={loc}
                            href={`/contact?subject=${encodeURIComponent(serviceName + ' en ' + loc)}`}
                            // For now linking to contact or a search page. 
                            // Ideal: href={`/zonas/${loc.toLowerCase().replace(' ', '-')}/${categorySlug}`}
                            className="text-xs sm:text-sm text-slate-500 hover:text-primary hover:underline transition-colors border rounded-full px-3 py-1 bg-white"
                        >
                            {serviceName} en {loc}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
