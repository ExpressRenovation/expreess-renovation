import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { GoogleAuthOptions } from 'google-auth-library';

/**
 * Genkit instance secundaria (/ai/flows y /ai/tools legacy) — Vertex AI.
 * Migrado de googleAI() (Dev API) a vertexAI() por las mismas razones que
 * shared/config/genkit.config.ts: sin API key + residencia de datos EU (GDPR).
 * Ver memoria eu-data-residency-llm.
 */

const PROJECT =
    process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'express-renovation';
const LOCATION = process.env.VERTEX_LLM_LOCATION || 'europe-west1';

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

// DEPRECATED: runtime embebe por VertexEmbeddingAdapter. Compat de imports legacy.
export const embeddingModel = vertexAI.embedder('text-embedding-004');
