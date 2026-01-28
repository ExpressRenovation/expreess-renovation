'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quickBudgetSchema, QuickBudgetFormValues } from './schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SimpleFileUpload } from '@/components/ui/simple-file-upload';
import { createBudgetAction } from '@/actions/budget/create-budget.action';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function QuickBudgetWizard() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();

    const form = useForm<QuickBudgetFormValues>({
        resolver: zodResolver(quickBudgetSchema),
        defaultValues: {
            files: [],
            description: '',
            name: '',
            email: '',
            phone: '',
            address: ''
        }
    });

    const onSubmit = async (values: QuickBudgetFormValues) => {
        setIsSubmitting(true);
        try {
            const result = await createBudgetAction('quick', values);
            if (result.success) {
                setIsSuccess(true);
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error inesperado.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg border border-green-100 text-center"
            >
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Solicitud Recibida!</h2>
                <p className="text-slate-600 mb-8">
                    Hemos recibido tu solicitud de presupuesto rápido. Nuestro equipo la revisará y te contactará en breve.
                </p>
                <Link href="/">
                    <Button className="w-full">Volver al Inicio</Button>
                </Link>
            </motion.div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Presupuesto Rápido ⚡</h1>
                <p className="mt-4 text-lg text-slate-600">
                    Cuéntanos qué necesitas y te daremos una estimación inicial sin complicaciones.
                </p>
            </div>

            <Card className="border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Detalles del Proyecto</CardTitle>
                    <CardDescription>Describe tu idea y adjunta fotos o vídeos si los tienes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>¿Qué quieres hacer?</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ej: Quiero reformar el baño principal, cambiando bañera por plato de ducha y renovando los azulejos..."
                                                className="min-h-[120px] resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="files"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fotos o Vídeos (Opcional)</FormLabel>
                                        <FormControl>
                                            <SimpleFileUpload
                                                value={field.value}
                                                onChange={field.onChange}
                                                accept={{
                                                    'image/*': [],
                                                    'video/*': []
                                                }}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Sube fotos del estado actual para ayudarnos a entender mejor el trabajo.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-6 border-t">
                                <h3 className="text-lg font-semibold mb-4">Datos de Contacto</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre y Apellidos</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Tu nombre" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: 600 000 000" {...field} />
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
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="tucorreo@ejemplo.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Dirección de la obra</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ciudad o dirección" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-medium"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        Solicitar Presupuesto
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </Button>

                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
