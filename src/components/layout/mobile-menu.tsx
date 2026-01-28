'use client';

import { Link } from '@/i18n/navigation';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { services } from '@/lib/services';
import { cn } from '@/lib/utils';
import { SheetClose } from '@/components/ui/sheet';
import { BudgetWidget } from '@/components/budget-widget';
import { Button } from '@/components/ui/button';

interface MobileMenuProps {
    t: any;
    navLinks: { href: any; label: string }[];
    onLinkClick: () => void;
    user: any;
}

export function MobileMenu({ t, navLinks, onLinkClick, user }: MobileMenuProps) {
    return (
        <div className="flex flex-col gap-4 py-4 h-full overflow-y-auto pb-20">
            <Accordion type="single" collapsible className="w-full">
                {/* Services with Submenu */}
                <AccordionItem value="services" className="border-b-0">
                    <AccordionTrigger className="text-lg font-medium text-foreground hover:text-primary font-headline py-2 hover:no-underline">
                        {t.header?.nav?.services || "Servicios"}
                    </AccordionTrigger>
                    <AccordionContent className='pb-2'>
                        <div className="pl-4 border-l-2 border-primary/20 ml-2 space-y-4 mt-2">
                            {services.map((service) => (
                                <Accordion type="single" collapsible className="w-full" key={service.id}>
                                    <AccordionItem value={service.id} className="border-b-0">
                                        <AccordionTrigger className="text-base font-medium text-foreground/80 hover:text-primary py-1 hover:no-underline justify-between">
                                            {t.services?.[service.id]?.title || service.id}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="flex flex-col gap-2 pl-4 mt-1 border-l border-white/10 ml-1">
                                                {service.subservices?.map((sub) => (
                                                    <SheetClose asChild key={sub.id}>
                                                        <Link
                                                            href={{
                                                                pathname: '/services/[category]/[subcategory]',
                                                                params: {
                                                                    category: service.id,
                                                                    subcategory: sub.id
                                                                }
                                                            }}
                                                            className="text-sm text-muted-foreground hover:text-primary transition-colors py-1 block"
                                                            onClick={onLinkClick}
                                                        >
                                                            {t.services?.[service.id]?.subservices?.[sub.id]?.title || sub.id}
                                                        </Link>
                                                    </SheetClose>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            ))}
                            <SheetClose asChild>
                                <Link
                                    href="/services"
                                    className="text-sm font-bold text-primary block pt-2"
                                    onClick={onLinkClick}
                                >
                                    {t.header?.megaMenu?.viewAll || "Ver todos los servicios"}
                                </Link>
                            </SheetClose>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {navLinks.filter(link => {
                const isServices = typeof link.href === 'object'
                    ? link.href.hash === 'services'
                    : link.href === '/#services';
                return !isServices;
            }).map((link) => (
                <SheetClose asChild key={link.href}>
                    <Link
                        href={link.href as any}
                        className="text-lg font-medium text-foreground transition-colors hover:text-primary font-headline py-2"
                        onClick={onLinkClick}
                    >
                        {link.label}
                    </Link>
                </SheetClose>
            ))}

            {/* Budget Omni Button / Widget */}
            <div className="pt-4 mt-auto">
                <BudgetWidget
                    t={t}
                    trigger={
                        <Button className="w-full gap-2 text-lg h-12" size="lg">
                            {t.header.nav.budgetRequest}
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
