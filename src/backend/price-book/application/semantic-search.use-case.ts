
import { PriceBookRepository } from '../domain/price-book.repository';
import { VectorizerPort } from '../domain/vectorizer.port';
import { PriceBookItem } from '../domain/price-book-item'; // or a DTO

export class SemanticSearchUseCase {
    constructor(
        private repository: PriceBookRepository,
        private vectorizer: VectorizerPort
    ) { }

    async execute(query: string, limit: number = 10): Promise<PriceBookItem[]> {
        if (!query.trim()) return [];

        // 1. Vectorize the query
        const queryEmbedding = await this.vectorizer.embedText(query);

        // 2. Search repository by similarity
        return await this.repository.searchBySimilarity(queryEmbedding, limit);
    }
}
