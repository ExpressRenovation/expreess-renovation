
import { MessageRepository } from '@/backend/chat/domain/message-repository';
import { Message } from '@/backend/chat/domain/message';

export class GetConversationHistoryUseCase {
    constructor(private messageRepo: MessageRepository) { }

    async execute(conversationId: string): Promise<Message[]> {
        return this.messageRepo.findByConversationId(conversationId);
    }
}
