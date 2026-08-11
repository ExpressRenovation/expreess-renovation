
export type IngestionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IngestionJob {
    id: string;
    fileName: string;
    fileUrl: string;
    status: IngestionStatus;
    progress: number; // 0-100
    year?: number;
    error?: string;
    logs?: string[];
    totalItems?: number;
    currentMeta?: {
        pageNumber?: number;
        totalPages?: number;
        currentChapter?: string;
        currentSection?: string;
        lastItem?: { code: string; description: string; price: number };
    };
    createdAt: Date;
    updatedAt: Date;
}
