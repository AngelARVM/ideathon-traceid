# M6 — Front principal desde `codigo-ui`

**Fase:** después de M1–M4 mergeados en `develop`. Primero va **M6.0** (secuencial, un agente); después, **M6.1–M6.4** en paralelo. **M7** conecta lo que M6 deje pendiente, y **M5** (tests, README, deploy) queda al final.
**Estimado:** M6.0, 45–60 min; cada pista, 45–75 min.
**Contrato:** [`docs/00-mvp-spec.md`](../00-mvp-spec.md), en especial §2 (D1, D11), §3, §9, §10 y §12. Referencia visual: [`codigo-ui/`](../../codigo-ui/), una SPA de Vite + React + Ant Design generada con AI Studio, con datos mock.

## Objetivo

Que la app Next.js se vea y se use como `codigo-ui`, sin cambiar el producto. El diseño, la jerarquía visual y la experiencia salen de `codigo-ui`; el alcance, los datos y las reglas siguen siendo los del contrato.

M6 es la **capa visual**. Reescribe las páginas existentes, que ya leen y escriben en la base a través de `src/lib/**`. **No inventa datos:** si un elemento de `codigo-ui` necesita un dato o una consulta que hoy no existe, M6 lo deja fuera, marca el lugar con `// TODO(M7): <clave>` y lo agrega a la tabla "Pendientes para M7" de [`M7-front-backend.md`](./M7-front-backend.md). Así la demo nunca queda rota entre M6 y M7.

## Decisiones

| # | Decisión |
|---|---|
| F1 | **Sin Ant Design.** Los componentes de `codigo-ui` se portan a Tailwind v4, con las primitivas de `src/components/ui/`. No se agregan `antd`, `@ant-design/*`, `motion` ni `@google/genai`. |
| F2 | **Rutas en inglés**, según la tabla de §1. El texto visible sigue en español. Los query params del contrato (`categoria`, `radio`, `disponibilidad`, etc.) no cambian. |
| F3 | **Se recorta lo que está fuera de alcance** (§2 de este spec). No se migra como mock. |
| F4 | **Solo tema claro**, como `codigo-ui`. M6.0 quita `ThemeToggle` y las variantes `dark:` de los archivos que toca. Las pistas escriben solo en claro. |
| F5 | **Imágenes por categoría,** no por oferta: el modelo no tiene fotos. Se descargan una vez a `public/images/categories/` y se mapean en `src/lib/category-media.ts`. No se cargan imágenes remotas en runtime. |
| F6 | `codigo-ui/` se commitea como referencia, excluido de `tsc`, de Biome y del build. Se borra al final de M7. |

## 1. Mapa de vistas y rutas

| `codigo-ui` | Ruta final | Hoy (en `develop`) | Datos | Pista |
|---|---|---|---|---|
| `Navbar` | header global | `SiteHeader`, `PersonaSwitcher` | persona | M6.0 |
| `Footer` | footer global | `SiteFooter` | — | M6.0 |
| `ProductCard` | — | `OfferCard` | `OfferCardData` | M6.0 |
| `HomeView` | `/` | `src/app/page.tsx` + `_home/` (M4) | `_home/queries.ts` | M6.4 |
| `MarketplaceView` | `/offers` | `/ofertas` (M1) | `listCatalog` | M6.1 |
| `ProductDetailView` | `/offers/[id]` | `/ofertas/[id]` (M1) | `getOfferDetail` | M6.1 |
| `PublishProductView` | `/offers/new`, `/offers/[id]/edit` | `/ofertas/nueva`, `/ofertas/[id]/editar` (M1) | `createOffer`, `updateOffer` | M6.1 |
| `QuoteModal` | `/offers/[id]/propose` | ya en inglés (M3) | `createProposal` | M6.2 |
| `RequestsView` | `/proposals`, `/proposals/[id]` | ya en inglés (M3) | `listProposalsFor`, `getProposalForParty`, acciones de §8.2 | M6.2 |
| Pestaña de órdenes de `VendorDashboardView` | `/agreements`, `/agreements/[id]` | ya en inglés (M3) | `listAgreementsFor`, `getAgreementForParty` | M6.2 |
| — (no existe en `codigo-ui`) | `/demands`, `/demands/new`, `/demands/[id]`, `/demands/[id]/edit`, `/my-demands` | ya en inglés (M2) | `src/lib/demands/*` | M6.3 |
| `VendorDashboardView` (inventario y estimativos) | `/my-offers` | `/mis-ofertas` (M1) | `listMyOffers` | M6.4 |

Las demandas no tienen diseño en `codigo-ui`: M6.3 las diseña con el mismo lenguaje del catálogo, usando sus tarjetas, su barra de filtros y su layout de detalle.

## 2. Qué se recorta y por qué

| Elemento de `codigo-ui` | Motivo | Qué queda en su lugar |
|---|---|---|
| `CartDrawer`, carrito B2B | §3: sin carrito | Nada. Se negocia una oferta por vez. |
| `BlockchainSignatureModal`, órdenes "firmadas en blockchain", hash y bloque | §3 y D13 | El comprobante de acuerdo (`/agreements/[id]`), con la leyenda "acuerdo declarado". |
| `ContactModal`, teléfono, email y CUIT | D1: sin datos de contacto | Nada. |
| `TraceabilityTimeline` y código de lote | §3 y D11 | Nada. |
| Sello "Verificado", rating y reseñas | D11 y §3 | En el detalle, datos reales del vendedor (M7). |
| Chat de negociación (`QuoteMessage[]`) | §3: sin chat | Una línea de tiempo **derivada** de la propuesta: mensaje inicial, contraoferta, confirmación (M6.2). |
| Moneda USD | D3: solo ARS/Tn | ARS. |
| Provincia Formosa | D2: Corrientes, Misiones y Chaco | Las 13 localidades del fixture. |
| Pedido mínimo, frecuencia de generación, dirección de planta, camiones por día, granulometría, cenizas, densidad, "libre de contaminantes" | No están en el modelo (§6) | Los campos de `Offer`: humedad, kcal, presentación, flete, báscula y análisis. |
| Fotos subidas por el vendedor (paso 5 del wizard) | No están en el modelo | La imagen de la categoría (F5). |
| `ProductForecast` como entidad aparte | En el contrato es `OfferStatus.estimated` | El selector "Lotes inmediatos / Estimativos" se mapea al filtro `disponibilidad`. |
| Preferencia logística "cotizar flete" | §3: sin flete | El `freight` de la oferta, solo informativo. |

**Correspondencia de campos** (`Product` → `Offer`): `availableTons` → `quantityTons`; `pricePerTon` → `pricePerTon` (opcional, "Precio a convenir"); `city`/`province` → `locality`; `specs.moisturePercentage` → `humidityPct`; `specs.calorificPowerKcalKg` → `calorificKcalKg`; `specs.packaging` → `presentation` (`granel`, `big_bag`, `fardos`); `labCertificateAvailable` → `labAnalysis` (texto, con la leyenda de D11); `status` `active`/`paused`/`sold_out` → `available`/`estimated`/`withdrawn` + "Agotada".

## 3. M6.0 — Base (secuencial)

Lo hace **un** agente. Las pistas arrancan desde su commit en `develop`.

### Archivos permitidos

`docs/00-mvp-spec.md` (§10, §12.2, §12.3 y §13), `tsconfig.json`, `biome.json`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/not-found.tsx`, `src/components/**`, `src/lib/persona.ts`, `src/lib/category-media.ts` (nuevo), `public/images/categories/**`, `codigo-ui/**`. Para el renombre de rutas: `src/app/ofertas/**` → `src/app/offers/**`, `src/app/mis-ofertas/**` → `src/app/my-offers/**`, y los **strings de rutas** dentro de `src/lib/**` y `src/app/**`.

### Tareas

1. **Referencia.** Commitear `codigo-ui/` y agregarlo a `exclude` en `tsconfig.json` y a `files.includes` de `biome.json` como `!codigo-ui`. Sin esto, `npm run typecheck` falla, porque `antd` no está instalado.
2. **Contrato.** En `00-mvp-spec.md`, reescribir §10 con las rutas en inglés (la tabla de `src/app/_home/integration-notes.md`), y actualizar §12.2, §12.3 y §13. Avisar al equipo.
3. **Unificar rutas.** Hacer `git mv` de las rutas de M1: `/ofertas` → `/offers`, `nueva` → `new`, `editar` → `edit` y `/mis-ofertas` → `/my-offers`. Reemplazar en todo `src/` los `href`, `redirect` y `revalidatePath` en español, incluidos los de M2 y M3 que apuntan a `/ofertas`. Actualizar `safeNext` de `persona.ts` para que su destino por defecto sea `/offers`. Al terminar, `grep -rn '"/\(ofertas\|demandas\|propuestas\|acuerdos\|mis-\)' src` no devuelve nada.
4. **Tokens.** En `globals.css`, la paleta de `codigo-ui`: `brand` (`#176B4D` como 600, hover `#12553c`, títulos `#114735`, bordes de hover `#92d6bb`), fondo `#f5f7fa`, fondo del hero `#f4f3ef`, sombras de tarjeta y scrollbar. Las fuentes son Inter (texto) y Plus Jakarta Sans (títulos), con `next/font`. Se mantiene `font-mono-num` para cifras, con `tabular-nums`. Si el resto de la app sigue usando la paleta `campo`, se la redefine como alias de `brand` para que nada quede sin color.
5. **Primitivas** (`src/components/ui/`). Reestilar `Button`, `LinkButton`, `Field`, `Input`, `Select`, `Textarea`, `FormError`, `PageHeader` y `EmptyState` sin cambiar sus props. Agregar las que reemplazan a antd y que usan varias pistas: `Card`, `Tag`, `Stat` (KPI), `Tabs` (con enlaces o query param, sin estado de cliente si se puede), `Steps` (indicador del wizard), `Dialog` (`<dialog>` nativo, Client Component) y `Descriptions` (lista de etiqueta y valor). Documentar cada una con una línea JSDoc.
6. **Chrome global.**
   - `SiteHeader`, al estilo de `Navbar`: logo "subMarket · Lo que sobra, vale.", la navegación por rol (§10) y el CTA de publicar.
   - `PersonaSwitcher` como desplegable, agrupado por Vendedores y Compradores, que reemplaza al toggle de dos perfiles de `codigo-ui`.
   - Un drawer en mobile.
   - El lugar para el contador de pendientes queda con `// TODO(M7): header-badge`.
   - `SiteFooter`, al estilo de `Footer`: categorías con enlace a `/offers?categoria=…` y las tres provincias, sin contacto, sin "Trazabilidad & Garantía" y sin INTI.
   - `DemoBanner` se mantiene (D1).
   - Se quita `ThemeToggle` (F4).
7. **`OfferCard`** al estilo de `ProductCard`: la imagen de la categoría arriba, con los badges de estado y distancia superpuestos; el vendedor y la localidad; los tags de características; el pie con stock y precio de referencia. Se mantiene la interfaz `OfferCardData` y se agrega `categoryImage` desde `category-media.ts`. **No** lleva botones de carrito ni de cotización: toda la tarjeta enlaza al detalle.
8. **Imágenes** (F5). Descargar 5 fotos de Unsplash, una por `Category`, de las que ya usa `codigo-ui/src/data/mockData.ts`. Para `biomasa_pellets` se usa la de biochar. Van a `public/images/categories/<category>.jpg`, a 1200 px o menos y comprimidas. `category-media.ts` exporta `CATEGORY_IMAGE: Record<Category, { src: string; alt: string }>`.

### Definición de terminado de M6.0

- [ ] `npm run typecheck`, `npm run lint` y `npm run build` pasan con `codigo-ui/` en el repo.
- [ ] No quedan rutas en español en `src/` (el `grep` de la tarea 3).
- [ ] Las páginas viejas siguen funcionando bajo las rutas nuevas, aunque todavía con el estilo anterior.
- [ ] El header, el footer, la tarjeta de oferta y las primitivas se ven como `codigo-ui`.

## 4. Pistas paralelas (M6.1–M6.4)

Reglas comunes:

- Cada pista toca **solo** sus archivos. Las primitivas nuevas que necesite van en su carpeta `_components/`, y se promueven en M7 si sirven a varias.
- **No** se modifican `src/lib/**` ni `prisma/**`. Se consumen las queries y acciones existentes tal como están.
- Se respetan las reglas de lectura de §7 (persona dentro de `<Suspense>`) y de autorización de §9: los botones de acción se muestran según el rol y el dueño, y el servidor ya valida.
- Las interacciones que en `codigo-ui` son modales o drawers con estado global pasan a ser **rutas o query params**: filtros por GET, pestañas por `?tab=` y formularios en su propia página. Se usa `Dialog` solo para confirmaciones.
- Copy en español, sin promesas fuera de alcance: sin "verificado", "certificado", "trazabilidad" ni "flete incluido".

### M6.1 — Catálogo, detalle y publicación

**Archivos:** `src/app/offers/**`, excepto `src/app/offers/[id]/propose/**`.

- **`/offers`** (de `MarketplaceView`):
  - título y barra superior;
  - el selector de modo **"Lotes inmediatos / Estimativos / Todos"**, mapeado a `disponibilidad`;
  - una barra lateral de filtros en desktop y un drawer en mobile, con los filtros de §9.2: categoría, radio, humedad máx., kcal mín. y presentación;
  - una barra de resultados con "N lotes · desde <localidad>" y tags removibles de los filtros activos;
  - la grilla de `OfferCard`.

  Quedan para M7 la búsqueda de texto, la provincia, el precio máximo, el stock mínimo, la báscula y el orden (`TODO(M7): catalog-filters`).
- **`/offers/[id]`** (de `ProductDetailView`):
  - breadcrumb;
  - la imagen de la categoría como galería de una sola foto;
  - descripción y ficha técnica con `Descriptions`: solo los campos cargados, más la leyenda de D11 para el análisis;
  - la caja comercial: precio, stock, la distancia "aprox., en línea recta" y el recuadro de oferta estimada.
  - **la calculadora de carga:** un input de Tn que muestra el total referencial (Tn × precio de referencia) y se calcula en el cliente, sin camiones ni flete. El CTA "Proponer compra" lleva a `/offers/[id]/propose` según §12.3;
  - las acciones del dueño (editar, retirar, marcar disponible) con `Dialog` de confirmación;
  - la tarjeta del vendedor con nombre, tagline y localidad; las estadísticas quedan con `TODO(M7): seller-stats`.
- **`/offers/new` y `/offers/[id]/edit`** (de `PublishProductView`): un wizard de 4 pasos con `Steps`:
  1. Identificación: título, categoría y descripción.
  2. Volumen y precio: Tn, precio y disponibilidad, con la fecha si es estimada.
  3. Ubicación y logística: localidad, flete, báscula y análisis.
  4. Ficha técnica y confirmación: humedad, kcal, presentación y una vista previa con `OfferCard`.

  Los pasos son un Client Component que **conserva todos los campos en un solo `<form>`**: oculta los pasos con CSS y no los desmonta. Se envía una sola vez a `createOffer` o `updateOffer` con `useActionState`. Si vuelven `fieldErrors`, salta al primer paso que tenga un error. Se mantiene la precarga de §12.2 y el aviso de la demanda.

### M6.2 — Negociación y acuerdos

**Archivos:** `src/app/offers/[id]/propose/**`, `src/app/proposals/**` y `src/app/agreements/**`.

- **`/offers/[id]/propose`** (de `QuoteModal`): un resumen de la oferta arriba; cantidad y precio propuesto; un banner con el subtotal (Tn × precio) en el cliente; y el mensaje. **No** se migran la preferencia logística, el destino ni la fecha requerida.
- **`/proposals`** (de `RequestsView`, columna izquierda): lista de propuestas con filtro por estado (`?estado=`) en tags, y tarjetas con oferta, contraparte, Tn, precio y `ProposalStatusBadge`. El título depende del rol: "Mis propuestas" o "Propuestas recibidas".
- **`/proposals/[id]`** (de `RequestsView`, columna derecha): el encabezado con estado y botones según `allowedActions` (§8.2); los parámetros del trato con `Descriptions`, que muestran los términos originales, la contraoferta si la hay y los términos efectivos; y una **línea de tiempo derivada** en lugar del chat: "Propuesta enviada" con el mensaje, "Contraoferta" con `counterMessage`, "Aceptada", "Rechazada" y "Acuerdo confirmado" con el comentario de cierre. El formulario de contraoferta y el de confirmar con comentario de cierre se usan como ya existen. El aviso de stock (D8) y el bloqueo de la oferta estimada (D10) quedan visibles.
- **`/agreements` y `/agreements/[id]`** (de la pestaña de órdenes): tarjetas de acuerdo con número corto, partes, Tn × precio = total, fecha y snapshot de la oferta. El comprobante lleva la leyenda **"Acuerdo declarado: pago, flete y entrega se coordinan fuera de SubMarket"**. Sin hash, bloque ni firma.

### M6.3 — Demandas

**Archivos:** `src/app/demands/**` y `src/app/my-demands/**`.

Diseño nuevo con el lenguaje del catálogo:

- **`/demands`:** grilla de tarjetas de demanda (categoría con su imagen en chico, Tn, precio máximo, "necesito para", radio y comprador con localidad y distancia) y los filtros que ya soporta `parseDemandFilters`.
- **`/demands/[id]`:** la caja de la demanda y la sección "Ofertas compatibles", con `OfferCard`, más "cubre X de Y Tn" y "sobre tu precio máximo" (§9.3). Para un seller, el CTA "Publicar oferta para esta demanda", que enlaza a `/offers/new?...` (§12.2).
- **`/demands/new` y `/demands/[id]/edit`:** formulario en una sola página, con las mismas secciones visuales que el wizard de ofertas, pero sin pasos.
- **`/my-demands`:** lista o tabla con estado y acciones.

### M6.4 — Home y panel del vendedor

**Archivos:** `src/app/page.tsx`, `src/app/_home/**` y `src/app/my-offers/**`.

- **`/`** (de `HomeView`):
  - **Hero** en dos columnas, con fondo `#f4f3ef`, la línea "subMarket · Lo que sobra, vale.", el título "Transformamos subproductos en oportunidades", el subtítulo y el CTA "Explorar materiales". A la derecha va una foto grande con una tarjeta flotante que enlaza a la oferta más cercana, tomada de las consultas de `_home`.
  - **"Un nuevo destino para cada material":** categorías con foto, con el conteo real de §M4.
  - **"Lotes cerca tuyo".**
  - **"Cómo funciona"**, sin promesas fuera de alcance (M4).
  - Sin persona, el selector de personas de M4 se reestila con el mismo hero.
  - La línea de garantía de `codigo-ui` se reemplaza por "Acuerdos entre empresas · Corrientes, Chaco y Misiones".
- **`/my-offers`** (de `VendorDashboardView`):
  - el banner superior con el nombre del vendedor y el CTA "Publicar oferta";
  - una fila de `Stat` con los KPIs que se puedan calcular con `listMyOffers` (ofertas activas, estimadas y propuestas pendientes); los demás quedan con `TODO(M7): seller-kpis`;
  - `Tabs` por `?tab=`: **Inventario** (tabla de ofertas activas con estado, stock, pendientes y acciones), **Estimativos** (las estimadas, con "Marcar disponible") y **Retiradas**;
  - la pestaña **Acuerdos** queda para M7 (`TODO(M7): seller-agreements-tab`).
  - Editar lleva a `/offers/[id]/edit`; no se edita en un modal.

## 5. Notas de Next.js 16

- Antes de escribir componentes, leer `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`, `01-app/01-getting-started/07-mutating-data.md` y `02-guides/forms.md`.
- Los componentes portados de `codigo-ui` son Client Components por defecto (antd). Al portarlos, **solo** se marcan con `"use client"` las piezas interactivas: el wizard, la calculadora, el drawer de filtros, `Dialog` y el menú mobile. Las tarjetas, las listas y las fichas son Server Components.
- `next/image` con imágenes locales de `public/`, con `sizes` adecuados. No se agregan `remotePatterns`.

## Definición de terminado de M6

- [ ] Cada ruta de la tabla de §1 se ve con el lenguaje visual de `codigo-ui` en desktop (1280 px) y en mobile (375 px).
- [ ] No se agregó ninguna dependencia de antd, motion ni genai. `package.json` solo cambia si una pista lo justifica en el PR.
- [ ] Nada de §2 aparece en la UI: `grep -rni "verificad\|blockchain\|carrito\|trazabilidad\|USD\|Formosa" src/app src/components` solo devuelve la leyenda de D11.
- [ ] Todos los `TODO(M7)` están listados en `M7-front-backend.md`.
- [ ] Los pasos 2–9 del guion §13 (con las rutas nuevas) siguen funcionando en local.
- [ ] `npm run typecheck`, `npm run lint` y `npm run build` pasan.
