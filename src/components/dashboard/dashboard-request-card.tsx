'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWidgetContext } from '@/context/budget-widget-context';
import { ArrowRight, PlusCircle, Sparkles } from 'lucide-react';

export function DashboardRequestCard({ t }: { t: any }) {
    const { openWidget } = useWidgetContext();

    return (
        <Card
            onClick={() => openWidget('general')}
            className="h-full flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-900 border-indigo-100 dark:border-indigo-900/50 hover:shadow-lg hover:shadow-indigo-500/10"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-indigo-500/20"></div>

            <CardHeader className="relative z-10">
                <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                </div>
                <div className='pt-6 space-y-2'>
                    <CardTitle className="text-2xl font-bold font-headline leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                        {t.title}
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground/80 leading-relaxed">
                        {t.description}
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
}
