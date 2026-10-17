# M1 — Ofertas: catálogo, detalle y gestión del vendedor

**Fase:** paralela, después de M0. **Estimado:** 60–75 min.
**Contrato:** [`docs/00-mvp-spec.md`](../00-mvp-spec.md), §6 (`Offer`), §8.1, §9, §9.1, §9.2, §10, §12.1–§12.3.

## Objetivo

Un vendedor publica, edita, retira y marca como disponible sus ofertas. Cualquier persona explora el catálogo con filtros y ordenado por distancia, y ve el detalle de cada oferta.

## Archivos permitidos

- `src/app/ofertas/**`, **excepto** `src/app/ofertas/[id]/proponer/**`, que es de M3.
- `src/app/mis-ofertas/**`
- `src/lib/offers/**`

No se modifica nada de §12.1. Si falta algo compartido, se crea dentro de `src/lib/offers/` o `src/app/ofertas/_components/`, y se anota para M5.

## Server actions (`src/lib/offers/actions.ts`)

Todas devuelven `ActionResult`, salvo las que terminan en `redirect`. Todas empiezan con `requirePersona("seller")`, validan con zod y usan `parseTons` y `parsePrice` de `src/lib/decimal.ts`.

| Acción | Entrada | Reglas |
|---|---|---|
| `createOffer` | `title`, `category`, `description`, `quantityTons`, `pricePerTon?`, `status` (`available`\|`estimated`), `estimatedDate?`, `localityId`, `humidityPct?`, `calorificKcalKg?`, `presentation?`, `freight`, `hasWeighbridge`, `labAnalysis?` | `sellerId = persona.id`. `estimated` exige `estimatedDate` futura; `available` la ignora. `quantityTons > 0`. `humidityPct` entre 0 y 100. `calorificKcalKg` entero entre 0 y 10000. `localityId` por defecto es la de la persona y tiene que existir. Termina con `redirect('/ofertas/<id>')`. |
| `updateOffer` | `id` + los mismos campos | La oferta tiene que existir con `sellerId === persona.id` y estado distinto de `withdrawn`. `status` solo admite `available`\|`estimated`. `quantityTons` puede ser ≥ 0: es el stock restante, y editarlo es la forma de corregirlo. No afecta propuestas ni acuerdos. |
| `withdrawOffer` | `id` | Dueño, y estado distinto de `withdrawn`, pasa a `withdrawn`. Usar `updateMany` con `where: { id, sellerId, status: { not: "withdrawn" } }`. Si `count === 0`, devolver un error. |
| `markOfferAvailable` | `id` | Dueño y `status === "estimated"`. Pasa a `available` y pone `estimatedDate = null`. |

Después de cada mutación: `revalidatePath("/ofertas")`, `revalidatePath("/mis-ofertas")` y el detalle.

## Consultas (`src/lib/offers/queries.ts`)

- `listCatalog(filters, persona)`: busca las ofertas con `status in [available, estimated]`, filtra en la base por `categoria`, `disponibilidad` y `presentacion`, e incluye `locality` y `seller`. Los demás filtros se aplican en memoria: distancia con `distanceKm`, `humedadMax` y `kcalMin`, con la regla de nulos de §9.2. Ordena según §9.2. Devuelve `OfferCardData[]` con `distanceKm`.
- `getOfferDetail(id, persona)`: si la oferta es `withdrawn` y la persona no es su dueño, `notFound()`.
- `listMyOffers(persona)`: todas las ofertas del vendedor, retiradas incluidas, con el conteo de propuestas `pending` (solo el número).
- `parseCatalogFilters(searchParams)`: valida los query params. Si un valor es inválido, lo ignora sin romper.

## Páginas

| Ruta | Contenido |
|---|---|
| `/ofertas` | Título "Explorar subproductos". Barra de filtros como formulario GET: selects de categoría, radio, disponibilidad y presentación; inputs de humedad máx. y kcal mín.; botones "Aplicar" y "Limpiar". La cantidad de resultados se muestra como "N lotes · desde <localidad de la persona>". Grilla de `OfferCard`. Si no hay resultados, `EmptyState` con "Probá ampliar el radio". Las ofertas agotadas van al final. |
| `/ofertas/[id]` | Encabezado con título, categoría, `OfferStatusBadge` y vendedor + localidad. Distancia: "≈ N km desde <tu localidad> (aprox., en línea recta)". Bloque de stock y precio de referencia; sin precio, dice "Precio a convenir". Bloque de características (humedad, kcal, presentación) que muestra solo las cargadas. Bloque logístico: flete, báscula y análisis de laboratorio con la leyenda de D11. Si la oferta es estimada, un recuadro destacado: "Oferta estimada · disponible aprox. <fecha>. Podés enviar una propuesta, pero el acuerdo solo se confirma cuando el vendedor la marque como disponible." Para un buyer, el `LinkButton` "Proponer compra" según §12.3. Para el seller dueño, "Editar", "Retirar" y, si es estimada, "Marcar disponible". |
| `/ofertas/nueva` | Formulario de creación, solo para seller. Si un buyer entra por URL, `notFound()` o un mensaje. Precarga desde `?categoria=&cantidad=&titulo=&demanda=` (§12.2): si viene `demanda`, busca su título y muestra "Publicando en respuesta a: <título>". La disponibilidad es un radio Disponible/Estimada; Estimada muestra el campo de fecha. La localidad por defecto es la de la persona. |
| `/ofertas/[id]/editar` | El mismo formulario, precargado. Solo el dueño; con una oferta retirada, `notFound()`. |
| `/mis-ofertas` | Tabla o lista con título, estado, stock, propuestas pendientes (enlace a `/propuestas`) y acciones (editar, retirar con confirmación, marcar disponible). Un toggle muestra u oculta las retiradas. |

El formulario es un Client Component con `useActionState`. Muestra los errores por campo (`fieldErrors`) y el botón queda deshabilitado mientras se envía.

## Notas de Next.js 16

- Las páginas leen la persona y los `searchParams`, que son una lectura de runtime: el contenido va dentro de `<Suspense>` o la página usa `export const instant = false` (§7).
- `searchParams` y `params` son `Promise` y se hace `await`. Revisar `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`.

## Definición de terminado

- [ ] Como Molinos del Iberá:
  - se crea una oferta disponible y una estimada;
  - se edita el título y el stock;
  - se marca la estimada como disponible;
  - se retira una.
  Las retiradas desaparecen de `/ofertas` y siguen en `/mis-ofertas`.
- [ ] Como Granja Avícola Bella Vista, en `/ofertas?categoria=cascarilla_arroz&radio=200` aparecen las 2 cascarillas, la de Corrientes primero (≈ 118 km).
- [ ] Los filtros `humedadMax=11` y `kcalMin=4000` funcionan y los nulos se excluyen solo cuando se usa el filtro.
- [ ] El detalle de `o-pulpa-zafra-2027` muestra el recuadro de estimada y, para un buyer, el botón "Proponer compra".
- [ ] `/ofertas/nueva?categoria=orujos_bagazos&cantidad=150&titulo=Pulpa&demanda=d-suplemento-feedlot` precarga los campos y muestra el aviso.
- [ ] Un seller que llama a `updateOffer` o `withdrawOffer` con el id de una oferta ajena recibe un error y no cambia nada. Se verifica a mano desde la consola o con un form modificado.
- [ ] `npm run typecheck` y `npm run lint` pasan.
