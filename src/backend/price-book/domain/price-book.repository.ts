
import { PriceBookItem } from './price-book-item';

export interface PriceBookRepository {
    /**
     * Save a single item or update it.
     */
    save(item: PriceBookItem): Promise<void>;

    /**
     * Save multiple items in a batch.
     */
    saveBatch(items: PriceBookItem[]): Promise<void>;

    /**
     * Find an item by its unique code.
     */
    findByCode(code: string): Promise<PriceBookItem | null>;

    /**
     * Find items capable of vector search. 
     * In a pure port, we might just say "search" but here we specifically need 
     * to support vector similarity.
     */
    searchBySimilarity(embedding: number[], limit?: number): Promise<PriceBookItem[]>;

    /**
     * Count total items.
     */
    count(): Promise<number>;

    /**
     * List items with pagination (optional, useful for admin).
     */
    findAll(limit?: number, offset?: number): Promise<PriceBookItem[]>;
}
