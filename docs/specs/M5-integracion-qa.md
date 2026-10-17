# M5 — Integración, tests y entrega

**Fase:** secuencial, al final. Arranca cuando M1–M4 están mergeados. **Estimado:** 30–40 min. Si sobra un agente antes, puede adelantar la tarea 2.
**Contrato:** [`docs/00-mvp-spec.md`](../00-mvp-spec.md), §8.3 y §13.

## Tareas

### 1. Integración

- Mergear M1–M4 en el orden de [`01-orchestration.md`](../01-orchestration.md) §4.
- Correr `npm run typecheck`, `npm run lint` y `npm run build`, y resolver los conflictos.
- Verificar que todos los enlaces del header lleguen a páginas existentes, y que no queden los 404 provisorios de M0.
- Si dos hitos crearon la misma primitiva de UI por separado, unificarlas en `src/components/ui/` solo si es trivial. Si no, dejarlas.

### 2. Tests mínimos

Con `node --test` y tsx (`npm test`), en `src/lib/negotiation/*.test.ts`.

- **Puros**, sin base:
  - `effectiveTerms`: sin contraoferta; con contraoferta completa; con contraoferta solo de precio.
  - `totalAmount`: redondeo con 3 decimales de Tn × 2 decimales de precio.
  - `allowedActions`: una fila de la tabla §8.2 por caso.
  - `confirmBlockReason`: oferta estimada, retirada y con stock insuficiente.
  - `distanceKm`: Bella Vista–Corrientes ≈ 118.
- **Con base local**, si hay tiempo y si `DATABASE_URL` apunta a localhost; si no, se saltean. Extraer la transacción de §8.3 a una función `confirmProposalTx(tx, buyerId, proposalId, comment)` que no dependa de cookies, y probar:
  1. el stock insuficiente rechaza y no descuenta;
  2. una oferta estimada rechaza;
  3. dos confirmaciones concurrentes (`Promise.all`) generan exactamente 1 `Agreement` y el stock se descuenta una sola vez;
  4. otro `buyerId` es rechazado;
  5. el acuerdo conserva sus términos después de un `update` de la oferta.

### 3. Recorrido de demo

- Con la base local en `--reset-demo`, ejecutar el guion de §13 completo, paso por paso.
- Anotar cualquier desvío y corregirlo, o ajustar el guion si la diferencia es aceptable.
- Repetirlo una vez en Vercel, después de que la persona responsable aplique la migración y el seed (D15).

### 4. Entrega

- `README.md`: qué es SubMarket; qué se simula y qué no (pagos, flete, verificación); arranque local; variables de entorno; cómo resetear la demo; personas disponibles; un enlace al spec.
- `.env.example`: verificar que esté completo.
- **Vercel** (lo hace la persona responsable, no un agente):
  1. definir `PERSONA_SECRET` en el proyecto, en Production y Preview;
  2. confirmar que el build no requiere variables de Better Auth ni de Hedera;
  3. correr desde local `DATABASE_URL=<vercel> npm run db:migrate`;
  4. después, `npm run db:seed -- --allow-remote --reset-demo`;
  5. redeploy.
- Antes de presentar, correr `--reset-demo` en la base de Vercel.

## Definición de terminado

- [ ] `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` pasan.
- [ ] El guion §13 funciona en local y en la URL de Vercel.
- [ ] El README describe el producto realmente implementado.
