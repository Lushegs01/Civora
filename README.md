# Civora

**Report safely. Verify carefully. Respond together.**

Civora is a civic incident platform: people report community problems safely,
evidence is preserved and organised, a responsible organization coordinates a
response, and everyone can see what actually happened.

> **All data in this repository is fictional.** Cases, organizations, people,
> notices and documents are invented for evaluation. Fictional records are
> labelled as such throughout the interface.

---

## The distinction the product exists to protect

```
REPORTED  ≠  VERIFIED  ≠  RESPONDED  ≠  RESOLVED
```

Verification and response are independent axes and are never collapsed:

| Axis | States |
| --- | --- |
| Verification | Unverified · Partially verified · Documented · Conflicting · Resolved |
| Response | Not assigned · Received · Acknowledged · In progress · Action recorded · Closed |

Closing a case records that a **response** happened. It does not mark the
underlying claim verified: a case closed while still unverified stays
unverified (`verificationAfterClosure` in `src/lib/case-state.ts`, and the test
that pins it in `tests/unit/case-state.test.ts`).

The trust workflow:

```
REPORT → PROTECT → MATCH → VERIFY → COORDINATE → RESPOND → ACCOUNT → INFORM
```

Matching and verification are deliberately separate steps. A heuristic can
only ever *propose* that two reports describe the same incident; a person
confirms it, with a recorded reason, and even a confirmed link does not by
itself change a verification state.

## Quick start

```bash
npm install
cp .env.example .env.local          # set DATABASE_URL and SESSION_SECRET
npm run setup                       # prisma migrate deploy && prisma db seed
npm run dev                         # http://localhost:3000
```

Civora needs PostgreSQL. With Docker:

```bash
docker run --name civora-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
```

Production build:

```bash
npm run build && npm start
```

`GET /api/health` reports what the deployment can actually do and names any
configuration that is missing.

## Demo walkthrough

Demo mode (`CIVORA_DEMO_MODE=true`) seeds a fictional dataset and enables a
shared responder access code. It is off by default in production.

1. **Landing** (`/`) — what Civora is and how trust is established.
2. **Report** (`/report`) — category → description → location → time →
   evidence → privacy → review. The review step states plainly what stays
   private and what may be published.
3. **Your case** (`/cases/CS-…`) — tracked on the device you reported from.
   Ask for a recovery code at submission time to reach it from elsewhere.
4. **Community board** (`/community`) — only cases a handler has published.
5. **Responder workspace** (`/responder`) — sign in with the demo access code
   `civora-demo`. That code signs you in as the seeded platform administrator,
   so you can reach every case. Case **CS-1045** arrives with a corroboration
   candidate for **CS-1042** waiting for a decision: look at the per-signal
   breakdown, then confirm or reject it and watch what does *not* change.
6. **Organization scoping** — sign in instead as `facilities@civora-demo.example`
   with the password the seed script printed. That account sees the unassigned
   queue and the Facilities Department's cases, and nothing belonging to the
   water service or the mediation unit.
7. **Offline** — switch the browser to offline and submit a report. It queues
   in IndexedDB with independent per-item retry and submits on reconnect.

`npm run smoke` walks these journeys against a running server and prints a
pass/fail line per step.

## Architecture

```
Citizen / Responder
        │
   Next.js 14 (App Router)
        │
   middleware.ts ── per-request CSP nonce
        │
   API routes ── Zod validation · same-origin check · shared rate limiter
        │
   authz.ts ── permissions      dto/case.ts ── role-specific views
   case-state.ts ── transitions publication.ts ── what may be published
        │
   Prisma 7 + @prisma/adapter-pg
        │
   PostgreSQL              Private object storage       Redis (optional)
   cases, reports,         evidence bytes, never        shared rate-limit
   evidence metadata,      publicly addressable         counters
   events, sessions
        │
   Optional AI provider (advisory only, never a writer)
```

Offline client:

```
Browser → IndexedDB (drafts, outbox, tracking tokens) → sync engine → API
```

### Where things live

```
src/
  app/
    (citizen)/       citizen shell: bottom nav on mobile, sidebar on desktop
    responder/       responder workspace, session-gated and org-scoped
    api/             reports, evidence, evidence-file, cases, track, responder,
                     civic, ai, demo, health
  components/
    case/            CasePageBody, EvidenceChain, CaseTimeline, TrustPanel,
                     CaseProgress, InfoRequestPanel, AiSummaryCard
    report/          ReportWizard — 7 steps, draft autosave, offline queue
    responder/       ResponderCasePanel — audit-first actions, corroboration
                     review with the per-signal breakdown
    civic/           Civic explorer, trust card, freshness and provenance
  lib/
    config.ts        all configuration, with production validation
    authz.ts         one place decides who may do what
    case-state.ts    the state machine, enforced server-side
    publication.ts   screening rules and the text that may be published
    privacy.ts       the fixed vocabulary of public labels
    matching.ts      corroboration candidates (proposals, never conclusions)
    dto/             PublicCaseView, ReporterCaseView, ResponderCaseView
    db/              Prisma client, repository, demo dataset
    storage/         private object storage: s3, vercel-blob, local (dev)
    files/validate   magic-byte validation and safe serving types
    rate-limit.ts    Redis-backed, PostgreSQL fallback
    ai/              provider, schema-validated summary, honest translation
    offline/         IndexedDB stores and the retrying sync engine
    log.ts           structured logging with redaction
prisma/
  schema.prisma      the authoritative data model
  seed.ts            the fictional demo corpus
tests/               unit, integration, security and offline suites
```

## Data model

PostgreSQL is the only authoritative store. Nothing in the running system
reads or writes a JSON file.

Two rules are enforced by the schema rather than by convention:

- **Reporter identity lives in its own table.** `ReporterContact` hangs off
  `Report`, so no query that loads a case can select a name by accident.
- **Matching is separate from verification.** `CaseLink` holds proposals with
  a per-signal breakdown and a status; `Case.verification` is only ever
  changed by an explicit responder action with a reason.

Case creation is a single transaction covering the case, the report, the
reporter's contact record, the opening audit event and any proposed links.
Public case numbers come from a PostgreSQL sequence (`nextval`) inside that
transaction, so concurrent submissions cannot collide — there is a test that
fires twelve at once.

Indexes cover the queries the product actually runs: the public board
(`publicVisible, updatedAt`), the responder queue (`assignedOrgId, response`),
timelines (`caseId, at`), evidence (`caseId, publicVisible`) and token lookup
(`Report.trackingTokenHash`, unique).

## Privacy model

| Mode | What is stored | Who can see it |
| --- | --- | --- |
| Anonymous | Nothing identifying — contact details sent with an anonymous report are discarded before the write | Nobody |
| Confidential | Contact details, in a separate table | The organization handling the case |
| Identified | Contact details, in a separate table | The organization handling the case |

Reporter identity never reaches a public surface. Every label that can be
published comes from a fixed vocabulary in `src/lib/privacy.ts`
(`Anonymous reporter`, `Confidential reporter`, `Identified reporter`,
organization names, responders' professional display names) — a person's name
cannot be interpolated into an event actor or an evidence source.

**A report is not a publication.** The reporter's own words are stored as
`Case.privateDescription` and shown only to them and to authorized handlers.
The public board shows `Case.publicSummary`, which a handler writes. New cases
enter `screening` and are held from the public board when automatic screening
flags a sensitive category, allegation language, an apparent name, or contact
details in the text. The review step in the wizard says all of this before the
reporter submits.

Tracking is device-local by default: a random token is returned once, only its
SHA-256 hash is stored, and it never appears in a URL. A reporter can opt into
a one-time recovery code; exchanging it rotates the tracking token, so a lost
device loses access.

## Authentication and authorization

Sessions are server-side rows: a random token stored as a hash, bound to a
user, with both an idle and an absolute lifetime and server-side revocation.
The cookie is `httpOnly`, `sameSite=strict` and `secure` in production.

Roles are `citizen`, `responder`, `organization_admin` and `platform_admin`.
A responder sees the unassigned triage queue and their own organization's
cases; another organization's casework is never loaded. Routing a case to a
different organization requires at least organization-admin. Every permission
question is answered by `src/lib/authz.ts` — no route re-derives its own.

The shared demo access code only works while `CIVORA_DEMO_MODE=true`, and only
for accounts flagged `isDemo`. Production sign-in is email and password
(scrypt, via `node:crypto`).

## Evidence

Bytes go to private object storage; metadata and a SHA-256 checksum go to
PostgreSQL. `/api/evidence-file/[id]` is the only way a file leaves the
system, and it checks authorization first: public evidence is open, restricted
evidence needs an authorized handler or the reporter's tracking token (sent in
a request header, never a URL).

Uploads are validated from their bytes, not from what the browser claims. An
HTML payload announced as `image/jpeg` is rejected. On the way out, anything a
browser might execute is downgraded to `application/octet-stream` and served
as an attachment with `Content-Security-Policy: default-src 'none'; sandbox`.

Files are sent as binary through `multipart/form-data`, one request each,
rather than base64 inside the report JSON — a third less data over the wire,
and a six-photo report is six bounded requests instead of one very large body.
Images are still compressed on the device before upload.

## Offline

Drafts and queued submissions live in IndexedDB, with an in-memory fallback
when storage is blocked (private browsing, policy, quota) and a visible
warning when that happens. Each queued item carries its own status, attempt
count and next-attempt time, and retries with exponential backoff and full
jitter. One permanently failing report never blocks the rest of the queue.
Tabs coordinate over a Web Lock and broadcast outcomes to each other, so two
open tabs cannot submit the same report twice and both show the same result.

## AI

AI is advisory and has no write surface. It can summarize, explain and
translate. It cannot change a verification state, resolve or assign a case,
decide who is telling the truth, or suppress contradictory evidence.

Model output is validated against a Zod schema before it renders, and cited
evidence ids are checked against the case's actual evidence, so a model cannot
invent a source. Invalid output falls back to Civora's deterministic analyzer,
which is labelled as such. Only the *public* view of a case is ever sent to a
provider — never the reporter's own words.

Translation is either real or absent. When no provider is configured, the
endpoint returns the original text with an explanation in the reader's
language. Civora supports exactly the languages its interface offers: English,
Swahili and French.

Every AI route is rate limited, size limited, timed out, and subject to a
deployment-wide daily quota.

## Security posture

- Nonce-based Content-Security-Policy per request, with `strict-dynamic`;
  `unsafe-eval` only on the development server
- `Permissions-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `X-Content-Type-Options`, `Cross-Origin-Opener-Policy`
- Zod validation on every mutation; no endpoint reads a role, organization or
  authorization claim from a request body
- Same-origin check on every state-changing route, plus `sameSite=strict`
- Shared rate limiting (Redis, or PostgreSQL) on reporting, tracking,
  recovery, uploads, sign-in, responder actions, civic search and every AI route
- Timing-safe comparison for tokens, codes and passwords
- Case lookup answers identically for "wrong token" and "no such case", so
  case ids cannot be enumerated
- Structured logs with redaction: tokens, codes, contact details, report text
  and coordinates never reach a log sink

## Data retention

| Data | Retained |
| --- | --- |
| Cases, reports, audit events | Indefinitely — the accountability record |
| Evidence files | `RETENTION_EVIDENCE_DAYS` (default 365) after closure |
| Reporter contact details | `RETENTION_CONTACT_DAYS` (default 180) after closure |
| Tracking tokens | Until the case is closed, or until a recovery rotates them |
| Sessions | Absolute expiry, then deleted by `pruneExpiredSessions` |
| Rate-limit counters | Until their window expires |

`Evidence.retainUntil` and `Case.retainUntil` carry the horizons. A scheduled
job that enforces them is not yet implemented — see Limitations.

## Testing

```bash
npm test                 # everything
npm run test:unit        # pure logic
npm run test:integration # real database, real route handlers
npm run test:security    # the boundaries
npm run smoke            # the five journeys, over real HTTP
```

Integration and security suites run against a real PostgreSQL database
(`TEST_DATABASE_URL`, falling back to `DATABASE_URL`) because the guarantees
under test — transactions, unique constraints, the case-number sequence —
do not exist in a mock.

What is covered: token hashing and comparison, state transitions, closure
rules, matching (including the false positives it must *not* produce), the
screening rules, file validation and safe serving, DTO boundaries, corroboration
staying separate from verification, organization scoping, evidence access for
every role, case-id enumeration, rate limiting, demo gating, log redaction, AI
schema validation and translation honesty, and the offline queue's independent
retry.

## Deployment

Any Node host: Vercel, Fly, Railway, a container platform.

```bash
npm ci
npm run db:deploy       # prisma migrate deploy
npm run build
npm start
```

Requirements:

- PostgreSQL (`DATABASE_URL`, plus `DIRECT_URL` behind a transaction pooler)
- `SESSION_SECRET` of at least 32 characters
- A durable object-storage driver (`s3` or `vercel-blob`)
- Optionally a Redis-compatible endpoint for rate limiting
- `CIVORA_DEMO_MODE` and `ENABLE_DEMO_TOOLS` left off

Nothing depends on the local filesystem or on process memory for authoritative
state. `OBJECT_STORAGE_DRIVER=local` is refused when `NODE_ENV=production`.

## Environment variables

See `.env.example` for the annotated list.

## Limitations

Honest notes on what is not finished:

- **Retention is modelled, not enforced.** The horizons are stored; the
  scheduled job that deletes expired evidence and contact details is not
  written yet.
- **No account self-service.** Responder accounts are created by seeding or
  directly in the database. There is no invitation, password-reset or
  organization-management interface.
- **Screening is heuristic.** It errs towards holding a case back, and a
  handler still has to read everything before publishing. It is a safety net,
  not a classifier.
- **Matching is lexical.** Token overlap with stop-word filtering and weighted
  location signals; no embeddings, no geospatial index. It proposes, a person
  decides.
- **Civic information is demo data.** The corpus is fictional and labelled.
  Real deployments need a real ingestion and re-verification process.
- **No push notifications or email.** A reporter learns about a response by
  opening their case page.
- **Evidence virus scanning is not implemented.** Type and size are validated;
  content is not scanned.
- **AI translation quality is the provider's.** Civora validates shape and
  refuses to present an echo as a translation, but it cannot check accuracy.
