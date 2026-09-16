# Civora

**Report safely. Verify carefully. Respond together.**

Civora is a trusted civic incident platform that helps people safely report community problems, preserve and organize evidence, coordinate appropriate response, and transparently track what happens next.

> **This build contains only fictional demo data.** All cases, organizations, people and documents are invented for evaluation purposes.

---

## The core loop

```
REPORT → PROTECT → VERIFY → COORDINATE → RESPOND → ACCOUNT → INFORM
```

The central object is a **Civic Case**. Civora keeps four states strictly separate — `REPORTED ≠ VERIFIED ≠ RESPONDED ≠ RESOLVED` — because collapsing them is how communities lose trust in information.

| Axis | States |
| --- | --- |
| Verification | Unverified · Partially verified · Documented · Conflicting · Resolved |
| Response | Not assigned · Received · Acknowledged · In progress · Action recorded · Closed |

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

No database or environment setup is required for the demo: the app boots with a seeded fictional dataset persisted to `data/civora-db.json` (auto-created on first run). Production-style configuration is optional:

```bash
cp .env.example .env.local   # then edit as needed
```

```bash
npm run build && npm start   # production build
```

## Demo walkthrough (2 minutes)

1. **Landing** (`/`) — what Civora is and how trust works.
2. **Report** (`/report`) — 7-step flow: category → description → location (optional) → time → evidence (optional, compressed client-side) → privacy → review. Try submitting *Safety* → *"Exposed wiring sparking near the Halls B entrance walkway"* with location *"North walkway, student residences"* — it will be matched to case **CS-1042** as an independent corroborating report and flip its verification to *Partially verified*.
3. **Case page** (`/cases/CS-1042` after submitting, or `/community/CS-1042` publicly) — the signature screen: What we know / What remains uncertain, evidence chain with provenance and checksums, timeline, response section, next actions.
4. **Responder workspace** (`/responder`) — access code `civora-demo`. Acknowledge, assign, record actions (each requires a short record and becomes a permanent timeline event), publish public updates, change verification, close cases.
5. **Public explorer** (`/community`) — search and filter public cases; reporter identity is never exposed.
6. **Offline** — in browser dev tools switch to Offline, then submit a report: it queues on-device (IndexedDB) and auto-submits when you go back online.
7. **Demo tools** (`/more`) — reset the fictional dataset to its original state; clear device tracking.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/home` | Citizen dashboard (your cases, community snapshot) |
| `/report` | 7-step report wizard with offline drafts |
| `/cases`, `/cases/[id]` | Your tracked cases / case tracking view |
| `/community`, `/community/[id]` | Public case explorer / public case page |
| `/privacy`, `/resources`, `/more` | Privacy model, get-help guidance, settings + demo tools |
| `/responder`, `/responder/cases/[id]` | Responder workspace (code-gated) |

## Architecture

```
src/
  app/
    (citizen)/        citizen shell: bottom nav (mobile) + sidebar (desktop)
    responder/        responder shell (code-gated, server-verified session)
    api/              reports, evidence, evidence-file, track, responder,
                      ai/case-summary, demo/reset
  components/
    ui/               Button, Badges, Modal, EmptyState, Icon (registry)…
    case/             CaseCard, CaseProgress, CaseTimeline, EvidenceChain,
                      TrustPanel, ResponseSection, AiSummaryCard, CasePageBody
    report/           ReportWizard (7 steps, draft autosave, offline queue)
    responder/        ResponderCasePanel (audit-first action dialogs)
    shell/            Sidebar, MobileBottomNav, TopBar
    system/           OfflineBanner, OutboxSync (auto-submit), SW register
  lib/
    types.ts          domain model (mirrors prisma/schema.prisma)
    states.ts         verification/response metadata (icon+label, never color alone)
    db/               store.ts (JSON persistence) + seed-data.ts (fictional dataset)
    validation/       Zod schemas for every input
    auth/             HMAC responder session, hashed tracking tokens
    ai/               SummaryProvider abstraction (mock ⇄ OpenAI, env-swapped)
    offline/db.ts     IndexedDB: drafts, outbox, tracking tokens
    client/upload.ts  client-side image compression + file validation
prisma/schema.prisma  reference relational schema for PostgreSQL migration
```

**Persistence.** The demo uses a JSON file store shaped exactly like the Prisma schema (`prisma/schema.prisma`). To move to PostgreSQL: install Prisma, point `DATABASE_URL` at your database, migrate, and swap the read/write helpers in `src/lib/db/store.ts` — domain logic, API routes and UI remain unchanged.

**Roles & trust.** Roles are never trusted from the client. The responder role is an httpOnly cookie containing an HMAC verified server-side. Citizen case access uses a random tracking token; only its SHA-256 hash is stored. Private reporter data (`reporterContact`, token hashes) is stripped from every non-responder view server-side.

**AI.** AI summarizes and organizes — never adjudicates. Summaries are always labelled “AI-assisted summary”, stay subordinate to the evidence chain, link back to the sources they used, and the provider is swappable via `AI_PROVIDER=mock|openai` without code changes. Civora never displays a “truth score”.

**Offline & low bandwidth.** Drafts autosave to IndexedDB; submissions that can’t reach the server are queued in an outbox and auto-submitted on reconnect. Photos are compressed client-side before upload. No map tiles anywhere in the reporting flow.

## Security posture (demo-appropriate)

- Zod validation on every API input; upload type/size limits (8 MB)
- Per-IP rate limiting on report creation
- Duplicate/corroboration matching server-side (human/rule-confirmed links)
- Evidence files served through an authorization-checking route
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` headers
- Secrets via environment variables only

## Configuration

See `.env.example` for all options: session secret, responder access code, emergency/referral contacts (never hard-coded fake numbers), upload limits, AI provider.

## Deployment

Any Node host or container platform:

```bash
npm ci
npm run build
npm start        # PORT env respected; needs a writable volume for ./data
```

For a stateless deployment, mount `./data` (JSON store + uploads) or migrate to PostgreSQL + object storage first. The service worker enables the offline shell in production builds.

---

Civora — know what's happening. Know what's verified. Know what happens next.
