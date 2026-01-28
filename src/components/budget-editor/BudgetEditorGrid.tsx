'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { EditableBudgetLineItem } from '@/types/budget-editor';
import { EditableCell } from './EditableCell';
import { Button } from '@/components/ui/button';
import {
    GripVertical,
    Trash2,
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    FolderPlus,
    Pencil,
    AlertTriangle,
    Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BudgetEditorGridProps {
    items: EditableBudgetLineItem[];
    chapters: string[];
    onReorder: (newItems: EditableBudgetLineItem[]) => void;
    onUpdate: (id: string, changes: Partial<EditableBudgetLineItem>) => void;
    onRemove: (id: string) => void;
    onDuplicate: (id: string) => void;
    // Chapter Actions
    onAddChapter: (name: string) => void;
    onRemoveChapter: (name: string) => void;
    onRenameChapter: (oldName: string, newName: string) => void;
    onReorderChapters: (newOrder: string[]) => void;
    // Visual Features
    showGhostMode?: boolean;
}

const DraggableRow = ({ item, onUpdate, onRemove, onDuplicate, showGhostMode }: {
    item: EditableBudgetLineItem;
    onUpdate: (id: string, changes: Partial<EditableBudgetLineItem>) => void;
    onRemove: (id: string) => void;
    onDuplicate: (id: string) => void;
    showGhostMode?: boolean;
}) => {
    const controls = useDragControls();
    const [isExpanded, setIsExpanded] = useState(false);

    // Deviation Analysis
    const currentPrice = item.item?.unitPrice || 0;
    const originalPrice = item.originalState?.unitPrice || currentPrice;
    const deviation = originalPrice > 0 ? Math.abs((currentPrice - originalPrice) / originalPrice) : 0;
    const isDeviated = deviation > 0.2; // 20% threshold

    // Handle Total Price Change (Reverse Calculation)
    const handleTotalChange = (val: string | number) => {
        const newTotal = Number(val);
        const quantity = item.item?.quantity || 0;
        const safeQuantity = quantity === 0 ? 1 : quantity;
        const newUnitPrice = newTotal / safeQuantity;

        onUpdate(item.id, {
            item: {
                ...item.item!,
                unitPrice: newUnitPrice,
            }
        });
    };

    return (
        <Reorder.Item
            value={item}
            id={item.id}
            dragListener={false}
            dragControls={controls}
            className={cn(
                "group relative bg-white border rounded-xl mb-4 shadow-sm hover:shadow-md transition-all overflow-hidden",
                item.isDirty && "border-amber-200 bg-amber-50/10"
            )}
        >
            <div className="flex items-stretch bg-slate-50/50 border-b p-3">
                {/* Drag Handle */}
                <div
                    onPointerDown={(e) => controls.start(e)}
                    className="mr-3 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 flex flex-col justify-center"
                >
                    <GripVertical className="w-5 h-5" />
                </div>

                {/* Index Number */}
                <div className="flex flex-col justify-center mr-4">
                    <span className="text-xs font-mono font-bold text-slate-400 border bg-white px-2 py-1 rounded">
                        {String(item.order || 0).padStart(2, '0')}
                    </span>
                </div>

                {/* Header Title */}
                <div className="flex-1 flex flex-col justify-center py-1">
                    <EditableCell
                        value={item.originalTask || "Nueva Partida"}
                        onChange={(val) => onUpdate(item.id, { originalTask: val as string })}
                        className="font-bold text-base text-slate-700 bg-transparent border-transparent hover:border-slate-200 focus:bg-white px-0"
                        placeholder="Título de la partida..."
                    />
                    {isDeviated && (
                        <div className="flex items-center gap-1 text-amber-600 text-[10px] mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Desviación significativa (+20%)</span>
                        </div>
                    )}
                </div>

                {/* Price Logic */}
                <div className="flex flex-col items-end gap-1 justify-center">
                    {/* Ghost Mode Original Total */}
                    {showGhostMode && item.originalState && (
                        <span className="text-xs text-slate-400 line-through font-mono mr-2">
                            {(item.originalState.quantity * item.originalState.unitPrice).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                    )}

                    <div className={cn(
                        "flex items-center gap-2 border rounded-lg px-3 py-1 ml-4 shadow-sm transition-colors bg-white",
                        isDeviated ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-100"
                    )}>
                        {/* Quantity x Unit Price = Total */}
                        <div className={cn(
                            "flex items-center gap-1 text-sm",
                            isDeviated ? "text-amber-800" : "text-green-800"
                        )}>
                            <EditableCell
                                value={item.item?.quantity || 0}
                                onChange={(val) => onUpdate(item.id, { item: { ...item.item!, quantity: Number(val) } })}
                                type="number"
                                className={cn(
                                    "w-12 h-6 text-right bg-transparent border-transparent hover:bg-white focus:bg-white font-mono p-0",
                                    isDeviated ? "text-amber-800" : "text-green-800"
                                )}
                            />
                            <div className="flex flex-col items-center leading-none">
                                <span className={cn("text-[10px] uppercase", isDeviated ? "text-amber-500" : "text-green-500")}>
                                    <EditableCell
                                        value={item.item?.unit || 'ud'}
                                        onChange={(val) => onUpdate(item.id, { item: { ...item.item!, unit: val as string } })}
                                        className="w-8 text-center bg-transparent border-transparent hover:bg-white focus:bg-white p-0 h-4"
                                    />
                                </span>
                            </div>

                            <span className={cn("mx-1 text-xs opacity-50", isDeviated ? "text-amber-800" : "text-green-800")}>x</span>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <EditableCell
                                                value={item.item?.unitPrice || 0}
                                                onChange={(val) => onUpdate(item.id, { item: { ...item.item!, unitPrice: Number(val) } })}
                                                type="currency"
                                                className={cn(
                                                    "w-20 h-6 text-right bg-transparent border-transparent hover:bg-white focus:bg-white font-mono p-0",
                                                    isDeviated ? "text-amber-800" : "text-green-800"
                                                )}
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    {isDeviated && item.originalState && (
                                        <TooltipContent side="top">
                                            Original: {item.originalState.unitPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className={cn("h-4 w-px mx-2", isDeviated ? "bg-amber-200" : "bg-green-200")} />

                        {/* Editable Total Price */}
                        <div className={cn("font-bold text-lg", isDeviated ? "text-amber-700" : "text-green-700")}>
                            <EditableCell
                                value={item.item?.totalPrice || 0}
                                onChange={handleTotalChange}
                                type="currency"
                                className="w-24 h-7 text-right bg-transparent border-transparent hover:bg-white focus:bg-white font-mono p-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-3 border-l pl-3 self-center">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-300 hover:text-blue-500 hover:bg-blue-50"
                                    onClick={() => onDuplicate(item.id)}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Duplicar partida</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción eliminará la partida "{item.originalTask}" permanentemente.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onRemove(item.id)} className="bg-red-600 hover:bg-red-700">
                                    Eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-4 pl-14 relative group/body">
                <div className={cn(
                    "relative transition-all duration-300 ease-in-out",
                    isExpanded ? "h-auto block" : "max-h-[3rem] overflow-hidden" // Slightly smaller collapsed height
                )}>
                    {!isExpanded && (
                        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
                    )}

                    {/* Description Editor */}
                    <div className="space-y-2">
                        <EditableCell
                            value={item.item?.description || ""}
                            onChange={(val) => onUpdate(item.id, { item: { ...item.item!, description: val as string } })}
                            type="textarea"
                            className={cn(
                                "text-sm text-slate-600 leading-relaxed bg-transparent border-slate-100 focus:bg-white focus:border-primary/20 w-full",
                                isExpanded ? "min-h-[4rem]" : "h-full"
                            )}
                            placeholder="Descripción técnica detallada..."
                        />

                        {/* Ghost Mode Original Description */}
                        {showGhostMode && item.originalState && (
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500 italic">
                                <span className="font-semibold not-italic block mb-1 text-slate-400 uppercase tracking-wider">Original:</span>
                                {item.originalState.description}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center -mb-2 mt-1 relative z-20">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-5 w-full hover:bg-slate-50 text-slate-300 hover:text-slate-500 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"
                    >
                        {isExpanded ? (
                            <>Menos <ChevronUp className="w-3 h-3" /></>
                        ) : (
                            <>Más Detalles <ChevronDown className="w-3 h-3" /></>
                        )}
                    </Button>
                </div>

                {/* Footer: Ref */}
                <div className="absolute top-3 right-[150px] opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Positioned Ref in top row for cleaner look? No, stick to bottom or integrated. */}
                </div>
            </div>
        </Reorder.Item>
    );
};

// Chapter Component
const ChapterGroup = ({
    chapterName,
    items,
    onReorder,
    onUpdate,
    onRemove,
    onDuplicate,
    onRename,
    onDelete,
    showGhostMode
}: {
    chapterName: string;
    items: EditableBudgetLineItem[];
    onReorder: (items: EditableBudgetLineItem[]) => void;
    onUpdate: any;
    onRemove: any;
    onDuplicate: any;
    onRename: (newName: string) => void;
    onDelete: () => void;
    showGhostMode?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState(chapterName);

    const handleRenameSubmit = () => {
        if (nameDraft.trim() && nameDraft !== chapterName) {
            onRename(nameDraft.trim());
        }
        setIsEditingName(false);
    };

    return (
        <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 shadow-sm">
            {/* Chapter Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
                <div className="flex items-center gap-3 flex-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6 text-slate-400"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>

                    {isEditingName ? (
                        <Input
                            autoFocus
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                            className="h-7 w-64 font-bold text-lg"
                        />
                    ) : (
                        <h3
                            className="font-bold text-lg text-slate-800 cursor-pointer hover:underline decoration-dashed decoration-slate-300 underline-offset-4"
                            onClick={() => setIsEditingName(true)}
                        >
                            {chapterName}
                            <span className="ml-3 text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {items.length} partidas
                            </span>
                        </h3>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500 mr-4">
                        {(items.reduce((acc, i) => acc + (i.item?.totalPrice || 0), 0)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                                <Pencil className="w-4 h-4 mr-2" /> Renombrar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onDelete}>
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar Capítulo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Chapter Items */}
            {isOpen && (
                <div className="p-4 bg-slate-50/30">
                    <Reorder.Group axis="y" values={items} onReorder={onReorder} className="space-y-4">
                        {items.length === 0 ? (
                            <div className="text-center py-8 border border-dashed rounded-lg text-slate-400 text-sm">
                                Arrastra partidas aquí o añade nuevas
                            </div>
                        ) : (
                            items.map((item) => (
                                <DraggableRow
                                    key={item.id}
                                    item={item}
                                    onUpdate={onUpdate}
                                    onRemove={onRemove}
                                    onDuplicate={onDuplicate}
                                    showGhostMode={showGhostMode}
                                />
                            ))
                        )}
                    </Reorder.Group>
                </div>
            )}
        </div>
    );
};

export const BudgetEditorGrid = ({
    items,
    chapters,
    onReorder,
    onUpdate,
    onRemove,
    onDuplicate,
    onAddChapter,
    onRemoveChapter,
    onRenameChapter,
    onReorderChapters,
    showGhostMode
}: BudgetEditorGridProps) => {

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {chapters.map((chapterName) => (
                <ChapterGroup
                    key={chapterName}
                    chapterName={chapterName}
                    items={items.filter(i => i.chapter === chapterName)}
                    onReorder={(newChapterItems) => onReorder(newChapterItems)}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    onDuplicate={onDuplicate}
                    onRename={(newName) => onRenameChapter(chapterName, newName)}
                    onDelete={() => onRemoveChapter(chapterName)}
                    showGhostMode={showGhostMode}
                />
            ))}

            <Button
                variant="outline"
                className="w-full border-dashed py-6 text-slate-500 hover:text-primary hover:border-primary/50 hover:bg-primary/5"
                onClick={() => onAddChapter(`Nuevo Capítulo ${chapters.length + 1}`)}
            >
                <FolderPlus className="w-5 h-5 mr-2" />
                Añadir Nuevo Capítulo
            </Button>
        </div>
    );
};
