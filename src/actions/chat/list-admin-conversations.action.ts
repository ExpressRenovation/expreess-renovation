'use server';

import { FirestoreConversationRepository } from '@/backend/chat/infrastructure/firestore-conversation-repository';
import { ListAdminConversationsUseCase } from '@/backend/chat/application/list-admin-conversations.usecase';

export async function listAdminConversationsAction(limit: number = 20) {
    try {
        const conversationRepo = new FirestoreConversationRepository();
        const useCase = new ListAdminConversationsUseCase(conversationRepo);

        const conversations = await useCase.execute(limit);

        return {
            success: true,
            conversations: conversations.map(c => ({
                id: c.id,
                participants: c.participants,
                status: c.status,
                updatedAt: c.updatedAt.toISOString(),
                unreadCount: c.unreadCount,
                leadName: c.participants.find(p => p.type === 'lead')?.name || 'Desconocido'
            }))
        };
    } catch (error: any) {
        console.error("Error listing admin conversations:", error);
        return { success: false, error: error.message };
    }
}
