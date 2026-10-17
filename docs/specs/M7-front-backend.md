# M7 — Conectar el front nuevo con el backend

**Fase:** secuencial, después de M6 mergeado en `develop`. Antes de M5. **Estimado:** 60–90 min. Lo puede hacer un solo agente; si son dos, el reparto está en §4.
**Contrato:** [`docs/00-mvp-spec.md`](../00-mvp-spec.md) §6, §9, §10 y §12. Antecedente: [`M6-front-codigo-ui.md`](./M6-front-codigo-ui.md).

## Objetivo

Cerrar las brechas entre el diseño de `codigo-ui` y los datos reales. M6 dejó fuera, marcados con `TODO(M7)`, los elementos que necesitaban consultas que no existían. M7 escribe esas consultas en `src/lib/**`, las conecta a la UI y deja la app sin mocks ni referencias a `codigo-ui`.

**Sin cambios de esquema.** Todo lo de este hito sale de las tablas actuales. Si algo exige tocar `prisma/schema.prisma`, se frena, se cambia antes el contrato §6 y se avisa al equipo.

## Archivos permitidos

- `src/lib/**`: queries y acciones nuevas o extendidas. Las consultas nuevas que cruzan dominios van en `src/lib/dashboard/`.
- Las páginas y componentes que tengan un `TODO(M7)`.
- `docs/00-mvp-spec.md`: §9.2 y §12, para documentar los filtros y contratos nuevos.
- Borrar `codigo-ui/` y sus exclusiones en `tsconfig.json` y `biome.json`.

## 1. Pendientes para M7

Cada pista de M6 agrega aquí sus `TODO(M7)` con su clave, el archivo y una línea. Las filas iniciales son las previstas en el spec de M6.

| Clave | Dónde | Qué falta |
|---|---|---|
| `catalog-filters` | `/offers` | Búsqueda de texto, provincia, precio máximo, stock mínimo, báscula y orden (§2.1). |
| `seller-stats` | `/offers/[id]`, tarjeta del vendedor | Estadísticas reales del vendedor (§2.2). |
| `seller-kpis` | `/my-offers` | KPIs que necesitan acuerdos y propuestas (§2.3). |
| `seller-agreements-tab` | `/my-offers?tab=agreements` | Pestaña de acuerdos del vendedor (§2.3). |
| `header-badge` | `SiteHeader` | Contador de propuestas que esperan una acción de la persona (§2.4). |
| `demands-readme` | `src/lib/demands/README.md` | Documenta `/my-demands?showWithdrawn=true`; M6.3 lo reemplazó por `?tab=withdrawn`. |

**Query params (D17).** M6 usó nombres en inglés para los params nuevos: `/proposals?status=`, `/my-offers?tab=inventory\|estimated\|withdrawn` y `/my-demands?tab=withdrawn`. Los params de §2.1 y §2.5 siguen la misma regla: `q`, `province`, `maxPrice`, `minStock`, `weighbridge=1`, `sort` (`distance`, `price_asc`, `price_desc`, `recent`, `stock_desc`) y `quantity`.

## 2. Tareas

### 2.1 Catálogo: filtros y orden de `codigo-ui`

Extender `parseCatalogFilters` y `listCatalog` (`src/lib/offers/queries.ts`). Todos los parámetros son opcionales y, si son inválidos, se ignoran, como hoy.

| Param | Valores | Efecto |
|---|---|---|
| `q` | texto, 2–60 caracteres | `title` o `description` contiene el texto, sin distinguir mayúsculas (`contains`, `mode: "insensitive"`) |
| `provincia` | un `Province` | `locality.province` igual al valor |
| `precioMax` | decimal > 0 | `pricePerTon ≤ valor`. Las ofertas sin precio se excluyen solo si se usa el filtro. |
| `stockMin` | decimal > 0 | `quantityTons ≥ valor` |
| `bascula` | `1` | `hasWeighbridge = true` |
| `orden` | `distancia` (por defecto), `precio_asc`, `precio_desc`, `recientes`, `stock_desc` | Las agotadas siguen al final. Con orden por precio, las ofertas sin precio van después de las que lo tienen. |

- Se documenta en el contrato, en §9.2.
- Se conecta a la barra lateral y a la barra de búsqueda y orden de `/offers`, y al buscador del hero de la home si M6.4 lo dejó.
- Los tags de filtros activos incluyen los nuevos.

### 2.2 Estadísticas del vendedor

`getSellerStats(sellerId)` en `src/lib/dashboard/queries.ts` devuelve:

- `memberSince`: `User.createdAt`;
- `activeOffers`: cantidad de ofertas `available` o `estimated`;
- `agreements`: cantidad de `Agreement` como vendedor;
- `tonsAgreed`: suma de `quantityTons` de esos acuerdos, como string decimal.

Reemplaza el rating y el sello de `codigo-ui` en la tarjeta del vendedor de `/offers/[id]`. El texto es descriptivo, por ejemplo: "3 acuerdos registrados en SubMarket". No usa "verificado" ni "confiable".

### 2.3 Panel del vendedor

`getSellerDashboard(persona)` en `src/lib/dashboard/queries.ts`, con `requirePersona("seller")` en la página:

- **KPIs:**
  - ofertas activas y Tn en stock (suma de `quantityTons` de las `available` con stock);
  - propuestas pendientes de responder (`pending`);
  - propuestas que esperan al comprador (`accepted` o `countered`);
  - acuerdos confirmados;
  - Tn acordadas y monto acordado (suma de `totalAmount`, en ARS).

  Todo con `Decimal`. Se serializa como string.
- **Pestaña Acuerdos:** `listAgreementsFor(persona)`, que ya existe en `src/lib/negotiation/queries.ts`, con enlace a `/agreements/[id]`.

### 2.4 Contador en el header

`countPendingActions(persona)` en `src/lib/dashboard/queries.ts`:

- para un **seller**, propuestas `pending` sobre sus ofertas;
- para un **buyer**, sus propuestas `accepted` o `countered`, que esperan su confirmación.

El header lo muestra junto a "Propuestas", dentro de su propio `<Suspense fallback={null}>`. Las acciones de negociación (`src/lib/negotiation/actions.ts`) ya revalidan `/proposals`; además, agregar `revalidatePath("/", "layout")` para que el contador se actualice.

### 2.5 De la calculadora a la propuesta

La calculadora de `/offers/[id]` (M6.1) enlaza a `/offers/[id]/propose?cantidad=<Tn>`. La página de proponer lee `cantidad` como valor inicial, con `parseTons`. Si no es válida, la ignora. Se documenta en el contrato, en §12.3.

### 2.6 Limpieza

- `grep -rn "TODO(M7)" src` no devuelve nada.
- `grep -rni "mockData\|codigo-ui" src` no devuelve nada.
- Borrar `codigo-ui/` y sus exclusiones en `tsconfig.json` y `biome.json`.
- Las primitivas que se repiten en dos o más carpetas `_components/` de M6 se promueven a `src/components/ui/`.

### 2.7 Recorrido completo

Con la base local en `--reset-demo`, correr el guion §13 entero con las rutas en inglés y la UI nueva. Además:

- en `/offers?q=pino&orden=precio_asc`, aparecen el aserrín ($ 31.000) y después los chips ($ 34.000);
- como Molinos del Iberá, después del paso 6 del guion, `/my-offers` muestra 1 acuerdo, 80 Tn acordadas y $ 2.200.000;
- el contador del header aparece en el paso 4 (Molinos tiene 1 pendiente) y en el paso 5 (Granja tiene 1 para confirmar), y desaparece después de confirmar.

## 3. Notas

- Las consultas por persona no se cachean con `use cache`, y todo componente que las use va dentro de `<Suspense>` (contrato §7).
- Las agregaciones se hacen con `db.<model>.aggregate` y `count`, no trayendo filas a memoria, salvo el filtro por distancia, que sigue en memoria (§9.1).

## 4. Reparto, si hay dos agentes

- **A:** §2.1 y §2.5 (catálogo y propuesta). Archivos: `src/lib/offers/**`, `src/app/offers/**` y la página de proponer.
- **B:** §2.2–§2.4 (dashboard y header). Archivos: `src/lib/dashboard/**`, `src/app/my-offers/**`, la tarjeta del vendedor en `src/app/offers/[id]/` (coordinar con A) y `src/components/SiteHeader.tsx`.
- La limpieza (§2.6) y el recorrido (§2.7) los hace quien termine último, después de mergear los dos.

## Definición de terminado

- [ ] Las tablas de §1 y §2 están resueltas y no quedan `TODO(M7)`.
- [ ] Los checks del recorrido (§2.7) pasan en local.
- [ ] `codigo-ui/` ya no está en el repo y `npm run typecheck`, `npm run lint` y `npm run build` pasan.
- [ ] El contrato documenta los filtros nuevos (§9.2) y el parámetro `cantidad` (§12.3).
- [ ] Sigue M5: tests, README y deploy, con las rutas en inglés.
