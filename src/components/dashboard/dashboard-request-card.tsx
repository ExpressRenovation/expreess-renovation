'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWidgetContext } from '@/context/budget-widget-context';
import { ArrowRight, PlusCircle } from 'lucide-react';

export function DashboardRequestCard({ t }: { t: any }) {
    const { openWidget } = useWidgetContext();

    return (
        <Card
            onClick={() => openWidget('general')}
            className="h-full flex flex-col justify-between hover:border-primary transition-colors cursor-pointer group"
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <PlusCircle className="w-8 h-8 text-primary" />
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className='pt-4'>
                    <CardTitle className="text-xl font-headline">{t.title}</CardTitle>
                    <CardDescription className="pt-2">{t.description}</CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
}
