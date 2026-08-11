import { z } from 'zod';

export const BasicResourceSchema = z.object({
    id: z.string().optional(),
    code: z.string(),
    description: z.string(),
    unit: z.string(),
    priceBase: z.number(),
    category: z.enum(['MATERIAL', 'LABOR', 'MACHINERY', 'OTHER']).optional(),
    updatedAt: z.date(),
});

/**
 * Basic Resource (Insumo/Mano de Obra).
 * These are the leaf nodes of the pricing graph.
 * 
 * Examples:
 * - mt49sla280: Ensayo C.B.R.
 * - mo020: Oficial 1ª construcción
 */
export type BasicResource = z.infer<typeof BasicResourceSchema>;
