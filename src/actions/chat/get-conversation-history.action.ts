'use server';

import { FirestoreMessageRepository } from '@/backend/chat/infrastructure/firestore-message-repository';
import { GetConversationHistoryUseCase } from '@/backend/chat/application/get-conversation-history.usecase';

export async function getConversationHistoryAction(conversationId: string) {
    try {
        const messageRepo = new FirestoreMessageRepository();
        const useCase = new GetConversationHistoryUseCase(messageRepo);

        const messages = await useCase.execute(conversationId);

        return {
            success: true,
            messages: messages.map(m => ({
                id: m.id,
                content: m.content,
                // Ensure sender type is correctly passed for UI logic
                sender: m.sender,
                createdAt: m.createdAt.toISOString(),
                attachments: m.attachments || [],
                type: m.type
            }))
        };

    } catch (error: any) {
        console.error("Error getting conversation history:", error);
        return { success: false, error: error.message };
    }
}
