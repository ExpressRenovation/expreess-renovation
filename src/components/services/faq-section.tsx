import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface FAQSectionProps {
    className?: string;
    t: {
        title: string;
        items: Array<{
            question: string;
            answer: string;
        }>;
    };
}

export function FAQSection({ className, t }: FAQSectionProps) {
    return (
        <section className={cn("py-16 md:py-24", className)}>
            <div className="container-limited max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">{t.title}</h2>
                    <p className="text-muted-foreground">
                        Respuestas a las dudas más comunes sobre nuestros servicios.
                    </p>
                </div>

                <div className="bg-background rounded-2xl shadow-sm border p-6 md:p-10">
                    <Accordion type="single" collapsible className="w-full">
                        {t.items.map((item, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-left font-headline font-bold text-lg">
                                    {item.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
}
