
import { PriceBookRepository } from '../../domain/price-book.repository';
import { PriceBookItem } from '../../domain/price-book-item';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';
import { FieldValue } from 'firebase-admin/firestore';



export class FirestorePriceBookRepository implements PriceBookRepository {
    private db;
    private collectionName: string;

    // Fuente única: `price_book_2025` (gemini-embedding-2 @768). Reemplaza al
    // legacy `price_book_items` (-001), que se jubila.
    constructor(collectionName: string = 'price_book_2025') {
        initFirebaseAdminApp();
        this.db = getFirestore();
        this.collectionName = collectionName;
    }

    /** Normaliza un doc de price_book_2025 a PriceBookItem (unit ← unit_raw). */
    private static mapDoc(data: any): PriceBookItem {
        return {
            ...data,
            unit: data.unit ?? data.unit_raw ?? data.unit_normalized ?? 'ud',
        } as PriceBookItem;
    }

    async save(item: PriceBookItem): Promise<void> {
        if (!item.code) throw new Error("Item must have a code");

        // Use code as ID for idempotency if possible, or a composite ID
        // For now, assuming ID is passed or we generate one based on code + year?
        // Let's rely on item.id if present, else auto-gen (but auto-gen bad for updates)
        // Strategy: ID = `YEAR_CODE` e.g. "2025_DQC040"

        const id = item.id || `${item.year || 2025}_${item.code}`;

        const docData: any = { ...item };
        if (item.embedding) {
            docData.embedding = FieldValue.vector(item.embedding);
        }

        await this.db.collection(this.collectionName).doc(id).set({
            ...docData,
            id: id,
            updatedAt: new Date(),
        }, { merge: true });
    }

    async saveBatch(items: PriceBookItem[]): Promise<void> {
        const batch = this.db.batch();

        items.forEach(item => {
            const id = item.id || `${item.year || 2025}_${item.code}`;
            const ref = this.db.collection(this.collectionName).doc(id);

            const docData: any = { ...item };
            if (item.embedding) {
                docData.embedding = FieldValue.vector(item.embedding);
            }

            batch.set(ref, {
                ...docData,
                id: id,
                updatedAt: new Date(),
            }, { merge: true });
        });

        await batch.commit();
    }

    async findByCode(code: string): Promise<PriceBookItem | null> {
        const snapshot = await this.db.collection(this.collectionName)
            .where('code', '==', code)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as PriceBookItem;
    }

    async searchBySimilarity(embedding: number[], limit: number = 10): Promise<PriceBookItem[]> {
        // Requires Firestore Vector Search Index. Filtro `kind=='item'` (price_book_2025
        // mezcla partidas y breakdowns) → índice compuesto `kind + embedding`.
        const coll = this.db.collection(this.collectionName);

        const vectorQuery = coll
            .where('kind', '==', 'item')
            .findNearest('embedding', FieldValue.vector(embedding), {
                limit: limit,
                distanceMeasure: 'COSINE',
            });

        const snapshot = await vectorQuery.get();
        return snapshot.docs.map(doc => FirestorePriceBookRepository.mapDoc(doc.data()));
    }

    async count(): Promise<number> {
        const snapshot = await this.db.collection(this.collectionName).count().get();
        return snapshot.data().count;
    }

    async findAll(limit: number = 50, offset: number = 0): Promise<PriceBookItem[]> {
        // Offset is inefficient in Firestore but okay for small admin tools
        // A better approach is cursor-based but for simple "find all" limit/offset is standard interface
        // We will just use limit here for safety.
        const snapshot = await this.db.collection(this.collectionName)
            .limit(limit)
            .offset(offset)
            .get();

        return snapshot.docs.map(doc => doc.data() as PriceBookItem);
    }
}
