'use server';

import { vertexDocumentEmbedder } from '@/backend/ai/shared/vertex-embedding.adapter';
import { FirestorePriceBookRepository } from '@/backend/price-book/infrastructure/firestore-price-book-repository';
import { FirestorePendingPriceItemRepository } from '@/backend/budget/infrastructure/firestore-pending-item.repository';
import { PendingPriceItem } from '@/backend/budget/domain/pending-price-item';
import { revalidatePath } from 'next/cache';

const priceBookRepo = new FirestorePriceBookRepository();
const pendingRepo = new FirestorePendingPriceItemRepository();

export interface ApproveItemInput {
    id: string; // Pending ID
    finalCode: string;
    finalDescription: string;
    finalPrice: number;
    finalUnit: string;
}

export async function approvePendingItemAction(input: ApproveItemInput) {
    try {
        console.log(`[Action] Approving item ${input.id}...`);

        // 1. Embedding con gemini-embedding-2 (RETRIEVAL_DOCUMENT, 768) — se indexa
        // como doc en price_book_2025.
        const embedding = await vertexDocumentEmbedder.embedText(input.finalDescription);

        // 2. Create Price Book Item — forma canónica de price_book_2025 (`kind:'item'`
        // + `unit_raw`) para que entre en el filtro `kind=='item'` de las búsquedas.
        await priceBookRepo.saveBatch([{
            id: input.finalCode,
            code: input.finalCode,
            description: input.finalDescription,
            unit: input.finalUnit,
            unit_raw: input.finalUnit,
            kind: 'item',
            priceTotal: input.finalPrice,
            priceLabor: 0, // Default breakdown
            priceMaterial: input.finalPrice,
            year: 2025,
            embedding: embedding,
            searchKeywords: input.finalDescription.toLowerCase().split(' '),
            createdAt: new Date()
        }]);

        // 3. Mark Pending as Approved
        await pendingRepo.updateStatus(input.id, 'approved');

        revalidatePath('/dashboard/admin/pending-items');
        return { success: true };
    } catch (error) {
        console.error("Error approving item:", error);
        return { success: false, error: 'Failed' };
    }
}

export async function rejectPendingItemAction(id: string) {
    await pendingRepo.updateStatus(id, 'rejected');
    revalidatePath('/dashboard/admin/pending-items');
}

export async function getPendingItemsAction() {
    return await pendingRepo.findAllPending();
}
