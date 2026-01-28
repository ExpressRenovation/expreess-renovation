'use server';

import { DetailedFormValues, detailedFormSchema } from '@/components/budget-request/schema';
import { buildBudgetNarrative } from '@/backend/budget/domain/budget-narrative-builder';
import { generateBudgetFlow } from '@/backend/ai/flows/budget/generate-budget.flow';
import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { Budget } from '@/backend/budget/domain/budget';
// import { auth } from '@/backend/shared/infrastructure/auth';

// Assuming some auth helper exists or we use currentUser from clerk/next-auth,
// but for now let's leave userId optional or check header if available.
// Ideally, we should use a session helper. Let's use a dummy ID or null for now if no auth.

// We need a simple ID generator since uuid might not be available
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export type SubmitBudgetResult = {
    success: boolean;
    message?: string;
    narrative?: string;
    budgetResult?: {
        lineItems: any[];
        totalEstimated: number;
        costBreakdown?: {
            materialExecutionPrice: number;
            overheadExpenses: number;
            industrialBenefit: number;
            tax: number;
            globalAdjustment: number;
            total: number;
        };
        id?: string; // Return the ID of the saved budget
    };
    errors?: any;
};

const budgetRepository = new BudgetRepositoryFirestore();

export async function submitBudgetRequest(data: DetailedFormValues): Promise<SubmitBudgetResult> {
    try {
        // 1. Validate Data on Server
        const parsed = detailedFormSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, errors: parsed.error.flatten() };
        }

        const validData = parsed.data;

        // 2. Build Narrative
        const narrative = buildBudgetNarrative(validData);
        console.log('--- Generated Budget Narrative ---');
        console.log(narrative);
        console.log('----------------------------------');

        // 3. Call AI Flow
        // Calls the orchestrator: Extraction -> Search -> Pricing
        const budgetResult = await generateBudgetFlow({ userRequest: narrative });

        // 4. Persist Budget
        const budgetId = generateId();

        // TODO: Get actual logged in user ID if available
        // const session = await auth(); 
        const userId = undefined;

        const newBudget: Budget = {
            id: budgetId,
            ...(userId ? { userId } : {}),
            status: 'draft', // Initial status
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
            clientData: validData,
            lineItems: budgetResult.lineItems.map((item, index) => ({
                ...item,
                id: generateId(), // Ensure items have IDs
                isEditing: false
            })),
            costBreakdown: budgetResult.costBreakdown || {
                materialExecutionPrice: 0,
                overheadExpenses: 0,
                industrialBenefit: 0,
                tax: 0,
                globalAdjustment: 0,
                total: budgetResult.totalEstimated
            },
            totalEstimated: budgetResult.totalEstimated
        };

        await budgetRepository.save(newBudget);
        console.log(`[Action] Budget persisted with ID: ${budgetId}`);

        return {
            success: true,
            message: 'Presupuesto preliminar generado correctamente.',
            narrative,
            budgetResult: {
                ...budgetResult,
                id: budgetId // Return ID to client so we can redirect/edit if needed
            }
        };

    } catch (error: any) {
        console.error('Error processing budget request:', error);
        return {
            success: false,
            message: 'Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.',
        };
    }
}
