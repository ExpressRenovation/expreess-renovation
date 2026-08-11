
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

async function main() {
    initFirebaseAdminApp();
    const db = getFirestore();

    console.log("Checking for 'XSL010m'...");
    const snapshot = await db.collection('price_book_items').where('code', '==', 'XSL010m').get();

    if (snapshot.empty) {
        console.log("Item NOT found. Ingestion failed to persist.");
        return;
    }

    const item = snapshot.docs[0].data();
    console.log("Item found. Embedding present?", !!item.embedding);

    if (!item.embedding) {
        console.log("No embedding on item.");
        return;
    }

    // Inspect embedding
    const emb = item.embedding;
    console.log("Embedding type:", emb.constructor.name);
    // It might be VectorValue or custom object

    console.log("Attempting Vector Search to trigger Index Link...");

    try {
        // We typically need to pass a VectorValue or array
        const vectorParam = FieldValue.vector(Array.isArray(emb) ? emb : (emb.values || emb._values || Array(768).fill(0)));

        const results = await db.collection('price_book_items').findNearest('embedding', vectorParam, {
            limit: 1,
            distanceMeasure: 'COSINE'
        }).get();

        console.log("Vector Search Succeeded!");
        if (!results.empty) {
            console.log("Found match:", results.docs[0].data().code);
            console.log("Distance/Score:", results.docs[0].data()); // Score isn't directly in data(), usually in snapshot metadata if using client SDK, but admin SDK?
        }
    } catch (e: any) {
        console.log("\n============================================");
        console.log("CAPTURED ERROR (Look for Link below):");
        console.log(e.message);
        if (e.details) console.log("Details:", e.details);
        console.log("============================================\n");
    }
}

main();
