/**
 * Drena el outbox una vez y sale (docs/07).
 *
 * En S2 esto se corre a mano: `npm run outbox:drain`. Es un script y no un loop de desarrollo
 * ni un worker porque así el operador ve el ciclo `pending → confirmed` cuando él decide, que
 * es justamente lo que hay que poder demostrar.
 */

import { createPrismaClient } from "../src/db/client";
import { drainOutbox } from "../src/lib/outbox/drain";

const db = createPrismaClient();
const result = await drainOutbox({ db, onLog: (line) => console.log(line) });

console.log(
  `\nConfirmadas ${result.confirmed} · reintentables ${result.retried} · fallidas ${result.failed} · postergadas ${result.skipped}`,
);

await db.$disconnect();

if (result.failed > 0) process.exitCode = 1;
