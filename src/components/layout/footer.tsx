import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/logo';
import { Mail, MapPin, Phone } from 'lucide-react';
import { services } from '@/lib/services';
import { CONTACT_INFO, SITE_NAME } from '@/lib/contact-info';

/**
 * Public site footer.
 *
 * Carries the real company identity and contact details, plus links into every
 * service silo — the footer is on every page, so those are the site's most
 * consistent internal links.
 */
export function Footer({ t }: { t?: any }) {
    const currentYear = new Date().getFullYear();
    const { address } = CONTACT_INFO;

    // Falls back to Spanish so an untranslated locale still reads correctly.
    const serviceTitles = t?.services ?? {};
    const nav = t?.header?.nav ?? {};

    return (
        <footer className="w-full bg-stone-950 text-stone-300 border-t border-white/10">
            <div className="container-limited py-16 md:py-20">
                <div className="grid gap-12 md:grid-cols-12">

                    {/* Identity */}
                    <div className="md:col-span-4 space-y-6">
                        <Logo variant="light" width={150} height={50} />
                        <p className="text-sm leading-relaxed text-stone-400 max-w-xs">
                            Construcción, reformas integrales y obra nueva en Mallorca.
                            Acabados de alta gama, presupuesto cerrado por partidas y plazos
                            garantizados por contrato.
                        </p>
                    </div>

                    {/* Services — the footer's internal link block */}
                    <nav className="md:col-span-4" aria-label="Servicios">
                        <h2 className="font-headline font-semibold text-primary mb-5 text-sm uppercase tracking-[0.14em]">
                            {nav.services ?? 'Servicios'}
                        </h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                            {services.map((service) => (
                                <li key={service.id}>
                                    <Link
                                        href={{ pathname: '/services/[category]', params: { category: service.id } }}
                                        className="text-sm text-stone-400 hover:text-primary transition-colors"
                                    >
                                        {serviceTitles?.[service.id]?.title ?? service.id}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Contact */}
                    <div className="md:col-span-4">
                        <h2 className="font-headline font-semibold text-primary mb-5 text-sm uppercase tracking-[0.14em]">
                            {nav.contact ?? 'Contacto'}
                        </h2>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                                <span className="text-stone-400 leading-relaxed">
                                    {address.street}
                                    <br />
                                    {address.postalCode} {address.locality}, Mallorca
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                                <a href={CONTACT_INFO.phoneHref} className="text-stone-400 hover:text-primary transition-colors">
                                    {CONTACT_INFO.phone}
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-4 w-4 shrink-0 text-primary/70" />
                                <a
                                    href={`mailto:${CONTACT_INFO.email}`}
                                    className="text-stone-400 hover:text-primary transition-colors break-all"
                                >
                                    {CONTACT_INFO.email}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-stone-500">
                        &copy; {currentYear} {SITE_NAME}. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="text-xs text-stone-500 hover:text-primary transition-colors">
                            Política de Privacidad
                        </Link>
                        <Link href="/terms" className="text-xs text-stone-500 hover:text-primary transition-colors">
                            Términos de Servicio
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
