# TraceID

> **Pivot en preparación:** el nuevo producto es un marketplace regional de subproductos agroindustriales. Leer el [brief](pivot/ideathon_agro_marketplace_contexto.md) y el [apéndice de transición](pivot/11-apendice-pivot-marketplace-agro.md). El resto de este README describe el sistema anterior hasta que se implemente el pivot.

Trazabilidad individual de ganado bovino con historial verificable en Hedera (Testnet).
La red cambió de Stellar a Hedera: ver [`docs/adr/0003-hedera-instead-of-stellar.md`](docs/adr/0003-hedera-instead-of-stellar.md).
La documentación de diseño está en [`docs/`](docs/README.md); el plan por etapas en
[`docs/08-implementation-plan.md`](docs/08-implementation-plan.md).

**Estado:** S1 (Foundation) — base de datos, migraciones, usuarios sembrados y login.

## Arranque local

Requisitos: Node ≥ 20.12, Docker. Detalle completo en
[`docs/07-setup-and-deployment.md`](docs/07-setup-and-deployment.md).

```bash
npm install
cp .env.example .env.local      # completar AUTH_SECRET: openssl rand -base64 32
docker compose up -d            # PostgreSQL en localhost:54320
npm run db:migrate
npm run db:seed
npm run dev
```

Entrar en `/login` con `owner@demo.local` / `demo1234` (otros usuarios: los imprime el seed).

## Scripts

| Script | Qué hace |
|---|---|
| `dev`, `build`, `start` | Next.js |
| `lint`, `format`, `typecheck` | Biome y TypeScript |
| `db:generate` | Genera el cliente Prisma (también corre en `postinstall`) |
| `db:migrate` | Aplica las migraciones de `prisma/migrations/` |
| `db:migrate:dev` | Crea y aplica una migración desde `prisma/schema.prisma` |
| `db:seed` | Datos de demo (`-- --reset` para volver a sembrar) |
| `db:studio` | Prisma Studio |

`prototype/` contiene el prototipo de UI con datos simulados: solo referencia visual, fuera del build.
