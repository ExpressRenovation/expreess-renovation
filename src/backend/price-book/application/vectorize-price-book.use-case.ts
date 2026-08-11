
import { PriceBookRepository } from '../domain/price-book.repository';
import { VectorizerPort } from '../domain/vectorizer.port';
import { PriceBookItem } from '../domain/price-book-item';

export class VectorizePriceBookUseCase {
    constructor(
        private repository: PriceBookRepository,
        private vectorizer: VectorizerPort
    ) { }

    async execute(batchSize: number = 50, force: boolean = false): Promise<{ processed: number, total: number }> {
        console.log("Starting Vectorization Use Case...");

        // 1. Fetch items
        // In a real app with 1M items, we'd use a cursor or stream. 
        // For ~1600 items, fetching all IDs is fine, or fetching in chunks.
        // Let's fetch all via repository (we might need a findAllStream in repository ideally, but let's use findAll for now or implement a specific 'findUnprocessed')
        // For simplicity with current repo interface, let's just loop with offset.

        const total = await this.repository.count();
        let processed = 0;
        let offset = 0;

        // Logic: Fetch pages, process, save.
        while (processed < total) { // Danger: infinite loop if total decreases (unlikely) or offset doesn't work right
            // Better safeguard:
            if (offset >= total) break;

            const items = await this.repository.findAll(batchSize, offset);
            if (items.length === 0) break;

            const itemsToProcess: PriceBookItem[] = [];
            const textsToEmbed: string[] = [];

            for (const item of items) {
                if (!force && item.embedding && item.embedding.length > 0) {
                    continue; // Skip already vectorized
                }
                itemsToProcess.push(item);
                textsToEmbed.push(this.formatForEmbedding(item));
            }

            if (itemsToProcess.length > 0) {
                console.log(`Vectorizing batch of ${itemsToProcess.length} items...`);
                // Add try/catch block for embedding to prevent whole batch failure
                try {
                    const embeddings = await this.vectorizer.embedMany(textsToEmbed);

                    // Assign embeddings back to items
                    itemsToProcess.forEach((item, index) => {
                        item.embedding = embeddings[index];
                    });

                    // Save batch
                    await this.repository.saveBatch(itemsToProcess);
                    console.log(`Saved batch of ${itemsToProcess.length} items.`);
                } catch (err) {
                    console.error("Error vectorizing batch:", err);
                    // Continue to next batch? or retry? For now continue.
                }
            }

            processed += items.length; // Note: 'processed' here tracks database traversal, not just updated
            offset += items.length;
        }

        return { processed, total };
    }

    private formatForEmbedding(item: PriceBookItem): string {
        // Enriched context for better search
        return `Code: ${item.code || ''}
Chapter: ${item.chapter || ''} ${item.section ? '- ' + item.section : ''}
Description: ${item.description || ''}
Unit: ${item.unit || ''}
Price: ${item.priceTotal} EUR`;
    }
}
