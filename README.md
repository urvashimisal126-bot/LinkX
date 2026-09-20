# LinkX — Cyber-Fraud Investigation Tool

LinkX is a unified cyber-fraud correlation tool for investigating officers. It ingests CDR, IPDR, bank, and UPI records offline, maps the money flow trail, calculates risk scores, recommends immediate account freeze priorities, and generates court-admissible forensic briefs.

## Features

- **Offline-first Forensic Operation**: 100% client-side execution with zero external network requests and local SHA-256 evidence verification.
- **Entity Correlation & Identity Linking**: Deterministic multi-factor identity resolution across phone numbers, VPAs, bank accounts, and IP addresses.
- **Risk Scoring & Golden Hour Freeze Queue**: Actionable priority ranking for rapid fund preservation.
- **Interactive Network Graph**: Layered money flow and communications topology with Cytoscape.js.
- **Court-Ready Investigative Briefs**: One-click A4 preview, print, and JSON forensic export (`generator: "LinkX"`).

## Running Locally

```bash
npm install
npm run dev
```

## Testing & Quality

```bash
npm run typecheck
npm run test
npm run check:offline
```

