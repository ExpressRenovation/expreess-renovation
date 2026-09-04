import 'server-only';

/**
 * STUB DE ADAPTACIÓN (express-renovation).
 *
 * En dochevi este módulo cablea el bus de eventos de dominio completo
 * (marketing / CRM / lead-scoring / re-engagement) al arrancar el proceso.
 * express es un fork temprano que NO tiene ese subsistema de automatización
 * (le faltan las usecases de re-engagement, los listeners de lead-scoring y
 * varias usecases de CRM; además su modelo de dominio Deal/PipelineStage ya
 * diverge del de dochevi). Portarlo entero excede el alcance del editor de
 * presupuestos y rompería el CRM existente de express.
 *
 * Por eso `registerEventListeners()` es aquí un NO-OP idempotente: el editor
 * (`send-budget-to-client.action`) sigue enviando el email, subiendo el PDF y
 * marcando el presupuesto como `sent`; sólo queda no-op la automatización
 * downstream que reacciona a `BudgetSentEvent` (mover el deal a PROPOSAL_SENT,
 * ajustar lead score, cancelar la secuencia de re-engagement). Cuando se porte
 * el subsistema de eventos, sustituir este stub por el cableado real de dochevi.
 */

let registered = false;

export function registerEventListeners(): void {
    if (registered) return;
    registered = true;
    // NO-OP: subsistema de eventos de dominio no portado en express (ver cabecera).
    console.log('[events] registerEventListeners: no-op stub (event subsystem not ported)');
}
