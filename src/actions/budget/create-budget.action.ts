'use server';

import { BudgetService } from '@/backend/budget/application/budget-service';
import { BudgetRepositoryFirestore } from '@/backend/budget/infrastructure/budget-repository-firestore';
import { BudgetClientData } from '@/components/budget-request/schema';
import { ProjectSpecs } from '@/backend/budget/domain/project-specs';
import { revalidatePath } from 'next/cache';

const budgetRepository = new BudgetRepositoryFirestore();
const budgetService = new BudgetService(budgetRepository);

/**
 * Builds the domain specs from whichever public form the request came through.
 *
 * Each form has its own schema, so this reads the fields that actually exist on
 * that shape. Anything the domain has no dedicated field for is folded into
 * `description` rather than dropped — an admin reviewing the budget must see
 * everything the client told us.
 */
function mapFormDataToSpecs(
    type: 'renovation' | 'quick' | 'new_build',
    clientData: BudgetClientData
): ProjectSpecs {
    const data = clientData as any;

    const base: ProjectSpecs = {
        propertyType: data.propertyType ?? (type === 'new_build' ? 'house' : 'flat'),
        interventionType: type === 'new_build' ? 'new_build' : 'partial',
        totalArea: 0,
        qualityLevel: 'medium',
        description: data.description || undefined,
        files: data.files?.length ? data.files : undefined,
    };

    if (type === 'new_build') {
        // Fields with no domain equivalent are preserved in the description.
        const extras = [
            data.plotArea ? `Parcela: ${data.plotArea} m²` : null,
            data.floors ? `Plantas: ${data.floors}` : null,
            data.pool ? 'Incluye piscina' : null,
        ].filter(Boolean);

        return {
            ...base,
            totalArea: Number(data.buildingArea) || 0,
            parking: Boolean(data.garage),
            description: [base.description, ...extras].filter(Boolean).join('\n') || undefined,
        };
    }

    if (type === 'renovation') {
        return {
            ...base,
            propertyType: data.propertyType === 'residential' ? 'flat' : data.propertyType ?? 'flat',
            interventionType: data.projectScope === 'integral' ? 'total' : 'partial',
            totalArea: Number(data.totalAreaM2) || 0,
        };
    }

    // 'quick': the client only describes the job in free text, so there is no
    // reliable area to record.
    return base;
}

export async function createBudgetAction(
    type: 'renovation' | 'quick' | 'new_build',
    clientData: BudgetClientData
) {
    try {
        const specs = mapFormDataToSpecs(type, clientData);

        const newBudget = await budgetService.createNewBudget({
            type,
            status: 'pending_review',
            version: 1,
            updatedAt: new Date(),
            leadId: crypto.randomUUID(), // TODO: Link to real lead
            clientSnapshot: {
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                address: clientData.address
            },
            specs,
            chapters: [], // Initial empty chapters
            costBreakdown: {
                materialExecutionPrice: 0,
                overheadExpenses: 0,
                industrialBenefit: 0,
                tax: 0,
                globalAdjustment: 0,
                total: 0
            },
            totalEstimated: 0,
            source: 'manual',
        });

        // Revalidate admin dashboard so new budget appears immediately
        revalidatePath('/dashboard/admin/budgets');

        return { success: true, budgetId: newBudget.id };
    } catch (error) {
        console.error("Error creating budget:", error);
        return { success: false, error: "Failed to create budget" };
    }
}
