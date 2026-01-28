'use server';

import { FirestorePriceBookRepository } from '@/backend/price-book/infrastructure/firestore-price-book-repository';
import { SearchPriceBookService } from '@/backend/price-book/application/search-price-book-service';
import { PriceBookItem } from '@/backend/price-book/domain/price-book-item';

export async function searchPriceBookAction(query: string): Promise<{ success: boolean; data?: PriceBookItem[]; error?: string }> {
    try {
        if (!query || query.trim().length === 0) {
            return { success: true, data: [] };
        }

        const repository = new FirestorePriceBookRepository();
        const service = new SearchPriceBookService(repository);

        console.log(`[Action] Searching for: "${query}"`);
        const results = await service.execute(query, 15); // Limit to 15 items

        // Serialize results to ensure they are passable to Client Components (Dates to strings/numbers if needed)
        // Next.js Server Actions handle Dates, but let's be safe if we encounter issues.
        // For now, let's pass as is, assuming Next.js serialization works for standard objects.
        const serializedResults = results.map(item => ({
            ...item,
            // Convert everything to simple types if necessary
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined
        }));

        return { success: true, data: serializedResults };
    } catch (error) {
        console.error('[Action] Error searching price book:', error);
        return { success: false, error: 'Failed to search price book.' };
    }
}
