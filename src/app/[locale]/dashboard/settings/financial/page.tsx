'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, use } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    iva: z.coerce.number().min(0).max(100),
    overheadExpenses: z.coerce.number().min(0).max(100),
    industrialBenefit: z.coerce.number().min(0).max(100),
});

type FormValues = z.infer<typeof formSchema>;

// Mock initial data matching BudgetEconomicSummary
const initialConfig = {
    iva: 21,
    overheadExpenses: 13,
    industrialBenefit: 6,
};

export default function FinancialSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialConfig,
    });

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        console.log("Saving financial config:", values);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast({
                title: "Configuración guardada",
                description: "Los valores se han actualizado correctamente.",
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "No se pudieron guardar los cambios.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Configuración Financiera</CardTitle>
                    <CardDescription>Ajusta los porcentajes globales para el cálculo de presupuestos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <div className="grid md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="overheadExpenses"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gastos Generales (GG) %</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="industrialBenefit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Beneficio Industrial (BI) %</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="iva"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Impuesto (IVA) %</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
                                <strong>Nota:</strong> Estos valores se aplicarán por defecto a los nuevos presupuestos. Los presupuestos existentes mantendrán sus valores históricos.
                            </div>

                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
