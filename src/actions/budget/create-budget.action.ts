'use server';

import { BudgetService } from '@/backend/budget/application/budget-service';
import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { BudgetClientData } from '@/components/budget-request/schema';
import { revalidatePath } from 'next/cache';

const budgetRepository = new BudgetRepositoryFirestore();
const budgetService = new BudgetService(budgetRepository);

export async function createBudgetAction(
    type: 'renovation' | 'quick' | 'new_build',
    clientData: BudgetClientData
) {
    try {
        const newBudget = await budgetService.createNewBudget({
            type,
            clientData,
            status: 'pending_review',
            lineItems: [], // Initial empty line items
            costBreakdown: {
                materialExecutionPrice: 0,
                overheadExpenses: 0,
                industrialBenefit: 0,
                tax: 0,
                globalAdjustment: 0,
                total: 0
            },
            totalEstimated: 0,
            updatedAt: new Date(),
            version: 1,
            userId: 'guest', // Or authenticated user ID if available in context
        });

        // Revalidate admin dashboard so new budget appears immediately
        revalidatePath('/dashboard/admin/budgets');

        return { success: true, budgetId: newBudget.id };
    } catch (error) {
        console.error("Error creating budget:", error);
        return { success: false, error: "Failed to create budget" };
    }
}
