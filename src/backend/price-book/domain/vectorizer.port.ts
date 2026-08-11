
/**
 * Port for the Vectorization Service.
 * Decouples the domain/application from the specific AI provider (Vertex, OpenAI, etc).
 */
export interface VectorizerPort {
    /**
     * Generate an embedding vector for a given text.
     */
    embedText(text: string): Promise<number[]>;

    /**
     * Generate embeddings for multiple texts in batch.
     */
    embedMany(texts: string[]): Promise<number[][]>;
}
