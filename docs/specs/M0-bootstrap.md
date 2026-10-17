# M0 — Bootstrap: limpieza, esquema, seed, persona y layout

**Fase:** secuencial. **Bloquea** a M1–M4. **Estimado:** 40–50 min, un solo agente.
**Contrato:** [`docs/00-mvp-spec.md`](../00-mvp-spec.md), §2, §5–§7, §9.1, §10–§12.

## Objetivo

Dejar un commit que compile (`npm run typecheck && npm run lint && npm run build`). Ese commit ya no tiene nada de TraceID y tiene:

- el esquema nuevo con su migración;
- el seed de demo;
- la identidad por cookie de persona;
- el layout de SubMarket;
- todos los módulos y componentes compartidos de §12.1.

M1–M4 arrancan desde ese commit.

## Antes de escribir código

Leer:

- `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`

`next.config.ts` tiene `cacheComponents: true`: hay que mantenerlo y respetar la regla de `<Suspense>` de §7.

## Tareas

### 1. Borrar el legado

Eliminar:

- `src/app/animals/`, `src/app/login/` y `src/app/api/`
- `src/proxy.ts`
- en `src/lib/`: `animals/`, `chain/`, `outbox/`, `records/`, `identifiers.ts`, `identifiers.test.ts`, `auth.ts`, `auth-actions.ts`, `session.ts` y `password.ts`
- en `src/components/`: `HashChip.tsx`, `NewIdField.tsx`, `RecordStatusBadge.tsx`, `RecordTypeIcon.tsx` y `EnvironmentBanner.tsx`
- `scripts/drain.ts`, `contracts/` y `prototype/`
- `src/generated/`, que se regenera

Además:

- Sacar del `package.json` las dependencias `better-auth`, `@node-rs/argon2` y `qrcode.react`, y el script `outbox:drain`. Correr `npm install`.
- Sacar del `Makefile` los targets `drain` y `contract`. `reset` pasa a usar `npm run db:seed -- --reset-demo`.
- Reescribir `.env.example`: solo `DATABASE_URL` y `PERSONA_SECRET`, con instrucciones para generarlo (`openssl rand -base64 32`). Quitar Hedera, `AUTH_*` y `NEXT_PUBLIC_EXPLORER_*`.
- `docker-compose.yml` queda igual: nombre `traceid`, puerto 54320. No se renombra, para no perder volúmenes locales.

### 2. Esquema y migración

1. Reemplazar `prisma/schema.prisma` por el de §6 del spec, **exacto**.
2. Correr `npm run db:migrate:dev -- --name submarket_pivot` contra el Postgres **local** (`make db` o `docker compose up -d --wait`). La migración generada dropea las tablas legadas y crea las nuevas.
3. **No** editar ni borrar las migraciones existentes (`20261016153050_init` y `20261016160045_s2_domain_records_outbox`).
4. Revisar el SQL generado. Que dropee tablas legadas es lo esperado (D13). Recrear `users` también es aceptable.
5. Verificar que `npm run db:migrate` (`migrate deploy`) aplica limpio sobre una base que ya tenía las dos migraciones viejas. Es el estado de Vercel.

### 3. Seed

Reescribir `scripts/seed.ts` según §11. Requisitos:

- **Idempotente:** `upsert` por id fijo. Las localidades van primero, después los usuarios, las ofertas y las demandas.
- **`--reset-demo`:** en una transacción, `deleteMany` de agreements y proposals, y de offers y demands cuyo id no esté en el fixture. Después se hacen los upserts, que restauran el `quantityTons` original de cada oferta del fixture.
- **Guarda remota:** si el host de `DATABASE_URL` no es `localhost` ni `127.0.0.1` y no vino `--allow-remote`, el seed aborta con un mensaje claro. Conservar ese comportamiento del seed actual.
- Usa `createPrismaClient()` de `src/db/client.ts`, no `db`, porque corre fuera de Next.
- Imprime un resumen: N localidades, N personas, N ofertas y N demandas.
- Verificar con `npm run db:seed`, después con `npm run db:seed` otra vez (no duplica) y después con `npm run db:seed -- --reset-demo`.

### 4. Módulos compartidos

Crear exactamente lo que lista §12.1:

- `src/lib/persona.ts`
- `src/lib/geo.ts`
- `src/lib/format.ts`
- `src/lib/labels.ts`
- `src/lib/decimal.ts`
- `src/lib/action-result.ts`

`src/lib/ids.ts` y `src/db/*` se conservan.

- `persona.ts` lanza un error al arrancar si falta `PERSONA_SECRET` en producción. En desarrollo usa un valor fijo con un `console.warn`.
- `format.ts` usa `Intl.NumberFormat("es-AR")` y no usa `toFixed` para dinero.
- `decimal.ts` devuelve strings normalizados con punto decimal, que Prisma acepta para campos `Decimal`.

### 5. Layout y componentes compartidos

- **`src/app/layout.tsx`:**
  - metadatos de SubMarket: título "SubMarket · Subproductos agroindustriales NEA" y descripción del producto;
  - `themeColor` de la paleta;
  - se conservan las fuentes;
  - estructura: `<DemoBanner />`, después `<SiteHeader />`, después `<main>` y después `<SiteFooter />`.
- **`src/components/DemoBanner.tsx`:** banner fino con "Entorno demostrativo · Empresas y operaciones ficticias".
- **`src/components/SiteHeader.tsx`:** reescribir.
  - Logo con la palabra **SubMarket** y la tagline "Lo que sobra, vale.".
  - Navegación por rol según §10.
  - CTA de publicar según el rol.
  - `PersonaSwitcher` a la derecha.
  - `ThemeToggle` se conserva.
  - La parte que lee la persona va en `<Suspense>`.
- **`src/components/PersonaSwitcher.tsx`:**
  - Muestra la persona actual (nombre, rol y localidad).
  - Tiene un desplegable con las 6 personas del seed, agrupadas en Vendedores y Compradores. Cada opción es un `<form action={selectPersona}>` con un `userId` oculto y `next` igual al path actual.
  - Tiene la opción "Salir del modo persona", que llama a `clearPersona`.
  - La lista se lee de la base (`db.user.findMany`).
- **`src/components/SiteFooter.tsx` y `src/components/Logo.tsx`:** rebranding. Sin datos de contacto.
- **`src/app/icon.svg`:** ícono neutro de SubMarket, por ejemplo una hoja o un círculo de reciclaje, en la paleta.
- **`src/app/not-found.tsx`:** textos de SubMarket.
- **`src/app/globals.css`:** se conserva la paleta `campo`/`tierra`. Se pueden agregar tokens, pero no se renombran.
- **Componentes de §12.1:** `src/components/OfferCard.tsx`, `src/components/StatusBadge.tsx` y `src/components/ui/*`. `OfferCard` sigue el estilo de tarjeta de lote del PDF: categoría, localidad + vendedor, humedad y kcal si están, Tn disponibles, $/Tn, chip de distancia, badge Estimada o Agotada y "Báscula en planta" si `hasWeighbridge`. **Sin** el sello "Verificado".
- **`src/app/page.tsx`:** placeholder mínimo que M4 reemplaza. Muestra las tarjetas de persona si no hay cookie y un enlace a `/ofertas` si la hay. Alcanza con que el flujo funcione.

### 6. Documentación mínima

- `README.md`: arranque local en 5 líneas (`cp .env.example .env.local`, `make db` y `make up`) y un enlace a `docs/00-mvp-spec.md`. M5 lo completa.
- `AGENTS.md` ya apunta al spec vigente: no hace falta tocarlo. **No tocar** el bloque de Next.js que genera `next dev`.

## Archivos que este hito puede tocar

Todo el repo. Es el único hito con permiso amplio. Al terminar, **no** debe existir `src/app/ofertas`, `src/app/demandas`, `src/app/propuestas`, `src/app/acuerdos` ni ninguna carpeta `src/lib/{offers,demands,negotiation,home}`: son de M1–M4.

## Definición de terminado

- [ ] `npm run typecheck`, `npm run lint` y `npm run build` pasan.
- [ ] `grep -riE "traceid|hedera|animal|better-auth|caravana" src scripts` no devuelve nada. El nombre `traceid` en `docker-compose.yml`, el `Makefile` y `package.json#name` está permitido.
- [ ] La migración nueva aplica con `migrate deploy` sobre una base con las migraciones viejas, y también sobre una base vacía.
- [ ] El seed es idempotente y `--reset-demo` restaura el stock.
- [ ] En `npm run dev`:
  - sin cookie, `/` muestra las 6 personas;
  - elegir una redirige a `/ofertas`, que puede dar 404 porque todavía no existe;
  - el header muestra la persona y la navegación de su rol;
  - cambiar de persona desde el header funciona sin recargar manualmente.
- [ ] Una cookie `submarket_persona` adulterada, por ejemplo con otro `userId` y la firma vieja, hace que `getPersona()` devuelva `null`.
- [ ] Hay un commit "M0: bootstrap SubMarket" y el equipo recibe el aviso de que M1–M4 pueden arrancar.
- [ ] Se avisa a quien corre la migración y el seed en Vercel (D15) que ya puede hacerlo.
