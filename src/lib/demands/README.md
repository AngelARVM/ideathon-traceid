# M2 integration

The user explicitly requested English filenames and endpoint paths, overriding
the Spanish route names in the milestone spec. UI copy remains in Spanish.

## Public routes

- `/demands?category=<Category>&radius=50|100|200`
- `/demands/new`
- `/demands/[id]`
- `/demands/[id]/edit`
- `/my-demands?showWithdrawn=true`

No Spanish route aliases are introduced. Domain enum values and fixture IDs stay
unchanged to preserve the shared database contract.

## Integration with M1, M3 and M4

- Compatible cards link to `/offers/[id]`.
- Seller CTA: `/offers/new?category=<Category>&quantity=<decimal>&title=<encoded title>&demand=<id>`.
  M1 should use these parameters to prefill the form and show the demand title.
- M2 only reads offers. Stock updates from M3 are read on subsequent server requests;
  queries do not use persistent caches.
- M4 and the shared header should link to `/demands`, `/demands/new`, and `/my-demands`.
  The existing M0 header still uses Spanish URLs and is outside M2 ownership.
- The shared M0 OfferCard still hardcodes a Spanish URL. M2 uses a local
  CompatibleOfferCard with the same data contract and English links. M5 can unify
  the cards once the shared component's route is updated.

The schema, seed, shared components, home, offers and negotiation files are
unchanged. Automated tests belong to M5; M2 is checked with types, lint, build and
the acceptance walkthrough against a dedicated local database.

## Verification (2026-10-17)

- Typecheck, production build and the full Biome check scoped to M2 pass.
- Repository-wide lint rules pass with `npm run lint -- --formatter-enabled=false`.
  Plain `npm run lint` reports pre-existing CRLF formatting differences in M0
  files on this Windows checkout (`core.autocrlf=true`); those files were not edited.
- Browser walkthrough: Feedlot's two pulp offers at 117 km, Yerbatera's chips at
  110 km, category exclusion, create/edit/withdraw, private withdrawn details,
  partial coverage, above-maximum price notices, GET filters and the seller CTA.
- Estimated offers are excluded before their date, included on the exact date
  and included without a demand deadline. Reducing the demand radius excludes
  distant offers. Failed submissions retain all form values, including dates.
- Direct local HTTP calls reject seller creation, another buyer's update and
  withdrawal, past/impossible dates, nonexistent localities, invalid radii and
  excessive decimal precision. Database contents remain unchanged on rejection.
- M1's receiving page and the full negotiation journey await integration in M5.
