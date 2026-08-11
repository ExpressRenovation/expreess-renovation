// src/backend/budget/infrastructure/budget-repository-firestore.ts
import { Budget, BudgetRepository } from '../domain/budget';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';

/**
 * Firestore implementation of the BudgetRepository.
 */
export class BudgetRepositoryFirestore implements BudgetRepository {
  private db;

  constructor() {
    initFirebaseAdminApp();
    this.db = getFirestore();
  }

  private get collection() {
    return this.db.collection('budgets');
  }

  async findById(id: string): Promise<Budget | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    
    // Hydrate chapters from subcollection
    const chaptersSnap = await this.collection.doc(id).collection('chapters').orderBy('order', 'asc').get();
    const chapters = chaptersSnap.docs.map(cDoc => cDoc.data());
    
    return this.mapDocToBudget(doc, chapters);
  }

  async findByLeadId(leadId: string): Promise<Budget[]> {
    const snapshot = await this.collection.where('leadId', '==', leadId).get();
    // For listing, we leave chapters empty to vastly improve bandwidth/speed.
    return snapshot.docs.map(doc => this.mapDocToBudget(doc, []));
  }

  async findAll(): Promise<Budget[]> {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
    // For list views, we do not fetch chapters.
    return snapshot.docs.map(doc => this.mapDocToBudget(doc, []));
  }

  async save(budget: Budget): Promise<void> {
    console.log(`[Infrastructure] Saving budget to Firestore (Subcollections): ${budget.id}`);
    
    const batch = this.db.batch();
    const docRef = this.collection.doc(budget.id);
    
    const { chapters, ...budgetMeta } = budget;

    batch.set(docRef, {
      ...budgetMeta,
      createdAt: budget.createdAt, // Ensure dates are handled
      updatedAt: budget.updatedAt || new Date(),
    }, { merge: true });

    // Wipe existing chapters? For simplicity in this architectural rewrite, we just overwrite them.
    if (chapters && chapters.length > 0) {
      for (const [index, chapter] of chapters.entries()) {
        const chapId = String(chapter.id || `chapter_${index}`);
        const chapRef = docRef.collection('chapters').doc(chapId);
        batch.set(chapRef, chapter);
      }
    }

    await batch.commit();
  }

  async delete(id: string): Promise<void> {
    console.log(`[Infrastructure] Deleting budget from Firestore: ${id}`);
    await this.collection.doc(id).delete();
  }

  private mapDocToBudget(doc: any, injectedChapters?: any[]): Budget {
    const data = doc.data();

    // Map nested collections/arrays if they contain Timestamps
    const renders = data.renders?.map((r: any) => ({
      ...r,
      createdAt: r.createdAt?.toDate ? r.createdAt.toDate() : (new Date(r.createdAt) || new Date())
    })) || [];

    // Map nested telemetry executionLog timestamps if they exist
    let mappedTelemetry = data.telemetry;
    if (mappedTelemetry?.executionLog) {
      mappedTelemetry = {
        ...mappedTelemetry,
        executionLog: mappedTelemetry.executionLog.map((log: any) => ({
          ...log,
          timestamp: log.timestamp?.toDate ? log.timestamp.toDate() : (log.timestamp ? new Date(log.timestamp) : new Date())
        }))
      };
    }

    return {
      ...data,
      id: doc.id,
      renders: renders,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (new Date(data.createdAt) || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (new Date(data.updatedAt) || new Date()),
      // Prioritize injected subcollections, fallback to existing for legacy data
      chapters: injectedChapters || data.chapters || [],
      telemetry: mappedTelemetry,
    } as Budget;
  }
}
