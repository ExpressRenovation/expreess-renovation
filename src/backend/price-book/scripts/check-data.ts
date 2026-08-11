
import * as dotenv from 'dotenv';
dotenv.config();

import { FirestorePriceBookRepository } from '../infrastructure/firestore/firestore-price-book.repository';

async function main() {
    console.log("🔍 Checking Firestore Data...");

    try {
        const repository = new FirestorePriceBookRepository();

        // 1. Check a few items to see if they have embeddings
        const items = await repository.findAll(5);

        console.log(`Found ${items.length} items.`);

        let embeddedCount = 0;
        items.forEach(item => {
            const hasEmbedding = item.embedding && item.embedding.length > 0;
            if (hasEmbedding) embeddedCount++;
            console.log(`Item ${item.code}: ID=${item.id}, Embedding Length=${item.embedding?.length || 0}`);
        });

        console.log(`Summary: ${embeddedCount}/${items.length} items have embeddings.`);

        // 2. Count total items
        const total = await repository.count();
        console.log(`Total items in collection: ${total}`);

    } catch (error) {
        console.error("❌ Check failed:", error);
    }
}

main();
