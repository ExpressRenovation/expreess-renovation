'use server';

import { v4 as uuidv4 } from 'uuid';
import { clearGenerationEvents } from '@/backend/budget/events/budget-generation.emitter';

export async function extractMeasurementPdfAction(formData: FormData, leadId: string) {
    try {
        if (leadId && leadId !== 'unknown-lead' && leadId !== 'admin-user') {
            await clearGenerationEvents(leadId);
        }

        const file = formData.get('file') as File;
        if (!file) throw new Error("No file provided");

        const budgetId = uuidv4();
        
        // Append strict tracking IDs for the Python task
        formData.append('leadId', leadId || 'anonymous');
        formData.append('budgetId', budgetId);

        // Send to the Asynchronous Python Microservice (FastAPI)
        // Locally it runs on 8080. In GCP, AI_CORE_URL will be injected via ENV.
        const AI_CORE_URL = process.env.AI_CORE_URL || 'http://127.0.0.1:8080';
        const targetUrl = `${AI_CORE_URL}/api/v1/jobs/measurements`;
        
        console.log(`[Next.js Action] Proxying PDF to Python Core Engine: ${targetUrl}`);

        // ai-core rejects this endpoint without the shared token. Vercel has no
        // GCP metadata server to mint an identity token from, so a secret header
        // is what keeps the endpoint from being an open door to Gemini.
        const serviceToken = process.env.AI_CORE_SERVICE_TOKEN;
        if (!serviceToken) {
            throw new Error('AI_CORE_SERVICE_TOKEN is not configured');
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'X-Service-Token': serviceToken },
            body: formData, // Auto-sets multipart/form-data boundary
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Next.js Proxy Error]", errorText);
            throw new Error(`AI Core service failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log("[Next.js Action] Python Core Accepted Job:", result);

        // Fast return so the UI can start streaming from Firestore
        return { 
            success: true, 
            budgetId: result.budgetId || budgetId, 
            isPending: true,
            message: "El Motor IA ha comenzado a procesar en segundo plano."
        };
        
    } catch (error: any) {
        console.error("Extraction error:", error);
        return { success: false, error: error.message || "Unknown error occurred" };
    }
}
