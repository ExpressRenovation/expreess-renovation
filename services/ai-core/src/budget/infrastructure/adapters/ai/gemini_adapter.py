import os
import time
import json
import logging
import httpx
from typing import Dict, Any, Type, Optional, List
from pydantic import BaseModel



from src.budget.application.ports.ports import ILLMProvider
from src.budget.domain.exceptions import AIProviderError

logger = logging.getLogger(__name__)

class GoogleGenerativeAIAdapter(ILLMProvider):
    """
    Adapter for Google Cloud Vertex AI (Gemini 2.5).
    Features built-in exponential backoff to handle rate limits and guaranteed Pydantic structured output.
    Uses native GCP Service Account OAuth2 Authentication for 99.9% SLA guarantees.
    """
    
    # El pooling HTTP/1.1 se mantiene deshabilitado (aislamiento efímero)
    # Vertex AI es estable, pero el aislamiento previene Timeouts en lambdas/cloud functions.

    def __init__(self, model_name: str = 'gemini-2.5-flash', max_retries: int = 5, base_delay: float = 4.0):
        SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

        project_id = os.environ.get("FIREBASE_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT")
        client_email = os.environ.get("FIREBASE_CLIENT_EMAIL")
        private_key = os.environ.get("FIREBASE_PRIVATE_KEY")

        if client_email and private_key:
            # Explicit service-account key, for local development.
            formatted_private_key = private_key.replace('\\n', '\n')
            info = {
                "type": "service_account",
                "project_id": project_id,
                "private_key": formatted_private_key,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            from google.oauth2 import service_account
            self.credentials = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
        else:
            # Application Default Credentials. On Cloud Run this resolves to the
            # service's own identity, so no private key has to be shipped or
            # stored anywhere.
            import google.auth
            self.credentials, discovered_project = google.auth.default(scopes=SCOPES)
            project_id = project_id or discovered_project

        if not project_id:
            raise ValueError(
                "No GCP project available. Set FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT, "
                "or run with credentials that carry a project."
            )

        self.project_id = project_id
        # Defaults to the region holding Firestore, keeping inference and data in
        # the same place (and inside the EU). Override with VERTEX_LOCATION.
        self.location = os.environ.get("VERTEX_LOCATION", "europe-southwest1")
        self.model_name = model_name
        self.max_retries = max_retries
        self.base_delay = base_delay

    async def generate_structured(self, system_prompt: str, user_prompt: str, response_schema: Type[BaseModel], temperature: float = 0.2, model: str = "gemini-2.5-flash", image_base64: Optional[str] = None) -> tuple[BaseModel, Dict[str, int]]:
        """
        Calls Vertex AI, enforcing a strict JSON return conforming to the Pydantic `response_schema`.
        Applies exponential backoff on HTTP 429 (ResourceExhausted).
        """
        schema_json = json.dumps(response_schema.model_json_schema(), ensure_ascii=False)
        
        full_system = (
            f"{system_prompt}\n\n"
            "INSTRUCCIONES DE SALIDA CRÍTICAS:\n"
            "DEBES devolver ÚNICAMENTE un objeto JSON válido, sin bloques de código Markdown ni texto adicional.\n"
            f"El JSON DEBE cumplir estrictamente con el siguiente esquema JSON Schema:\n{schema_json}"
        )

        import httpx
        import asyncio
        import random
        import google.auth.transport.requests
        from google.auth.exceptions import RefreshError
        
        # Vertex AI REST URL (Publisher Models endpoint)
        # Note: Flash and Pro are available natively on us-central1
        url = f"https://{self.location}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{self.location}/publishers/google/models/{model}:generateContent"
        
        parts = []
        if image_base64:
            parts.append({
                "inlineData": {
                    "mimeType": "image/jpeg",
                    "data": image_base64
                }
            })
        parts.append({"text": user_prompt})
            
        payload = {
            "contents": [{"role": "user", "parts": parts}],
            "systemInstruction": {"parts": [{"text": full_system}]},
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json"
            }
        }
        
        attempt = 0
        while attempt < self.max_retries:
            try:
                # Actualizar el Token OAuth2 efímero en cada intento si fuera necesario
                auth_req = google.auth.transport.requests.Request()
                self.credentials.refresh(auth_req)
                
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.credentials.token}'
                }
                
                logger.debug(f"Calling Vertex AI {model} REST API (Attempt {attempt + 1}/{self.max_retries})...")
                
                limits = httpx.Limits(max_keepalive_connections=0, keepalive_expiry=0)
                async with httpx.AsyncClient(timeout=300.0, limits=limits, http2=False) as client:
                    response = await client.post(url, json=payload, headers=headers)
                
                if response.status_code in [400, 401, 403, 404]:
                    raise AIProviderError(f"Terminal API Error {response.status_code} on Vertex AI: {response.text}")
                    
                response.raise_for_status()
                data = response.json()
                
                if "candidates" not in data or not data["candidates"]:
                    raise AIProviderError(f"No candidates returned from Vertex AI. Response: {data}")
                    
                raw_json = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if raw_json.startswith("```json"):
                    raw_json = raw_json[7:]
                if raw_json.endswith("```"):
                    raw_json = raw_json[:-3]
                raw_json = raw_json.strip()
                
                usage_metadata = data.get("usageMetadata", {"promptTokenCount": 0, "candidatesTokenCount": 0, "totalTokenCount": 0})
                
                if raw_json.startswith("[") and raw_json.endswith("]"):
                    schema_dict = response_schema.model_json_schema()
                    if "properties" in schema_dict and len(schema_dict["properties"]) == 1:
                        only_key = list(schema_dict["properties"].keys())[0]
                        raw_json = f'{{"{only_key}": {raw_json}}}'
                
                parsed = response_schema.model_validate_json(raw_json)
                return parsed, usage_metadata
                
            except httpx.HTTPError as e:
                error_str = f"HTTP Error: {str(e)}"
                logger.error(f"Vertex AI REST Error: {error_str}")
            except RefreshError as e:
                error_str = f"OAuth2 Refresh Error: {str(e)}. Revisa tus credenciales GCP."
                logger.error(f"Vertex AI {error_str}")
                raise AIProviderError(error_str)
            except Exception as e:
                error_str = f"{type(e).__name__}: {str(e)}"
                logger.error(f"Vertex AI Unknown Error: {error_str}")
            
            attempt += 1
            if attempt >= self.max_retries:
                raise AIProviderError(f"Unknown AI API error after {self.max_retries} retries: {error_str}")
            
            delay = self.base_delay * (2 ** (attempt - 1))
            jitter = random.uniform(0, 1)
            total_delay = delay + jitter
            
            logger.warning(f"Retrying in {total_delay:.2f} seconds...")
            await asyncio.sleep(total_delay)
                
        raise AIProviderError("Fell through retry loop unexpectedly.")

    async def get_embedding(self, text: str) -> List[float]:
        """
        Embeds text through the Vertex AI Embedding API.

        The model MUST match the one that indexed the target collection.
        `price_book_items` and `material_catalog` were both written with
        gemini-embedding-001 at 768 dimensions; querying them with a vector from
        a different model returns plausible-looking but meaningless neighbours,
        because cosine distance across two embedding spaces means nothing. This
        used to call text-embedding-004 against gemini-embedding-001 data.
        """
        import httpx
        import asyncio
        import google.auth.transport.requests
        from google.auth.exceptions import RefreshError
        import random

        model = os.environ.get("EMBEDDING_MODEL", "gemini-embedding-001")
        dimensions = int(os.environ.get("EMBEDDING_DIMENSIONS", "768"))

        # Vertex AI Prediction URL for embeddings
        url = f"https://{self.location}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{self.location}/publishers/google/models/{model}:predict"

        payload = {
            "instances": [{"content": text}],
            "parameters": {"outputDimensionality": dimensions},
        }
        
        attempt = 0
        while attempt < self.max_retries:
            try:
                auth_req = google.auth.transport.requests.Request()
                self.credentials.refresh(auth_req)
                
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.credentials.token}'
                }
                
                limits = httpx.Limits(max_keepalive_connections=0, keepalive_expiry=0)
                async with httpx.AsyncClient(timeout=60.0, limits=limits) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    
                response.raise_for_status()
                data = response.json()
                
                embeddings = data.get("predictions", [{}])[0].get("embeddings", {}).get("values")
                if not embeddings:
                    raise ValueError(f"No embeddings returned from Vertex AI. Response: {data}")
                
                return embeddings
            except (httpx.HTTPError, ValueError) as e:
                logger.error(f"Vertex AI Embedding API Error: {e}")
            except RefreshError as e:
                raise AIProviderError(f"OAuth2 Refresh Error: {str(e)}")
            except Exception as e:
                logger.error(f"Vertex AI Embedding Unexpected Error: {e}")
                
            attempt += 1
            if attempt >= self.max_retries:
                raise AIProviderError(f"Failed to get embeddings after {self.max_retries} retries.")
                
            delay = self.base_delay * (2 ** (attempt - 1)) + random.uniform(0, 1)
            await asyncio.sleep(delay)
            
        raise AIProviderError("Fell through get_embedding retry loop unexpectedly.")
