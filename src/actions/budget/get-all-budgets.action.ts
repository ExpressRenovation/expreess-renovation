'use server';

import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { Budget } from '@/backend/budget/domain/budget';

const budgetRepository = new BudgetRepositoryFirestore();

export async function getAllBudgetsAction(): Promise<Budget[]> {
    try {
        const budgets = await budgetRepository.findAll();
        return budgets;
    } catch (error) {
        console.error('Error fetching budgets:', error);
        return [];
    }
}
