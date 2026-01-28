'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from '@/components/ui/sheet';
import { BudgetRequestWizard } from '@/components/budget-request-wizard';
import { Calculator, X } from 'lucide-react';
import { services } from '@/lib/services';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BudgetWidgetProps {
    t: any;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function BudgetWidget({ t, trigger }: BudgetWidgetProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button className="shadow-lg hover:shadow-primary/20 transition-all font-semibold gap-2">
                        <Calculator className="h-4 w-4" />
                        {t.header.nav.budgetRequest}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="right" className="w-[100vw] sm:w-[600px] md:w-[700px] p-0 border-l border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-none">
                <div className="h-full flex flex-col">
                    <SheetHeader className="px-6 py-4 border-b border-white/10 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <SheetTitle className="font-headline text-xl">{t.budgetRequest?.selection?.detailed?.title || "Solicitar Presupuesto"}</SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground">{t.budgetRequest?.selection?.detailed?.description || "Calcula tu reforma al detalle"}</SheetDescription>
                        </div>
                        {/* Close button is automatically added by SheetContent but we can customize if needed */}
                    </SheetHeader>

                    <ScrollArea className="flex-1 p-6">
                        <div className="pb-20"> {/* Padding bottom for scroll space */}
                            <BudgetRequestWizard
                                t={t}
                                services={services}
                                onBack={() => setOpen(false)}
                                isWidget={true}
                            />
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}
