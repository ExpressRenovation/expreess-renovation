
import { VectorizerPort } from '../../domain/vectorizer.port';
import { genkit } from 'genkit';
import { googleAI, textEmbedding004 } from '@genkit-ai/googleai';

export class GenkitVectorizerAdapter implements VectorizerPort {
    private ai;

    constructor() {
        // Initialize Genkit with Google AI plugin
        // Note: In a production app, the genkit instance might be injected or a singleton
        this.ai = genkit({
            plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
        });
    }

    async embedText(text: string): Promise<number[]> {
        if (!text) throw new Error("Text to embed cannot be empty");

        const result = await this.ai.embed({
            embedder: textEmbedding004,
            content: text,
        });

        // Handle array return type from genkit
        return Array.isArray(result) ? result[0].embedding : (result as any).embedding;
    }

    async embedMany(texts: string[]): Promise<number[][]> {
        if (!texts || texts.length === 0) return [];

        const result = await this.ai.embedMany({
            embedder: textEmbedding004,
            content: texts,
        });

        return result.map(r => r.embedding);
    }
}
