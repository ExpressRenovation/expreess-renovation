import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { locations } from '@/lib/locations';

interface InterlinkingCloudProps {
    serviceName: string;
    categorySlug: string;
    /** Localized heading with a `{service}` placeholder. */
    title?: string;
    className?: string;
}

/** `"Port d'Andratx"` -> `"port-d-andratx"`, matching the zone route params. */
function toZoneSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function InterlinkingCloud({ serviceName, title, className }: InterlinkingCloudProps) {
    const heading = (title ?? '{service} en Mallorca — Zonas de actuación').replace(
        '{service}',
        serviceName
    );

    return (
        <section className={cn('py-12 border-t bg-muted/30', className)}>
            <div className="container-limited text-center">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">
                    {heading}
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                    {locations.map((loc) => (
                        <Link
                            key={loc}
                            // Points at the real zone pages, which are indexed and in the
                            // sitemap. These used to all link to /contact with a query
                            // string, so the block carried no internal link value.
                            href={{ pathname: '/zonas/[zone]', params: { zone: toZoneSlug(loc) } }}
                            className="text-xs sm:text-sm text-muted-foreground hover:text-primary-onLight hover:border-primary/40 transition-colors border rounded-full px-3 py-1 bg-background"
                        >
                            {serviceName} en {loc}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
