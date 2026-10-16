/**
 * Límites del contrato desplegado (contracts/traceid/src/TraceId.sol, S3).
 *
 * Se duplican acá a propósito y no se derivan: el contrato es **no actualizable** (docs/04, D8),
 * así que estos números son fijos para siempre una vez desplegado. Si alguno cambia en el
 * contrato, cambia el contrato, no estas constantes.
 */

/**
 * `MAX_PAYLOAD_BYTES`. Un record realista son unos cientos de bytes; el tope deja que un
 * `ContractExecuteTransaction` con el overhead ABI entre en los ~6 KiB de Hedera (docs/06).
 */
export const MAX_PAYLOAD_BYTES = 4_096;

/**
 * `MAX_PAGE`: tope interno de `getRecords`. Provisional hasta medirlo contra el
 * `contracts/call` del mirror con payloads de tamaño máximo (docs/06, Pending).
 */
export const MAX_PAGE = 20;
