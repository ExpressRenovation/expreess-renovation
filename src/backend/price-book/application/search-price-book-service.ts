
import { PriceBookRepository } from "../domain/price-book-repository";
import { vertexQueryEmbedder } from '@/backend/ai/shared/vertex-embedding.adapter';
import { PriceBookItem } from "../domain/price-book-item";

export class SearchPriceBookService {
    constructor(private repository: PriceBookRepository) { }

    async execute(query: string, limit: number = 10, year?: number): Promise<PriceBookItem[]> {
        console.log(`[SearchService] Generating embedding for query: "${query}"`);

        // 1. Embedding de la query con gemini-embedding-2 (RETRIEVAL_QUERY, 768) —
        // mismo modelo que los docs de price_book_2025 para que el coseno sea válido.
        const vector = await vertexQueryEmbedder.embedText(query);

        console.log(`[SearchService] Generated vector length: ${vector?.length}`);

        if (!vector || vector.length === 0) {
            console.error("[SearchService] Error: Generated vector is empty.");
            return [];
        }

        // 2. Perform Vector Search
        return this.repository.searchByVector(vector, limit, year, query);
    }
}
