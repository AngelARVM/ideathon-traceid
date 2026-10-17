# Demands (M2)

Paths follow D17 / ADR-0004: English routes and query parameters, Spanish copy.

## Public routes

- `/demands?category=<Category>&radius=50|100|200`
- `/demands/new`
- `/demands/[id]`
- `/demands/[id]/edit`
- `/my-demands?tab=withdrawn`

Domain enum values and fixture IDs stay unchanged to preserve the shared database contract.

## Contracts with M1, M3 and M4

- Compatible cards link to `/offers/[id]`.
- Seller CTA: `/offers/new?category=<Category>&quantity=<decimal>&title=<encoded title>&demand=<id>`.
  M1 reads these parameters to prefill the form and show the demand title (§12.2).
- M2 only reads offers. Stock updates from M3 are read on subsequent server requests;
  queries do not use persistent caches.
- `CompatibleOfferCard` mirrors the shared `OfferCard` data contract. It was created while the
  shared card still linked to Spanish routes; unifying both is pending UI work.

## Verification (2026-10-17, before integration)

- Typecheck, production build and the full Biome check scoped to M2 pass.
- Browser walkthrough: Feedlot's two pulp offers at 117 km, Yerbatera's chips at
  110 km, category exclusion, create/edit/withdraw, private withdrawn details,
  partial coverage, above-maximum price notices, GET filters and the seller CTA.
- Estimated offers are excluded before their date, included on the exact date
  and included without a demand deadline. Reducing the demand radius excludes
  distant offers. Failed submissions retain all form values, including dates.
- Direct local HTTP calls reject seller creation, another buyer's update and
  withdrawal, past/impossible dates, nonexistent localities, invalid radii and
  excessive decimal precision. Database contents remain unchanged on rejection.
