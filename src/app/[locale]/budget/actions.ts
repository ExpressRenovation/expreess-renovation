'use server';

import { DetailedFormValues, detailedFormSchema } from '@/components/budget-request/schema';
import { BudgetNarrativeBuilder } from '@/backend/budget/domain/budget-narrative-builder';
import { FormToSpecsMapper } from '@/backend/budget/application/mappers/form-to-specs.mapper';
import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { Budget } from '@/backend/budget/domain/budget';

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
        id?: string;
    };
    errors?: any;
};

const budgetRepository = new BudgetRepositoryFirestore();

export async function submitBudgetRequest(data: DetailedFormValues): Promise<SubmitBudgetResult> {
    try {
        const parsed = detailedFormSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, errors: parsed.error.flatten() };
        }

        const validData = parsed.data;

        // Map form values to domain specs
        const specs = FormToSpecsMapper.map(validData);
        // Build narrative from specs
        const narrative = BudgetNarrativeBuilder.build(specs);
        console.log('--- Generated Budget Narrative ---');
        console.log(narrative);
        console.log('----------------------------------');

        // Persist Budget (Skipping AI generation as per new workflow)
        const budgetId = generateId();

        const clientSnapshot = {
            name: validData.name,
            email: validData.email,
            phone: validData.phone,
            address: validData.address
        };

        const newBudget: Budget = {
            id: budgetId,
            leadId: generateId(),
            clientSnapshot,
            status: 'draft', // Initial status, ready for admin to trigger AI
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
            specs,
            chapters: [{
                id: generateId(),
                name: "Presupuesto Base (A generar por IA)",
                order: 0,
                items: [],
                totalPrice: 0
            }],
            costBreakdown: {
                materialExecutionPrice: 0,
                overheadExpenses: 0,
                industrialBenefit: 0,
                tax: 0,
                globalAdjustment: 0,
                total: 0
            },
            totalEstimated: 0
        };

        await budgetRepository.save(newBudget);
        console.log(`[Action] Budget persisted with ID: ${budgetId}`);

        return {
            success: true,
            message: 'Presupuesto preliminar generado correctamente.',
            narrative,
            budgetResult: {
                lineItems: [],
                totalEstimated: 0,
                id: budgetId
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
