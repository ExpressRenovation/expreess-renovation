# Vercel — Environment Variables (express-renovation)

Runbook para activar producción en Vercel apuntando al proyecto GCP/Firebase
`express-renovation` (nº 797056263958, Firestore `europe-southwest1`).

Vercel → **Settings → Environment Variables**. Marca cada var para
**Production** (y Preview si quieres previews funcionales). Redeploy al terminar.

> Fuente canónica: [`.env.example`](../.env.example). Este checklist lo agrupa
> por prioridad y anota lo que cambió tras la migración del motor + asistente.

---

## ⚠️ 0. El bloqueo a resolver ANTES: la clave del Admin SDK

El Firebase **Admin SDK** (server actions, `verifyAuth`, `adminFirestore`, el
session cookie de login) necesita las credenciales `FIREBASE_CLIENT_EMAIL` +
`FIREBASE_PRIVATE_KEY`. En local usamos ADC (`gcloud auth application-default
login`); **Vercel no puede usar ADC → necesita una clave de cuenta de servicio**.

**El problema:** la organización aplica la política
`iam.disableServiceAccountKeyCreation`, que **bloquea descargar claves de SA**
(tanto por consola de Firebase → "Generar nueva clave privada" como por
`gcloud iam service-accounts keys create`).

**Opciones:**
1. **Excepción de política** (recomendado): pedir al admin de la organización
   una excepción de `iam.disableServiceAccountKeyCreation` a nivel del proyecto
   `express-renovation` (o para el SA `vercel-app@express-renovation.iam.gserviceaccount.com`),
   crear la clave, copiar `client_email` y `private_key`, y volver a activar la
   política. El SA `vercel-app@…` **ya existe** con roles mínimos
   (`datastore.user`, `storage.objectAdmin`, `cloudtasks.enqueuer`).
2. Si no se puede: no hay atajo limpio para Vercel (Workload Identity Federation
   requiere setup extra no trivial). Sin la clave, **las server actions fallan en
   producción** (login/sesión/Firestore).

> Al pegar `FIREBASE_PRIVATE_KEY` en Vercel: **conserva los `\n` escapados** tal
> cual vienen en el JSON (`-----BEGIN PRIVATE KEY-----\n...`). El código los
> des-escapa. No lo envuelvas en comillas extra dentro del panel de Vercel.

---

## 1. ✅ REQUERIDO — Firebase Web SDK (cliente)

Públicas por diseño (el navegador las necesita; las protege Firestore rules).
Valores ya conocidos del proyecto:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyAI57qxGJZTm7Q4o4-oMTlIXrrWyuNGaC0` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `express-renovation.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `express-renovation` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `express-renovation.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `797056263958` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:797056263958:web:f92823d59b5bea26b09237` |

## 2. ✅ REQUERIDO — Firebase Admin SDK (servidor)

| Variable | Valor |
|---|---|
| `FIREBASE_PROJECT_ID` | `express-renovation` |
| `GCLOUD_PROJECT` | `express-renovation` |
| `FIREBASE_STORAGE_BUCKET` | `express-renovation.firebasestorage.app` |
| `FIREBASE_CLIENT_EMAIL` | del JSON de la clave → `client_email` (`vercel-app@express-renovation.iam.gserviceaccount.com`) |
| `FIREBASE_PRIVATE_KEY` | del JSON de la clave → `private_key` (con `\n`, ver §0) |

## 3. ✅ REQUERIDO — Puente con el ai-core (Cloud Run)

| Variable | Valor |
|---|---|
| `AI_CORE_URL` | `https://ai-core-797056263958.europe-southwest1.run.app` |
| `INTERNAL_WORKER_TOKEN` | **debe COINCIDIR** con el `INTERNAL_WORKER_TOKEN` del Cloud Run Service `ai-core` |

> Cómo leer el token que ya tiene el Service (sin imprimirlo en claro, con la
> cuenta owner):
> ```bash
> gcloud run services describe ai-core --region=europe-southwest1 \
>   --project=express-renovation --format='value(spec.template.spec.containers[0].env)'
> ```
> El asistente v2 y el monitor de jobs dependen de este token. (La antigua
> `AI_CORE_SERVICE_TOKEN` ya **no** se usa — no la pongas.)

## 4. ✅ REQUERIDO — Encender el motor

| Variable | Valor | Nota |
|---|---|---|
| `NEXT_PUBLIC_USE_PIPELINE_JOBS` | `true` | Activa el flujo async pipeline-jobs (dispatch al Cloud Run Job + polling). Sin esto, la UI usa el flujo legacy síncrono y el monitor de Jobs / asistente no aprovechan la pipeline. |

## 5. ✅ REQUERIDO — Sitio

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_APP_URL` | origen de producción, p.ej. `https://www.expressrenovationmallorca.es` |
| `NEXT_PUBLIC_SITE_URL` | mismo origen (canonical/hreflang/sitemap — un mismatch rompe indexación) |
| `NEXT_PUBLIC_USE_TEST_DB` | `false` |

## 6. 🟡 RECOMENDADO / según features

| Variable | Para qué | ¿Necesaria? |
|---|---|---|
| `GOOGLE_GENAI_API_KEY` | Búsqueda **vectorial del libro de precios** (`dashboard/admin/prices`) + flows Genkit. Créala en Google AI Studio contra `express-renovation`. | Sí, si usas la búsqueda semántica de precios. (`GEMINI_API_KEY` es alias fallback.) |
| `ADMIN_SECRET` | Protege las acciones de mantenimiento bajo `/actions/debug`. El código se niega a correr sin ella. | Solo si usas esas utilidades. |
| `GCP_TASKS_LOCATION` / `GCP_TASKS_QUEUE` | Cloud Tasks (encolado diferido). | Solo si usas Cloud Tasks. |

## 7. 🔵 OPCIONAL — Integraciones (Fase 2)

| Variable | Para qué |
|---|---|
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Email transaccional (notificaciones de lead). |
| `META_ACCESS_TOKEN` / `META_PHONE_NUMBER_ID` | WhatsApp Business (Meta). Vacío = desactivado. |
| `GOOGLE_WORKSPACE_ADMIN_EMAIL` | Impersonación de calendario (agenda). Vacío = desactivado. |

## 8. ❌ NO poner en Vercel

- `NODE_ENV` — Vercel la fija sola (`production`).
- `GOOGLE_APPLICATION_CREDENTIALS` — solo para ADC local; en Vercel usa la terna Admin (§2).
- `AI_CORE_SERVICE_TOKEN` — legacy, ya no la lee el código (usa `INTERNAL_WORKER_TOKEN`).

---

## 9. Verificación post-deploy

1. **Login** → carga el dashboard (confirma web SDK + que el session cookie se acuña).
2. **Calibración** (`/dashboard/settings/budget`) carga el panel real, no "solo administradores" (confirma Admin SDK + claim admin + session cookie).
3. **Libro de precios** (`/dashboard/admin/prices`) → la búsqueda vectorial responde (confirma `GOOGLE_GENAI_API_KEY`).
4. **Asistente** (`/dashboard/wizard`) → generar un presupuesto por chat (confirma `AI_CORE_URL` + `INTERNAL_WORKER_TOKEN` + flag on + endpoint `/api/v1/jobs/nl-budget`).
5. **Monitor de Jobs** (`/dashboard/admin/jobs`) → lista jobs (confirma el puente completo).

> Recordatorio: los admins necesitan el claim `{admin:true}` (`set-admin.mjs`) y
> **cerrar/abrir sesión** tras asignarlo para refrescar el token.
