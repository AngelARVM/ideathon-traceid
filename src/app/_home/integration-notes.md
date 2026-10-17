# M4 integration

M4 is based on M0 (`52e2f3f`). Its implementation is confined to `src/app/page.tsx` and `src/app/_home/`.

## English routes

The user explicitly requires English filenames and endpoint paths. Display copy remains Spanish. New M4 links follow this mapping; query parameter names remain the shared contract's `categoria` and `radio`.

| Existing contract path | English path | Owner |
| --- | --- | --- |
| `/ofertas` | `/offers` | M1 |
| `/ofertas/nueva` | `/offers/new` | M1 |
| `/ofertas/[id]` | `/offers/[id]` | M1 |
| `/ofertas/[id]/editar` | `/offers/[id]/edit` | M1 |
| `/mis-ofertas` | `/my-offers` | M1 |
| `/demandas` | `/demands` | M2 |
| `/demandas/nueva` | `/demands/new` | M2 |
| `/demandas/[id]` | `/demands/[id]` | M2 |
| `/demandas/[id]/editar` | `/demands/[id]/edit` | M2 |
| `/mis-demandas` | `/my-demands` | M2 |
| `/ofertas/[id]/proponer` | `/offers/[id]/propose` | M3 |
| `/propuestas` | `/proposals` | M3 |
| `/propuestas/[id]` | `/proposals/[id]` | M3 |
| `/acuerdos` | `/agreements` | M3 |
| `/acuerdos/[id]` | `/agreements/[id]` | M3 |

The user reserved shared-file changes for the integrator. Update these together with the common contract and the other milestones:

- `src/components/OfferCard.tsx`: detail link to `/offers/[id]`. M4 reuses this component unchanged, so its existing Spanish link remains until integration.
- `src/lib/persona.ts`: default `safeNext` destination to `/offers`. M4's selection forms already pass `next=/offers` through the existing action.
- `src/components/SiteHeader.tsx`: all navigation and publish links according to the table.
- M1–M3 actions, links and revalidation paths: use the same English routes.

Do not add Spanish route aliases or change the database model to translate seeded category values.

## Integration boundaries

- M4 uses only M0 imports and its own read queries. It does not import M1–M3 queries or actions.
- Category counts include `available` and `estimated` offers, including zero-stock offers as specified by the active-status definition.
- Nearby offers put exhausted lots last, then sort by distance, newest publication and stable ID. If an estimated lot is within 200 km, retain one in the four-item selection and restore that ordering.
- Buyer demand compatibility follows contract §9.3, including estimated availability dates; it does not filter by price or require enough stock for the whole demand.
- Personalized reads execute below `Suspense`, without cross-request caching.
- Validation uses an isolated local database only. Automated tests and the complete cross-milestone demo belong to M5.

## Verification

- `next typegen` followed by `npm run typecheck`: passed. The type generation step is needed in a fresh checkout for M0's `LayoutProps`.
- `npm run build`: passed with Cache Components and Partial Prefetching enabled; `/` is partially prerendered.
- Biome check for `src/app/page.tsx` and `src/app/_home/`: passed.
- `npm run lint`: blocked by 34 existing formatting diagnostics in unchanged M0 files (including CRLF line endings). No M4 file is reported. Resolve shared formatting during integration.
- Impeccable detector on the changed UI: no findings.
- Local fixture: all three repository migrations applied, then the unmodified seed loaded 13 localities, 6 personas, 6 offers and 3 demands.
- Browser: all 6 personas are available; choosing Feedlot Resistencia redirects to `/offers` and returning to `/` shows its personalized home.
- Category counts: rice husk 2, forest chips 1, sawdust 1, pellets 0, pulp/bagasse 2.
- Granja Avícola Bella Vista: both pulp lots appear first at 0 km, followed by rice husk at 118 km and 120 km; its demand shows 2 compatible offers.
- Feedlot Resistencia: its open demand shows 2 compatible offers, including the estimated pulp lot.
- Molinos del Iberá: the publish CTA points to `/offers/new`; the 3 nearest open demands are shown by distance.
- Search form: `categoria=cascarilla_arroz`, `radio=100` submits to `/offers?categoria=cascarilla_arroz&radio=100`.
- Visual review: 375px mobile and 1280px desktop, light and dark themes; no document-level horizontal overflow. The shared header retains its own horizontally scrolling mobile navigation.
- Expected pre-integration 404s: the M1–M3 destination routes are absent from this M4 checkout. Their behavior cannot be verified until integration.

Because Docker is unavailable in the current environment, browser verification used Prisma's installed PGlite dependencies as an ephemeral, loopback-only PostgreSQL-compatible fixture at `127.0.0.1:54324`. The preview uses a single connection to accommodate that fixture; application queries and dependencies are unchanged. This does not validate production PostgreSQL concurrency, which is outside M4's scope.
