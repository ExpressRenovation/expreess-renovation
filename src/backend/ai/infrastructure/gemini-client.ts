import { GoogleGenAI } from "@google/genai";

/**
 * Cliente `@google/genai` en modo **Vertex AI** (usado por el render de imágenes,
 * `gemini-2.5-flash-image`, en generate-render.flow).
 *
 * Migrado del Dev API (`GoogleGenAI({ apiKey })` + GOOGLE_GENAI_API_KEY) a Vertex:
 *   - Sin API key: autentica con el SA `vercel-app@` (creds por env en Vercel;
 *     ADC en local).
 *   - Región EU (europe-west1) por NORMATIVA GDPR/EU — residencia de datos, también
 *     para las imágenes. Ver memoria eu-data-residency-llm.
 *   - `gemini-2.5-flash-image` verificado disponible en europe-west1/west4.
 */

const PROJECT =
    process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "express-renovation";
const LOCATION = process.env.VERTEX_LLM_LOCATION || "europe-west1";

const _clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const _privateKey = process.env.FIREBASE_PRIVATE_KEY;
const googleAuthOptions =
    _clientEmail && _privateKey
        ? {
              credentials: {
                  client_email: _clientEmail,
                  private_key: _privateKey.replace(/\\n/g, "\n"),
              },
              scopes: ["https://www.googleapis.com/auth/cloud-platform"],
          }
        : undefined;

let geminiClient: GoogleGenAI | null = null;

export const getGeminiClient = () => {
    if (!geminiClient) {
        geminiClient = new GoogleGenAI({
            vertexai: true,
            project: PROJECT,
            location: LOCATION,
            googleAuthOptions,
        });
    }
    return geminiClient;
};
