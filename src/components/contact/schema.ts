import { z } from 'zod';

export const contactMessageSchema = z.object({
    name: z.string().trim().min(2, 'El nombre es obligatorio.'),
    email: z.string().trim().email('Introduce un correo electrónico válido.'),
    message: z.string().trim().min(10, 'Cuéntanos un poco más sobre tu proyecto.'),
    /** Honeypot: bots fill hidden fields, humans never see it. */
    website: z.string().max(0).optional(),
});

export type ContactMessageValues = z.infer<typeof contactMessageSchema>;
