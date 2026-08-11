import React from 'react';
import { formatCurrency } from '@/lib/utils';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, ListTree } from "lucide-react";
import { EditableBudgetLineItem } from "@/types/budget-editor";
import { sileo } from 'sileo';

interface AIReasoningSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: EditableBudgetLineItem | null;
    onUpdate: (id: string, changes: Partial<EditableBudgetLineItem>) => void;
}

export function AIReasoningSheet({ open, onOpenChange, item, onUpdate }: AIReasoningSheetProps) {
    if (!item || !item.item) return null;

    const allCandidates = (item.item.candidates || item.item.alternativeCandidates || []);
    const hasCandidates = allCandidates.length > 0;
    
    // Robust fallback for Pydantic/JSON camelCase or snake_case conversion leaks
    const aiReasoning = item.item.aiResolution?.reasoning_trace || item.item.aiResolution?.reasoningTrace || item.item.note || item.item.ai_justification || "Sin justificación detallada de la máquina.";

    const handleApplyFullSubstitute = (c: any) => {
        const extractedPrice = Number(c.unitPrice || c.priceTotal || c.price_total || c.precio_total || 0);

        onUpdate(item.id, {
            item: {
                ...item.item!,
                unitPrice: extractedPrice,
                description: c.description,
                unit: c.unit || item.item?.unit || 'ud',
                code: c.code,
                totalPrice: extractedPrice * (item.item?.quantity || 1),
                breakdown: c.breakdown,
                needsHumanReview: false, // Reset alert if human applied it manually
            },
            isDirty: true
        });
        onOpenChange(false);
        sileo.success({ title: "Sustitución Completa Aplicada", description: `La partida original ha sido reemplazada con el desglose del Catálogo.` });
    };

    const handleApplyPriceOnly = (c: any) => {
        const extractedPrice = Number(c.unitPrice || c.priceTotal || c.price_total || c.precio_total || 0);

        onUpdate(item.id, {
            item: {
                ...item.item!,
                unitPrice: extractedPrice,
                totalPrice: extractedPrice * (item.item?.quantity || 1),
                needsHumanReview: false,
                // Preserve description, original code, and unit from the OCR!
            },
            isDirty: true
        });
        onOpenChange(false);
        sileo.success({ title: "Precio Aplicado Constatado", description: `Se ha inyectado el precio oficial manteniendo el texto normativo del PDF.` });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[600px] md:max-w-[750px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        Auditoría de IA y Opciones
                    </SheetTitle>
                    <SheetDescription>
                        Revisa el razonamiento del modelo y edita con precisión quirúrgica.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6">
                    {/* AI Reasoning Panel */}
                    <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-amber-500" /> Dictamen del Juez cognitivo
                        </h4>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-indigo-400 pl-3 py-1">
                            "{aiReasoning}"
                        </p>
                    </div>

                    {/* Candidates */}
                    {hasCandidates ? (
                        <div>
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-1">
                                <ListTree className="w-3 h-3" /> Partidas Alternativas (Catálogo)
                            </h4>
                            <div className="flex flex-col gap-3">
                                {allCandidates.map((c: any, index: number) => {
                                    const cPrice = Number(c.unitPrice || c.priceTotal || c.price_total || c.precio_total || 0);
                                    return (
                                        <div key={c.code || index} className="flex flex-col border border-slate-200 dark:border-white/10 rounded-xl p-3 transition-all hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 bg-white dark:bg-zinc-950 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">{c.code || 'SIN CODIGO'}</Badge>
                                                <span className="font-bold text-sm text-indigo-700 dark:text-indigo-400">{formatCurrency(cPrice)}/{c.unit || 'ud'}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{c.description}</p>
                                            
                                            {/* DUAL ACTION BUTTONS */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-slate-100 dark:border-white/5 pt-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border-dashed hover:bg-slate-50"
                                                    onClick={() => handleApplyPriceOnly(c)}
                                                >
                                                    Extraer Solo Precio
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/60 dark:text-indigo-300"
                                                    onClick={() => handleApplyFullSubstitute(c)}
                                                >
                                                    Sustituir Partida Completa
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-400 italic text-center p-4 border border-dashed rounded-xl">
                            No se encontraron alternativas en Bases de Datos para esta partida.
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
