
import { ConversationRepository } from '@/backend/chat/domain/conversation-repository';
import { Conversation } from '@/backend/chat/domain/conversation';
import { v4 as uuidv4 } from 'uuid';

export class GetOrCreateConversationUseCase {
    constructor(private conversationRepo: ConversationRepository) { }

    async execute(leadId: string, leadName?: string): Promise<Conversation> {
        // 1. Try to find existing conversation for this lead
        const conversations = await this.conversationRepo.findByLeadId(leadId);

        // Return most recent active one if exists
        const activeConversation = conversations.find(c => c.status !== 'archived');
        if (activeConversation) {
            return activeConversation;
        }

        // 2. Create new conversation
        const newConversation = Conversation.create(uuidv4(), leadId, leadName);
        await this.conversationRepo.save(newConversation);

        return newConversation;
    }
}
