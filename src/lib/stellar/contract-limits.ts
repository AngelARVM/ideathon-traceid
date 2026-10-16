/**
 * Límites del contrato desplegado (contracts/traceid/src/lib.rs, S3).
 *
 * Se duplican acá a propósito y no se derivan: el contrato es **no actualizable** (docs/04, D8),
 * así que estos números son fijos para siempre una vez desplegado. Si alguno cambia en el
 * contrato, cambia el contrato, no estas constantes.
 */

/** `MAX_PAYLOAD_BYTES`. Un record realista son unos cientos de bytes. */
export const MAX_PAYLOAD_BYTES = 8_192;

/**
 * `MAX_PAGE`: tope interno de `get_records` / `extend_ttl`. Provisional hasta medirlo en
 * Testnet (docs/06, Pending); también mantiene `extend_ttl` bajo el límite de 200 entradas
 * por transacción.
 */
export const MAX_PAGE = 50;
