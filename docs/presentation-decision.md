# DECISION-PRESENTATION-001 — physical cards and shared artwork

Authority: explicit user correction in this conversation. This replaces the previous instruction to recover missing Lime 1 artwork. It changes the preservation assessment and proposed presentation mapping, not gameplay rules or the 133-card inventory.

| Status | Result |
|---|---|
| Lime 1 artwork | VERIFIED / AVAILABLE |
| Empty legacy `_02` file | LEGACY ASSET-MAPPING DEFECT |
| Canonical starting card count | 133, UNCHANGED |
| Canonical families | 19, approved counts unchanged |
| New artwork required | NO |
| P0 blocked by Lime 1 artwork | NO |

Both distinct physical Lime 1 copies must resolve to `assetKey: number_lime_1`. That key resolves to the approved `packages/cards/assets/CHAOS-133-V1/cards/numbers/lime/number_lime_1_01.jpg`. The approved image decodes at 1080 × 1512 and has SHA-256 `de80a9104d8635a72c17aff20545cd34b946e3c2513da1a15d1609cd91a53a32`.

Verified evidence: the other 35 numbered duplicate pairs use identical `_01` and `_02` image bytes. The uploaded ZIP matches the pinned card JPG assets and card back. Its three additional Reverse Confession PNGs are recorded as attachment provenance only; they were not adopted into the immutable old source or used as replacements.

The P0 audit now records legacy source measurements separately from resolved presentation mappings. All 133 physical slots remain and resolve to nonempty decodable approved artwork. The two Lime 1 entries retain distinct physical slots and share one assetKey. This is documentary/audit verification; no production application mapping has been implemented.

## Required clean-application CI

- Assert exactly 133 starting physical instances and the approved 19 family counts.
- Assert physical instance IDs are unique; assetKeys need not be unique across physical copies.
- Resolve every card definition through the canonical presentation mapping.
- Assert every referenced resolved asset exists, is nonempty, decodes and matches approved provenance.
- Explicitly test two physical Lime 1 copies, one approved assetKey, and no lost physical multiplicity after any presentation deduplication.
- Do not require unused legacy duplicate slots to become separate artwork or production assets.
- If legacy `_02` filename compatibility is explicitly needed later, its bytes may only be an exact copy of approved `_01`; prefer shared asset references. No such compatibility repair is performed in P0.

Do not generate/redesign Lime 1, remove a physical copy, reduce the deck, or modify the old preservation repository. Existing rule wording and clause IDs stay unchanged. P0's remaining visual/device/approval gates remain open; P1 is independently authorized by the later gate correction; UI migration retains its P0B gates.
