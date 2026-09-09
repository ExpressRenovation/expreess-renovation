import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { GoogleAuthOptions } from 'google-auth-library';
import dns from 'node:dns';

/**
 * Shared Genkit instance — Vertex AI (NO Dev API).
 *
 * Migrado de `googleAI()` (Dev API + GOOGLE_GENAI_API_KEY) a `vertexAI()`:
 *   - Sin API key: autentica con el SA `vercel-app@` (creds por env en Vercel;
 *     ADC en local).
 *   - Región EU por NORMATIVA GDPR/EU (residencia de datos). NUNCA `global`
 *     (rutea fuera de la UE). Ver memoria eu-data-residency-llm.
 *
 * Los ~25 consumidores solo importan `ai` / `gemini25Flash` de aquí, así que
 * cambiar el plugin migra todo el LLM a Vertex sin tocarlos.
 */

// Fix Node/Undici fetch tardando 60s en timeout en redes IPv6 (Windows).
dns.setDefaultResultOrder('ipv4first');

const PROJECT =
    process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'express-renovation';
// EU por defecto (europe-west1 = Bélgica) — residencia de datos EU + más cuota
// que europe-southwest1. Override por env si hiciera falta.
const LOCATION = process.env.VERTEX_LLM_LOCATION || 'europe-west1';

// Auth explícita para Vercel (fuera de GCP → sin ADC): creds del SA vercel-app@
// desde env. Sin ellas (local), se omite → cae a ADC (gcloud).
const _clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const _privateKey = process.env.FIREBASE_PRIVATE_KEY;
const googleAuth: GoogleAuthOptions | undefined =
    _clientEmail && _privateKey
        ? {
              credentials: {
                  client_email: _clientEmail,
                  private_key: _privateKey.replace(/\\n/g, '\n'),
              },
              scopes: ['https://www.googleapis.com/auth/cloud-platform'],
          }
        : undefined;

export const ai = genkit({
    plugins: [vertexAI({ projectId: PROJECT, location: LOCATION, googleAuth })],
    promptDir: 'src/backend/ai/prompts',
});

// LLM principal: gemini-2.5-flash en Vertex (misma familia que el Dev API, sin key).
export const gemini25Flash = vertexAI.model('gemini-2.5-flash');

// DEPRECATED: el runtime embebe por VertexEmbeddingAdapter (REST :embedContent).
// Se conserva el export solo por compat de imports legacy (scripts); NO se usa
// en runtime. Referencia lazy — no se registra hasta usarse.
export const embeddingModel = vertexAI.embedder('text-embedding-004');
