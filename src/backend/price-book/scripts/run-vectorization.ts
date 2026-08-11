
import * as dotenv from 'dotenv';
dotenv.config();

import { FirestorePriceBookRepository } from '../infrastructure/firestore/firestore-price-book.repository';
// import { GenkitVectorizerAdapter } from '../infrastructure/ai/genkit-vectorizer.adapter';
import { RestApiVectorizerAdapter } from '../infrastructure/ai/rest-api-vectorizer.adapter';
import { VectorizePriceBookUseCase } from '../application/vectorize-price-book.use-case';

async function main() {
    console.log("🚀 Initializing Price Book Vectorization...");

    try {
        const repository = new FirestorePriceBookRepository();
        console.log("✅ Firestore Repository Initialized");

        // Use RestApi adapter as fallback due to Genkit configuration issues
        const vectorizer = new RestApiVectorizerAdapter();
        console.log("✅ RestApi/Gemini Adapter Initialized");

        const useCase = new VectorizePriceBookUseCase(repository, vectorizer);

        console.log("⚙️ Starting processing...");

        // Force re-processing if needed, or just process new/missing ones
        // execute(batchSize, force)
        const result = await useCase.execute(10, true);
        console.log("✅ Vectorization Complete!");
        console.log(`📊 Processed: ${result.processed}, Total Items: ${result.total}`);
    } catch (error) {
        console.error("❌ Error during vectorization:", error);
        process.exit(1);
    }
}

main().catch(console.error);
