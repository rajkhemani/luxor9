# LUXOR9 Landing Page — Deep-Dive Implementation Brief (v3)

**Status:** Implementation in progress — first cut live at `/home`  
**Surface:** `apps/control-tower` marketing route at `app/(marketing)/home/page.tsx` with shared chrome; keep `/` as Control Tower overview  
**Doctrine line:** Control AI execution. Prove every outcome.  
**Primary GTM:** Dubai real-estate developers (expandable to other contexts later)  
**Brand source of truth:** `apps/control-tower/lib/luxor-brand.ts` + CSS tokens in `app/globals.css`  
**Forbidden UI copy:** any term in `FORBIDDEN_VISIBLE_TERMS` (vendor kit names stay internal)

---

## 0. How to use this document

For every section below, implementers get five locked specs:

1. **Copy** — primary + alternates (A/B), microcopy, CTA labels  
2. **Layout / space** — composition, hierarchy, what is *not* allowed  
3. **Motion / 3D / real-time** — arrival, depth, interaction, WebGL, polling  
4. **Responsive** — desktop / tablet / mobile behavior and fallbacks  
5. **Stack tie-in** — exact routes, APIs, components, data contracts

### Global non-negotiables

| Rule | Spec |
|------|------|
| Brand-first viewport | Wordmark is hero-scale. Headline must not overpower `LUXOR9`. Brand test: remove nav — page still unmistakably Luxor. |
| Hero budget | Brand + one headline + one supporting sentence + one CTA group + one dominant full-bleed visual. No stats, chips, logos, or schedule strips in first viewport. |
| No hero overlays | No floating badges, promo stickers, or info chips on media. |
| Cards | Default: none. Cards only when they contain a real interaction (approve, select context, expand evidence). |
| Motion principles | **Arrival** (staged reveal), **Depth** (parallax / 3D z), **Interaction** (pointer + scroll driven). Prefer intentional 2–3 motions per section over continuous noise. |
| Performance | Hero WebGL ≤ 45 draw calls target; pause when offscreen; `prefers-reduced-motion` → static poster + CSS fade only. |
| Real-time honesty | Live strips must show cold-start / offline / demo states. Never fake production evidence. Label demo traces. |
| Accessibility | Focus rings on CTAs, keyboard for interactive diagrams, ARIA live region for status strip, contrast ≥ WCAG AA on ivory/obsidian. |

### Visual system (locked)

```css
:root {
  /* Marketing aliases (--lx-*) mirror legacy Tower tokens (--obsidian, --signal-cyan, …). Both exist in globals.css. */
  --lx-obsidian: #0B0D10; /* = --obsidian */
  --lx-elevated: #14181F; /* = --obsidian-elevated */
  --lx-ivory: #F3EFE6; /* = --mineral-ivory */
  --lx-cyan: #2EC4B6; /* = --signal-cyan */
  --lx-copper: #C4A574;
  --lx-muted: #8B93A7; /* = --muted */
  --lx-danger: #D64545; /* = --danger */
  --lx-border: #2A3140; /* = --border */
  --font-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  --font-body: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  /* Engineering upgrade path: swap display → Fraunces or Instrument Serif; body → Geist or IBM Plex Sans via next/font — keep character, avoid Inter/Roboto. */
}
```

**Atmosphere:** full-bleed obsidian with mineral grain / soft cyan radial (existing globals pattern). No purple gradients, no glow stacks, no emoji.

**Voice:** Precise, accountable, calm authority. Prefer verbs of control and proof over hype. Short sentences. Evidence IDs use `LX9/EVT/######`.

### Page map (shipping order)

| # | Section ID | Purpose |
|---|------------|---------|
| 00 | `site-chrome` | Sticky nav + skip link |
| 01 | `hero-chamber` | Brand arrival + doctrine |
| 02 | `problem-fracture` | Why unbound AI fails |
| 03 | `accountable-route` | 6-state doctrine path |
| 04 | `value-lattice` | Three ownership pillars |
| 05 | `product-chamber` | Control Tower / Command / Stack / API |
| 06 | `verification-theater` | Timed proof sequence |
| 07 | `stack-constellation` | Capability map from `LUXOR_CAPABILITIES` |
| 08 | `signal-route-3d` | Context → agents → tools → evidence diagram |
| 09 | `live-overview-strip` | Real API pulse |
| 10 | `context-blueprint` | Interactive RE (or multi-context) blueprint |
| 11 | `proof-and-trust` | Social proof / evidence honesty |
| 12 | `faq-precision` | Objection handling |
| 13 | `final-cta` | Convert |
| 14 | `site-footer` | Legal + deep links |

---

## 00 — Site chrome (`SiteChrome`)

### 1) Copy

- Brand: `LUXOR` + cyan `9` (match existing `.brand span`)  
- Nav: `Doctrine` · `Product` · `Stack` · `Proof` · `Command`  
- Primary CTA (nav): `Open Command Bridge`  
- Secondary: `Enter Tower` → `/`  
- Skip link: `Skip to content`

### 2) Layout

- Sticky top bar, `backdrop-filter: blur(8px)`, border-bottom `--lx-border`, height ~64px.  
- Left: wordmark. Right: text links + one solid CTA.  
- No mega-menu. No logo carousel.

### 3) Motion / real-time

- On scroll past hero: bar gains 1px cyan hairline (150ms).  
- Optional: tiny status pip next to CTA reflecting `/health` (cyan = up, muted = cold, danger = down). Poll 30s.

### 4) Responsive

- `<768px`: hamburger or overflow menu; CTA remains visible as icon+label condensed to `Command`.

### 5) Stack tie-in

- Links: `#accountable-route`, `#product-chamber`, `#stack-constellation`, `#proof-and-trust`, `/command`, `/`.  
- Health: `GET {API}/health` via shared client helper (add if missing beside `client.overview`).

---

## 01 — Hero Chamber (`HeroChamber`)

### 1) Copy

**Primary (recommended)**  
- Brand: `LUXOR9`  
- Headline: `Control AI execution. Prove every outcome.`  
- Support: `Route intelligence through policy, execution, verification, and evidence — for real-estate teams who must own the record.`  
- Primary CTA: `Open Command Bridge` → `/command`  
- Secondary CTA: `See the accountable route` → `#accountable-route`

**Alt A (product-forward)**  
- Headline: `Governed agents. Verified launches.`  
- Support: `Brief → blueprint → CMO workforce → Trust gate → evidence in Control Tower.`

**Alt B (category)**  
- Headline: `The accountable execution layer for AI.`  
- Support: `Sit between intelligence and action. Keep contracts, data, and proof under your control.`

**Microcopy under CTAs:** `Demonstration traces are labeled. Production evidence requires your Trust policy.`

### 2) Layout / space

- Full viewport height (`100svh`).  
- Composition: left 40% type column (brand oversized, then headline, support, CTAs); right/behind: full-bleed 3D chamber as edge-to-edge plane (not inset card).  
- Vertical rhythm: brand → 24px → headline → 16px → support → 32px → CTAs.  
- **Forbidden in hero:** stats, partner logos, feature pills, floating badges, second headline.

### 3) Motion / 3D / real-time (detailed)

**3D scene (R3F + drei)**  
- Chamber: dark mineral architecture — vertical pylons, a central “route spine,” faint copper seams.  
- Six luminous nodes along the spine (doctrine states), dormant until scroll section 03 activates them via shared store.  
- Camera: slow dolly-in 0–1.2s on load; subtle parallax on pointer (±4° max).  
- Particles: sparse dust (≤120 points), cyan-tinted, no bloom spam.  
- Interaction: hovering a node pulses label in muted type *below* the fold only if user scrolls — do not overlay labels on hero media.

**Arrival timeline**  
1. `0ms` — black/obsidian hold  
2. `120ms` — brand fades/up 12px  
3. `320ms` — headline  
4. `480ms` — support  
5. `640ms` — CTAs  
6. `0–1200ms` — WebGL camera settle (parallel)

**Reduced motion:** static render of chamber (WebP/AVIF poster), brand+copy CSS opacity only.

### 4) Responsive

- Desktop: split type / scene.  
- Tablet: type over scene with gradient scrim from left (opacity ≤0.55), still full-bleed.  
- Mobile: stack — brand/headline/CTAs first; scene height `42vh` below CTAs OR absolute background at 40% opacity; disable pointer parallax; use CSS-only ambient shift.

### 5) Stack tie-in

- Component path: `apps/control-tower/components/marketing/HeroChamber.tsx`  
- CTA routes wired to real Next.js pages.  
- Optional: pre-warm `GET /api/v1/agui/status` so Command Bridge cold-start is shorter.

---

## 02 — Problem Fracture (`ProblemFracture`)

*Added in review — original prompt under-specified the “why now” beat.*

### 1) Copy

- Eyebrow: `Without an accountable route`  
- Headline: `Your organization does not need another AI tool.`  
- Support: `It needs a system that knows what can happen next, what must be authorized, and what has to be proven afterward.`  
- Fracture labels (7): `Data Unbound` · `AI Unbound` · `People Unbound` · `Tools Unbound` · `Policy Unbound` · `Workflows Unbound` · `Evidence Unbound`

**Alt headline:** `Capability without a shared path is noise.`

### 2) Layout

- One composition: large headline left or centered; seven unbound signals as typographic fragments drifting apart (not cards).  
- Hairline separators ok; no icon row of SaaS logos.

### 3) Motion

- On enter: fragments start clustered, then ease apart on scroll progress 0→1 (scrubbed).  
- On exit toward §03: fragments converge toward the route spine (handoff animation into Accountable Route).

### 4) Responsive

- Mobile: vertical list with staggered fade; skip horizontal drift if width < 480.

### 5) Stack tie-in

- Narrative only — primes Trust Engine + workflow mental model. Deep-link footnote: `See Trust gates in Tower → /approvals`.

---

## 03 — Accountable Route (`AccountableRoute`)

### 1) Copy

- Headline: `One intent. Six accountable states.`  
- Support: `Each output becomes the next input — until evidence is recorded.`

| State | Title | Line |
|-------|-------|------|
| 01 | FRAGMENTED | Signals exist without one accountable route. |
| 02 | ROUTED | One intent receives a controlled direction. |
| 03 | AUTHORIZED | Policy resolves before the route can cross. |
| 04 | EXECUTED | An approved tool receives a bounded run. |
| 05 | VERIFIED | Checks resolve the action and outcome. |
| 06 | RECORDED | Execution becomes an attributable evidence record. |

Toggle microcopy: `Recorded execution` / `Remove the accountable route` (demo of failure mode).

### 2) Layout

- Horizontal process on desktop (full width, ~120–160px stage height for nodes + labels beneath).  
- Active state expands a detail panel *below* the track (not a floating card overlay on 3D).  
- Evidence chip example (demo-labeled): `LX9/EVT/000184` · Action `workflow.execute` · Policy `approved` · Verifier `passed`.

### 3) Motion / 3D / real-time

- Scroll-scrubbed progress lights nodes 01→06; connecting line draws with cyan stroke.  
- Sync with Hero chamber spine via Zustand/context `routeProgress`.  
- Click/focus a state: panel content crossfades 200ms; URL hash `#state-authorized` for shareability.  
- Failure toggle: animate fracture reverse (nodes dim, line breaks) — teaches doctrine.

### 4) Responsive

- Mobile: vertical stepper; swipe or tap advances; keep keyboard arrows.

### 5) Stack tie-in

- Maps to real product loop: chat/objective → blueprint → Trust/approvals → workflow run → evidence endpoints  
  - `POST /api/v1/chat`  
  - `GET/POST /api/v1/approvals/*`  
  - `GET /api/v1/workflows/{id}/evidence`  
  - `GET /api/v1/workflows/{id}/claims`  
- CTA in panel for AUTHORIZED: `Open approval centre` → `/approvals`  
- CTA for RECORDED: `Inspect a workflow` → `/workflows`

---

## 04 — Value Lattice (`ValueLattice`)

### 1) Copy

- Headline: `Own the contracts. Own the evidence. Own the data.`  
- Three pillars (not feature cards — typographic columns):

| Pillar | Headline | Body |
|--------|----------|------|
| Contracts | Policy before action | Trust Engine authorizes consequential side effects. Model text never does. |
| Evidence | Proof is part of execution | Claims, sources, and traces bind to the workflow — not a slide afterward. |
| Data | Your operating context | Briefs, locations, and launch constraints stay in your tenancy boundary. |

**Alt support:** `LUXOR9 sits between intelligence and action.`

### 2) Layout

- Three equal columns, max-width ~1100px, generous whitespace.  
- Copper rule under each pillar title. No icons required; if used, single-line geometric marks only.

### 3) Motion

- Staggered rise on enter (80ms apart).  
- On hover: copper rule extends to full column width (200ms). No scale bounce.

### 4) Responsive

- Stack to single column; keep order Contracts → Evidence → Data.

### 5) Stack tie-in

- Contracts → `apps/api/app/services/trust.py`, `/approvals`  
- Evidence → evidence + claims routers  
- Data → tenancy + workflow `context` (e.g. Dubai residential defaults in chat client)

---

## 05 — Product Chamber (`ProductChamber`)

Showcase four surfaces: Control Tower, Command Bridge, Luxor Stack, API.

### 1) Copy

- Section headline: `Dense where operators need precision.`  
- Support: `The public page explains the system. The product gives a live view of agents, approvals, execution, cost, health, and evidence.`

| Surface | Title | Blurb | CTA |
|---------|-------|-------|-----|
| Control Tower | Control Tower | Overview of workflows, exceptions, and approvals — the operator’s truth panel. | `Enter Tower` → `/` |
| Command Bridge | Command Bridge | Live governed chat with the CMO workforce — stream, steer, approve. | `Open Command Bridge` → `/command` |
| Luxor Stack | Luxor Stack | Branded constellation of skins, Live UI, research, and Orchestrator Graph. | `Explore Stack` → `/stack` |
| API | Intelligence API | FastAPI contracts for overview, trust, evidence, AG-UI status, demo seed. | `Read API surface` → `#live-overview-strip` or docs |

**Tab/segment labels:** `Tower` · `Command` · `Stack` · `API`

### 2) Layout

- Left: segment control (text, not pills-with-glow).  
- Right: large product frame — **real UI screenshot/video OR live iframe/embed of route in demo mode**. Prefer live sparse chrome over fake marketing mock.  
- Do not wrap frames in generic SaaS “browser chrome” cards unless needed for contrast; prefer edge-to-edge elevated plane.

### 3) Motion / real-time

- Segment change: crossfade + slight horizontal slide (12px), 220ms.  
- Command Bridge panel: if authenticated/demo, mount lightweight status from AG-UI (`enabled`, agent names) — not full chat unless perf allows.  
- Stack panel: pull live `LUXOR_CAPABILITIES` counts by status (`Live` / `Wired` / `Shell` / `Planned`).  
- API panel: typewriter-free; show structured JSON snippet from last successful `overview` or `agui/status` fetch with timestamp.

### 4) Responsive

- Mobile: horizontal scroll segments or native select; media stacks below copy; reduce live embeds to static captures.

### 5) Stack tie-in

| Panel | Integration |
|-------|-------------|
| Tower | Reuse overview metrics shape from `client.overview()` |
| Command | `/command` page + `/api/v1/agui/status` |
| Stack | Import `LUXOR_CAPABILITIES` — single source of truth |
| API | `lib/api.ts` now exposes `overview()`, `health()`, `aguiStatus()` (+ workflows/approvals/etc.) |

---

## 06 — Verification Theater (`VerificationTheater`)

### 1) Copy

- Headline: `Intelligence is not enough. It must execute.`  
- Support: `Every action advances through context, authority, policy, and verification before the system writes evidence.`  
- Gate label: `Verification gate` · states `UNVERIFIED` → `PASSED`  
- Timeline events (demo-paced):

| t | Event | Line |
|---|-------|------|
| 00:00.000 | Intent received | Objective normalized into an executable instruction. |
| 00:00.086 | Context retrieved | Memory, records, operating conditions assembled. |
| 00:00.142 | Risk classified | Impact, sensitivity, approval requirements set. |
| 00:00.211 | Agent selected | Bounded capability assigned. |
| 00:00.294 | Tool authorized | Permissions checked before external touch. |
| 00:00.418 | Action executed | Approved operation against the workflow. |
| 00:00.604 | Output verified | Result, policy, provenance, integrity resolve. |
| 00:00.642 | Evidence recorded | Durable trace written for review and learning. |

Footer disclaimer: `Demonstration record, not live production evidence.`

### 2) Layout

- Left: vertical timeline. Right: gate panel with seven check dimensions (Factual integrity, Evidence, Permission, Policy, Execution, Risk, Outcome).  
- Monospace for timestamps; display serif for headline only.

### 3) Motion / real-time

- Autoplay once on first intersection (total ~4.5s); pause offscreen.  
- Replay control (text button `Replay proof`).  
- Checks flip from muted → cyan on verify step.  
- Optional advanced mode: if a real workflow id is in query `?wf=`, fetch evidence/claims and bind labels — else stay in demo script.

### 4) Responsive

- Stack timeline above gate; reduce autoplay speed 20% on mobile CPU; honor reduced motion (show final completed state immediately).

### 5) Stack tie-in

- Public Theater stays on the scripted demo timeline (labeled non-production).  
- Do **not** call `POST /api/v1/demo/run` from the public landing — that endpoint is auth-gated and mutates workflows. Operators run demos from Tower after sign-in.  
- Live bind (authenticated only): evidence + claims APIs  
- Trust: narrative aligns with `services/trust.py` recheck before side effects

---

## 07 — Stack Constellation (`StackConstellation`)

### 1) Copy

- Headline: `The Luxor Stack, named for the work — not the vendors.`  
- Support: `Live, Wired, Shell, Planned — one constellation for the CMO workforce.`  
- Filter chips (interaction exception — allowed): `All` · `Live` · `Wired` · `Shell` · `Planned`  
- Per node: use `label` + `blurb` from `LUXOR_CAPABILITIES` exactly; `statusLabel(status)` for badge text.

### 2) Layout

- Desktop: force-directed or radial constellation (canvas/WebGL) with list fallback beside.  
- Selecting a node opens a detail strip (interaction container) with CTA to `href`.  
- **No vendor names** in tooltips.

### 3) Motion / 3D

- Nodes as small metallic spheres / disks; Live = cyan, Wired = ivory, Shell = copper, Planned = muted.  
- Idle: slow orbital drift. Hover: bring to front, others dim to 40%.  
- Click: camera eases to node; detail strip slides from bottom/right.

### 4) Responsive

- `<1024px`: drop WebGL; render accessible list/grid grouped by status (still not generic marketing cards — use bordered rows).

### 5) Stack tie-in

```ts
import { LUXOR_CAPABILITIES, statusLabel } from "@/lib/luxor-brand";
```
- Live status overlay from `GET /api/v1/agui/status` for orchestrator connectivity callout.  
- Links land on `/stack#<id>`, `/command`, `/agents`, `/atelier`, `/workflows`, `/chat` as defined.

---

## 08 — Signal Route 3D (`SignalRoute3D`)

*Added in review — keeps advanced tech present mid-page, not only in hero.*

### 1) Copy

- Headline: `Control across the systems you already run.`  
- Support: `Context, agents, tools, policy, verification, and evidence — one governable path.`  
- Layer labels: `Memory` · `Reasoning` · `Agents` · `Tools` · `Policy` · `Verification`  
- Operating verbs (KNOW → THINK → ACT → PROVE → LEARN) as secondary captions.

### 2) Layout

- Full-bleed diagram section (~80vh desktop). Labels sit in margins, not on top of geometry as stickers.  
- Caption: `LUXOR9 Execution — Governed / observable / verifiable`

### 3) Motion / 3D

- Toroidal / layered ring diagram in R3F; scroll progress drives token travel along path.  
- Pointer rotates view ±15°.  
- Hotspots keyboard-focusable; Enter announces layer description via ARIA.

### 4) Responsive

- Mobile: replace with 2D SVG path animation (same labels); keep scroll scrub.

### 5) Stack tie-in

- Conceptual map of Orchestrator Graph (`intelligence/graph.py` / AG-UI CMO) + Trust + Tower.  
- CTA: `View agents` → `/agents`

---

## 09 — Live Overview Strip (`LiveOverviewStrip`)

### 1) Copy

- Headline: `Live operators see numbers, not slides.`  
- Labels: `Active workflows` · `Pending approvals` · `Completed` · `Exceptions`  
- States:  
  - Loading: `Contacting Intelligence API…`  
  - Cold-start: `API warming — Tower remains browsable.`  
  - Gated (401/403 / demo-auth disabled): `Live metrics require a Tower session — open Control Tower after sign-in.`  
  - Error: `API unreachable. Start the API or check NEXT_PUBLIC_API_BASE_URL.`  
  - Fresh: `Updated {relative time}`  
- Production note: overview is tenant-scoped. Without a session, show the gated state — never invent metrics.

### 2) Layout

- Full-width elevated band; four metrics in a row; recent workflow titles as a quiet list (not a card grid).  
- Primary link: `Open full overview` → `/`

### 3) Motion / real-time

- Poll `client.overview()` every 15s while in viewport when live; slower poll when gated.  
- Classify 401/403 as gated (not “down”). Exponential backoff on transport failures only.  
- Number transitions: count-up on first load only; subsequent updates swap with 120ms fade.  
- ARIA `aria-live="polite"` on status text.

### 4) Responsive

- 2×2 metric grid on mobile; list collapses to top 3 workflows.

### 5) Stack tie-in

- Exact contract from `lib/api.ts` `overview()`  
- Mirror empty-state copy already on `app/page.tsx` for consistency  
- Secondary: ping `GET /api/v1/agui/status` for `Orchestrator: connected|disabled`

---

## 10 — Context Blueprint (`ContextBlueprint`)

### 1) Copy

- Headline: `Where is your launch losing time?`  
- Support: `Choose an operating context and bottleneck. LUXOR9 frames the first execution blueprint for review.`  
- Default context: `Real Estate` (Dubai residential). Optional others for future: Financial Services, Hospitality, etc. — ship RE-first.  
- Bottlenecks (RE): `Launch brief chaos` · `Approval latency` · `Evidence gaps` · `Channel publish risk`  
- Output title example: `Policy-aware launch orchestration`  
- Steps: `01 Capture intent` · `02 Classify risk` · `03 Route authority` · `04 Record evidence`  
- CTA: `Run this brief in Command Bridge` → `/command` (optionally with query `?preset=dubai-launch`)

### 2) Layout

- Interactive selector (allowed card-like container — this *is* the interaction).  
- Left: context + bottleneck controls. Right: blueprint preview updating in place.

### 3) Motion / real-time

- Selection morphs blueprint steps (layout animation).  
- Public landing uses **local blueprint preview only**. Do not mutate via chat/demo from anonymous visitors.

### 4) Responsive

- Single column; blueprint preview below controls; sticky CTA.

### 5) Stack tie-in

- Aligns with chat context defaults `{ location: "Dubai", product_type: "residential" }`  
- CTA deep-links to `/command` for authenticated operators; mutating demo seed stays inside Tower.  
- Follow-through: `/workflows`, `/approvals`

---

## 11 — Proof & Trust (`ProofAndTrust`)

### 1) Copy

- Headline: `AI should not only act. It should prove what it did.`  
- Five bound questions:

1. Who initiated this action? → `Bound`  
2. Why was it executed? → `Bound`  
3. Which data and model were used? → `Bound`  
4. What policy authorized it? → `Bound`  
5. Where is the evidence? → `Recorded`

- Honesty line: `The record below is interface architecture for a representative workflow. Live deployments bind these fields to real events.`  
- Avoid fake customer logos. Prefer: operational contexts list (Real Estate featured) + “built for operators under audit pressure.”

**If testimonials exist later:** quote format with role + context; never invent logos.

### 2) Layout

- Numbered questions as a precise list with status words right-aligned.  
- Secondary: “Before / After” — fragmented systems vs one controlled path (typographic, not comic illustration).

### 3) Motion

- On enter, statuses tick Bound/Recorded sequentially (80ms).  
- Before/After: cross-dissolve scrubbed by scroll.

### 4) Responsive

- Status wraps under question on narrow screens.

### 5) Stack tie-in

- Deep links to `/workflows/[id]` evidence when demo id known  
- Audit router narrative: `/api/v1` audit + trust services  
- Metering mention optional: `/metering` for cost observability

---

## 12 — FAQ Precision (`FaqPrecision`)

*Added in review — award-winning landings resolve objections before final CTA.*

### 1) Copy (Q/A)

1. **Is this another chatbot?**  
   No. Chat is an entry surface. Trust Engine, approvals, evidence, and Control Tower complete the loop.

2. **Do model outputs publish on their own?**  
   No. Consequential side effects require Trust authorization and human approval binding.

3. **What is live vs planned?**  
   Statuses come from the Luxor Stack map — Live, Wired, Shell, Planned — not marketing fiction.

4. **Can we run a demo without production keys?**  
   Yes. Sandbox AI and demo seed paths support zero-cost demonstration. Traces are labeled as demonstration.

5. **Where does this plug into our stack?**  
   Control Tower (Next.js) + Intelligence API (FastAPI) + AG-UI Command Bridge. See `/stack`.

### 2) Layout

- Accordion (interaction container). One open at a time. No illustrative icons.

### 3) Motion

- Height animate 200ms; focus moves with keyboard.

### 4) Responsive

- Full width; larger tap targets (44px).

### 5) Stack tie-in

- Answers must stay consistent with `AGENTS.md`, Trust architecture, and `luxor-brand.ts` statuses.

---

## 13 — Final CTA (`FinalCta`)

### 1) Copy

- Headline: `Put the next launch on an accountable route.`  
- Support: `Open Command Bridge with a Dubai brief — or enter Control Tower to inspect live workflows.`  
- Primary: `Open Command Bridge` → `/command`  
- Secondary: `Enter Control Tower` → `/`  
- Tertiary text link: `Explore Luxor Stack` → `/stack`

**Alt headline:** `From brief to verified evidence — without surrendering control.`

### 2) Layout

- Sparse centered band; brand wordmark small above headline; two CTAs.  
- Atmospheric background continuation — not a new colorful block.

### 3) Motion

- Soft opacity/translate on enter; CTAs get focus-visible cyan ring.

### 4) Responsive

- Stack buttons full-width on mobile.

### 5) Stack tie-in

- Same destinations as hero; add `utm` only if analytics exists — do not invent tracking.

---

## 14 — Site footer (`SiteFooter`)

### 1) Copy

- Brand + doctrine one-liner  
- Columns: Product (`/`, `/command`, `/stack`, `/agents`, `/approvals`, `/workflows`) · Doctrine anchors · Legal placeholders (`Privacy`, `Terms` — stub routes ok)  
- Copyright: `© {year} LUXOR9`

### 2) Layout

- Multi-column desktop; stacked mobile. Hairline top border.

### 3) Motion

- None required.

### 4) Responsive

- Stack columns; reduce link density with grouped headings.

### 5) Stack tie-in

- All links must 200 on current app router.

---

## Cross-cutting engineering specs

### File / route plan

```
apps/control-tower/
  app/(marketing)/layout.tsx      # SiteChrome + footer
  app/(marketing)/home/page.tsx   # /home — composes sections (NOT app/(marketing)/page.tsx)
  app/(tower)/layout.tsx          # operator chrome
  app/(tower)/page.tsx            # / — Control Tower overview
  components/marketing/
    HeroChamber.tsx
    ProblemFracture.tsx
    AccountableRoute.tsx
    ValueLattice.tsx
    ProductChamber.tsx
    VerificationTheater.tsx
    StackConstellation.tsx
    SignalRouteDiagram.tsx
    LiveOverviewStrip.tsx
    ContextBlueprint.tsx
    ProofAndTrust.tsx
    FaqPrecision.tsx
    FinalCta.tsx
    SiteFooter.tsx
    marketing-store.tsx
  lib/luxor-brand.ts              # DO NOT duplicate capability copy
  lib/api.ts                      # health + aguiStatus + overview
  lib/marketing-copy.ts           # scanned by forbidden-term tests
```

**Routing note:** Marketing must live at `/home` via `app/(marketing)/home/page.tsx`. Do **not** put `page.tsx` directly under `(marketing)/` — that would collide with Tower overview at `/`. Promote marketing to `/` only after overview moves to `/tower`.

### Dependencies

- `@react-three/fiber`, `@react-three/drei`, `three`  
- `framer-motion` (or Motion)  
- Optional: `@react-three/rapier` — **do not add** unless physics is justified; prefer kinematic animation.

### Real-time matrix

| Signal | Endpoint | Cadence | UI consumer |
|--------|----------|---------|-------------|
| Health | `GET /health` | 30s | Nav pip, Live strip |
| Overview | `GET /api/v1/overview` | 15s when authorized | LiveOverviewStrip, Product Tower panel (gated publicly) |
| AG-UI | `GET /api/v1/agui/status` | on mount + 60s | Stack, Command panel |
| Demo seed | `POST /api/v1/demo/run` | Tower operators only | Not called from public `/home` |
| Evidence | `GET /api/v1/workflows/:id/evidence` | authenticated workflow | Theater advanced bind, Proof |

### SEO / share

- Title: `LUXOR9 | Control AI execution. Prove every outcome.`  
- Description: doctrine + RE GTM sentence  
- OG image: chamber still with wordmark (no vendor marks)  
- JSON-LD: SoftwareApplication (minimal)

### Accessibility checklist

- [ ] Skip link  
- [ ] Reduced motion posters for both WebGL sections  
- [ ] Constellation list fallback  
- [ ] FAQ keyboard accordion  
- [ ] Live region for API status  
- [ ] Focus order matches visual order  
- [ ] `assertNoForbiddenVisibleCopy` in unit test over all marketing strings

### Acceptance criteria (ship bar)

1. First viewport passes brand test and hero budget.  
2. At least three intentional motion systems (arrival, scroll-scrub doctrine, live data).  
3. Two WebGL moments (Hero + Signal Route or Constellation) with mobile fallbacks.  
4. Live strip handles up / cold / down without lying.  
5. All CTAs hit real Control Tower routes.  
6. Capability copy imported from `luxor-brand.ts` — no drift.  
7. Lighthouse perf: no unbounded particle fill; WebGL paused offscreen.  
8. Forbidden vendor terms test passes.  
9. Doctrine states FRAGMENTED→RECORDED are complete and interactive.  
10. Demo evidence clearly labeled non-production.

---

## Self-review changelog (v2 → v3 deep dive)

1. **Expanded every section** into the required five-part spec (copy, layout, motion/3D/realtime, responsive, stack tie-in).  
2. **Added missing award-winning sections:** Problem Fracture, Signal Route 3D (mid-page advanced tech), FAQ Precision, explicit Site Chrome/Footer, SEO/a11y/perf cross-cuts.  
3. **Tightened vague hero language** into a locked timeline, WebGL budget, and forbidden-element list.  
4. **Bound doctrine to real APIs** (chat, approvals, evidence, claims, demo, agui/status, overview, health).  
5. **Forced brand map reuse** (`LUXOR_CAPABILITIES`) to prevent marketing/product copy drift.  
6. **Specified honest live states** (cold-start, unreachable, demonstration labels) so “real-time” cannot become fake theater.  
7. **Resolved routing merge risk** with a recommended `/home` → later `/` promotion path so Tower deep links stay safe.  
8. **Added objection FAQ** so Final CTA is not the first place trust questions appear.  
9. **Clarified card policy exceptions** — only Context Blueprint, FAQ accordion, and capability detail strips qualify as interaction containers.  
10. **Locked acceptance checklist** to make “world-class” testable rather than aspirational.

---

## Implementation priority (for the engineer)

1. Chrome + Hero + Accountable Route + Final CTA (doctrine spine)  
2. Live Overview Strip + Product Chamber (merge with stack)  
3. Verification Theater + Proof  
4. Stack Constellation + Signal Route 3D  
5. Problem Fracture + Context Blueprint + FAQ  
6. Polish: reduced motion, OG, forbidden-copy tests
