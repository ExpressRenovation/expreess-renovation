'use client';

import { useBudgetEditor } from '@/hooks/use-budget-editor';
import { BudgetEditorGrid } from './BudgetEditorGrid';
import { BudgetEditorToolbar } from './BudgetEditorToolbar';
import { updateBudgetAction } from '@/actions/budget/update-budget.action';
import { Budget } from '@/backend/budget/domain/budget';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetRequestDetails } from './BudgetRequestDetails';
import { BudgetEconomicSummary } from './BudgetEconomicSummary';
import { BudgetLibrarySidebar } from './BudgetLibrarySidebar';
import { RenovationGallery } from '@/components/dream-renovator/RenovationGallery';
import { BudgetRequestViewer } from './BudgetRequestViewer';
import React from 'react';

interface BudgetEditorWrapperProps {
    budget: Budget;
}

export const BudgetEditorWrapper = ({ budget }: BudgetEditorWrapperProps) => {
    // If it's a Quick Budget or New Build, we use the Viewer, not the full Editor
    if (budget.type === 'quick' || budget.type === 'new_build') {
        return <BudgetRequestViewer budget={budget} />;
    }

    const {
        state,
        updateItem,
        addItem,
        reorderItems,
        removeItem,
        duplicateItem,
        undo,
        redo,
        saveStart,
        saveSuccess,
        saveError,
        canUndo,
        canRedo,
        addChapter,
        removeChapter,
        renameChapter,
        reorderChapters
    } = useBudgetEditor(budget.lineItems);

    const { toast } = useToast();
    const [isGhostMode, setIsGhostMode] = React.useState(false);

    // Handle Save
    const handleSave = async () => {
        saveStart();
        try {
            const result = await updateBudgetAction(budget.id, {
                lineItems: state.items,
                costBreakdown: state.costBreakdown,
                totalEstimated: state.costBreakdown.total
            });

            if (result.success) {
                saveSuccess();
                toast({
                    title: "Presupuesto guardado",
                    description: "Los cambios se han guardado correctamente.",
                });
            } else {
                saveError();
                toast({
                    title: "Error al guardar",
                    description: result.error || "Ha ocurrido un error inesperado.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            saveError();
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar con el servidor.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            <BudgetEditorToolbar
                hasUnsavedChanges={state.hasUnsavedChanges}
                isSaving={state.isSaving}
                canUndo={canUndo}
                canRedo={canRedo}
                onSave={handleSave}
                onUndo={undo}
                onRedo={redo}
                lastSavedAt={state.lastSavedAt}
                clientName={budget.clientData.name}
                items={state.items}
                costBreakdown={state.costBreakdown}
                budgetNumber={budget.id.substring(0, 8)}
                showGhostMode={isGhostMode}
                onToggleGhostMode={() => setIsGhostMode(!isGhostMode)}
            />

            <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 space-y-6 animate-in fade-in duration-500">

                {/* Header Info */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{budget.clientData.name}</h1>
                        <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                            <span className="bg-slate-200 px-2 py-0.5 rounded text-xs font-semibold text-slate-700 capitalize">
                                {(budget.clientData as any).projectScope === 'integral' ? 'Reforma Integral' : 'Reforma Parcial'}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="capitalize">{(budget.clientData as any).propertyType === 'residential' ? 'Vivienda' : 'Local / Oficina'}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">

                    {/* LEFT COLUMN: Main Content Area (Tabs) */}
                    <div className="min-w-0">
                        <Tabs defaultValue="editor" className="space-y-6">
                            <TabsList className="bg-white border shadow-sm">
                                <TabsTrigger value="editor">Editor de Partidas</TabsTrigger>
                                <TabsTrigger value="details">Detalles Solicitud</TabsTrigger>
                                <TabsTrigger value="renovation" className="text-purple-600 data-[state=active]:text-purple-800 data-[state=active]:bg-purple-50">
                                    Dream Renovator ✨
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="editor" className="space-y-8">
                                <BudgetEditorGrid
                                    items={state.items}
                                    chapters={state.chapters}
                                    onReorder={reorderItems}
                                    onUpdate={updateItem}
                                    onRemove={removeItem}
                                    onDuplicate={duplicateItem}
                                    onAddChapter={addChapter}
                                    onRemoveChapter={removeChapter}
                                    onRenameChapter={renameChapter}
                                    onReorderChapters={reorderChapters}
                                    showGhostMode={isGhostMode}
                                />
                            </TabsContent>

                            <TabsContent value="details">
                                <BudgetRequestDetails data={budget.clientData as any} />
                            </TabsContent>

                            <TabsContent value="renovation">
                                <RenovationGallery budgetId={budget.id} renders={budget.renders} />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* RIGHT COLUMN: Sidebar (Summary + Library) */}
                    <div className="sticky top-24">
                        <Tabs defaultValue="summary" className="w-full">
                            <TabsList className="w-full grid grid-cols-2 bg-white/50 mb-4 border shadow-sm">
                                <TabsTrigger value="summary">Resumen</TabsTrigger>
                                <TabsTrigger value="library">Biblioteca</TabsTrigger>
                            </TabsList>
                            <TabsContent value="summary">
                                <BudgetEconomicSummary costBreakdown={state.costBreakdown} />
                            </TabsContent>
                            <TabsContent value="library">
                                <BudgetLibrarySidebar onAddItem={addItem} />
                            </TabsContent>
                        </Tabs>
                    </div>

                </div>
            </main>
        </div>
    );
};
