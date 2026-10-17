# ADR-0004 — English paths, Spanish copy

**Status:** accepted (2026-10-17, M4.5) · amends `docs/00-mvp-spec.md` §9.2, §10 and §12 (D17)

## Context

The MVP contract named every route in Spanish (`/ofertas`, `/mis-demandas`, `/acuerdos/[id]`…).
During the parallel milestones the user asked for English filenames and endpoint paths: M2, M3
and M4 followed that, M1 and the shared M0 files kept the contract's Spanish names. After the
merge the app had both, and every cross-milestone link (header, offer cards, propose button,
demand CTA, home search) pointed at a route that did not exist.

## Decision

Every **path** is in English: route segments, folders and files under `src/`, query parameter
names, and the names of the docs under `docs/specs/`. **Visible copy** stays in Spanish. Database
enum values and fixture ids (`cascarilla_arroz`, `retiro_en_planta`, `o-cascarilla-mercedes`…)
are data, not paths, and stay unchanged. No Spanish route aliases or redirects are added.

| Before | Now |
|---|---|
| `/ofertas`, `/ofertas/nueva`, `/ofertas/[id]`, `/ofertas/[id]/editar` | `/offers`, `/offers/new`, `/offers/[id]`, `/offers/[id]/edit` |
| `/ofertas/[id]/proponer` | `/offers/[id]/propose` |
| `/mis-ofertas` | `/my-offers` |
| `/demandas`, `/demandas/nueva`, `/demandas/[id]`, `/demandas/[id]/editar` | `/demands`, `/demands/new`, `/demands/[id]`, `/demands/[id]/edit` |
| `/mis-demandas` | `/my-demands` |
| `/propuestas`, `/propuestas/[id]` | `/proposals`, `/proposals/[id]` |
| `/acuerdos`, `/acuerdos/[id]` | `/agreements`, `/agreements/[id]` |

| Query parameter | Before | Now |
|---|---|---|
| Catalog and demand filters | `categoria`, `radio`, `disponibilidad` (`disponible`/`estimada`), `humedadMax`, `kcalMin`, `presentacion` | `category`, `radius`, `availability` (`available`/`estimated`), `maxHumidity`, `minKcal`, `presentation` |
| Offer prefill from a demand (§12.2) | `categoria`, `cantidad`, `titulo`, `demanda` | `category`, `quantity`, `title`, `demand` |
| Show withdrawn (`/my-offers`, `/my-demands`) | `retiradas=1` | `showWithdrawn=true` |

## Consequences

- Old Spanish URLs return 404. The demo never relied on them, and there are no external links.
- New routes, folders and parameters follow this rule; reviewers reject Spanish paths.
- Milestone branches keep their historical names; new branches use English (`m4.5`, `m5/...`).
