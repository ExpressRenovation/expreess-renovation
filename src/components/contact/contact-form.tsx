'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { submitContactMessage } from '@/actions/contact/submit-contact.action';
import { contactMessageSchema, type ContactMessageValues } from './schema';

export function ContactForm({ t, locale }: { t: any; locale: string }) {
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();

    const form = useForm<ContactMessageValues>({
        resolver: zodResolver(contactMessageSchema),
        defaultValues: { name: '', email: '', message: '', website: '' },
    });

    const onSubmit = async (values: ContactMessageValues) => {
        const result = await submitContactMessage(values, locale);

        if (result.success) {
            setIsSuccess(true);
            form.reset();
            return;
        }

        if (result.errors) {
            for (const [field, messages] of Object.entries(result.errors)) {
                if (messages?.[0]) {
                    form.setError(field as keyof ContactMessageValues, { message: messages[0] });
                }
            }
            return;
        }

        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.message ?? 'No hemos podido enviar tu mensaje.',
        });
    };

    if (isSuccess) {
        return (
            <div className="rounded-2xl border bg-muted/30 p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary-onLight">
                    <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="font-headline text-xl font-bold">¡Mensaje enviado!</h3>
                <p className="mt-2 text-muted-foreground">
                    Gracias por escribirnos. Te responderemos lo antes posible.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setIsSuccess(false)}>
                    Enviar otro mensaje
                </Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.form.name}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.form.namePlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.form.email}</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder={t.form.emailPlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.form.message}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t.form.messagePlaceholder}
                                    className="min-h-[150px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Honeypot — hidden from humans, irresistible to bots. */}
                <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                        <FormItem className="hidden" aria-hidden="true">
                            <FormControl>
                                <Input tabIndex={-1} autoComplete="off" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        t.form.button
                    )}
                </Button>
            </form>
        </Form>
    );
}
