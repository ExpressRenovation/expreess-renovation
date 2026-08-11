'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/backend/shared/infrastructure/firebase/admin-app';
import { ADMIN_NOTIFICATION_EMAIL } from '@/lib/contact-info';
import { contactMessageSchema, type ContactMessageValues } from '@/components/contact/schema';

type SubmitContactResult = {
    success: boolean;
    message?: string;
    errors?: Record<string, string[] | undefined>;
};

/** Escapes user input before it is interpolated into the notification HTML. */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export async function submitContactMessage(
    data: ContactMessageValues,
    locale = 'es'
): Promise<SubmitContactResult> {
    const parsed = contactMessageSchema.safeParse(data);

    if (!parsed.success) {
        return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    // Honeypot tripped: pretend it worked so the bot does not retry.
    if (parsed.data.website) {
        return { success: true };
    }

    const { name, email, message } = parsed.data;

    try {
        initFirebaseAdminApp();
        const db = getFirestore();

        await db.collection('contactMessages').add({
            name,
            email,
            message,
            locale,
            status: 'new',
            source: 'web_contact_form',
            createdAt: FieldValue.serverTimestamp(),
        });

        // Delivered by the Firebase "Trigger Email" extension, same as the
        // budget forms.
        await db.collection('mail').add({
            to: [ADMIN_NOTIFICATION_EMAIL],
            replyTo: email,
            message: {
                subject: `Nuevo mensaje de contacto: ${name}`,
                html: `
                    <h1>Nuevo mensaje desde el formulario de contacto</h1>
                    <ul>
                        <li><strong>Nombre:</strong> ${escapeHtml(name)}</li>
                        <li><strong>Email:</strong> ${escapeHtml(email)}</li>
                        <li><strong>Idioma:</strong> ${escapeHtml(locale)}</li>
                    </ul>
                    <h2>Mensaje</h2>
                    <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
                `,
            },
        });

        return { success: true };
    } catch (error) {
        console.error('[submitContactMessage] Failed to persist contact message:', error);
        return {
            success: false,
            message: 'No hemos podido enviar tu mensaje. Inténtalo de nuevo en unos minutos.',
        };
    }
}
