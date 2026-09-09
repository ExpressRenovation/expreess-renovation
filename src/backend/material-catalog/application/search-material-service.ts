
import { MaterialCatalogRepository } from '../domain/material-catalog-repository';
import { MaterialItem } from '../domain/material-item';
import { vertexQueryEmbedder } from '@/backend/ai/shared/vertex-embedding.adapter';

export class SearchMaterialService {
    constructor(
        private repository: MaterialCatalogRepository
    ) { }

    async search(query: string, limit: number = 10): Promise<MaterialItem[]> {
        // Hybrid strategy:
        // 1. If query looks like a SKU, search by SKU first
        if (/^\d{5,10}$/.test(query)) {
            const bySku = await this.repository.findBySku(query);
            if (bySku) return [bySku];
        }

        // 2. Semantic Search — embedding de la query con gemini-embedding-2
        // (RETRIEVAL_QUERY, 768), mismo modelo que los vectores de material_catalog.
        try {
            const vector = await vertexQueryEmbedder.embedText(query);
            return await this.repository.searchByVector(vector, limit);
        } catch (error) {
            console.error("Vector search failed, falling back to text:", error);
            return await this.repository.searchByText(query, limit);
        }
    }
}
