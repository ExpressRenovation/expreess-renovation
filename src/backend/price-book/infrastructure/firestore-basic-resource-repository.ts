import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';
import { getFirestore } from 'firebase-admin/firestore';
import { BasicResource } from '@/backend/price-book/domain/basic-resource';
import { BasicResourceRepository } from '@/backend/price-book/domain/basic-resource-repository';

export class FirestoreBasicResourceRepository implements BasicResourceRepository {
    private db;
    private collection;

    constructor() {
        initFirebaseAdminApp();
        this.db = getFirestore();
        this.collection = this.db.collection('basic_resources');
    }

    async findById(id: string): Promise<BasicResource | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        return doc.data() as BasicResource;
    }

    async findByCode(code: string): Promise<BasicResource | null> {
        const snapshot = await this.collection.where('code', '==', code).limit(1).get();
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as BasicResource;
    }

    async save(resource: BasicResource): Promise<void> {
        // Use code as ID for easy deduplication? 
        // Or keep auto-ID? Ideally code is unique in price books usually.
        // Let's use code as ID to enforce uniqueness and easy lookup.
        const id = resource.code.replace(/\//g, '_'); // Sanitize code for ID
        await this.collection.doc(id).set({
            ...resource,
            updatedAt: new Date()
        }, { merge: true });
    }

    async saveBatch(resources: BasicResource[]): Promise<void> {
        const batch = this.db.batch();

        resources.forEach(resource => {
            const id = resource.code.replace(/\//g, '_');
            const docRef = this.collection.doc(id);
            batch.set(docRef, {
                ...resource,
                updatedAt: new Date()
            }, { merge: true });
        });

        await batch.commit();
    }
}
