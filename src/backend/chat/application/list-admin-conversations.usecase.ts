
import { ConversationRepository } from '@/backend/chat/domain/conversation-repository';
import { Conversation } from '@/backend/chat/domain/conversation';

export class ListAdminConversationsUseCase {
    constructor(private conversationRepo: ConversationRepository) { }

    async execute(limit: number = 20): Promise<Conversation[]> {
        // For admin, we primarily want active conversations or recently updated ones
        // We could merge findActive and findRecent or just use findRecent for now as a catch-all list
        return this.conversationRepo.findRecent(limit);
    }
}
