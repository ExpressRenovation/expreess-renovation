'use server';

import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { Budget } from '@/backend/budget/domain/budget';
import { revalidatePath } from 'next/cache';

const budgetRepository = new BudgetRepositoryFirestore();

export async function updateBudgetAction(id: string, updates: Partial<Budget>): Promise<{ success: boolean; error?: string }> {
    try {
        const existingBudget = await budgetRepository.findById(id);

        if (!existingBudget) {
            return { success: false, error: 'Presupuesto no encontrado' };
        }

        const updatedBudget: Budget = {
            ...existingBudget,
            ...updates,
            updatedAt: new Date()
        };

        await budgetRepository.save(updatedBudget);

        revalidatePath(`/dashboard/admin/budgets/${id}/edit`);
        revalidatePath('/dashboard/admin/budgets');

        return { success: true };
    } catch (error) {
        console.error(`Error updating budget ${id}:`, error);
        return { success: false, error: 'Error al guardar el presupuesto' };
    }
}
