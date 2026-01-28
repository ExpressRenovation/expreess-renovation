import { ArrowRight, ClipboardList, PenTool, Hammer, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessTimelineProps {
    className?: string;
    t: {
        title: string;
        steps: Array<{
            title: string;
            description: string;
        }>;
    };
}

export function ProcessTimeline({ className, t }: ProcessTimelineProps) {
    const icons = [ClipboardList, PenTool, Hammer, CheckCircle2];

    return (
        <section className={cn("py-16 md:py-24 bg-secondary/20", className)}>
            <div className="container-limited">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">{t.title}</h2>
                    <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                </div>

                <div className="relative grid md:grid-cols-4 gap-8">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-border -z-10" />

                    {t.steps.map((step, index) => {
                        const Icon = icons[index] || icons[0];
                        return (
                            <div key={index} className="flex flex-col items-center text-center group">
                                <div className="w-24 h-24 rounded-full bg-background border-4 border-secondary flex items-center justify-center mb-6 shadow-sm group-hover:border-primary/50 group-hover:scale-105 transition-all duration-300 relative z-10">
                                    <Icon className="h-10 w-10 text-primary" />
                                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                                        {index + 1}
                                    </div>
                                </div>
                                <h3 className="font-headline font-bold text-xl mb-3">{step.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed max-w-[250px]">
                                    {step.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
