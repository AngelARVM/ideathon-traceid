# 01 — Vision, Value Hypotheses and Scope

## Confirmed

**What it is.** A platform for individual traceability of bovine cattle, initially aimed at
producers in the Argentine Northeast (NEA). Presented internally as an ideathon, but the goal
is a working MVP.

**The proposition.** Record the history of each animal in a form that is public, verifiable
and resistant to later modification.

**Value hypotheses — to be validated, not claimed as results.**

- Easier access to markets that value traceability.
- Support for a possible price differential.
- Reduced operational time by centralizing an animal's history.
- Easier consultation and verification by producers, professionals and buyers.

**What the platform is not.** It is not, by itself, a sanitary certification, and it does not
replace official systems. Blockchain anchoring lets anyone verify the *integrity and ordering*
of what was recorded; it does not make a declared fact true.

**Future expansion** contemplates other species and regions. Not implemented in the MVP.

**Explicitly out of initial scope.** Mainnet; NFTs, tokens, payments or trading inside the
platform; official SENASA integrations; RFID readers, sensors and hardware; advanced
collaborator management; automated permission transfer between organizations on a sale; other
species and countries; native mobile apps; deployment automation. None of these may be
introduced as an MVP dependency.

**Minimum acceptance journey.** It must be possible to create an animal, record several
milestones, find them on Stellar, consult the animal's history publicly, verify its integrity,
close its chain, and confirm the chain rejects further ordinary milestones.

## Proposed

**Three claims kept rigorously separate**, in the product copy as well as the docs, because
conflating them is the main reputational risk of a traceability product:

| Claim | Guaranteed by | Status in the MVP |
|---|---|---|
| **Content integrity** — this record has not been altered since it was written | `sha256` over a canonical payload, stored on-chain, verified live on read | Guaranteed |
| **Ordering** — this record came after that one, and nothing was inserted between them | Contract-assigned sequence plus `prev_hash` linkage | Guaranteed |
| **Author identity** — this specific person wrote it | Nothing on-chain. A single custodial platform key signs every write | **Not** guaranteed; a platform-level claim only |
| **Truthfulness** — the declared fact actually happened | Nothing. No sensor, no official cross-check | **Not** guaranteed |

The public history UI must state the bottom two limitations where a reader will see them, not
in a buried disclaimer.

**Demo environment is explicitly ephemeral.** Stellar Testnet is a demonstration network
subject to resets and offers no permanent preservation of history. A deterministic seed can
re-create the demo fixtures in both PostgreSQL and the contract after a reset; anything a user
typed live during a demo is permanently lost. This is stated in the setup document and in the
UI's environment banner.

**Audience split.** Two distinct readers, which drives the route split in document 03:

- **Operators** (producer, veterinarian, agronomist, farmhand) — authenticated, mobile, in the
  field, optimizing for "find the animal and record a milestone in as few steps as possible".
- **Verifiers** (buyer, market, professional, general public) — unauthenticated, arriving via
  QR or a shared link, optimizing for "is this history real?".

**Scope discipline rule.** Any feature request during implementation that is not traceable to
a line in this document or in document 02 is out of scope by default and belongs in document
10 as a Pending item.

## Pending

- **Which market or buyer would actually accept this as evidence?** The access-to-markets and
  price-differential hypotheses are untested. No validation plan exists, and none is in MVP
  scope — but the absence of an identified first verifier is the project's largest commercial
  unknown.
- **Whether "resistant to later modification" is a strong enough promise on Testnet.** The
  contract enforces immutability, but the network it runs on can be reset and its storage
  entries can be archived (see documents 06 and 10). The honest framing of this in
  producer-facing language is not settled.
