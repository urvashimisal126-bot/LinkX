# DECISIONS.md — LinkX Architecture & Implementation Decisions

- D-01: Used React + TypeScript + Vite + Zustand for zero-overhead, strictly offline, reactive client-side architecture.
- D-02: Bundled offline font subsets (`@fontsource/inter`, `@fontsource/ibm-plex-mono`) to guarantee 100% air-gapped forensic operation with 0 external network requests.
- D-03: Designed custom SVG-based interactive force and layered flow graph visualizations with drag, zoom, pan, tier coloring, and link strength stroke styles.
- D-04: Implemented pure deterministic rules engine in `src/domain/rules.ts` covering link strength calculation, entity merge eligibility, composite risk scoring (0-100), and freeze priority ranking (0-100).
- D-05: Implemented MockApi with in-memory state and Web Crypto SHA-256 for evidence integrity hashing, tampering simulation, and hash-chained audit logging.
- D-06: Configured HttpApi interface mirror to enable instant plug-and-play backend swapping when deploying into production environments.
- D-07: Added 35 comprehensive Vitest unit tests in `src/tests/rules.test.ts` covering all edge cases for link strength, merging, risk tiers, and freeze ordering.
- D-08: Created data integrity validator script `scripts/validate-data.mjs` verifying total victim outflow balance (₹4,85,000), chronological ordering, and link decisions.
- D-09: Implemented sample evidence generator and SHA-256 manifest builder `scripts/make-manifest.mjs` for forensic reproducibility.
- D-10: Implemented automated static asset offline scanner `scripts/check-offline.mjs` to enforce strict zero external resource policy.
- D-11: Adhered to high-density dark-mode cyber forensics design system with HSL tokens, accessible contrast, monospaced data alignment, and micro-interactions.
- D-12: Integrated new LinkX brand mark from `public/brand/linkx-logo-source.png` (teal LX monogram with chain link X). Performed alpha unmixing to create clean transparent bounding-box-trimmed assets across 3 variants: full-color original teal (`#196367`), white (`#FFFFFF`) for dark navigation, and ink (`#1C232B`) for monochrome/print.
- D-13: Generated crisp 2x, 4x, and high-resolution SVG wrapped vector assets in `public/brand/` as well as multi-resolution square favicons (16px, 32px, 180px, SVG, ICO).
- D-14: Sampled the logo teal (`#196367`) and updated the global CSS design system tokens (`--accent`, `--accent-dark`, `--accent-tint`, `--edge-call`) to match the brand mark identically while maintaining high contrast (7.1:1 on white, exceeding WCAG AAA).
- D-15: Embedded the logo mark consistently across all required UI surfaces: Top bar wordmark (white variant), Empty state on first load (48px full-color), Investigative brief preview & print header (full-color/ink), System drawer header (full-color), and page `<title>` set to "LinkX".
- D-16: Added `generator: "LinkX"` metadata attribute to `BriefData` type and JSON brief export payload.
- D-17: Segmented the teal LX monogram into three discrete layer elements in `src/assets/brand/linkx-mark-parts.svg` and `<LinkXMarkAnimated />` (L body, chain-link loop, and X diagonal strokes) with bitwise zero-error pixel alignment when assembled.
- D-18: Implemented 1.6s pure CSS transform/opacity keyframe animation demonstrating the evidence correlation concept: parts slide along the linking axis, interlock with a subtle 2.5px latch overshoot click, followed by wordmark fade-in.
- D-19: Connected startup splash progress to actual engine initialization (`document.fonts.ready`, static sample manifest check, and store initialization) with a 1.6s minimum display, 3.0s safety ceiling, and 150ms exit fade.
- D-20: Implemented `sessionStorage` single-session display rule, hidden `Shift+L` instant replay shortcut, `prefers-reduced-motion` 600ms static bypass, automatic focus handover to `#main-content`, and aria-live status announcements.
- D-22: UI inspired by Dribbble references:
  - Reference 1: https://cdn.dribbble.com/userupload/43714181/file/original-2f60c90bf580636d50c13b1fd53d0bbb.mp4
  - Reference 2: https://cdn.dribbble.com/userupload/43714182/file/original-e29bd07ac546df54403fd688746eab77.mp4
- D-23: Implemented measured CyberHacx color tokens in `src/index.css` (`#021D24` deep canvas, `#05262F` panel surface, `#08323D` elevated tables, `#CCF300` electric lime accent, `#6AE6EF` vibrant cyan, `#98FEA4` verified mint) and cyber grid matrix background texture.
- D-24: Created central motion file `src/lib/motion.ts` with standardized cubic-bezier `(0.16, 1, 0.3, 1)` easing curves, and created unified `src/components/ui/Icon.tsx` wrapper component.


