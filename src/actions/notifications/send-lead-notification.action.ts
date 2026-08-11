'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';
import { ADMIN_NOTIFICATION_EMAIL } from '@/lib/contact-info';

export type LeadNotificationField = { label: string; value: string | number | null | undefined };

export type LeadNotificationInput = {
    /** Subject line, e.g. "Nuevo Lead: OBRA NUEVA". */
    subject: string;
    /** Rendered as a definition list in the email body. */
    fields: LeadNotificationField[];
    /** Free-text block appended after the fields. */
    notes?: string;
    /** Overrides the recipient. Used by the "test email" toggle in the admin forms. */
    to?: string;
    /** Reply-To, normally the lead's own address. */
    replyTo?: string;
};

function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Queues a lead-notification email for the Firebase "Trigger Email" extension.
 *
 * This runs on the server with the Admin SDK deliberately. The public forms used
 * to write straight into the `mail` collection from the browser, which forced
 * the Firestore rule `match /mail/{id} { allow create: if true; }` — and with
 * the repository public, that turned the project into an open email relay:
 * anyone could queue mail from the company's sender. With the write moved here,
 * that rule can be closed.
 */
export async function sendLeadNotification(input: LeadNotificationInput): Promise<{ success: boolean }> {
    try {
        initFirebaseAdminApp();
        const db = getFirestore();

        const rows = input.fields
            .filter((f) => f.value !== undefined && f.value !== null && `${f.value}`.trim() !== '')
            .map((f) => `<li><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(f.value)}</li>`)
            .join('');

        await db.collection('mail').add({
            to: [input.to?.trim() || ADMIN_NOTIFICATION_EMAIL],
            ...(input.replyTo ? { replyTo: input.replyTo } : {}),
            message: {
                subject: input.subject,
                html: `
                    <h1>${escapeHtml(input.subject)}</h1>
                    <ul>${rows}</ul>
                    ${input.notes ? `<h2>Detalles</h2><p>${escapeHtml(input.notes).replace(/\n/g, '<br />')}</p>` : ''}
                `,
            },
            createdAt: FieldValue.serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        console.error('[sendLeadNotification] Failed to queue notification:', error);
        return { success: false };
    }
}
