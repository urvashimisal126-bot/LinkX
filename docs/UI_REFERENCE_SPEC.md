# LinkX UI Reference Specification (Dribbble CyberHacx Theme)

Measured and sampled directly from reference frames in `reference/frames/` extracted from reference videos:
- Video 1: `https://cdn.dribbble.com/userupload/43714181/file/original-2f60c90bf580636d50c13b1fd53d0bbb.mp4`
- Video 2: `https://cdn.dribbble.com/userupload/43714182/file/original-e29bd07ac546df54403fd688746eab77.mp4`

---

## 1. Color Palette & Roles

| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `--bg-base` | `#021D24` | Primary deep cyber night background |
| `--bg-surface` | `#05262F` | Base card and panel surface layer |
| `--bg-elevated` | `#08323D` | Elevated surfaces, tables, active card background |
| `--bg-highlight` | `#0D3F4D` | Hover states, selected rows, active pills |
| `--border-subtle` | `#0E3642` | Inner dividers and subtle card borders |
| `--border-strong` | `#174E5D` | Prominent borders, container outlines, card frames |
| `--border-active` | `#6AE6EF` | Focus rings, active tab outlines, interactive highlights |
| `--accent-lime` | `#CCF300` | High-energy neon accent: active indicators, primary CTA buttons, key metrics |
| `--accent-cyan` | `#6AE6EF` | Secondary vibrant cyan: link nodes, network edges, info tags |
| `--accent-mint` | `#98FEA4` | Soft pastel mint: verified integrity badges, safe status, positive signals |
| `--text-primary` | `#FFFFFF` | Primary headers, key values, active navigation titles |
| `--text-secondary`| `#A2C2C8` | Subtitles, table cells, secondary descriptions |
| `--text-muted` | `#60868F` | Metadata, timestamps, captions, disabled states |
| `--danger-red` | `#FF453A` | Critical risk, immediate freeze alerts, hash tampering |
| `--warning-orange`| `#FF9F0A` | High risk, candidate links, review required |
| `--warning-yellow`| `#FFD60A` | Medium risk, moderate links |

---

## 2. Backgrounds & Textures

- **Layer 1 (Canvas Base)**: Deep dark cyan-navy (`#021D24`).
- **Layer 2 (Cyber Matrix Grid Texture)**: Subtle SVG tech grid pattern (`rgba(106, 230, 239, 0.03)` with 32px × 32px dot pitch and faint code/bracket motifs).
- **Layer 3 (Glow & Radial Accents)**: Soft radial gradients (`radial-gradient(circle at 50% 0%, rgba(106, 230, 239, 0.08) 0%, transparent 70%)`) above primary panels for cyber depth without performance-degrading blur filters.

---

## 3. Typography

- **Primary Font**: `Inter`, system-ui, sans-serif (via local `@fontsource/inter`).
- **Monospace Font**: `IBM Plex Mono`, monospace (via local `@fontsource/ibm-plex-mono` for hashes, UTRs, IPs, IMEIs, and numeric data).
- **Hierarchy**:
  - Page Title: `20px` / `600` weight / letter-spacing `-0.02em`
  - Section Header: `14px` / `600` weight / letter-spacing `-0.01em`
  - Body Text: `13px` / `400` weight / line-height `1.5`
  - Small / Metadata: `11px` / `500` weight
  - Monospace Data: `11px` / `400` weight

---

## 4. Iconography & Badges

- **Icon Style**: Sharp, geometric line icons (16px, 1.5px stroke width, matching Lucide / Cyber theme).
- **Circle Icon Containers**: Inspired by Video 2 circular feature badges (`#CCF300` lime circle container with dark icon for hero badges, or `#08323D` dark circle with `#6AE6EF` cyan icon for list items).
- **Tag / Badge Styling**:
  - Verified: Background `rgba(152, 254, 164, 0.12)`, text `#98FEA4`, border `1px solid rgba(152, 254, 164, 0.3)`.
  - Critical: Background `rgba(255, 69, 58, 0.14)`, text `#FF453A`, border `1px solid rgba(255, 69, 58, 0.35)`.
  - High: Background `rgba(255, 159, 10, 0.14)`, text `#FF9F0A`, border `1px solid rgba(255, 159, 10, 0.35)`.
  - Primary Active Tag: Background `rgba(204, 243, 0, 0.12)`, text `#CCF300`, border `1px solid rgba(204, 243, 0, 0.35)`.

---

## 5. Navigation, Tabs & Cards

- **Left Rail Navigation**:
  - Background: `#021419`
  - Active Item: Glowing lime accent bar `#CCF300` on left edge, surface `#08323D`, text `#FFFFFF`.
  - Hover Item: Surface `#05262F`, text `#6AE6EF`.
- **Panels & Cards**:
  - Border radius: `6px`
  - Border: `1px solid #144A59`
  - Background: `#05262F`
  - Header: `#08323D` with subtle bottom border `#0E3642`
- **Buttons**:
  - Primary: Background `#CCF300`, text `#021D24` (Inter 600, high energy, bold contrast), hover `#DCF833`.
  - Secondary: Background `#08323D`, text `#6AE6EF`, border `1px solid #174E5D`, hover `#0D3F4D`.
  - Danger / Alert: Background `rgba(255, 69, 58, 0.15)`, text `#FF453A`, border `1px solid rgba(255, 69, 58, 0.4)`.

---

## 6. Motion & Animation Timing

Measured from 12 fps dense video frame sampling:
- **Tab & Route Transitions**: `180ms` ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`), opacity `0 -> 1` and translateY `4px -> 0`.
- **Button Hover / Press**: `120ms` ease-out (`transform: scale(0.98)` on active press).
- **Drawer Slide-in**: `220ms` cubic-bezier `(0.16, 1, 0.3, 1)` transform `translateX(100% -> 0)`.
- **Progress Line & Number Counters**: `250ms` ease-out.
- **LinkX Interlocking Splash Animation**: `1.6s` cubic-bezier `(0.16, 1, 0.3, 1)` with 2.5px latch overshoot.
- **Reduced Motion**: All transforms and transitions disabled when `prefers-reduced-motion: reduce` is active.

---

## 7. Network Graph Palette Mapping

- **Victim Node**: Neutral slate `#A2C2C8` with double border `#FFFFFF`.
- **Mule Layer 1 / 2 (M1–M4)**: Cyber orange `#FF9F0A` / amber `#FFD60A` with `#08323D` fill.
- **Cash-Out / Crypto Node (E1)**: Neon danger `#FF453A` with `#280806` fill.
- **Operator / Phone Nodes (N1–N3)**: Cyber cyan `#6AE6EF` with `#021D24` fill.
- **Money Flow Edges**: Solid cyan `#6AE6EF` with animated pulse indicators.
- **Call / Session Edges**: Dashed mint `#98FEA4`.
