
import * as dotenv from 'dotenv';
dotenv.config();
import { RestApiVectorizerAdapter } from '../infrastructure/ai/rest-api-vectorizer.adapter';

async function main() {
    try {
        const adapter = new RestApiVectorizerAdapter();
        const vector = await adapter.embedText("Hello world");
        console.log("Vector length:", vector.length);
    } catch (e) {
        console.error(e);
    }
}
main();
