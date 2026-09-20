# LinkX — Cyber-Fraud Investigation Tool

![LinkX Brand Mark](public/brand/linkx-mark.svg)

**LinkX** is a unified, air-gapped cyber-fraud investigation and evidence correlation platform designed for law enforcement, cyber-cell officers, and forensic investigators. It ingests Call Detail Records (CDR), Internet Protocol Detail Records (IPDR), bank transaction ledgers, and UPI payment trails completely offline, resolves suspect clusters through deterministic rules, maps multi-tier money flow trails, prioritizes account freeze targets during the critical "Golden Hour," and generates court-admissible forensic briefs.

---

## Key Capabilities

- **100% Offline & Air-Gapped**: Runs entirely client-side with zero external network requests, preserving forensic integrity and chain-of-custody.
- **Cryptographic Evidence Verification**: Browser-native SHA-256 integrity verification (`Web Crypto API`) with local manifest cross-checking and tamper detection.
- **Multi-Source Entity Resolution**: Deterministic multi-factor identity linking across phone numbers (`MSISDN`), device identifiers (`IMEI`), Virtual Payment Addresses (`VPA`), bank accounts, and IP sessions.
- **Interactive Multi-Tier Flow Graph**: Cytoscape.js-powered visual topology showing the flow of funds from victim to mule accounts, layering nodes, and cash-out/crypto off-ramps.
- **"Golden Hour" Freeze Queue**: Actionable priority ranking (0–100 score) recommending immediate account freeze and SIM block actions to maximize fund recovery.
- **Multi-Source Chronological Timeline**: Unified second-by-second reconstruction correlating phone calls, APK malware activity, OTP SMS forwards, and bank debits.
- **Court-Ready Investigative Briefs**: Instant A4 report preview and print generation with suspect dossiers, flow matrices, and forensic JSON exports (`generator: "LinkX"`).

---

## Technology Stack

- **Framework**: React 18 + TypeScript + Vite
- **State Management**: Zustand
- **Graph Visualization**: Cytoscape.js (dagre & layered layouts)
- **Data Parsing**: PapaParse (`.csv`) + SheetJS (`.xlsx`)
- **Typography & Assets**: Local `@fontsource/inter` + `ibm-plex-mono` (no external Google Fonts)
- **Security & Hashes**: Web Crypto API (SHA-256)
- **Testing**: Vitest

---

## Investigation Pipeline

```
 ┌────────────────────────────────────────────────────────┐
 │ 1. Ingest                                              │
 │ Raw CSV, XLSX, EML, JSON files (CDR, Bank, UPI, IPDR)  │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2. Normalize & Verify                                  │
 │ SHA-256 integrity hashing + schema column mapping      │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ 3. Link & Cluster                                      │
 │ Deterministic identity resolution & suspect clustering │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ 4. Graph & Risk Analysis                               │
 │ Multi-tier money flow trail + 0-100 risk scoring       │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ 5. Freeze Queue & Timeline                             │
 │ Golden Hour freeze priorities + chronological timeline │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ 6. Output & Deliverables                               │
 │ Court-ready A4 brief, Section 91 notices, JSON export  │
 └──────────────────────────┬─────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/urvashimisal1126-bot/LinkX.git
cd LinkX

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Verification & Testing

```bash
# Run TypeScript typechecks
npm run typecheck

# Run unit tests
npm test

# Verify 100% offline compliance (0 external network requests in dist)
npm run check:offline

# Production build
npm run build
```

---

## Sample Case

LinkX comes bundled with benchmark case **`LX-2026-0918-A`** representing a realistic ₹4,85,000 APK-based UPI fraud investigation across 6 forensic exhibits:
- **E01**: Telecom CDR (Victim phone interactions)
- **E02**: Bank Statement (Initial fraud outflow)
- **E03**: IPDR Session Logs (Tower & IP sessions)
- **E04**: Intermediate Mule Accounts (Layering trail)
- **E05**: P2P Exchange Logs (Cash-out & crypto off-ramps)
- **E06**: Android Malware APK Manifest (SMS-forwarder analysis)

---

## Credits & Acknowledgements

UI inspired by Dribbble references:
- [Reference 1](https://cdn.dribbble.com/userupload/43714181/file/original-2f60c90bf580636d50c13b1fd53d0bbb.mp4)
- [Reference 2](https://cdn.dribbble.com/userupload/43714182/file/original-e29bd07ac546df54403fd688746eab77.mp4)

---

## License

This project is licensed under the MIT License.

