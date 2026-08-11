import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from src.budget.application.ports.ports import ILLMProvider, IVectorSearch, IGenerationEmitter, IBudgetRepository
from src.budget.domain.entities import Budget, BudgetChapter, BudgetPartida, PersonalInfo, ProjectSpecs, BudgetCostBreakdown, OriginalItem, AIResolution
from src.budget.domain.math_validator import MathValidator

logger = logging.getLogger(__name__)

class RestructuredItem(BaseModel):
    code: Optional[str] = Field(default="", description='El código original de la partida (ej. 2.2). Si no tiene, usa "".')
    description: str = Field(description='La descripción de la partida. Resume y unifica si está cortada en varias líneas.')
    quantity: float = Field(default=1.0, description='La cantidad total acumulada para esta partida (busca los subtotales en las tablas asociadas).')
    unit: Optional[str] = Field(default="ud", description='La unidad de medida de la partida (ej. m2, m3, ud, ml).')
    chapter: Optional[str] = Field(default="Sin Capítulo", description='Nombre del capítulo al que pertenece.')

class RestructureChunkResult(BaseModel):
    items: List[RestructuredItem]
    has_more_items: bool = Field(default=False, description="True si la página es muy larga y te detuviste a la mitad por seguridad. False si leíste hasta el final.")
    last_extracted_code: str = Field(default="", description="Si has_more_items es true, el código numérico de la última partida que extrajiste.")

class PricingEvaluatorResult(BaseModel):
    razonamiento: str = Field(description="Análisis de por qué se elige este candidato y cómo se adapta la unidad y el precio (Chain of Thought). Piensa paso a paso.")
    selectedCandidateId: Optional[str] = Field(description="El ID exacto del candidato seleccionado (o null si ninguno sirve).")
    requiresEstimation: bool = Field(description="True si el candidato requiere ajustar su precio porque la unidad original difiere.")
    calculatedUnitPrice: float = Field(description="El precio unitario final para la partida original, en EUROS. Da un valor realista de mercado español si estimas.")

class BatchPricedItem(BaseModel):
    item_code: Optional[str] = Field(default="", description="El código exacto de la partida original evaluada.")
    original_unit: Optional[str] = Field(default="", description="La unidad original pedida en el PDF.")
    target_unit: Optional[str] = Field(default="", description="La unidad del candidato en la Base de Datos.")
    mathematical_extraction: str = Field(description="CADENA DE RAZONAMIENTO MATEMÁTICO: Extrae las dimensiones de la descripción original y conviértelas a la unidad del candidato seleccionado.")
    razonamiento: str = Field(description="Justificación rápida.")
    selectedCandidateId: Optional[str] = Field(description="ID del candidato, o null si la disparidad es incorregible.")
    requiresEstimation: bool = Field(description="True si se estima por diferencia de unidades.")
    needs_human_review: bool = Field(description="True si es imposible calcular, es una Partida Alzada sin métricas, o el fallo es crítico.")
    calculatedUnitPrice: float = Field(description="Precio unitario final estimado o exacto.")

class BatchPricingEvaluatorResult(BaseModel):
    results: List[BatchPricedItem] = Field(description="La evaluación en lote para el array de partidas.")

class RestructureBudgetUseCase:
    """
    Core AI Orchestrator that mirrors the TS measurement-pricing.flow.ts:
    1. Chunks raw spatial text and asks Gemini to fix chapters/items and quantities.
    2. Prices items by vector-searching Firestore and using Gemini Evaluator.
    3. Assembles the final Budget aggregate.
    """
    
    def __init__(self, 
                 llm_provider: ILLMProvider, 
                 vector_search: IVectorSearch,
                 emitter: Optional[IGenerationEmitter] = None,
                 repository: Optional[IBudgetRepository] = None):
        self.llm = llm_provider
        self.vector_search = vector_search
        self.emitter = emitter
        self.repository = repository
        
    def _emit(self, lead_id: str, event_type: str, data: Dict[str, Any]):
        if self.emitter:
            self.emitter.emit_event(lead_id, event_type, data)
            
    def _track_telemetry(self, metrics_dict: Dict, usage: Dict[str, int]):
        metrics_dict["prompt"] += usage.get("promptTokenCount", 0)
        metrics_dict["completion"] += usage.get("candidatesTokenCount", 0)
        metrics_dict["total"] += usage.get("totalTokenCount", 0)
        
        cost_prompt = (usage.get("promptTokenCount", 0) / 1_000_000) * 0.071
        cost_comp = (usage.get("candidatesTokenCount", 0) / 1_000_000) * 0.28
        metrics_dict["cost"] += (cost_prompt + cost_comp)

    def _load_prompt(self, filename: str, **kwargs) -> tuple[str, str]:
        import os, re
        filepath = os.path.join(os.path.dirname(__file__), "../../../../prompts", filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        content = re.sub(r"^---.*?---\n", "", content, flags=re.DOTALL)
        parts = re.split(r'\{\{role "(system|user)"\}\}\n', content)
        
        sys_p, usr_p = "", ""
        curr_role = None
        for p in parts:
            if p in ('system', 'user'):
                curr_role = p
            elif curr_role == 'system':
                sys_p = p.strip()
            elif curr_role == 'user':
                usr_p = p.strip()
                
        for k, v in kwargs.items():
            usr_p = usr_p.replace(f"{{{{{k}}}}}", str(v))
            
        return sys_p, usr_p

    async def _restructure_phase(self, raw_items: List[Dict[str, Any]], lead_id: str, metrics: Dict) -> List[RestructuredItem]:
        logger.info(f"Starting Batch Restructure Phase for {len(raw_items)} raw items...")
        self._emit(lead_id, 'extraction_started', {"query": "Extrayendo y mapeando datos iniciales del PDF para la IA..."})
        
        # Prompts will be loaded inside the async function to inject raw_chunk
        import json
        import asyncio
        
        import json
        import asyncio
        
        # --- 1. Smart Chunking (Fotografías) ---
        # ATOMICIDAD EXTREMA: 1 página por petición
        # para que la Visión de Gemini resuelva cada hoja sin perder contexto.
        CHUNK_SIZE = 1
        chunks = [raw_items[i:i + CHUNK_SIZE] for i in range(0, len(raw_items), CHUNK_SIZE)]
        
        self._emit(lead_id, 'batch_restructure_submitted', {"query": f"Lote visual dividido en {len(chunks)} páginas atómicas concurrentes para estructuración OCR+LLM."})
        
        # Vertex AI soporta alta concurrencia nativa, extraemos 15 páginas simultáneamente
        semaphore = asyncio.Semaphore(15) 
        
        async def process_restructure_chunk(chunk_idx: int, raw_chunk: List[Dict]):
            async with semaphore:
                # Extraemos la imagen Base64 del chunk (que representa una página entera)
                page_data = raw_chunk[0]
                b64_img = page_data.get("image_base64")
                
                all_items_for_page = []
                last_code = ""
                iteration = 1
                max_iterations = 4
                
                accumulated_usage = {"promptTokenCount": 0, "candidatesTokenCount": 0, "totalTokenCount": 0}
                
                while iteration <= max_iterations:
                    start_instruction = ""
                    if last_code:
                        start_instruction = f"INSTRUCCIÓN CRÍTICA: Ya extrajiste correctamente hasta la partida {last_code}. IGNORA todo lo anterior a ella. INICIA tu extracción estrictamente desde la partida SIGUIENTE a {last_code} hasta el final físico de la página."
                        
                    # Usamos el nuevo prompt visual iterativo
                    sys_prompt, user_prompt = self._load_prompt(
                        "restructure_image_vision.prompt", 
                        image_base64_data="[IMAGEN RAW ENVIADA EN INLINEDATA]",
                        start_instruction=start_instruction
                    )
                    
                    self._emit(lead_id, 'restructuring', {"query": f"Extracción Multimodal Página {chunk_idx + 1}/{len(chunks)} (Iteración {iteration}/{max_iterations})..."})
                    
                    partial_res, usage = await self.llm.generate_structured(
                        system_prompt=sys_prompt,
                        user_prompt=user_prompt,
                        response_schema=RestructureChunkResult,
                        temperature=0.1,
                        image_base64=b64_img
                    )
                    
                    if usage:
                        accumulated_usage["promptTokenCount"] += usage.get("promptTokenCount", 0)
                        accumulated_usage["candidatesTokenCount"] += usage.get("candidatesTokenCount", 0)
                        accumulated_usage["totalTokenCount"] += usage.get("totalTokenCount", 0)
                    
                    if partial_res and partial_res.items:
                        all_items_for_page.extend(partial_res.items)
                        
                        if partial_res.has_more_items and partial_res.last_extracted_code:
                            last_code = partial_res.last_extracted_code
                            iteration += 1
                        else:
                            break
                    else:
                        break
                
                # Devolvemos un objeto fusionado simulando que se extrajo todo de un golpe
                merged_res = RestructureChunkResult(items=all_items_for_page, has_more_items=False, last_extracted_code="")
                self._emit(lead_id, 'restructuring', {"query": f"Página {chunk_idx + 1}/{len(chunks)} consolidada (Total partidas: {len(all_items_for_page)})."})
                return merged_res, accumulated_usage
                
        # Disparamos todas las peticiones a la vez (Abanico Asíncrono)
        tasks = [process_restructure_chunk(idx, chunk) for idx, chunk in enumerate(chunks)]
        results_group = await asyncio.gather(*tasks, return_exceptions=True)
        
        # --- 3. Ensamblaje Seguro ---
        consolidated = []
        for i, res in enumerate(results_group):
            if isinstance(res, Exception):
                logger.error(f"Error procesando página visual {i}: {res}")
            elif isinstance(res, tuple):
                parsed, usage = res
                consolidated.extend(parsed.items)
                self._track_telemetry(metrics, usage)
            else:
                logger.warning(f"Respuesta visual de la página {i} inesperada: {res}")
                
        # --- 4. Agrupador de Estado (Continuidad entre páginas) ---
        final_items = []
        current_chapter = "Sin Capítulo"
        
        for item in consolidated:
            if item.chapter and item.chapter.upper() not in ["", "CONTINUACIÓN_ANTERIOR", "CONTINUACION_ANTERIOR"]:
                current_chapter = item.chapter
            
            # Rehydrate the missing chapter from the previous page
            if (not item.chapter or item.chapter.upper() in ["", "CONTINUACIÓN_ANTERIOR", "CONTINUACION_ANTERIOR"]):
                item.chapter = current_chapter
                
            final_items.append(item)
        
        # --- 5. Filtro Anti-Fantasmas Estricto ---
        valid_items = []
        for item in final_items:
            if item.code and str(item.code).strip() != "":
                valid_items.append(item)
            else:
                logger.warning(f"Discarded ghost item lacking code: {item.description[:50]}")
        final_items = valid_items

        self._emit(lead_id, 'subtasks_extracted', {"count": len(final_items), "totalTasks": len(final_items)})
        return final_items

    def _estimate_fallback_price(self, unit: str) -> float:
        unit = unit.lower()
        if unit in ['m2', 'm²']: return 25.0
        if unit in ['m', 'ml']: return 15.0
        if unit in ['ud', 'u']: return 50.0
        if unit == 'kg': return 2.0
        if unit == 'h': return 35.0
        return 30.0

    async def _pricing_phase(self, items: List[RestructuredItem], lead_id: str, metrics: Dict) -> List[BudgetPartida]:
        logger.info("Starting Batch Pricing Phase...")
        self._emit(lead_id, 'vector_search_started', {"query": f"Buscando concordancias semánticas en Catálogo 2025 para {len(items)} partidas..."})

        # Prompts are loaded dynamically below in `_pricing_phase`
        priced_partidas = []
        global_order = 1
        import uuid
        import asyncio
        
        # --- 1. Concurrent Vector Search ---
        candidates_map = {}
        batch_tasks = []
        
        import inspect
        from src.budget.infrastructure.ai.query_expander import QueryExpander
        
        vector_sem = asyncio.Semaphore(5) # Throttled to prevent 60 QPM Vertex drops
        
        async def fetch_candidates(item: RestructuredItem) -> Dict[str, Any]:
            async with vector_sem:
                all_candidates = []
                try:
                    expander = QueryExpander(llm_provider=self.llm)
                    expanded_queries, mapped_chapters = await expander.expand(item.description, item.unit, item.chapter)
                    
                    seen_ids = set()
                    
                    # Primary Strict Search (Taxonomy Pre-Filter)
                    for q in expanded_queries:
                        vector = await self.llm.get_embedding(q)
                        res = self.vector_search.search_similar_items(
                            query_vector=vector, 
                            query_text=q, 
                            limit=10,
                            chapter_filters=mapped_chapters
                        )
                        if inspect.isawaitable(res):
                            candidates = await res
                        else:
                            candidates = res
                            
                        # Deduplicate
                        for c in candidates:
                            cid = c.get('id')
                            if cid and cid not in seen_ids:
                                seen_ids.add(cid)
                                all_candidates.append(c)
                                
                    # Fallback (Open Search)
                    if not all_candidates and mapped_chapters:
                        logger.warning(f"Taxonomy constraint {mapped_chapters} yielded 0 matches for {item.code}. Retrying OPEN vector search.")
                        for q in expanded_queries:
                            vector = await self.llm.get_embedding(q)
                            res = self.vector_search.search_similar_items(query_vector=vector, query_text=q, limit=10)
                            if inspect.isawaitable(res):
                                candidates = await res
                            else:
                                candidates = res
                                
                            for c in candidates:
                                cid = c.get('id')
                                if cid and cid not in seen_ids:
                                    seen_ids.add(cid)
                                    all_candidates.append(c)
                except Exception as e:
                    logger.error(f"Vector search failed for {item.code}: {e}")
                
                # Global sort across all expanded query candidates by actual semantic match score
                all_candidates.sort(key=lambda x: x.get('matchScore', 0), reverse=True)
                final_candidates = all_candidates[:12] # Top 12 robust semantic candidates para mayor precisión
                
                formatted_candidates = "\\n".join(
                    f"   [ID: {c.get('id', 'N/A')}] [Price: €{c.get('priceTotal', c.get('price', 0))}/{c.get('unit', 'ud')}] - {c.get('description', c.get('name', ''))}"
                    for c in final_candidates
                ) if final_candidates else "   [Sin candidatos encontrados]"
                
                prompt = (
                    f"PARTIDA {item.code}:\n"
                    f"- Descripción: {item.description}\n"
                    f"- Unidad original: {item.unit} | Cantidad: {item.quantity}\n"
                    f"- CANDIDATOS EN CATÁLOGO (ENJAMBRE):\n{formatted_candidates}"
                )
                return {
                    "id": item.code, 
                    "prompt": prompt, 
                    "meta": {"item": item, "candidates": final_candidates}
                }

        # Fire all semantic searches concurrently
        vector_responses = await asyncio.gather(*[fetch_candidates(i) for i in items], return_exceptions=True)
        
        for res in vector_responses:
            if isinstance(res, Exception):
                logger.error(f"Vector search concurrent error: {res}")
            else:
                batch_tasks.append({"id": res["id"], "prompt": res["prompt"]})
                candidates_map[res["id"]] = res["meta"]
            
        self._emit(lead_id, 'batch_pricing_submitted', {"query": f"Preparando {len(batch_tasks)} peticiones matemáticas concurrentes..."})
        
        # --- 2. Smart Chunking Matemático & Concurrencia ---
        CHUNK_SIZE_PRICING = 3
        grouped_tasks = [batch_tasks[i:i + CHUNK_SIZE_PRICING] for i in range(0, len(batch_tasks), CHUNK_SIZE_PRICING)]
        
        # Vertex AI Cloud strict limits bypassing: Throttling to 3 parallel chunks.
        semaphore_pricing = asyncio.Semaphore(3)
        
        # --- Fetch Live Human Heuristics from Firestore (RAG Filter) ---
        live_heuristics_str = ""
        try:
            from firebase_admin import firestore
            from src.budget.infrastructure.search.firestore_heuristics_repository import FirestoreHeuristicsRepository
            db = firestore.client()
            repo = FirestoreHeuristicsRepository(db)
            
            # Construir el BoW del chunk actual para Embedding
            current_chunk_text = " ".join([i.description.lower() for i in items])
            
            # Extraer vector usando el adaptador de Gemini ya presente en self.llm
            chunk_vector = await self.llm.get_embedding(current_chunk_text)
            
            # Firestore Native Vector Search (Cosine Similarity)
            top_k = repo.find_nearest_golden_rules(query_vector=chunk_vector, limit=5)
            
            if top_k:
                live_heuristics_str = "\n\n--- Criterios Heurísticos Registrados (Reglas de Alta Prioridad) ---\n"
                for rule in top_k:
                    reason = rule.humanCorrection.heuristicRule
                    cand_code = rule.humanCorrection.selectedCandidateCode
                    price = rule.humanCorrection.correctedUnitPrice
                    desc = rule.context.originalDescription
                    
                    live_heuristics_str += (
                        f"REGLA PARA PARTIDA: {desc}\n"
                        f"Motivo Humano (Súper Habilidad RAG): {reason}\n"
                        f"Acción Correcta -> Seleccionar {cand_code} con precio de {price}€\n\n"
                    )
                logger.info(f"RAG Vectorial inyectó {len(top_k)} reglas de oro en el Batch Context usando Firestore Vector Search.")

        except Exception as e:
            logger.error(f"Failed to fetch training_heuristics from DB: {e}")
            
        combined_golden_examples = live_heuristics_str
        
        async def process_pricing_chunk(chunk_idx: int, task_group: List[Dict]):
            async with semaphore_pricing:
                grouped_tasks_str = "\n\n".join(t["prompt"] for t in task_group)
                sys_prompt, user_prompt = self._load_prompt("pricing_evaluator.prompt", batch_items=grouped_tasks_str, golden_examples=combined_golden_examples)
                await asyncio.sleep(1.5) # Forced delay to protect Quota Limits
                
                eval_res, usage = await self.llm.generate_structured(
                    system_prompt=sys_prompt,
                    user_prompt=user_prompt,
                    response_schema=BatchPricingEvaluatorResult,
                    temperature=0.0,
                    model="gemini-2.5-pro"
                )
                self._emit(lead_id, 'vector_search', {"query": f"Evaluación Matemática Grupo {chunk_idx + 1}/{len(grouped_tasks)} terminada."})
                return eval_res, usage
                
        # Lanzar la batería de peticiones API
        p_tasks = [process_pricing_chunk(idx, g) for idx, g in enumerate(grouped_tasks)]
        results_group = await asyncio.gather(*p_tasks, return_exceptions=True)
        
        # --- 3. Parseo Ensamblaje en Tiempo Real ---
        for chunk_idx, res in enumerate(results_group):
            if isinstance(res, Exception):
                logger.error(f"Excepción en pricing concurrente grupo {chunk_idx}: {res}")
            elif isinstance(res, tuple):
                eval_res, usage = res
                self._track_telemetry(metrics, usage)
                
                task_group = grouped_tasks[chunk_idx]
                use_zip = len(task_group) == len(eval_res.results)
                
                for i, evaluated_item in enumerate(eval_res.results):
                    if use_zip:
                        code = task_group[i]["id"]
                    else:
                        # Fallback if Gemini missed/added an item: try to guess by string matching.
                        code = evaluated_item.item_code or ""
                        code = code.replace("PARTIDA", "").replace("Partida", "").replace("partida", "").strip()
                    
                    meta = candidates_map.get(code)
                    if not meta:
                        logger.warning(f"No candidate meta found for code '{code}'. Available keys: {list(candidates_map.keys())}")
                        continue
                        
                    item = meta["item"]
                    candidates = meta["candidates"]
                    
                    final_price = evaluated_item.calculatedUnitPrice
                    is_est = evaluated_item.requiresEstimation or evaluated_item.needs_human_review
                    reasoning_full = f"{evaluated_item.mathematical_extraction}. {evaluated_item.razonamiento}"
                    sel_id = evaluated_item.selectedCandidateId
                    
                    confidence = 40 if evaluated_item.needs_human_review else (70 if is_est else 95)
                    alternatives = [c for c in candidates if c.get('id') != sel_id]
                    if not candidates: confidence = 20
                    
                    # --- Dual Schema Hydration (HITL + Next.js Flat Compatibility) ---
                    original_item_obj = OriginalItem(
                        code=item.code if item.code is not None else "S/C",
                        description=item.description,
                        quantity=item.quantity,
                        unit=item.unit,
                        chapter=item.chapter,
                        raw_table_data="Desgloses extraídos y consolidados por Basis AI-Core"
                    )
                    
                    selected_cand_data = next((c for c in candidates if c.get('id') == sel_id), None)
                    
                    ai_res_obj = AIResolution(
                        selected_candidate=selected_cand_data,
                        reasoning_trace=reasoning_full,
                        calculated_unit_price=final_price,
                        calculated_total_price=final_price * item.quantity,
                        confidence_score=confidence,
                        is_estimated=is_est,
                        needs_human_review=evaluated_item.needs_human_review
                    )
                    
                    partida = BudgetPartida(
                        id=str(uuid.uuid4()), order=global_order, 
                        
                        original_item=original_item_obj,
                        ai_resolution=ai_res_obj,
                        alternatives=alternatives,
                        
                        code=item.code, description=item.description,
                        unit=item.unit, quantity=item.quantity, unitPrice=final_price, totalPrice=final_price * item.quantity,
                        isEstimate=is_est, matchConfidence=confidence, reasoning=reasoning_full
                    )
                    priced_partidas.append(partida)
                    
                    self._emit(lead_id, 'item_resolved', {
                        "type": "MATERIAL",
                        "item": partida.model_dump()
                    })
                    
                    global_order += 1
            else:
                logger.warning(f"Resultado no parseable en bloque {chunk_idx}: {res}")
                
        self._emit(lead_id, 'batch_pricing_completed', {"query": "¡El presupuesto está listo y ensamblado!"})
        return priced_partidas

    async def execute(self, raw_items: List[Dict[str, Any]], lead_id: str = "anonymous", budget_id: str = None) -> Budget:
        import uuid
        import time
        from datetime import datetime
        from src.budget.domain.entities import BudgetTelemetry, BudgetTelemetryMetrics
        
        start_time = time.time()
        metrics = {"prompt": 0, "completion": 0, "total": 0, "cost": 0.0}
        
        # Phase 1: Semantically structure messy spatial PDF chunks
        restructured = await self._restructure_phase(raw_items, lead_id, metrics)
        
        # Phase 2: Embed and lookup vector candidates, then LLM pricing evaluate
        partidas = await self._pricing_phase(restructured, lead_id, metrics)
        
        # Phase 3: Assembly & Validation
        chapters_dict = {}
        for p in partidas:
            # Extract the actual chapter string natively captured by the ML Vision node
            ch_name = (p.original_item.chapter if p.original_item and p.original_item.chapter else "VARIOS").strip()
            
            if ch_name not in chapters_dict:
                chapters_dict[ch_name] = {"items": [], "total": 0.0}
            chapters_dict[ch_name]["items"].append(p)
            chapters_dict[ch_name]["total"] += p.totalPrice
            
        final_chapters = []
        subtotal = 0.0
        order_idx = 1
        for ch_name, data in chapters_dict.items():
            final_chapters.append(BudgetChapter(
                id=str(uuid.uuid4()),
                name=ch_name,
                order=order_idx,
                items=data["items"],
                totalPrice=data["total"]
            ))
            subtotal += data["total"]
            order_idx += 1
            
        # Hardcoded margins for this microservice logic (to match TS)
        gg = subtotal * 0.13
        bi = subtotal * 0.06
        pem = subtotal + gg + bi
        iva = pem * 0.21
        total = pem + iva
        
        duration_ms = (time.time() - start_time) * 1000
        
        telemetry = BudgetTelemetry(
            metrics=BudgetTelemetryMetrics(
                generationTimeMs=duration_ms,
                tokens={
                    "inputTokens": metrics["prompt"],
                    "outputTokens": metrics["completion"],
                    "totalTokens": metrics["total"]
                },
                costs={
                    "fiatAmount": metrics["cost"],
                    "fiatCurrency": "EUR"
                }
            )
        )
        
        budget = Budget(
            id=budget_id if budget_id else str(uuid.uuid4()),
            leadId=lead_id,
            clientSnapshot=PersonalInfo(),
            status="draft",
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow(),
            version=1,
            specs=ProjectSpecs(),
            chapters=final_chapters,
            costBreakdown=BudgetCostBreakdown(
                materialExecutionPrice=subtotal,
                overheadExpenses=gg,
                industrialBenefit=bi,
                tax=iva,
                globalAdjustment=0.0,
                total=total
            ),
            totalEstimated=total,
            telemetry=telemetry
        )
        
        if self.repository:
            self.repository.save(budget)
            
        self._emit(lead_id, 'budget_completed', {"budgetId": budget.id, "metrics": telemetry.metrics.model_dump()})
            
        return budget
