import { GoogleAuth } from 'google-auth-library';
import { VectorizerPort } from '@/backend/price-book/domain/vectorizer.port';

/**
 * VertexEmbeddingAdapter — embeddings vía Vertex AI `gemini-embedding-2` (@global).
 *
 * Por qué existe: ai-core migró los corpus (`price_book_2025`, `material_catalog`)
 * a `gemini-embedding-2` @768 por cuota (self-service 6000/min vs los 5/min
 * capados de `gemini-embedding-001`). El lado Next debe embeber las QUERIES con el
 * MISMO modelo para que el coseno sea válido. Este adapter sustituye al viejo
 * `RestApiVectorizerAdapter` (Dev API, gemini-embedding-001) y al `ai.embed`
 * (genkit) en los sitios de búsqueda.
 *
 * Modelo/endpoint: `gemini-embedding-2` SOLO se sirve en el endpoint `global`
 * (host `aiplatform.googleapis.com`, sin prefijo de región). Método `:embedContent`
 * (embebe UNA content por llamada — NO batch como `:predict` de -001).
 *
 * Auth: token OAuth (scope cloud-platform) del SA de Firebase. Reutiliza las mismas
 * creds que `admin-app.ts` (`FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`); en
 * ausencia, cae a ADC (dev local con `gcloud auth application-default`). El SA
 * `firebase-adminsdk-fbsvc@express-renovation` ya tiene `roles/aiplatform.user`.
 *
 * Dims FIJAS a 768 (casan con los vectores almacenados y el índice de Firestore;
 * cambiarlas invalidaría todo el corpus). `taskType` asimétrico: RETRIEVAL_QUERY
 * para búsquedas, RETRIEVAL_DOCUMENT para indexar/guardar (mejor recall).
 */

const PROJECT =
  process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'express-renovation';
const LOCATION = 'global';
const MODEL = 'gemini-embedding-2';
const DIM = 768;
const ENDPOINT = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:embedContent`;

export type EmbeddingTaskType = 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT';

// GoogleAuth es caro de construir y cachea el token internamente (refresca solo
// cerca de expirar). Singleton a nivel de módulo.
let _auth: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  if (_auth) return _auth;
  const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    _auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'), // Vercel guarda \n escapados
      },
      scopes,
    });
  } else {
    _auth = new GoogleAuth({ scopes }); // ADC (dev local / metadata server)
  }
  return _auth;
}

async function getToken(): Promise<string> {
  const token = await getAuth().getAccessToken();
  if (!token) throw new Error('[VertexEmbedding] no se pudo obtener access token del SA');
  return token;
}

interface EmbedContentResponse {
  embedding?: { values?: number[] };
}

export class VertexEmbeddingAdapter implements VectorizerPort {
  constructor(private readonly taskType: EmbeddingTaskType = 'RETRIEVAL_QUERY') {}

  async embedText(text: string): Promise<number[]> {
    if (!text || !text.trim()) throw new Error('Text to embed cannot be empty');

    const body = JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: DIM,
      taskType: this.taskType,
    });

    // Reintento acotado ante 429/5xx puntuales.
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const token = await getToken();
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body,
        });
        if (res.status === 429 || res.status >= 500) {
          throw new Error(`Vertex embedContent transient ${res.status}: ${await res.text()}`);
        }
        if (!res.ok) {
          throw new Error(`Vertex embedContent ${res.status}: ${await res.text()}`);
        }
        const data = (await res.json()) as EmbedContentResponse;
        const values = data.embedding?.values;
        if (!values || values.length === 0) throw new Error('empty embedding returned');
        return values.slice(0, DIM);
      } catch (e) {
        lastErr = e;
        // Solo reintenta transitorios; los 4xx no-429 llevan "Vertex embedContent <4xx>".
        const msg = String(e);
        const transient = /transient|ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg);
        if (!transient || attempt === 3) throw e;
        await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** attempt, 8000)));
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    // Concurrencia acotada: gemini-embedding-2 embebe una content por llamada.
    const CONCURRENCY = 4;
    const out: number[][] = new Array(texts.length);
    let i = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, texts.length) }, async () => {
      while (i < texts.length) {
        const idx = i++;
        out[idx] = await this.embedText(texts[idx]);
      }
    });
    await Promise.all(workers);
    return out;
  }
}

// Singletons por task type (evita re-crear GoogleAuth y clarifica la intención).
export const vertexQueryEmbedder = new VertexEmbeddingAdapter('RETRIEVAL_QUERY');
export const vertexDocumentEmbedder = new VertexEmbeddingAdapter('RETRIEVAL_DOCUMENT');
