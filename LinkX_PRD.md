# LinkX — Product Requirements Document
**Cyber-Fraud Investigation & Evidence Correlation Platform**
Void Hacks 8.0 · Domain: Cybersecurity · Demo-grade prototype, client-only, no backend

---

## 0. What this document is

This is the single source of truth for building the LinkX demo. It is written to be handed directly to a coding agent (Codex/Antigravity) alongside the existing repo. It assumes the repo scaffold already exists (React 18 + TypeScript + Vite + Zustand + Cytoscape.js, per the current README) and this PRD's job is to **finalize the visual direction, fill every screen with real content, and wire it to hardcoded mock data** so it demos convincingly in a 2-minute video — nothing more.

**Explicitly out of scope:** real file parsing correctness, auth, a backend, database, deployment, GitHub Actions, tests. If any of these already exist in the repo, leave them; don't build new ones.

---

## 1. Product summary

LinkX is an offline investigation console for cyber-cell officers. A case is loaded (in the demo: one pre-baked sample case). The app then shows, screen by screen: what evidence came in, who the evidence links to, how the stolen money moved, who to freeze first, when everything happened, whether the evidence has been tampered with, and a printable brief for court.

**One-line pitch:** *From complaint to freeze order — inside the Golden Hour.*

**Audience in the room:** judges from Indore Police + faculty. They are not designers. They want to see, instantly, that this would save an officer time in the first hour of a real case. Every screen should answer "so what does the officer do next" — not just display data.

---

## 2. Design direction (read this before styling anything)

The current build (see screenshots) uses a near-black background with a bright acid-green/yellow accent. **Move away from this.** It reads as generic "hacker dashboard" rather than a tool a police department would actually deploy, and the user has explicitly asked for something calmer and more professional — closer to how a case-management or forensic tool looks, not a cyber-thriller.

### 2.1 Color tokens

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0F1D2E` | Sidebar / chrome, headings on light background |
| `--canvas` | `#F5F6F4` | Main content background (paper-like, not stark white) |
| `--surface` | `#FFFFFF` | Cards, panels, table rows |
| `--slate` | `#4B5768` | Secondary text, muted labels, borders on dark |
| `--line` | `#DDE1E6` | Hairline borders on light surfaces |
| `--signal` (primary) | `#0E7C7B` | Primary buttons, active nav item, links, "verified" accents |
| `--amber` (medium risk) | `#B7791F` | Medium-priority risk, warnings |
| `--red` (high risk) | `#B42318` | High-priority freeze targets, critical alerts — used sparingly, never as a background wash |
| `--green` (verified/low risk) | `#15803D` | Integrity verified, low risk, success states |

No neon. No pure black. Risk colors are used only on small elements (badges, dots, left-border accents on a row) — never as a full card background.

### 2.2 Typography

- **UI text / headings:** Inter (already in the stack via `@fontsource/inter`). Sentence case throughout — no forced all-caps except the existing single sidebar section label ("Investigation"), which can stay as the one deliberate exception.
- **Data / evidentiary text:** IBM Plex Mono (already in the stack) for anything that is *evidence*: case IDs, account numbers, phone numbers, IMEIs, VPAs, SHA-256 hashes, timestamps, currency amounts in tables. This is a functional choice, not decoration — it visually signals "this is verifiable data" versus "this is the app's own UI chrome."
- Keep line lengths reasonable in panels (~70–80 char max for body copy in side panels/report).

### 2.3 Layout

```
┌───┬──────────────────────────────────────────────────┐
│ L │  [Case chip]  [Integrity: Verified]     [Export] │  ← slim top bar, on --canvas
│ o │──────────────────────────────────────────────────│
│ g │                                                    │
│ o │                                                    │
│   │              main content (--canvas)               │
│ i │              cards / graph / tables on --surface   │
│ c │                                                    │
│ o │                                                    │
│ n │                                                    │
│ s │                                                    │
└───┴──────────────────────────────────────────────────┘
   ↑ dark (--ink) icon rail, 64px collapsed
     expands to ~220px on click/hover, showing labels
```

- Left rail is **dark, icon-only by default, collapsible/expandable** — same interaction pattern as the SatQuery reference screenshots the user provided (icon rail → labeled rail on toggle). This is the one carried-over pattern from that reference; everything else (color, type, card style) is LinkX's own.
- Main content sits on the light `--canvas`, not dark. This is the single biggest visual change from the current build and the main thing that will make it read as "professional govtech tool" instead of "hacker dashboard."
- Avoid the generic SaaS-card-kit look: don't put an identical rounded card + soft shadow around every single block. Use a **document/dossier metaphor** instead: exhibit entries look like case-file index cards (left accent bar = exhibit type color, monospace hash line, status chip); the money-flow view is a full-bleed canvas, not a card; the report screen looks like an actual paginated A4 document preview, not a dashboard widget.
- One motion moment, not motion everywhere: when the sample case loads, the exhibit cards populate in on the Evidence screen (a single orchestrated reveal). Don't add hover-lift/fade animation to every card — keep everything else static and calm.

### 2.4 Logo / brand mark — what Claude can and can't do here

Claude cannot generate custom image/logo assets in this environment (no image-generation tool available). The existing `L↔X` mark in the current build is usable as-is if you like it — it's a reasonable minimal wordmark-logo hybrid and doesn't need to be redone.

If you want a refreshed logo/favicon (recommended: a simple mark, not illustrative), generate it yourself the same way you did for SatQuery — paste this into your image generator:

> Minimal geometric logomark for "LinkX", a cyber-fraud investigation tool. Two interlocking node-and-link shapes forming the letters L and X, suggesting a connected evidence graph. Flat vector style, single color #0E7C7B on transparent background, no gradients, no 3D, no drop shadow, works at 24px favicon size. Also provide a horizontal lockup with "LinkX" in a clean geometric sans-serif next to the mark.

Everything else — every icon in the interface (sidebar nav, buttons, status icons) — should come from the `lucide-react` package already in the stack. No asset generation is needed for interface icons; that would be wasted effort for a hackathon timeline.

---

## 3. Information architecture

### 3.1 Marketing landing — `/`
A short, separate page before the app shell. This is what the demo video opens on, and what gives judges context before they see the working tool.

Sections, in order:
1. **Hero** — Headline: *"From complaint to freeze order — in the Golden Hour."* Sub-line: one sentence on what LinkX does. Primary CTA: **Enter workspace** → routes into the app shell (`/#/`). Secondary: none needed (skip "watch demo" — you're recording the whole thing live).
2. **Stat strip** — 3 numbers, no chart needed: `₹22,845 Cr` lost to cyber fraud in India in 2024 · `5.24 lakh` mule accounts flagged in a single month (Mar 2026) · `100%` offline, zero external requests. Small source note beneath, not a citation block.
3. **How it works** — 4-step strip mirroring the pipeline in the README (Ingest → Link → Map → Freeze), icon + one line each.
4. **Footer** — team/hackathon name, nothing else.

Keep this page short — it exists to frame the tool for the video, not to be a full product site.

### 3.2 App shell routes (hash routing, matches current scaffold)

| Route | Screen | Priority |
|---|---|---|
| `/#/` | Overview | High |
| `/#/evidence` | Evidence | High |
| `/#/links` | Links | Medium |
| `/#/network` | Network (money-flow graph) | **Highest — this is the hero screen** |
| `/#/risk` | Risk & Freeze | High |
| `/#/timeline` | Timeline | Medium |
| `/#/integrity` | Integrity | Medium |
| `/#/report` | Report | High |
| `/#/system` | System / Settings | Low |

**Build order / time allocation:** shell + nav (10%) → Network graph (35%) → Evidence + Risk & Freeze (25% combined) → Overview + Report (20% combined) → Links + Timeline + Integrity + System (10% combined, can be simpler). The graph is what judges will remember; everything else needs to be solid but doesn't need to be fancy.

Every screen in the current build that says "No case loaded" should, once the sample case is loaded (see §5), show the populated version described below. Never leave a screen the judges will see mid-demo in its empty state.

---

## 4. Screen-by-screen spec

### 4.1 Overview (`/#/`)
Once loaded: a case summary header (case ID, title, amount, filed date, status chip "Active — Golden Hour" in amber) plus 4 stat tiles: exhibits ingested (6), entities resolved (9), top freeze priority (score + account, links to Risk screen), hours since complaint filed (drives urgency framing). Below: a condensed preview of the money-flow graph (non-interactive thumbnail is fine) with a "View full graph" link to `/#/network`.

### 4.2 Evidence (`/#/evidence`)
List of the 6 exhibits from §5.1 as dossier-style cards: exhibit ID, type, filename, record count, SHA-256 (truncated, monospace), a "Verified" badge (green) once hashed. Uploading is stubbed — clicking "Load sample case" (or it auto-loads per §6) populates all 6 at once with the single reveal animation described in §2.3. Drag-and-drop zone can remain visually present but doesn't need real parsing logic behind it.

### 4.3 Links (`/#/links`)
A table of resolved identity clusters: each row is one real-world entity (victim, mule holder, attacker) with the evidence types that link to it (phone / IMEI / VPA / bank a/c / IP session) shown as small tags, and which exhibits support each link. This is where you show the "deterministic, explainable" claim — a `resolved via` column naming the matching field (e.g. "IMEI match across E01 + E06"), not a confidence percentage.

### 4.4 Network (`/#/network`) — hero screen
Full-bleed Cytoscape.js graph, not boxed in a card. Nodes: victim, mule accounts (tiered by layer), exchange/off-ramp, attacker phone/IMEI, malicious APK. Edges labeled with amount + date. Layered/dagre layout so money flows left→right or top→bottom, matching the tiers in §5.2.

Interactions needed for the demo:
- Click a node → right-side panel slides in with that entity's details (type, identifiers, linked exhibits, risk score if applicable).
- Click an edge → shows the transaction detail (amount, timestamp, source exhibit).
- A "highlight full path" affordance from victim to final off-ramp (button or click-through) — this is the single moment in the demo that sells the product, so it should feel deliberate, not accidental.

### 4.5 Risk & Freeze (`/#/risk`)
Ranked table/list, highest priority first, using the data in §5.3. Each row: account/VPA identifier (monospace), risk score (0–100, shown as a number not a decorative gauge), status line explaining *why* it's ranked where it is (e.g. "Funds confirmed present — ₹2,15,000"), and a "Recommend freeze" action button (stubbed — clicking it just marks the row as "Freeze recommended" locally, no backend). Explicitly show that ranking is about **where funds still are**, not chronological order — this is a good talking point for the demo narration.

### 4.6 Timeline (`/#/timeline`)
Vertical chronological list combining all event types from §5.4, each with a small type tag (Call / SMS / Bank / IPDR / Malware) in a muted color, timestamp in monospace, one-line description. No need for a zoomable/scrubbable timeline component — a clean scrollable list reads as more "evidence log," less "dashboard toy," and is faster to build.

### 4.7 Integrity (`/#/integrity`)
Simple table: exhibit → SHA-256 hash → verification status → verified timestamp. This can literally reuse the hash data from §5.1. Include one sentence at the top explaining what this screen is for ("Confirms no evidence file has been altered since ingestion") — plain language, not jargon.

### 4.8 Report (`/#/report`)
This should look like an actual A4 document preview (white page, margins, serif or clean sans body text, not app-chrome styling) — case summary, entity list, flow summary, freeze recommendations, exhibit list with hashes. "Export brief" triggers `window.print()` or a simple PDF-style preview; a real PDF export isn't necessary for the demo, "looks correct when you hit print" is enough.

### 4.9 System (`/#/system`)
Minimal: "Local mode" toggle (already exists, keep it), a note confirming zero external network requests, app version. Low priority — a few minutes of work at most.

---

## 5. Mock data — sample case `LX-2026-0918-A`

Use this verbatim as a single hardcoded object/module (e.g. `src/data/sampleCase.ts`) that every screen reads from via the existing Zustand store. Do not fetch it from a file/network — hardcode it directly so the demo never depends on file parsing working correctly live.

### 5.0 Case header

```ts
export const sampleCase = {
  id: "LX-2026-0918-A",
  title: "APK-based UPI fraud — ₹4,85,000",
  filedDate: "2026-09-18T09:14:00+05:30",
  status: "Active — Golden Hour",
  totalAmount: 485000,
  currency: "INR",
  victim: {
    label: "Complainant (Victim)",
    phone: "98••••••12",
    bankAccountLast4: "4471",
    bank: "Suraksha Cooperative Bank (sample)"
  }
};
```

### 5.1 Exhibits (6, matches README exactly)

```ts
export const exhibits = [
  { id: "E01", type: "Telecom CDR", filename: "cdr_victim_98xxxx12.csv",
    records: 214, sha256: "a1f9c3...e02b", status: "Verified", uploadedAt: "2026-09-18T09:20:00+05:30" },
  { id: "E02", type: "Bank Statement", filename: "bank_stmt_4471.xlsx",
    records: 38, sha256: "7be402...9f11", status: "Verified", uploadedAt: "2026-09-18T09:21:00+05:30" },
  { id: "E03", type: "IPDR Session Logs", filename: "ipdr_sessions_sep18.csv",
    records: 96, sha256: "d0a7e5...44cd", status: "Verified", uploadedAt: "2026-09-18T09:23:00+05:30" },
  { id: "E04", type: "Mule Account Records", filename: "mule_layer_accounts.xlsx",
    records: 12, sha256: "c92b81...117a", status: "Verified", uploadedAt: "2026-09-18T09:25:00+05:30" },
  { id: "E05", type: "P2P Exchange Logs", filename: "exchange_offramp_logs.json",
    records: 9, sha256: "5f3d90...ab02", status: "Verified", uploadedAt: "2026-09-18T09:27:00+05:30" },
  { id: "E06", type: "Malware APK Manifest", filename: "sms_forwarder.apk.manifest.json",
    records: 1, sha256: "e114af...caa9", status: "Verified", uploadedAt: "2026-09-18T09:29:00+05:30" }
];
```

### 5.2 Entities & money-flow graph

```ts
export const entities = [
  { id: "victim",   label: "Victim account (••4471)",     type: "victim" },
  { id: "attacker_phone", label: "Attacker-controlled number", type: "attacker" },
  { id: "apk",      label: "SMS-forwarder APK",            type: "malware", linkedExhibit: "E06" },
  { id: "mule1",     label: "Mule A/C — HDFC ••3321 (sample)", type: "mule", tier: 1 },
  { id: "mule2",     label: "Mule A/C — PNB ••7790 (sample)",  type: "mule", tier: 2 },
  { id: "mule3",     label: "Mule A/C — Canara ••1190 (sample)", type: "mule", tier: 2 },
  { id: "vpa_fraud", label: "VPA: fraud••@examplebank",     type: "vpa", tier: 2 },
  { id: "exchange",  label: "Exchange wallet — CoinRamp ••221 (sample)", type: "offramp", tier: 3 },
  { id: "atm_cashout", label: "ATM cash-out cluster (3 locations)", type: "offramp", tier: 3 }
];

export const flowEdges = [
  { from: "apk", to: "victim", label: "OTP intercepted", timestamp: "2026-09-18T08:51:00+05:30" },
  { from: "victim", to: "mule1", amount: 485000, timestamp: "2026-09-18T08:54:00+05:30", exhibit: "E02" },
  { from: "mule1", to: "mule2", amount: 260000, timestamp: "2026-09-18T09:02:00+05:30", exhibit: "E04" },
  { from: "mule1", to: "mule3", amount: 225000, timestamp: "2026-09-18T09:04:00+05:30", exhibit: "E04" },
  { from: "mule2", to: "vpa_fraud", amount: 250000, timestamp: "2026-09-18T09:11:00+05:30", exhibit: "E04" },
  { from: "mule3", to: "atm_cashout", amount: 195000, timestamp: "2026-09-18T09:18:00+05:30", exhibit: "E05" },
  { from: "vpa_fraud", to: "exchange", amount: 240000, timestamp: "2026-09-18T09:33:00+05:30", exhibit: "E05" }
];
```

Note the numbers don't need to reconcile to the last rupee (mule2 keeps a small buffer, some of mule3's balance is still sitting there) — that's realistic and gives Risk & Freeze something to say (see below).

### 5.3 Risk & Freeze queue

```ts
export const freezeQueue = [
  { rank: 1, entityId: "mule2", score: 96,
    reason: "Balance confirmed present: ₹10,000 residual + high inbound velocity in last 30 min",
    action: "Freeze immediately" },
  { rank: 2, entityId: "vpa_fraud", score: 88,
    reason: "₹2,50,000 credited 9:11am, not yet moved onward — funds recoverable now",
    action: "Freeze immediately" },
  { rank: 3, entityId: "mule3", score: 61,
    reason: "Partially drained — ₹30,000 balance remains, linked to 2 other active cases",
    action: "Freeze + flag for cross-case review" },
  { rank: 4, entityId: "exchange", score: 54,
    reason: "Funds likely converted to crypto — preservation notice, not a bank freeze",
    action: "Send preservation notice" },
  { rank: 5, entityId: "mule1", score: 22,
    reason: "Fully drained within 8 minutes of receipt, zero balance",
    action: "Deprioritize — intelligence value only" }
];
```

### 5.4 Timeline events

```ts
export const timelineEvents = [
  { time: "2026-09-18T08:47:00+05:30", type: "Malware", exhibit: "E06", text: "SMS-forwarder APK installed on victim device (sideloaded)" },
  { time: "2026-09-18T08:51:00+05:30", type: "Call",    exhibit: "E01", text: "Inbound call from spoofed bank support number, 4m12s" },
  { time: "2026-09-18T08:53:00+05:30", type: "SMS",      exhibit: "E06", text: "OTP SMS silently forwarded to attacker-controlled number" },
  { time: "2026-09-18T08:54:00+05:30", type: "Bank",     exhibit: "E02", text: "₹4,85,000 debited from victim account to Mule A/C ••3321" },
  { time: "2026-09-18T08:56:00+05:30", type: "IPDR",     exhibit: "E03", text: "Fraud session originated from IP geolocated outside victim's home circle" },
  { time: "2026-09-18T09:02:00+05:30", type: "Bank",     exhibit: "E04", text: "Layer 1 split: ₹2,60,000 to Mule A/C ••7790" },
  { time: "2026-09-18T09:04:00+05:30", type: "Bank",     exhibit: "E04", text: "Layer 1 split: ₹2,25,000 to Mule A/C ••1190" },
  { time: "2026-09-18T09:11:00+05:30", type: "Bank",     exhibit: "E04", text: "₹2,50,000 forwarded to VPA fraud••@examplebank" },
  { time: "2026-09-18T09:14:00+05:30", type: "Complaint", exhibit: null, text: "Victim files complaint — case LX-2026-0918-A opened" },
  { time: "2026-09-18T09:18:00+05:30", type: "Bank",     exhibit: "E05", text: "₹1,95,000 withdrawn across 3 ATM locations" },
  { time: "2026-09-18T09:33:00+05:30", type: "Exchange", exhibit: "E05", text: "₹2,40,000 converted at exchange wallet CoinRamp ••221" }
];
```

All names, banks, and identifiers above are fictional/sample — the report screen should show a small "Sample case for demonstration purposes" note in the footer.

---

## 6. Auto-load behavior for the demo

Don't make the presenter click through file uploads live. On the Overview and Evidence screens, keep the **"Load sample case"** button exactly as it exists now — clicking it should populate the entire store (all screens) in one action, so the person recording the demo clicks it once near the start and every subsequent screen is already populated. Don't gate any other screen behind additional loading steps.

---

## 7. Tech stack (unchanged from current repo)

React 18 + TypeScript + Vite · Zustand · Cytoscape.js (dagre/layered layout) · PapaParse + SheetJS (kept for visual authenticity of the upload zone; not required to actually parse for the demo) · `@fontsource/inter` + `@fontsource/ibm-plex-mono` · `lucide-react` for all interface icons · Web Crypto API for the hash values already baked into the mock data (real hashing not required — the values in §5.1 can be static strings).

Do not add a backend, database, or auth. Do not add real file-parsing robustness. Do not add tests unless trivial. The only goal is a convincing, good-looking, click-through demo.

---

## 8. 2-minute demo script (build the app so this recording is easy)

1. **0:00–0:12** — Landing page (`/`). Read the headline + stat strip. Click **Enter workspace**.
2. **0:12–0:20** — Overview, empty state. Click **Load sample case**.
3. **0:20–0:35** — Evidence screen. 6 exhibits populate with verified badges. Say: "six sources, every one hash-verified on load."
4. **0:35–0:50** — Links screen. Point at one row: "resolved by IMEI match, not guesswork."
5. **0:50–1:25** — Network screen (longest segment). Pan into the graph, click the victim node, trigger "highlight full path" through to the exchange wallet. This is the money shot.
6. **1:25–1:45** — Risk & Freeze. Point at rank #1: "this is the account to freeze right now, not the one that took the money first."
7. **1:45–1:55** — Timeline. Quick scroll, "everything correlated to the second."
8. **1:55–2:05** — Report. Click Export brief, show the A4 preview. End here.

Keep every screen's default state exactly matching what this script needs — no screen should require extra clicks beyond what's listed above.
