
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

async function main() {
    console.log("Triggering Vector Index Creation Link...");

    try {
        // Initialize App
        initFirebaseAdminApp();
        const db = getFirestore();

        // Dummy 768-dim vector (zeros)
        const dummyVector = Array(768).fill(0.1);

        console.log("Attempting vector search on 'price_book_items'...");

        // Attempt search
        const collection = db.collection('price_book_items');
        // @ts-ignore - Admin SDK typing might need update for vector, but runtime works
        const results = await collection.findNearest('embedding', FieldValue.vector(dummyVector), {
            limit: 1,
            distanceMeasure: 'COSINE'
        }).get();

        console.log("Success? (Unexpected if index missing):", results.size);

    } catch (error: any) {
        console.log("\n---------------------------------------------------");
        console.log("EXPECTED ERROR CAUGHT (This is good!)");
        console.log("---------------------------------------------------");
        // Extract the link if possible, or just print the whole message
        console.log(error.message);

        if (error.details && error.details.includes('https://console.firebase.google.com')) {
            console.log("\n>>> CLICK THIS LINK TO CREATE THE INDEX: <<<");
            // Regex to extract link could be added, but printing message is usually enough
        }
        console.log("---------------------------------------------------\n");
    }
}

main();
