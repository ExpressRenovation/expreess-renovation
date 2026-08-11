
import { MessageRepository } from '@/backend/chat/domain/message-repository';
import { ConversationRepository } from '@/backend/chat/domain/conversation-repository';
import { Message, MessageType, Attachment } from '@/backend/chat/domain/message';
import { Participant } from '@/backend/chat/domain/conversation';
import { v4 as uuidv4 } from 'uuid';

export interface SendMessageRequest {
    conversationId: string;
    sender: Participant;
    content: string;
    type?: MessageType;
    attachments?: Attachment[];
}

export class SendMessageUseCase {
    constructor(
        private messageRepo: MessageRepository,
        private conversationRepo: ConversationRepository
    ) { }

    async execute(request: SendMessageRequest): Promise<Message> {
        const conversation = await this.conversationRepo.findById(request.conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${request.conversationId} not found`);
        }

        const message = Message.create(
            uuidv4(),
            request.conversationId,
            request.sender,
            request.content,
            request.type || 'text',
            request.attachments || []
        );

        await this.messageRepo.save(message);

        // Update conversation metadata
        conversation.markAsUpdated();
        conversation.addParticipant(request.sender);

        // Update status based on sender
        if (request.sender.type === 'lead') {
            conversation.setStatus('waiting_for_admin');
            // Here we could increment unread count for admin
        } else if (request.sender.type === 'admin' || request.sender.type === 'assistant') {
            conversation.setStatus('waiting_for_user');
        }

        await this.conversationRepo.save(conversation);

        return message;
    }
}
