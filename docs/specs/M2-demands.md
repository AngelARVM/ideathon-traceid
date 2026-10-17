# M2 — Demandas: publicación, listado y ofertas compatibles

**Fase:** paralela, después de M0. **Estimado:** 45–60 min.
**Contrato:** [`docs/00-mvp-spec.md`](../00-mvp-spec.md), §6 (`Demand`), §9, §9.1, §9.3, §10, §12.1, §12.2, §12.4.

## Objetivo

Un comprador publica, edita y retira demandas. Cualquier persona las explora. El detalle de una demanda muestra las **ofertas compatibles**, que es la "compatibilidad oferta–demanda" del brief. Un vendedor puede publicar desde ahí una oferta precargada.

## Archivos permitidos

- `src/app/demands/**`
- `src/app/my-demands/**`
- `src/lib/demands/**`

La tabla `offers` es de **solo lectura** para este hito (§12.4).

## Server actions (`src/lib/demands/actions.ts`)

Todas empiezan con `requirePersona("buyer")` y validan con zod, `parseTons` y `parsePrice`.

| Acción | Entrada | Reglas |
|---|---|---|
| `createDemand` | `title`, `category`, `description?`, `quantityTons`, `maxPricePerTon?`, `neededBy?`, `radiusKm` (50\|100\|200), `localityId` | `buyerId = persona.id`. `localityId` por defecto es la de la persona. Si viene `neededBy`, no puede estar en el pasado. Termina con `redirect('/demands/<id>')`. |
| `updateDemand` | `id` + los mismos campos | Dueño (`buyerId === persona.id`) y `status === "open"`. |
| `withdrawDemand` | `id` | `updateMany` con `where: { id, buyerId, status: "open" }` y `data: { status: "withdrawn" }`. Si `count === 0`, devuelve un error. |

Después de cada mutación: `revalidatePath("/demands")`, `revalidatePath("/my-demands")` y el detalle.

## Consultas (`src/lib/demands/queries.ts`)

- `listDemands(filters, persona)`: busca las demandas `open`. Filtra por `category` y `radius` (distancia desde la persona) con los mismos params de §9.2 que apliquen. Ordena por distancia.
- `getDemandDetail(id, persona)`: si la demanda es `withdrawn` y la persona no es su dueño, `notFound()`.
- `listCompatibleOffers(demand)`: implementa §9.3 **exactamente**. Para cada oferta devuelve `OfferCardData`, `distanceKm`, `coversTons` (el menor entre el stock y lo pedido) y `overMaxPrice: boolean`.
- `listMyDemands(persona)`: todas las demandas del comprador, retiradas incluidas, con el conteo de ofertas compatibles.

## Páginas

| Ruta | Contenido |
|---|---|
| `/demands` | Título "Demandas de compradores". Filtros de categoría y radio. Lista de tarjetas simples, una por demanda: categoría, título, comprador + localidad, Tn buscadas, precio máx. (si lo hay), "necesito para <fecha>", distancia desde la persona y conteo de ofertas compatibles. Para un buyer, CTA "Publicar demanda". |
| `/demands/[id]` | Encabezado de la demanda. Sección **"Ofertas compatibles (N)"** con `OfferCard` y, debajo de cada una, "Cubre X de Y Tn", el badge "Sobre tu precio máximo" cuando corresponde y la distancia. Si no hay compatibles: "Todavía no hay ofertas compatibles dentro de N km". Si la persona es seller, recuadro **"¿Tenés este subproducto?"** con `LinkButton` a `/offers/new?category=<cat>&quantity=<tons>&title=<título urlencoded>&demand=<id>` (§12.2). Si la persona es el buyer dueño, acciones "Editar" y "Retirar". |
| `/demands/new` | Formulario solo para buyer, con `useActionState` y errores por campo. |
| `/demands/[id]/edit` | El mismo formulario, precargado. Solo el dueño. |
| `/my-demands` | Lista con estado, conteo de compatibles y acciones. Un toggle muestra las retiradas. |

## Notas

- La compatibilidad es una **regla visible**. Debajo del título de la sección va: "Misma categoría · dentro de N km · disponibles, o estimadas antes de <fecha>". No hay que presentarlo como recomendación inteligente.
- No hay propuestas desde una demanda. El camino es siempre: oferta compatible → detalle de la oferta (M1) → proponer (M3).
- `params` y `searchParams` son `Promise`. El contenido que depende de la persona va en `<Suspense>` (§7).

## Definición de terminado

- [ ] Como Feedlot Resistencia, `/demands/d-suplemento-feedlot` muestra como compatibles "Pulpa de cítricos fresca" (40 Tn, "cubre 40 de 150") y "Pulpa de cítricos — zafra 2027" (estimada, 01/05/2027), las dos a ≈ 117 km.
- [ ] Como Yerbatera Oberá, `/demands/d-secadero-obera` muestra "Chips de pino para caldera" (≈ 110 km). El aserrín de Santo Tomé **no** aparece, porque es de otra categoría.
- [ ] Como Granja Avícola Bella Vista, se crea, edita y retira una demanda. Las retiradas desaparecen de `/demands`.
- [ ] Como Citrícola Bella Vista, en el detalle de una demanda el CTA lleva a `/offers/new` con los params correctos.
- [ ] Un seller no puede ejecutar `createDemand`, y un buyer no puede editar una demanda ajena.
- [ ] `npm run typecheck` y `npm run lint` pasan.
