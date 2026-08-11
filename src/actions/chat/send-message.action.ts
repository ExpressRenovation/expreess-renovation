'use server';

import { FirestoreConversationRepository } from '@/backend/chat/infrastructure/firestore-conversation-repository';
import { FirestoreMessageRepository } from '@/backend/chat/infrastructure/firestore-message-repository';
import { SendMessageUseCase } from '@/backend/chat/application/send-message.usecase';
import { Participant } from '@/backend/chat/domain/conversation';

export async function sendMessageAction(
    conversationId: string,
    content: string,
    senderType: 'lead' | 'admin' | 'assistant',
    senderId: string,
    attachments: string[] = []
) {
    try {
        const conversationRepo = new FirestoreConversationRepository();
        const messageRepo = new FirestoreMessageRepository();
        const sendMessageUseCase = new SendMessageUseCase(messageRepo, conversationRepo);

        const sender: Participant = {
            id: senderId,
            type: senderType
        };

        const message = await sendMessageUseCase.execute({
            conversationId,
            sender,
            content,
            attachments: attachments.map(url => ({ type: 'image', url })) // Simplifying for now
        });

        return {
            success: true,
            messageId: message.id
        };

    } catch (error: any) {
        console.error("Error sending message:", error);
        return { success: false, error: error.message };
    }
}
