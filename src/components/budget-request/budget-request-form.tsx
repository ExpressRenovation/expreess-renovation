'use client';

import { useState } from 'react';
import { BudgetRequestWizard } from '@/components/budget-request-wizard';
import { QuickBudgetForm } from '@/components/budget-request/quick-budget-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { services } from '@/lib/services';

export function BudgetRequestForm({ t }: { t: any }) {
    const [formType, setFormType] = useState<'selection' | 'quick' | 'detailed'>('selection');

    const renderContent = () => {
        switch (formType) {
            case 'quick':
                return <QuickBudgetForm t={t} />;
            case 'detailed':
                return <BudgetRequestWizard t={t} services={services} onBack={() => setFormType('selection')} />;
            case 'selection':
            default:
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
                    >
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">{t.budgetRequest.selector.options.fast.title}</CardTitle>
                                <CardDescription>{t.budgetRequest.selector.options.fast.desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-end">
                                <Button className="w-full" onClick={() => setFormType('quick')}>
                                    {t.budgetRequest.selector.options.fast.title}
                                </Button>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">{t.budgetRequest.selector.options.wizard.title}</CardTitle>
                                <CardDescription>{t.budgetRequest.selector.options.wizard.desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-end">
                                <Button className="w-full" onClick={() => setFormType('detailed')}>
                                    {t.budgetRequest.selector.options.wizard.title}
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                );
        }
    };

    return <div className="w-full">{renderContent()}</div>;
}
