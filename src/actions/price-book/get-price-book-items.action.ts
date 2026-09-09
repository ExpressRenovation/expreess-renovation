
'use server';

import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';
import { getFirestore } from 'firebase-admin/firestore';
import { PriceBookItem } from '@/backend/price-book/domain/price-book-item';

export async function getPriceBookItems(year: number, limitCount: number = 50) {
    try {
        console.log(`[Action] Fetching price book items (kind=item, limit: ${limitCount})...`);
        initFirebaseAdminApp();
        const db = getFirestore();
        // Fuente única: `price_book_2025` (gemini-embedding-2). Se filtra por
        // `kind=='item'` (excluye breakdowns); NO por `year` (el esquema nuevo no
        // tiene ese campo). `unit` se deriva de `unit_raw`/`unit_normalized`.
        const collectionName = 'price_book_2025';
        const collectionRef = db.collection(collectionName);

        console.log(`[Action] Querying Firestore...`);
        const snapshot = await collectionRef
            .where('kind', '==', 'item')
            .select('code', 'description', 'unit_raw', 'unit_normalized', 'priceTotal', 'kind', 'chapter', 'section', 'createdAt', 'updatedAt', 'priceLabor', 'priceMaterial', 'breakdown')
            .limit(limitCount)
            .get();

        console.log(`[Action] Query complete. Found ${snapshot.size} docs.`);





        // ...

        const items = snapshot.docs.map(doc => {
            const data = doc.data() as PriceBookItem; // Cast to known type

            // Helper to safe convert timestamps
            const toDate = (val: any) => {
                if (!val) return null;
                if (val.toDate) return val.toDate(); // Firestore Timestamp
                if (val instanceof Date) return val;
                return new Date(val); // String or number
            };

            return {
                ...data,
                id: doc.id,
                // unit no existe en price_book_2025 → derivar de unit_raw/unit_normalized.
                unit: (data as any).unit ?? (data as any).unit_raw ?? (data as any).unit_normalized ?? 'ud',
                embedding: undefined, // Don't send heavy vectors to client
                createdAt: toDate(data.createdAt),
                updatedAt: toDate(data.updatedAt),
            } as PriceBookItem;
        });

        // Get total count (solo partidas)
        const countQuery = collectionRef.where('kind', '==', 'item').count();
        const countSnapshot = await countQuery.get();

        // Final separate sanitization to ensure no non-POJOs leak
        return JSON.parse(JSON.stringify({
            success: true,
            items,
            total: countSnapshot.data().count
        }));
    } catch (error: any) {
        console.error("Error fetching price book items:", error);
        return { success: false, error: error.message };
    }
}
