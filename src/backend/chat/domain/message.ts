
import { Participant } from './conversation';

export type MessageType = 'text' | 'audio' | 'image' | 'system_event' | 'file';

export interface Attachment {
    type: 'image' | 'file' | 'audio';
    url: string;
    name?: string;
    size?: number;
    mimeType?: string;
}

export class Message {
    constructor(
        public readonly id: string,
        public readonly conversationId: string,
        public readonly sender: Participant,
        public readonly content: string,
        public readonly type: MessageType,
        public readonly attachments: Attachment[] = [],
        public readonly createdAt: Date,
        public readAt: Date | null = null,
        public metadata: Record<string, any> = {}
    ) { }

    static create(
        id: string,
        conversationId: string,
        sender: Participant,
        content: string,
        type: MessageType = 'text',
        attachments: Attachment[] = []
    ): Message {
        return new Message(
            id,
            conversationId,
            sender,
            content,
            type,
            attachments,
            new Date()
        );
    }

    markAsRead(): void {
        this.readAt = new Date();
    }
}
