# LinkX demo build

Run from this folder:

```powershell
npm run dev
```

Open the localhost URL printed by Vite. The landing page is `/`; Enter workspace opens `/#/`.

## Recording walkthrough

1. Landing: introduce the Golden Hour headline and statistics.
2. Overview: click **Load sample case** once.
3. Evidence: all six exhibits appear; 370 records and verification badges are visible.
4. Links: point to the attacker row's **IMEI match across E01 + E06**.
5. Network: click the victim node, then **Highlight full path**. Drag blank canvas to pan; scroll to zoom. Click a transfer to inspect its amount, timestamp and exhibit.
6. Risk & freeze: rank 1 is PNB ••7790, score 96. **Recommend freeze** updates the row locally.
7. Timeline: scroll through the eleven events.
8. Report: **Export brief** opens browser printing; choose Save as PDF. Print styles use A4, two pages, and omit workspace chrome.

The sidebar begins collapsed; use its top toggle to show labels. Integrity and System are also populated. Reloading the browser resets the demo; changing screens preserves case data and local recommendations.

## Implementation notes

- `src/data/sampleCase.ts` contains the PRD's verbatim TypeScript fixtures.
- `src/store/demoStore.ts` loads the full bundle atomically in Zustand. Active routes do not call the legacy mock API or HTTP adapter.
- `src/components/Graph.tsx` uses Cytoscape with fixed layered positions, making the recorded graph deterministic.
- `src/data/presentation.ts` supplies illustrative identity-link descriptions and masked identifiers; it does not invent raw IMEIs or phone numbers.
- The PRD freeze queue includes a VPA balance snapshot predating the 09:33 transfer. Both supplied values are retained, with a note in Risk and Report.
- The Golden Hour clock is fixed at the sample snapshot (09:34 IST, 20 minutes after filing), not the computer's current date.
- Hashes and verification badges are sample values, and upload intake is decorative.
- Existing React 19 dependency versions were preserved despite the original README describing React 18.

## Verification

TypeScript and production build pass. Offline static scan passes. Browser walkthrough confirmed loaded screens, node/edge inspection, full-path highlighting, local freeze recommendation, and two-page print output. Browser resource entries showed no external requests and no browser errors were reported. Legacy unused files retain pre-existing lint warnings.
