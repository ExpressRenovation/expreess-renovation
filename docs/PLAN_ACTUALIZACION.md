# Plan de actualización — Express Renovation

> Objetivo: elevar `express-renovation` al nivel de `dochevi-construc` en **motor de
> presupuestos + editor (fullstack: ai-core + backend)**, sobre el proyecto
> GCP/Firebase **`express-renovation` (#797056263958, ya existente)**, gestionado por
> `expressrenovation.platform@gmail.com`.
> Fecha: 2026-09-04 · Referencia: grafo MCP codebase-memory de ambos repos.

## Decisiones confirmadas (2026-09-04)
- **Project ID**: `express-renovation` (#797056263958) — **ya existe**, no se crea; se verifica acceso con la cuenta nueva.
- **IA**: **Vertex AI** vía ADC (igual que `dochevi-construc`).
- **Fase 2 (diferido)**: `re-engagement` + email quedan FUERA de esta fase.
- **Pendiente**: re-indexar `dochevi-construc` en codebase-memory cuando termine la tarea en curso de su ai-core (referencia para portar B1).

## Alcance y reglas
- ✅ **Sí tocamos**: `services/ai-core` (Python), `src/backend/budget` + `src/lib/budget`, `src/components/budget-editor`, hooks y acciones del motor de presupuestos.
- ⛔ **No tocamos**: páginas públicas (`src/app/[locale]/(public)/**`, `components/home`, `services`, `blog`, `zonas`, `seo`). **Se mantiene el branding Express Renovation Mallorca.**
- 🔁 **Estrategia**: portar desde `dochevi-construc` (mismo ADN/boilerplate `nextn`), no reinventar.
- 🔐 **Secretos**: el proyecto nuevo estrena secretos. NO reutilizar la clave de `local-digital-eye` que hoy vive en `services/ai-core/env.yaml` (rotar/abandonar).
- 🌍 **Región**: `europe-southwest1` (Madrid) para Firestore + Vertex (datos e inferencia juntos, dentro de la UE).

## Estado de partida (verificado)
| | express-renovation (hoy) | dochevi-construc (referencia) |
|---|---|---|
| ai-core | 38 archivos, 2 endpoints, extract síncrono + 1 background task | 319 archivos, 19 endpoints, **pipeline de jobs asíncrono** |
| Retrieval | vector search básico | **híbrido** sentence-transformers + rank-bm25 + **BgeReranker** |
| Formatos PDF | pdfplumber genérico | + **BC3/FIEBDC**, **TabularParser (PRESTO)**, **vision-extract (Gemini)** |
| lib/budget | — (no existe) | reconciliation, budget-mode-calculator, markup-rebake, dispatch-job, repair-breakdown |
| Editor | 21 componentes | 28 (+ reconciliación, context, manual-partida, edit-client, send-to-client) |
| Tests | 17 aristas TESTS | 950 (vitest + pytest-asyncio) |
| Email | sin librería | resend + nodemailer |
| Cloud | proyecto `express-renovation` #797056263958 | proyecto propio |

Entorno local: **gcloud CLI NO instalado**; firebase CLI v15.19.0 logueado como `marketingnelsonvallejo@gmail.com` (la cuenta `expressrenovation.platform@gmail.com` **no** está presente y **no se puede verificar su existencia sin login** → paso A0).

---

## VÍA A — Consola nueva (infra GCP/Firebase)

> **Estado real verificado (2026-09-04)** con la cuenta `expressrenovation.platform@gmail.com` (= **Owner** del proyecto). El proyecto NO está vacío; casi toda la infra ya existe:

| Recurso | Estado |
|---|---|
| gcloud CLI | ✅ instalado (SDK 543) — en PATH de PowerShell, no de Git Bash |
| Cuenta `expressrenovation.platform@gmail.com` | ✅ existe, autenticada, **rol Owner** |
| APIs (Firestore, Auth, Storage, Tasks, Run, Secrets, Vertex, ArtifactReg, Build) | ✅ habilitadas |
| Firestore | ✅ `(default)` Native en `europe-southwest1` |
| Service accounts | ✅ `ai-core-run@`, `vercel-app@`, `firebase-adminsdk-fbsvc@` |
| Cloud Run `ai-core` | ✅ desplegado → `https://ai-core-m24mkyg6ia-no.a.run.app` |
| Secret Manager | ✅ `ai-core-service-token` |
| Cloud Tasks queue | ⚠️ no creada; además `europe-southwest1` NO es región válida de Tasks. Probablemente **no haga falta**: el pipeline de dochevi parece cola en Firestore (`claim/retry`), no Cloud Tasks. Confirmar al re-indexar. |
| Firebase Auth (Email/Password) | ⏳ confirmar proveedor habilitado en consola |
| ADC local (Vertex en dev) | ⏳ `gcloud auth application-default login` con la cuenta nueva si se corre ai-core en local |

> Conclusión: **Fase 0 (infra) esencialmente completa.** El grueso del trabajo real es la **Vía B (código)**. La tabla de fases siguiente queda como runbook de referencia (la mayoría ya en ✅).

| Fase | Acción | Quién |
|------|--------|:----:|
| **A0** | Crear/verificar la cuenta Google `expressrenovation.platform@gmail.com` (entrar en accounts.google.com). Instalar **gcloud CLI**. | TÚ |
| **A1** | `gcloud auth login` + `gcloud auth application-default login` + `firebase login` con la cuenta nueva (apruebas OAuth). | TÚ |
| **A2** | **El proyecto ya existe** (`express-renovation` #797056263958). NO crear — verificar acceso con la cuenta nueva, `gcloud config set project express-renovation`, revisar servicios habilitados. | TÚ login / YO verifico |
| **A3** | Habilitar APIs: Firestore, Identity Toolkit (Auth), Storage, Cloud Tasks, Cloud Run, Secret Manager, Vertex AI, Artifact Registry, Cloud Build. | YO cmds |
| **A4** | Firestore (Native, eu-sw1) + `firestore.rules` + **`firestore.indexes.json`** (portar de dochevi + índices de vector search). | YO |
| **A5** | **Firebase Auth**: habilitar Email/Password (+ Google si procede). Crear usuario admin inicial. *(“hacer la authentication”)* | YO cmds / TÚ apruebas |
| **A6** | Service account `vercel-app@…` con roles mínimos (datastore.user, storage.objectAdmin, cloudtasks.enqueuer, run.invoker) + secretos en **Secret Manager** (`ai-core-service-token`, Gemini key). | YO |
| **A7** | Deploy **ai-core** a Cloud Run en el proyecto nuevo con env limpio (ADC, sin key de `local-digital-eye`). | YO |
| **A8** | Cola de **Cloud Tasks** (`GCP_TASKS_QUEUE`) en eu-sw1. | YO |
| **A9** | Regenerar `.env` (web + admin), `services/ai-core/env.yaml` (con secretos nuevos) y envs de hosting (Vercel/App Hosting). | YO |

---

## VÍA B — Código (motor de presupuestos + editor)

> Trabajo en **rama nueva** (`feat/budget-engine-upgrade`), sin depender de la consola
> hasta el deploy. Portando de `dochevi-construc`.

### B1 · ai-core (Python) — subir al pipeline de dochevi
1. **Cola de jobs asíncrona** `pipeline_jobs` (crear/claim/retry/cancel, estado en Firestore) + `BudgetPipelineRunner`.
2. **Endpoints nuevos**: `POST /jobs/dispatch`, `GET /jobs/{id}`, `POST /jobs/{id}/cancel|retry`, `POST /budget/vision-extract`, `POST /bc3/detect`, `POST /jobs/nl-budget`, `POST /jobs/extract-metadata`.
3. **Retrieval híbrido**: `sentence-transformers` + `rank-bm25` + `BgeReranker`.
4. **Parsers**: `TabularParser` (PRESTO) + detección **BC3/FIEBDC**.
5. **Observabilidad**: logging JSON estructurado; adapters `google-cloud-storage/-run/-monitoring`.
6. `requirements.txt`: añadir `sentence-transformers`, `rank-bm25`, `pytest-asyncio`, `google-cloud-storage`. Revisar RAM/coldstart en Cloud Run (modelos de embeddings pesan).
7. Tests `pytest-asyncio` (portar `tests/` de dochevi que apliquen).

### B2 · Backend TS — motor de presupuestos
1. **`src/lib/budget/`**: `reconciliation`, `budget-mode-calculator`, `markup-rebake`, `dispatch-measurements-job`, `repair-breakdown` (+ sus tests).
2. **Wire backend ↔ ai-core**: acción de dispatch de job + polling de estado (edges HTTP_CALLS).
3. *(Fase 2)* **Email** `resend`/`nodemailer` para “enviar presupuesto al cliente”.
4. *(Fase 2)* `backend/re-engagement` (agendado de re-contacto de leads).

### B3 · Editor de presupuestos (frontend fullstack)
1. Componentes que faltan: `ReconciliationBanner/Chip/DiffModal`, `BudgetEditorContext`, `ManualPartidaDialog`, `EditBudgetClientDialog`, `SendToClientButton`.
2. Hooks: `use-pipeline-job`, `use-pipeline-job-state`, `use-markup-factor`.
3. `@dnd-kit/*` para reordenar filas del presupuesto.
4. `PipelineJobControls` + `ExtractorBannerView` + React Query provider.

### B4 · Infra de código
- Añadir **vitest** (runner + scripts `test`/`test:watch`).
- `firestore.indexes.json` en el repo.
- *(Opcional)* `instrumentation.ts`.

---

## Convergencia y verificación
1. Apuntar el código nuevo al **proyecto nuevo** (envs de A9).
2. Prueba E2E: subir PDF de mediciones → `dispatch` → pipeline (extract → retrieval híbrido → pricing) → editor con **reconciliación** → **send-to-client** (email).
3. Reindexar en codebase-memory (`index_repository mode=full`) y actualizar `docs/CODEBASE_INDEX.md`.

## Riesgos / decisiones abiertas
- ✅ Project ID, IA (Vertex) y diferidos de fase 2 → ver «Decisiones confirmadas» arriba.
- ⏳ Re-indexar `dochevi-construc` antes de empezar B1 (ai-core): tiene cambios + tarea en curso.
- Paquete local `nextn` (`file:../nexoai`) — verificar que la ruta existe en esta máquina.
- `sentence-transformers` en Cloud Run: tamaño de imagen y arranque en frío (¿min instances?).
- Confirmar qué cuenta es **owner** de `express-renovation` (#797056263958): ¿`expressrenovation.platform@gmail.com` ya tiene rol Owner/Editor?
