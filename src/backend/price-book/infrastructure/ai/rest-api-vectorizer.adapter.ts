import { VectorizerPort } from '../../domain/vectorizer.port';
import { vertexQueryEmbedder, vertexDocumentEmbedder } from '@/backend/ai/shared/vertex-embedding.adapter';

/**
 * RestApiVectorizerAdapter — DELEGA en el embedder Vertex `gemini-embedding-2`.
 *
 * Antes llamaba al Dev API (`generativelanguage.googleapis.com`, gemini-embedding-001).
 * Se migró a Vertex -2 (ver `vertex-embedding.adapter.ts`) porque los corpus
 * (`price_book_2025`, `material_catalog`) están ahora en -2 @768; una query -001
 * vive en otro espacio vectorial → coseno inválido. Se conserva el nombre de clase
 * y el puerto para que los 7 consumidores (retrievers, catalog-search, surveyor,
 * acciones y scripts) cambien sin tocarlos.
 *
 * embedText → RETRIEVAL_QUERY (uso dominante: búsquedas).
 * embedMany → RETRIEVAL_DOCUMENT (ingesta: asimetría doc/query mejora el recall).
 */
export class RestApiVectorizerAdapter implements VectorizerPort {
  async embedText(text: string): Promise<number[]> {
    return vertexQueryEmbedder.embedText(text);
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    return vertexDocumentEmbedder.embedMany(texts);
  }
}
