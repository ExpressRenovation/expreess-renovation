# Índice completo — Express Renovation

> Generado a partir del *knowledge graph* del MCP **codebase-memory**
> (proyecto `C-Users-Usuario-Documents-github-works-expreess-renovation`, **5.591 nodos / 12.738 aristas**).
> Fecha: 2026-09-04.

---

## 1. Qué es

Plataforma **SaaS de construcción / reformas** ("Express Renovation"): web pública multi-idioma + panel de administración (dashboard) + un **agente de IA que genera presupuestos** a partir de mediciones en PDF. Nació como boilerplate Next.js + Firebase + ShadCN y evolucionó a una aplicación DDD con un microservicio Python para la extracción/valoración de presupuestos con IA.

## 2. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | **Next.js 15.1** (App Router, Server Actions), React 18, TypeScript 5 |
| UI | Tailwind CSS 3.4, **ShadCN/Radix UI**, framer-motion, recharts, embla-carousel |
| Backend web | Server Actions + arquitectura **DDD / Hexagonal** en `src/backend` |
| Datos / Auth | **Firebase** (Firestore, Auth) + `firebase-admin` |
| IA (TS) | **Genkit** + `@genkit-ai/googleai` / `vertexai` / `@google/genai` (Gemini) |
| IA (Python) | Microservicio **FastAPI** `services/ai-core` (extracción PDF + Gemini) |
| PDF | `@react-pdf/renderer`, `pdf-lib`, `pdfjs-dist`, `pdf-parse`, `pdf2json`, `pdf2pic` |
| Infra | Firebase **App Hosting** (`apphosting.yaml`), Google Cloud **Tasks**, **Upstash Redis** (rate-limit) |
| i18n | `next-intl` + `next-i18n-router` — locales **es (default), en, ca, de, nl** |
| Validación | `zod` + `react-hook-form` |

**Puertos:** dev en `:9002` (`npm run dev`). Scripts: `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `validate`.

## 3. Estructura del monorepo

```
expreess-renovation/
├── middleware.ts          # i18n routing (next-i18n-router)
├── i18nConfig.ts          # locales: es|en|ca|de|nl, default es
├── next.config.js · tailwind.config.ts · apphosting.yaml
├── docs/                  # documentación (este índice)
├── services/
│   └── ai-core/           # Microservicio Python (FastAPI) — IA de presupuestos
└── src/
    ├── app/               # App Router (rutas, páginas, layouts)
    ├── actions/           # Server Actions (capa de aplicación del frontend)
    ├── backend/           # Núcleo DDD por bounded context (dominio/aplicación/infra)
    ├── application/ · domain/ · infrastructure/   # DDD compartido (marketing, analytics, leads)
    ├── components/        # Componentes React (ui, budget-editor, home, dashboard…)
    ├── hooks/ · context/  # Hooks y React Context
    ├── genkit/            # Configuración Genkit (index, ingestion, schema)
    ├── i18n/ · locales/   # Config y diccionarios de traducción (5 idiomas × 11 namespaces)
    ├── lib/               # Utilidades, firebase client, SEO, servicios, ubicaciones
    ├── types/ · scripts/  # Tipos y scripts de análisis de PDF
```

## 4. Arquitectura (DDD / Hexagonal)

El MCP detecta estas **capas** y **fronteras de llamadas** (call boundaries):

- **entry** → `app` (páginas), `components` (solo llamadas salientes)
- **internal** → `actions` (fan-in 101 / fan-out 271), `middleware`
- **core** (alto fan-in) → `backend` (407 entradas), `lib`, `hooks`, `infrastructure`

Flujo dominante: `app`/`components` → `actions` (Server Actions) → `backend` (casos de uso) → `infrastructure` (Firestore) → Firebase / `ai-core`.

Cada **bounded context** en `src/backend/<contexto>/` sigue el patrón:
`domain/` (entidades, value objects, puertos) · `application/` (casos de uso) · `infrastructure/` (repositorios Firestore, adaptadores).

### 4.1 Bounded contexts (`src/backend/`)

| Contexto | Rol |
|----------|-----|
| **budget** | Núcleo de presupuestos: mappers (`FormToSpecsMapper`), casos de uso, eventos, infra |
| **price-book** | Banco de precios (búsqueda semántica, ingestión, repos Firestore) |
| **material-catalog** | Catálogo de materiales (ingestión, búsqueda, actions propias) |
| **catalog** | Catálogo semántico + scripts de vectorización |
| **ai** | Flujos de IA: `flows`, `tools`, `private-core`, `public-demo`, `config`, `shared` |
| **ai-training** | Datos de entrenamiento / correcciones ICL |
| **chat** | Conversaciones (repos Firestore, dominio, aplicación) |
| **crm** | CRM |
| **lead** | Gestión de leads (repo `FirebaseLeadRepository`) |
| **marketing** | Captación / marketing |
| **agenda** | Reservas y disponibilidad (booking, config) |
| **project** | Proyectos y fases (`FirestoreProjectRepository`) |
| **expense** | Gastos / facturas de proveedores |
| **analytics** | Analítica (EVM, ranking proveedores, precisión de presupuesto) |
| **user** | Usuarios |
| **auth** | Middleware de autenticación + scripts |
| **security** | `AuditLogger`, `rate-limiter` (Upstash) |
| **shared** | Infra compartida (`initFirebaseAdminApp`), eventos, dominio base |
| **scripts** | Scripts de depuración PDF / precios / embeddings |

## 5. Frontend — App Router (`src/app/[locale]/`)

Rutas agrupadas por segmentos: `(public)`, `(auth)`, `dashboard`.

**Público** `(public)`:
- `/` (home) · `/services` · `/services/[category]` · `/services/[category]/[subcategory]`
- `/budget-request` · `/presupuesto/rapido` · `/presupuesto/obra-nueva`
- `/blog` · `/blog/[slug]` · `/contact` · `/zonas/[zone]` · `/hoja-de-ruta`
- `/llms.txt` (route handler para IA/SEO)

**Auth** `(auth)`: `/login` · `/signup`

**Dashboard** (`/dashboard/…`):
- Raíz · `analytics` · `projects` · `projects/[id]` · `expenses` · `agenda` · `leads` · `marketing` · `measurements` · `budget-request` · `wizard` · `settings` (+ `budget`, `financial`, `pricing`) · `seo-generator`
- **Admin**: `budgets` · `budgets/[id]/edit` · `messages` · `prices` · `pending-items` · `ai-training` · `traces` · `traces/[traceId]` · `pdf-batch-extractor`

### 5.1 Componentes destacados (`src/components/`)
- **`ui/`** (43): design system ShadCN (button, dialog, table, chart, sidebar, form…)
- **`budget-editor/`** (21): editor de presupuestos (grid, tabla, toolbar, catálogo semántico, material picker, salud del presupuesto, traza IA)
- **`budget-request/`**: asistentes (wizards) de solicitud (rápido, obra nueva, provisional)
- **`home/`**, **`layout/`** (header, footer, mega-menú, sidebar), **`analytics/`**, **`projects/`**, **`expenses/`**, **`pdf/`** (documentos PDF), **`seo/`** (JSON-LD, interlinking)

### 5.2 Hooks y contexto
- Hooks: `use-budget-editor`, `use-price-book`, `use-auth`, `use-analytics`, `use-audio-recorder`, `use-toast`, `use-mobile`, `use-media-query`, `use-scroll-direction`
- Context: `auth-context`, `budget-widget-context`

## 6. Server Actions (`src/actions/`)

Punto de entrada de la lógica de negocio desde el cliente. Agrupadas por dominio (~80 acciones):

- **budget/** (el mayor): generar/actualizar/aprobar presupuestos, demo público, desde specs, desde mediciones, smart-add, feedback ICL/comunidad, trazas de corrección…
- **agenda/**: `booking` (slots, crear/cancelar, desde lead), `config`
- **analytics/**: global, por proyecto, avanzada (EVM, ranking, precisión)
- **project/**, **expense/**, **lead/**, **chat/**, **price-book/**, **material-catalog/**, **catalog/**, **ai/** (generate-renovation), **audio/**, **attachments/**, **contact/**, **notifications/**, **admin/**, **marketing-analytics/**, **debug/**

## 7. Subsistema de IA

Dos motores complementarios:

1. **Genkit / Gemini (TypeScript)** — `src/genkit/` + `src/backend/ai/`: flujos, herramientas, demo público, ingestión de embeddings, generación de renders ("dream renovator").
2. **`services/ai-core` (Python / FastAPI)** — arquitectura hexagonal (`budget/`, `extractor/`, `core/`):
   - `GET /health` — health check abierto (uptime).
   - `POST /api/v1/jobs/measurements` — sube un PDF, hace **extracción espacial** síncrona (`PdfPlumberAdapter`) y lanza un **job de IA en background** (`RestructureBudgetUseCase` + `gemini_adapter`) para no chocar con el timeout de 60s de Vercel; responde **202 Accepted**. Protegido por *shared-secret* (`X-Service-Token`, `secrets.compare_digest`, fail-closed).
   - Casos de uso: `ExtractBudgetFromPdfUseCase`, `RestructureBudgetUseCase`; validación matemática (`MathematicalValidationError`), repos Firestore (`firestore_budget`, `firestore_price_book`, heurísticas), `query_expander`.
   - Scripts: gold standard, vectorización de catálogo, extracción de histórico ICL, comparación de presupuestos.

## 8. i18n

- **5 locales**: `es` (default), `en`, `ca`, `de`, `nl`; `prefixDefault: true`.
- Routing en `middleware.ts` vía `next-i18n-router` (matcher excluye `api`, `_next`, estáticos).
- **11 namespaces** por idioma en `src/locales/<locale>/`: blog, budget-request, contact, dashboard, header, home, login, metadata, pricing-settings, services, signup.

## 9. Infraestructura y seguridad

- **Firebase**: Firestore (persistencia), Auth, `firebase-admin` (`initFirebaseAdminApp` — 32 usos).
- **App Hosting** (`apphosting.yaml`, `maxInstances: 1`).
- **Google Cloud Tasks** (`@google-cloud/tasks`) para trabajos diferidos.
- **Upstash Redis** — rate limiting (`src/backend/security/rate-limiter.ts`).
- **Auditoría**: `AuditLogger.log` (98 usos) en `src/backend/security/`.

## 10. Puntos calientes (hotspots por fan-in)

| Símbolo | fan-in | Ubicación |
|---------|:------:|-----------|
| `FormToSpecsMapper.map` | 246 | `backend/budget/application/mappers` |
| `AuditLogger.log` | 98 | `backend/security` |
| `cn` (util classnames) | 98 | `lib/utils` |
| `FirestoreProjectRepository.collection` | 94 | `backend/project/infrastructure` |
| `toast` / `useToast` | 41 / 29 | `hooks/use-toast` |
| `initFirebaseAdminApp` | 32 | `backend/shared/infrastructure/firebase` |
| `getDictionary` | 25 | `lib/dictionaries` |
| `FirebaseLeadRepository.findById` | 21 | `infrastructure/persistence/firebase` |

## 11. Cómo consultar el índice (MCP codebase-memory)

El grafo queda persistido en el MCP. Ejemplos útiles (proyecto `C-Users-Usuario-Documents-github-works-expreess-renovation`):

- `get_architecture` → visión de capas, clusters y hotspots.
- `search_graph` / `search_code` → buscar funciones, rutas, clases (BM25 / semántico / regex).
- `trace_path` → callers/callees, data-flow, cross-service (a través de las rutas HTTP del ai-core).
- `query_graph` (Cypher) → patrones multi-hop, p. ej. cuellos de botella:
  `MATCH (f:Function) WHERE f.transitive_loop_depth >= 3 RETURN f.qualified_name ORDER BY f.transitive_loop_depth DESC`
- `detect_changes` → impacto de cambios respecto a `main`.

> Reindexar tras cambios grandes: `index_repository(mode="full")`.
