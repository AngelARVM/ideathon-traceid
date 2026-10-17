# SubMarket — Especificación del MVP (contrato común)

**Estado:** vigente desde el 17-10-2026. Resultado de la sesión de grilling sobre [`pivot/`](../pivot/). **Reemplaza** a `docs/legacy/**`, que describe TraceID y es solo antecedente histórico.

Este documento es el **contrato compartido** por todos los hitos de [`docs/specs/`](./specs/). Si un hito necesita algo que contradice este documento, se cambia primero este documento y se avisa al resto del equipo; nunca se resuelve en silencio dentro de un hito. Cómo se reparte y se integra el trabajo: [`01-orchestration.md`](./01-orchestration.md).

## 1. Producto en una frase

**SubMarket** ("Lo que sobra, vale.") conecta a quienes generan subproductos agroindustriales en el NEA (Corrientes, Misiones, Chaco) con compradores cercanos: el vendedor publica una oferta, el comprador la encuentra por cercanía y características, negocian una propuesta (con una contraoferta posible) y la plataforma registra un **acuerdo declarado**. Pago, flete y entrega ocurren fuera de la plataforma.

El PDF `ReValor NEA - Marketplace B2B _ Google AI Studio.pdf` (raíz del repo) es **referencia visual y de marca**: estética, home, tarjetas de lote, categorías. No agrega alcance, salvo lo que este documento incorpora explícitamente.

## 2. Decisiones cerradas

| # | Decisión |
|---|---|
| D1 | Marca visible: **SubMarket**. Banner fijo: "Entorno demostrativo · Empresas y operaciones ficticias". Ningún email ni dato de contacto real. |
| D2 | Región: Corrientes, Misiones y Chaco; 13 localidades fijas con coordenadas aproximadas (§5). |
| D3 | Subproductos de demo: cascarilla de arroz, chips/aserrín de pino, pulpa de cítricos (esta última como oferta **estimada**). Unidad única: **toneladas (Tn)**. Precio en **ARS por Tn**. |
| D4 | Distancia: haversine entre centros de localidad, en km, rotulada "aprox., en línea recta". Filtro por radio. Sin mapa, geocoding ni direcciones. |
| D5 | Cada cuenta tiene **un solo rol**: `seller` (vendedor) o `buyer` (comprador). Fijado en el seed; no se cambia desde la UI. |
| D6 | Los vendedores publican **ofertas**. Los compradores publican **demandas**. La demanda no tiene negociación propia: muestra ofertas compatibles y un botón para que un vendedor publique una oferta precargada. |
| D7 | Negociación: el comprador propone; el vendedor acepta, rechaza o **contraoferta una sola vez**; el comprador acepta o rechaza la contraoferta. Aceptar la contraoferta **confirma** el acuerdo en el mismo paso. |
| D8 | La aceptación del vendedor **avisa** si no alcanza el stock, pero no bloquea. La **confirmación** verifica y descuenta stock de forma atómica. Las propuestas no reservan stock. |
| D9 | El acuerdo congela los términos **finales** (cantidad, precio, total y datos de la oferta). El comprobante no muestra el historial de la negociación. Solo lo ven las dos partes. |
| D10 | Ofertas estimadas: admiten propuestas y aceptación, pero **no** se pueden confirmar hasta que el vendedor las marque como disponibles. |
| D11 | Características de la oferta: humedad %, poder calorífico (kcal/kg) y presentación. Son opcionales y filtrables. Flete, báscula y análisis de laboratorio son informativos: se muestran y se copian al acuerdo, pero no se filtran. **No hay sello "Verificado".** El análisis se muestra con la leyenda "declarado por el vendedor, no verificado por SubMarket". |
| D12 | Identidad: **sin login**. Una cookie de persona firmada con HMAC elige qué usuario de demo es el visitante (§7). Es suplantación por diseño, aceptable solo para esta demo. |
| D13 | Se elimina Better Auth y todo el código de TraceID/Hedera. Una migración nueva dropea las tablas legadas; las migraciones históricas no se tocan. Los datos remotos actuales son descartables. |
| D14 | Stack sin cambios: Next.js 16 (App Router, `cacheComponents` activo), React 19, TypeScript, Tailwind v4, Prisma 7 + `@prisma/adapter-pg`, PostgreSQL (Docker en local, PostgreSQL de Vercel en producción), Biome, `node --test`. |
| D15 | La demo corre en **Vercel**. La migración y el seed contra la base remota los corre **una persona del equipo, a mano**. Los agentes nunca ejecutan comandos contra la base remota. |
| D16 | Los tests se escriben al final (M5). Durante M1–M4 se verifica con `npm run typecheck`, `npm run lint` y el recorrido manual. |
| D17 | **Paths en inglés, textos en español.** Rutas, carpetas y archivos de `src/`, nombres de query params y nombres de los docs de `docs/specs/` van en inglés; el texto visible queda en español. Los valores de enums y los ids del fixture no cambian. Sin alias en español. Ver [ADR-0004](./adr/0004-english-paths.md). |

## 3. Fuera de alcance

Pagos, PSP, facturación e impuestos. Cotización o contratación de flete y rutas. Chat en tiempo real y notificaciones. KYC, reputación y calificaciones. Certificación de calidad o aptitud sanitaria. Matching con IA. Organizaciones y multiempresa. Carrito con varias ofertas. Reserva de stock durante la negociación. Mapa. Login real. Panel de administración. Conversión de unidades.

## 4. Glosario

| Término (UI) | Código | Significado |
|---|---|---|
| Persona | `User` | Empresa ficticia de demo con un rol y una localidad. |
| Vendedor / Comprador | `Role.seller` / `Role.buyer` | Rol único y fijo de la persona. |
| Oferta / Lote | `Offer` | Un solo subproducto publicado por un vendedor, con stock en Tn. |
| Oferta estimada | `OfferStatus.estimated` | Lote futuro, con fecha estimada. No se puede confirmar. |
| Demanda | `Demand` | Necesidad publicada por un comprador. |
| Ofertas compatibles | — | Ofertas activas de la misma categoría dentro del radio de la demanda (§9.3). |
| Propuesta | `Proposal` | Cantidad + precio + mensaje del comprador sobre una oferta. |
| Contraoferta | campos `counter*` de `Proposal` | Única respuesta con nuevos términos del vendedor. |
| Acuerdo / Comprobante | `Agreement` | Registro inmutable de los términos confirmados. |

## 5. Localidades (fixture)

`id` es un slug estable. Las coordenadas son aproximadas, del centro urbano.

| id | Nombre | Provincia | lat | lng |
|---|---|---|---|---|
| `corrientes` | Corrientes | corrientes | -27.4692 | -58.8306 |
| `bella-vista` | Bella Vista | corrientes | -28.5096 | -59.0434 |
| `mercedes` | Mercedes | corrientes | -29.1817 | -58.0753 |
| `gobernador-virasoro` | Gobernador Virasoro | corrientes | -28.0500 | -56.0333 |
| `santo-tome` | Santo Tomé | corrientes | -28.5499 | -56.0411 |
| `paso-de-los-libres` | Paso de los Libres | corrientes | -29.7125 | -57.0877 |
| `posadas` | Posadas | misiones | -27.3671 | -55.8961 |
| `obera` | Oberá | misiones | -27.4871 | -55.1199 |
| `eldorado` | Eldorado | misiones | -26.4084 | -54.6941 |
| `montecarlo` | Montecarlo | misiones | -26.5662 | -54.7574 |
| `resistencia` | Resistencia | chaco | -27.4606 | -58.9839 |
| `saenz-pena` | Presidencia Roque Sáenz Peña | chaco | -26.7852 | -60.4388 |
| `charata` | Charata | chaco | -27.2144 | -61.1881 |

## 6. Modelo de datos (Prisma)

Esquema objetivo completo. Es el **único** `schema.prisma` después de M0; ningún otro hito lo modifica sin cambiar antes este documento. Los ids de `User`, `Offer` y `Demand` del seed son slugs fijos (§11). Los creados en runtime usan `newId()` (ulid, `src/lib/ids.ts`).

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Province {
  corrientes
  misiones
  chaco
}

enum Role {
  buyer
  seller
}

enum Category {
  cascarilla_arroz   // "Cascarilla de arroz"
  chips_forestales   // "Chips forestales"
  aserrin_virutas    // "Aserrín y virutas"
  biomasa_pellets    // "Biomasa y pellets"
  orujos_bagazos     // "Orujos, pulpas y bagazos"
}

enum OfferStatus {
  available  // "Disponible"
  estimated  // "Estimada": requiere estimatedDate
  withdrawn  // "Retirada": no se lista ni admite propuestas
}

enum Presentation {
  granel    // "A granel"
  big_bag   // "Big bags"
  fardos    // "Fardos"
}

enum Freight {
  retiro_en_planta   // "Retiro en planta"
  entrega_vendedor   // "Entrega a cargo del vendedor"
  a_convenir         // "A convenir"
}

enum DemandStatus {
  open
  withdrawn
}

enum ProposalStatus {
  pending    // creada por el comprador, espera al vendedor
  accepted   // el vendedor aceptó los términos originales
  countered  // el vendedor contraofertó (una sola vez)
  rejected   // rechazada por el vendedor (desde pending) o por el comprador (desde countered)
  confirmed  // existe Agreement
}

model Locality {
  id       String   @id
  name     String
  province Province
  lat      Float
  lng      Float

  users   User[]
  offers  Offer[]
  demands Demand[]

  @@map("localities")
}

model User {
  id          String   @id
  name        String   // nombre comercial visible ("Molinos del Iberá")
  tagline     String?  // "Molino arrocero", visible en el selector
  role        Role
  localityId  String   @map("locality_id")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  locality          Locality    @relation(fields: [localityId], references: [id])
  offers            Offer[]
  demands           Demand[]
  proposals         Proposal[]
  agreementsAsSeller Agreement[] @relation("AgreementSeller")
  agreementsAsBuyer  Agreement[] @relation("AgreementBuyer")

  @@map("users")
}

model Offer {
  id               String        @id
  sellerId         String        @map("seller_id")
  title            String
  category         Category
  description      String
  quantityTons     Decimal       @map("quantity_tons") @db.Decimal(12, 3) // stock restante
  pricePerTon      Decimal?      @map("price_per_ton") @db.Decimal(14, 2) // precio de referencia, opcional
  status           OfferStatus
  estimatedDate    DateTime?     @map("estimated_date") @db.Date
  localityId       String        @map("locality_id")
  humidityPct      Decimal?      @map("humidity_pct") @db.Decimal(5, 2)
  calorificKcalKg  Int?          @map("calorific_kcal_kg")
  presentation     Presentation?
  freight          Freight       @default(a_convenir)
  hasWeighbridge   Boolean       @default(false) @map("has_weighbridge")
  labAnalysis      String?       @map("lab_analysis")
  createdAt        DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime      @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  seller     User        @relation(fields: [sellerId], references: [id])
  locality   Locality    @relation(fields: [localityId], references: [id])
  proposals  Proposal[]
  agreements Agreement[]

  @@index([status, category])
  @@map("offers")
}

model Demand {
  id             String       @id
  buyerId        String       @map("buyer_id")
  title          String
  category       Category
  description    String?
  quantityTons   Decimal      @map("quantity_tons") @db.Decimal(12, 3)
  maxPricePerTon Decimal?     @map("max_price_per_ton") @db.Decimal(14, 2)
  neededBy       DateTime?    @map("needed_by") @db.Date
  radiusKm       Int          @default(200) @map("radius_km")
  localityId     String       @map("locality_id")
  status         DemandStatus @default(open)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  buyer    User     @relation(fields: [buyerId], references: [id])
  locality Locality @relation(fields: [localityId], references: [id])

  @@index([status, category])
  @@map("demands")
}

model Proposal {
  id                  String         @id
  offerId             String         @map("offer_id")
  buyerId             String         @map("buyer_id")
  quantityTons        Decimal        @map("quantity_tons") @db.Decimal(12, 3)
  pricePerTon         Decimal        @map("price_per_ton") @db.Decimal(14, 2)
  message             String?
  status              ProposalStatus @default(pending)
  counterQuantityTons Decimal?       @map("counter_quantity_tons") @db.Decimal(12, 3)
  counterPricePerTon  Decimal?       @map("counter_price_per_ton") @db.Decimal(14, 2)
  counterMessage      String?        @map("counter_message")
  respondedAt         DateTime?      @map("responded_at") @db.Timestamptz(6)
  createdAt           DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime       @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  offer     Offer      @relation(fields: [offerId], references: [id])
  buyer     User       @relation(fields: [buyerId], references: [id])
  agreement Agreement?

  @@index([offerId, status])
  @@index([buyerId, status])
  @@map("proposals")
}

model Agreement {
  id               String       @id
  proposalId       String       @unique @map("proposal_id") // garantiza un acuerdo por propuesta
  offerId          String       @map("offer_id")
  sellerId         String       @map("seller_id")
  buyerId          String       @map("buyer_id")
  // Términos congelados
  quantityTons     Decimal      @map("quantity_tons") @db.Decimal(12, 3)
  pricePerTon      Decimal      @map("price_per_ton") @db.Decimal(14, 2)
  totalAmount      Decimal      @map("total_amount") @db.Decimal(16, 2)
  // Snapshot de la oferta al confirmar
  offerTitle       String       @map("offer_title")
  category         Category
  originLocality   String       @map("origin_locality")    // nombre, no FK
  humidityPct      Decimal?     @map("humidity_pct") @db.Decimal(5, 2)
  calorificKcalKg  Int?         @map("calorific_kcal_kg")
  presentation     Presentation?
  freight          Freight
  hasWeighbridge   Boolean      @map("has_weighbridge")
  labAnalysis      String?      @map("lab_analysis")
  closingComment   String?      @map("closing_comment")
  confirmedAt      DateTime     @default(now()) @map("confirmed_at") @db.Timestamptz(6)

  proposal Proposal @relation(fields: [proposalId], references: [id])
  offer    Offer    @relation(fields: [offerId], references: [id])
  seller   User     @relation("AgreementSeller", fields: [sellerId], references: [id])
  buyer    User     @relation("AgreementBuyer", fields: [buyerId], references: [id])

  @@index([sellerId])
  @@index([buyerId])
  @@map("agreements")
}
```

**Cantidades y dinero:** siempre `Decimal`, nunca `number` para aritmética. Cantidad > 0 con hasta 3 decimales; precio > 0 con hasta 2. `totalAmount = quantityTons × pricePerTon`, redondeado a 2 decimales. Para pasar valores a Client Components se serializan como `string`.

## 7. Identidad: cookie de persona

Todo vive en `src/lib/persona.ts` (M0), con `import "server-only"`.

- **Cookie** `submarket_persona` = `<userId>.<firma>`, donde la firma es HMAC-SHA256 en base64url de `userId` con `PERSONA_SECRET` (`node:crypto`, comparación con `timingSafeEqual`). Atributos: `httpOnly`, `sameSite: "lax"`, `secure` en producción, `path: "/"` y 30 días de vida.
- `getPersona(): Promise<PersonaWithLocality | null>` lee la cookie, verifica la firma y busca el `User` con `include: { locality: true }`. Si la firma es inválida o el usuario no existe, devuelve `null`. Va envuelta en `React.cache`.
- `requirePersona(role?: Role): Promise<PersonaWithLocality>`: sin persona, hace `redirect("/")`. Si se pasa `role` y la persona no lo tiene, lanza `AuthorizationError`. Las páginas protegidas la llaman y las server actions también, **siempre**.
- `selectPersona(formData)` es una server action. Recibe `userId`, verifica que el usuario exista, escribe la cookie y redirige a `/offers`, o a `next` si viene un path interno que empiece con `/` y no con `//`.
- `clearPersona()` es una server action que borra la cookie y redirige a `/`.

**Qué habilita el modo demo:** cualquier visitante puede elegir cualquier persona del seed. A partir de ahí, la autorización es real dentro de esa identidad: ninguna acción confía en ids de dueño enviados por el cliente. Los ids de vendedor y de comprador salen **siempre** de `getPersona()`.

**Cache Components** (`cacheComponents: true`): leer la cookie es una lectura en tiempo de request. Todo componente que llame a `getPersona()`, o que consulte datos por persona, va dentro de un `<Suspense>`. Si una página entera depende de la persona, se puede usar `export const instant = false`. Antes de escribir código Next.js, leer `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md` y `01-app/01-getting-started/07-mutating-data.md`.

## 8. Estados y transiciones

### 8.1 Oferta

```
available ──(retirar)──────────► withdrawn
estimated ──(retirar)──────────► withdrawn
estimated ──(marcar disponible)► available
available ──(editar → estimada)► estimated   (permitido; requiere estimatedDate)
```

- `withdrawn` es terminal.
- Una oferta con `quantityTons = 0` sigue en `available`, pero se muestra como **"Agotada"** y no admite propuestas nuevas. No hace falta un estado propio.
- Editar no toca propuestas ni acuerdos existentes. Los acuerdos ya tienen su snapshot.

### 8.2 Propuesta

| Desde | Acción | Actor | Hacia | Condiciones |
|---|---|---|---|---|
| — | `createProposal` | buyer | `pending` | Oferta `available` o `estimated`, `quantityTons > 0` en la oferta, cantidad propuesta ≤ stock actual, sin otra propuesta abierta (`pending`, `accepted`, `countered`) del mismo comprador sobre la misma oferta. |
| `pending` | `acceptProposal` | seller dueño | `accepted` | Oferta no `withdrawn`. Si la cantidad supera el stock, se acepta igual y la UI avisa (D8). |
| `pending` | `rejectProposal` | seller dueño | `rejected` | — |
| `pending` | `counterProposal` | seller dueño | `countered` | `counterQuantityTons` y/o `counterPricePerTon`, el que falte se copia del original. `counterMessage` opcional. Oferta no `withdrawn`. |
| `accepted` | `confirmProposal` | buyer dueño | `confirmed` + `Agreement` | §8.3 |
| `countered` | `confirmProposal` | buyer dueño | `confirmed` + `Agreement` | Es "aceptar la contraoferta". §8.3 con los términos `counter*`. |
| `countered` | `rejectCounter` | buyer dueño | `rejected` | — |

- `rejected` y `confirmed` son terminales.
- Después de un rechazo, el comprador puede crear una propuesta nueva.
- No hay contra-contraoferta.

**Términos efectivos** = `counter*` si existen y si no, los originales. Hay una única función pura que los calcula, `effectiveTerms(proposal)` en `src/lib/negotiation/terms.ts` (M3).

### 8.3 Confirmación atómica

`confirmProposal(proposalId, closingComment?)` corre en `db.$transaction(async (tx) => …)`:

1. `persona = requirePersona("buyer")`.
2. `tx.proposal.updateMany({ where: { id, buyerId: persona.id, status: { in: ["accepted", "countered"] } }, data: { status: "confirmed" } })`. Si `count === 0`, lanza "La propuesta ya no se puede confirmar". Esto cubre la doble confirmación, los reintentos y el acceso ajeno.
3. Releer la propuesta con su oferta y calcular `effectiveTerms`.
4. `tx.offer.updateMany({ where: { id: offerId, status: "available", quantityTons: { gte: q } }, data: { quantityTons: { decrement: q } } })`. Si `count === 0`, lanza: con la oferta estimada, "La oferta todavía es estimada"; con la oferta retirada, "La oferta fue retirada"; y si no, "Stock insuficiente: quedan X Tn". El throw revierte el paso 2.
5. `tx.agreement.create(...)` con los términos efectivos, el snapshot de la oferta y `closingComment`. `proposalId @unique` es la segunda barrera contra duplicados.
6. Fuera de la transacción: `revalidatePath` para `/offers`, `/proposals` y `/agreements`, y `redirect` a `/agreements/<id>`.

## 9. Reglas de lectura y autorización

| Recurso | Quién lo ve | Quién lo modifica |
|---|---|---|
| Ofertas `available`/`estimated` | Toda persona | Solo el `seller` dueño (`offer.sellerId === persona.id`) |
| Ofertas `withdrawn` | Solo su dueño, en "Mis ofertas" | — |
| Demandas `open` | Toda persona | Solo el `buyer` dueño |
| Propuesta | El comprador que la creó y el vendedor dueño de la oferta | Según §8.2 |
| Acuerdo | Solo `agreement.buyerId` y `agreement.sellerId` | Nadie (inmutable) |

- Un acceso no autorizado a una página de detalle responde con `notFound()`, para no revelar que el recurso existe.
- Un acceso no autorizado a una acción responde con `{ ok: false, error }`.

### 9.1 Distancia

`src/lib/geo.ts` (M0) exporta:

- `distanceKm(a: {lat,lng}, b: {lat,lng}): number`: haversine con radio terrestre de 6371 km, redondeado a entero.
- `RADIUS_OPTIONS = [50, 100, 200, null]`, donde `null` es "Todas".

Se mide desde la localidad de la persona hasta la localidad de la oferta o la demanda. El dataset es chico, así que filtrar y ordenar por distancia en memoria, después de la consulta, es aceptable.

### 9.2 Filtros del catálogo (`/offers`)

Los filtros van como query params en español, todos opcionales, y el formulario es GET:

| Param | Valores | Efecto |
|---|---|---|
| `category` | un `Category` | Igualdad |
| `radius` | `50`, `100`, `200` | `distanceKm ≤ radius` |
| `availability` | `available`, `estimated` | Filtra por estado. Por defecto, ambos. |
| `maxHumidity` | número | `humidityPct ≤ valor`. Las ofertas sin dato se excluyen solo si se usa el filtro. |
| `minKcal` | entero | `calorificKcalKg ≥ valor`, con la misma regla para los nulos |
| `presentation` | un `Presentation` | Igualdad |

- Se excluyen siempre las ofertas `withdrawn`. Las ofertas agotadas se muestran al final, marcadas.
- Orden: por distancia ascendente y, a igual distancia, las más recientes primero.

### 9.3 Ofertas compatibles con una demanda

Una oferta es compatible con una demanda si cumple todo esto:

- tiene la misma `category`;
- su estado es `available` con `quantityTons > 0`, o `estimated` con `estimatedDate ≤ neededBy` (o la demanda no tiene `neededBy`);
- `distanceKm(demanda.locality, oferta.locality) ≤ demanda.radiusKm`.

Se ordenan por distancia. **No** se exige que el stock cubra el volumen de la demanda: se muestra "cubre X de Y Tn". **No** se exige precio ≤ máximo: si lo supera, se marca "sobre tu precio máximo".

## 10. Rutas y responsables

| Ruta | Hito | Acceso |
|---|---|---|
| `/` | M4 | Público. Sin persona: selector de personas. Con persona: home tipo PDF. |
| `/offers` | M1 | Persona |
| `/offers/new` | M1 | seller. Acepta `?category=&quantity=&title=&demand=` para precargar (§12.2). |
| `/offers/[id]` | M1 | Persona. Enlaza a `/offers/[id]/propose` si la persona es buyer y la oferta admite propuestas. |
| `/offers/[id]/edit` | M1 | seller dueño |
| `/my-offers` | M1 | seller. Incluye retiradas y acciones de retirar y marcar disponible. |
| `/offers/[id]/propose` | **M3** | buyer |
| `/demands` | M2 | Persona |
| `/demands/new` | M2 | buyer |
| `/demands/[id]` | M2 | Persona. Incluye ofertas compatibles y, para un seller, el CTA "Publicar oferta para esta demanda". |
| `/demands/[id]/edit` | M2 | buyer dueño |
| `/my-demands` | M2 | buyer |
| `/proposals` | M3 | Persona. Para el buyer, "Mis propuestas"; para el seller, "Propuestas recibidas". |
| `/proposals/[id]` | M3 | Las partes. Incluye acciones según §8.2. |
| `/agreements` | M3 | Persona. Lista sus acuerdos. |
| `/agreements/[id]` | M3 | Solo las partes. Comprobante. |

El header (M0) muestra según el rol:

- **seller:** Explorar · Demandas · Mis ofertas · Propuestas · Acuerdos · botón "Publicar oferta".
- **buyer:** Explorar · Demandas · Mis demandas · Propuestas · Acuerdos · botón "Publicar demanda".

Mientras su hito no se integra, los enlaces pueden dar 404.

## 11. Seed (fixture de demo)

`scripts/seed.ts` (M0) es **idempotente**: hace `upsert` por id fijo de localidades, usuarios, ofertas y demandas. Tiene dos flags:

- `--reset-demo` borra **todas** las filas de `agreements` y `proposals`, y las ofertas y demandas cuyo id no esté en el fixture. Después vuelve a hacer los upserts, lo que restaura el stock de las ofertas del fixture. Sirve para repetir el ensayo antes de presentar.
- `--allow-remote`: sin este flag, el seed se niega a correr si `DATABASE_URL` no apunta a `localhost` o `127.0.0.1`.

**Todos los precios, volúmenes y fechas son ficticios.** La UI lo aclara en el banner (D1).

**Personas**

| id | Nombre | Rol | Localidad | tagline |
|---|---|---|---|---|
| `p-molinos-ibera` | Molinos del Iberá | seller | mercedes | Molino arrocero |
| `p-forestal-virasoro` | Forestal Virasoro | seller | gobernador-virasoro | Aserradero y chipeadora |
| `p-citricola-bella-vista` | Citrícola Bella Vista | seller | bella-vista | Planta juguera |
| `p-granja-bella-vista` | Granja Avícola Bella Vista | buyer | bella-vista | Producción avícola |
| `p-yerbatera-obera` | Yerbatera Oberá | buyer | obera | Secadero de yerba mate |
| `p-feedlot-resistencia` | Feedlot Resistencia | buyer | resistencia | Engorde bovino |

**Ofertas** (estado, Tn, ARS/Tn, humedad %, kcal/kg, presentación, flete, báscula)

| id | Vendedor | Localidad | Título | Cat. | Estado | Tn | $/Tn | Hum. | kcal | Pres. | Flete | Bás. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `o-cascarilla-mercedes` | molinos-ibera | mercedes | Cascarilla de arroz a granel | cascarilla_arroz | available | 650 | 28500 | 10.8 | 3550 | granel | retiro_en_planta | sí |
| `o-cascarilla-corrientes` | molinos-ibera | corrientes | Cascarilla de arroz en big bags | cascarilla_arroz | available | 120 | 32000 | 11.5 | 3500 | big_bag | a_convenir | no |
| `o-chips-virasoro` | forestal-virasoro | gobernador-virasoro | Chips de pino para caldera | chips_forestales | available | 1200 | 34000 | 32 | 3950 | granel | entrega_vendedor | sí |
| `o-aserrin-santo-tome` | forestal-virasoro | santo-tome | Aserrín y viruta de pino | aserrin_virutas | available | 400 | 31000 | 13.5 | 4200 | granel | retiro_en_planta | no |
| `o-pulpa-bella-vista` | citricola-bella-vista | bella-vista | Pulpa de cítricos fresca | orujos_bagazos | available | 40 | 8000 | 80 | — | granel | retiro_en_planta | sí |
| `o-pulpa-zafra-2027` | citricola-bella-vista | bella-vista | Pulpa de cítricos — zafra 2027 | orujos_bagazos | **estimated** (`estimatedDate` 2027-05-01) | 300 | 7500 | 80 | — | granel | a_convenir | sí |

Cada oferta lleva una descripción de 1–2 líneas. Una de ellas, `o-cascarilla-mercedes`, lleva `labAnalysis = "Análisis de humedad y cenizas, laboratorio externo, 09/2026"`. Ninguna descripción afirma usos aprobados ni aptitud sanitaria. Se habla de "usos habituales" con lenguaje condicional: por ejemplo, "suele utilizarse como cama avícola o combustible de biomasa".

**Demandas**

| id | Comprador | Localidad | Título | Cat. | Tn | Máx $/Tn | Necesito para | Radio |
|---|---|---|---|---|---|---|---|---|
| `d-cama-avicola` | granja-bella-vista | bella-vista | Cascarilla para cama de pollo | cascarilla_arroz | 80 | 30000 | 2026-11-30 | 200 |
| `d-secadero-obera` | yerbatera-obera | obera | Chips para secadero | chips_forestales | 300 | 35000 | 2026-12-15 | 200 |
| `d-suplemento-feedlot` | feedlot-resistencia | resistencia | Pulpa de cítricos para suplementación | orujos_bagazos | 150 | — | 2027-06-30 | 200 |

## 12. Contratos entre hitos

Son las únicas superficies que un hito consume de otro. Cada una se fija en M0 o en este documento.

### 12.1 Módulos compartidos (creados en M0, de solo lectura para M1–M4)

| Archivo | Exporta |
|---|---|
| `src/db/index.ts` | `db` (ya existe) |
| `src/lib/ids.ts` | `newId()` (ya existe) |
| `src/lib/persona.ts` | `getPersona`, `requirePersona`, `selectPersona`, `clearPersona`, `AuthorizationError`, tipo `PersonaWithLocality` |
| `src/lib/geo.ts` | `distanceKm`, `RADIUS_OPTIONS` |
| `src/lib/format.ts` | `formatTons(d)` → "650 Tn"; `formatArs(d)` → "$ 28.500"; `formatArsPerTon(d)` → "$ 28.500/Tn"; `formatKm(n)` → "≈ 120 km"; `formatDate(d)` → "01/05/2027". Todos en locale `es-AR`. Aceptan `Decimal \| string \| number`. |
| `src/lib/labels.ts` | `CATEGORY_LABEL`, `OFFER_STATUS_LABEL`, `PRESENTATION_LABEL`, `FREIGHT_LABEL`, `PROPOSAL_STATUS_LABEL`, `PROVINCE_LABEL`, en español |
| `src/lib/decimal.ts` | `parseTons(s)` y `parsePrice(s)`: aceptan "1.234,5" o "1234.5", validan > 0 y la escala, y devuelven `string` normalizado o un error. Los usan los schemas zod de M1, M2 y M3. |
| `src/lib/action-result.ts` | `type ActionResult<T = void> = { ok: true; data?: T } \| { ok: false; error: string; fieldErrors?: Record<string, string> }` |
| `src/components/OfferCard.tsx` | `<OfferCard offer={OfferCardData} distanceKm?={number} />`: tarjeta estilo PDF que enlaza a `/offers/[id]`. `OfferCardData` se exporta desde el mismo archivo e incluye `id, title, category, status, estimatedDate, quantityTons (string), pricePerTon (string \| null), humidityPct, calorificKcalKg, presentation, hasWeighbridge, locality {name, province}, seller {name}`. |
| `src/components/StatusBadge.tsx` | `<OfferStatusBadge status quantityTons />` (con "Agotada") y `<ProposalStatusBadge status />` |
| `src/components/ui/*` | `Button`, `LinkButton`, `Field`, `Input`, `Select`, `Textarea`, `FormError`, `PageHeader`, `EmptyState`: primitivas con Tailwind |

Si un hito necesita una primitiva nueva, la crea **dentro de su propia carpeta**. Si después resulta útil para todos, se promueve en M5.

### 12.2 Precarga de oferta desde una demanda

M2 enlaza a `/offers/new?category=<Category>&quantity=<tons>&title=<string>&demand=<demandId>`. M1 lee esos params como valores iniciales del formulario y, si viene `demand`, muestra un aviso "Publicando en respuesta a: <título de la demanda>" con enlace a ella. No hay relación en la base entre oferta y demanda.

### 12.3 Enlace a proponer

M1 renderiza en `/offers/[id]` un `LinkButton` a `/offers/[id]/propose` si se cumplen todas estas condiciones: la persona es buyer, el estado no es `withdrawn` y `quantityTons > 0`. M3 es dueño de esa ruta y repite todas las validaciones del lado del servidor.

### 12.4 Consultas de lectura cruzadas

M2 (ofertas compatibles) y M4 (lotes recientes y conteo por categoría) **leen** la tabla `offers` con sus propias consultas, dentro de sus carpetas. Ningún hito escribe tablas de otro hito, salvo M3, que decrementa `offers.quantity_tons` en la confirmación (§8.3).

## 13. Guion de demo (criterio de aceptación global)

Se corre con el seed recién aplicado (`--reset-demo`).

1. Abrir `/` sin cookie: aparecen las 6 personas. Elegir **Granja Avícola Bella Vista**.
2. En Explorar, filtrar por "Cascarilla de arroz" y radio ≤ 200 km. Aparecen Corrientes (≈ 118 km) y Mercedes (≈ 120 km), ordenadas por distancia.
3. Abrir la oferta de Mercedes y ver distancia, humedad, kcal, báscula y el análisis "declarado por el vendedor". Proponer 80 Tn a $ 26.000/Tn, con un mensaje.
4. Cambiar a **Molinos del Iberá** desde el selector del header. En Propuestas, abrirla y **contraofertar** $ 27.500/Tn.
5. Volver a **Granja Avícola Bella Vista**. Abrir la propuesta y **aceptar la contraoferta** con el comentario de cierre "Retiramos el lunes con camión propio".
6. Se ve el comprobante: 80 Tn × $ 27.500 = $ 2.200.000, las dos partes, la leyenda "acuerdo declarado". En Explorar, la oferta de Mercedes ahora muestra 570 Tn.
7. Cambiar a **Feedlot Resistencia** y abrir su demanda de pulpa. Entre las compatibles aparece "Pulpa de cítricos — zafra 2027", **Estimada** con fecha 01/05/2027. Proponer funciona, pero la confirmación queda bloqueada con el motivo visible.
8. Como **Citrícola Bella Vista**, publicar una oferta nueva, editarla y retirarla. Como buyer, ver la demanda "Chips para secadero" y su oferta compatible de Virasoro.
9. Intentar abrir `/agreements/<id del paso 6>` como **Yerbatera Oberá**: responde 404.

Distancias calculadas con la fórmula de §9.1 sobre las coordenadas de §5: Bella Vista–Corrientes 118 km, Bella Vista–Mercedes 120 km, Oberá–Virasoro 110 km, Resistencia–Bella Vista 117 km, Resistencia–Corrientes 15 km.
