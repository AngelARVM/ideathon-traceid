# M3 — Negociación y acuerdos

**Fase:** paralela, después de M0. **Estimado:** 75–90 min. Es el hito más largo y el corazón de la demo: conviene dárselo al agente o la persona con más contexto.
**Contrato:** [`docs/00-mvp-spec.md`](../00-mvp-spec.md), §6 (`Proposal` y `Agreement`), §8.2, §8.3, §9, §10, §12.3, §12.4 y §13 (pasos 3–7 y 9).

## Objetivo

- El comprador propone sobre una oferta.
- El vendedor acepta, rechaza o contraoferta.
- El comprador confirma, o acepta o rechaza la contraoferta.
- La confirmación es atómica: crea un `Agreement` inmutable y descuenta stock.
- Ambas partes ven el comprobante y nadie más lo ve.

## Archivos permitidos

- `src/app/offers/[id]/propose/**`, la única subcarpeta de `offers` que es de este hito.
- `src/app/proposals/**`
- `src/app/agreements/**`
- `src/lib/negotiation/**`

Escribe en `offers.quantity_tons` **solo** dentro de `confirmProposal` (§12.4).

## Dominio (`src/lib/negotiation/`)

### `terms.ts`: funciones puras, sin `server-only`, para poder testearlas en M5

- `effectiveTerms(p): { quantityTons: string; pricePerTon: string }` devuelve los términos `counter*` si existen, y si no, los originales. Si la contraoferta trae un solo campo, el que falta se toma del original (§8.2).
- `totalAmount(quantityTons, pricePerTon): string` calcula con `Prisma.Decimal` y redondea a 2 decimales.
- `allowedActions(p, offer, persona): Array<"accept"|"reject"|"counter"|"confirm"|"rejectCounter">` implementa la tabla §8.2 sin acceder a la base. La UI la usa para decidir qué botones mostrar y las actions la usan para validar.
- `confirmBlockReason(p, offer): string | null` devuelve el motivo legible si hoy no se puede confirmar: "La oferta todavía es estimada (disponible aprox. dd/mm/aaaa)", "La oferta fue retirada" o "Stock insuficiente: quedan X Tn". La UI muestra el motivo **antes** de que el usuario intente confirmar.

### `actions.ts`

Todas devuelven `ActionResult` o hacen `redirect`, y validan con zod, `parseTons` y `parsePrice`.

| Acción | Actor | Implementación |
|---|---|---|
| `createProposal(offerId, quantityTons, pricePerTon, message?)` | `requirePersona("buyer")` | Aplica las condiciones de §8.2: oferta `available` o `estimated` con stock mayor a 0, cantidad ≤ stock y ninguna propuesta abierta del mismo comprador sobre esa oferta. Si ya hay una abierta, devuelve un error con enlace a ella. Termina con `redirect('/proposals/<id>')`. |
| `acceptProposal(id)` | `requirePersona("seller")` | `updateMany` con `where: { id, status: "pending", offer: { sellerId: persona.id, status: { not: "withdrawn" } } }` y `data: { status: "accepted", respondedAt: now }`. Si `count === 0`, devuelve un error. Si la cantidad supera el stock actual, devuelve `ok: true` con `data.warning` (D8). |
| `rejectProposal(id)` | seller | Funciona igual que `acceptProposal`: pasa de `pending` a `rejected`. |
| `counterProposal(id, counterQuantityTons?, counterPricePerTon?, counterMessage?)` | seller | Exige al menos uno de los dos valores, y que alguno difiera del original. Usa `updateMany` desde `pending`, completa el campo que falte con el original y pasa a `countered`. |
| `rejectCounter(id)` | `requirePersona("buyer")` | `updateMany` con `where: { id, buyerId: persona.id, status: "countered" }` → `rejected`. |
| `confirmProposal(id, closingComment?)` | buyer | Sigue **exactamente §8.3**, en una transacción interactiva. Se usa tanto para "Confirmar acuerdo" (desde `accepted`) como para "Aceptar contraoferta" (desde `countered`). `closingComment` admite hasta 500 caracteres. |

Después de cada mutación: `revalidatePath` de `/proposals`, `/proposals/<id>` y `/offers/<offerId>`. En la confirmación, además, `/offers` y `/agreements`.

### `queries.ts`

- `listProposalsFor(persona)`:
  - si la persona es buyer, sus propuestas;
  - si es seller, las propuestas sobre sus ofertas.
  Incluye oferta, comprador y localidad. Agrupa en "Requieren tu acción" y "Otras". La acción que corresponde a cada uno sale de `allowedActions`.
- `getProposalForParty(id, persona)`: si la persona no es parte, `notFound()`.
- `listAgreementsFor(persona)` y `getAgreementForParty(id, persona)` funcionan igual. Para un no-participante, `notFound()` (§9, §13 paso 9).

## Páginas

| Ruta | Contenido |
|---|---|
| `/offers/[id]/propose` | Resumen de la oferta: título, vendedor, localidad, distancia, stock, precio de referencia y badge de estado; si es estimada, el aviso de D10. Formulario:<br>• cantidad en Tn, con máximo el stock visible y ayuda "Disponible: X Tn";<br>• precio por Tn, precargado con el de referencia si existe;<br>• mensaje opcional;<br>• total calculado en vivo, que es solo visual.<br>Botón "Enviar propuesta". Si la persona no es buyer o la oferta no admite propuestas, `notFound()` o un mensaje. |
| `/proposals` | Título "Propuestas recibidas" (seller) o "Mis propuestas" (buyer). Dos secciones: **Requieren tu acción** y **Historial**. Cada fila muestra la oferta, la contraparte, los términos efectivos, el `ProposalStatusBadge` y la fecha, y enlaza al detalle. |
| `/proposals/[id]` | Línea de tiempo simple, sin chat:<br>1. propuesta original (cantidad, precio, mensaje y fecha);<br>2. contraoferta, si la hay (valores nuevos y mensaje);<br>3. estado actual.<br>Acciones según `allowedActions`:<br>• **seller con `pending`:** "Aceptar", "Rechazar" y "Contraofertar". Contraofertar abre un formulario inline con cantidad, precio y mensaje. Si la cantidad supera el stock, aviso visible.<br>• **buyer con `accepted`:** "Confirmar acuerdo", con textarea de comentario de cierre.<br>• **buyer con `countered`:** "Aceptar contraoferta y confirmar", con textarea de comentario, y "Rechazar contraoferta".<br>Si `confirmBlockReason` no es nulo, el botón queda deshabilitado y el motivo se ve al lado. Si la propuesta está `confirmed`, enlace "Ver comprobante". |
| `/agreements` | Lista de acuerdos de la persona: material, contraparte, Tn, total y fecha. |
| `/agreements/[id]` | **Comprobante**:<br>• encabezado "Acuerdo comercial declarado · N° <id corto>";<br>• vendedor y comprador, con sus localidades;<br>• material, categoría y origen;<br>• cantidad, precio/Tn y **total** (D9: solo el precio final);<br>• características y logística copiadas del snapshot;<br>• comentario de cierre y fecha de confirmación.<br>Leyenda fija: "SubMarket registra un acuerdo declarado entre las partes. El pago, el flete y la entrega ocurren fuera de la plataforma y no son verificados por SubMarket." Datos tomados **solo** del `Agreement`, nunca de la oferta viva. |

## Definición de terminado

- [ ] Los pasos 3–7 y 9 del guion §13 funcionan de punta a punta con dos personas en el mismo navegador, cambiando desde el header.
- [ ] Después del paso 6, el stock de `o-cascarilla-mercedes` es 570 y el comprobante dice 80 Tn × $ 27.500 = $ 2.200.000.
- [ ] Si se edita la oferta de Mercedes (M1) después de confirmar, el comprobante no cambia.
- [ ] Una propuesta sobre `o-pulpa-zafra-2027` puede aceptarse, pero la confirmación queda bloqueada con el motivo visible. Después de "Marcar disponible" (M1), se confirma.
- [ ] Un doble clic en "Confirmar" o un reenvío del form genera **un** solo acuerdo y un solo descuento de stock. Se verifica a mano.
- [ ] Si se confirma una propuesta por más Tn que el stock que queda, se ve un error claro y no se descuenta nada.
- [ ] Una persona ajena que abre `/proposals/<id>` o `/agreements/<id>` recibe 404.
- [ ] `npm run typecheck` y `npm run lint` pasan.
