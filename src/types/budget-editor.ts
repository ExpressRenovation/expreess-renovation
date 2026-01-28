import { BudgetLineItem, BudgetCostBreakdown } from '@/backend/budget/domain/budget';

export interface EditableBudgetLineItem extends BudgetLineItem {
    id: string; // Ensure ID is present for dragging
    isEditing: boolean;
    isDirty: boolean;
    valErrors?: Record<string, string>;
}

export interface BudgetEditorState {
    items: EditableBudgetLineItem[];
    costBreakdown: BudgetCostBreakdown;
    history: {
        items: EditableBudgetLineItem[];
        timestamp: number;
    }[];
    historyIndex: number;
    hasUnsavedChanges: boolean;
    lastSavedAt?: Date;
    isSaving: boolean;
    chapters: string[]; // List of chapter names in order
}

export type BudgetEditorAction =
    | { type: 'SET_ITEMS'; payload: EditableBudgetLineItem[] }
    | { type: 'UPDATE_ITEM'; payload: { id: string; changes: Partial<EditableBudgetLineItem> } }
    | { type: 'ADD_ITEM'; payload: EditableBudgetLineItem }
    | { type: 'DUPLICATE_ITEM'; payload: string }
    | { type: 'REMOVE_ITEM'; payload: string }
    | { type: 'REORDER_ITEMS'; payload: EditableBudgetLineItem[] }
    | { type: 'ADD_CHAPTER'; payload: string }
    | { type: 'REMOVE_CHAPTER'; payload: string }
    | { type: 'RENAME_CHAPTER'; payload: { oldName: string; newName: string } }
    | { type: 'REORDER_CHAPTERS'; payload: string[] }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'SAVE_START' }
    | { type: 'SAVE_SUCCESS'; payload: Date }
    | { type: 'SAVE_ERROR' };
