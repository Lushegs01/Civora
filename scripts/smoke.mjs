// End-to-end smoke test.
//
// Walks the product's core journeys against a running server and prints a
// pass/fail line per step. It exercises the real HTTP surface — rate limiting,
// the same-origin check, authorization, the state machine — so it catches
// things a unit test cannot.
//
//   npm run dev                       # in one terminal
//   npm run db:seed                   # demo accounts and fictional corpus
//   npm run smoke                     # in another
//
// BASE defaults to http://localhost:3000. Reporters are given distinct
// x-forwarded-for values because the per-IP limits are real.
const BASE = process.env.BASE || "http://localhost:3000";
const H = { "content-type": "application/json", origin: BASE, host: new URL(BASE).host };

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}
const j = async (r) => { try { return await r.json(); } catch { return {}; } };

let ipCounter = 0;
async function post(path, body, extra = {}) {
  // Each simulated reporter gets its own address; otherwise the real per-IP
  // rate limiter (correctly) blocks the third report in this script.
  ipCounter += 1;
  const headers = { ...H, "x-forwarded-for": `198.51.100.${ipCounter}`, ...extra.headers };
  return fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body), ...extra });
}

// ─────────────────────────────────────────── Scenario A: anonymous safety report
console.log("\nScenario A — anonymous safety report");
const reportRes = await post("/api/reports", {
  category: "safety",
  description: "Exposed wiring and a scorched panel beside the east stair on level two. Sparks were visible tonight.",
  locationGeneral: "East stair, level two",
  privacyMode: "anonymous",
  withRecoveryCode: true
});
const report = await j(reportRes);
check("case created", reportRes.status === 201 && /^CS-\d+$/.test(report.caseId || ""), report.caseId);
check("tracking token returned once", typeof report.token === "string" && report.token.length > 30);
check("recovery code returned", /^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/.test(report.recoveryCode || ""));
check("safety report is NOT auto-published", report.publicVisible === false && report.publicationState === "screening");

// evidence upload (binary, not base64)
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...Array(200).fill(0x41), 0xff, 0xd9]);
const form = new FormData();
form.append("caseId", report.caseId);
form.append("token", report.token);
form.append("file", new Blob([jpeg], { type: "image/jpeg" }), "panel.jpg");
const upload = await fetch(`${BASE}/api/evidence`, { method: "POST", headers: { origin: BASE }, body: form });
const uploaded = await j(upload);
check("evidence uploaded as binary", upload.ok, `status ${upload.status}`);

// reporter view
const viewRes = await post("/api/cases/view", { caseId: report.caseId, token: report.token });
const view = (await j(viewRes)).view;
check("reporter sees their own report back", view?.role === "reporter" && view.yourReport.includes("scorched"));
check("public summary is not the raw report", !view.summary.includes("scorched"));

// public view blocked while screening
const publicPage = await fetch(`${BASE}/community/${report.caseId}`);
check("screened case is not on the public board", publicPage.status === 404);

// evidence authorization
const noAuth = await fetch(`${BASE}/api/evidence-file/${uploaded.evidenceId}`);
check("restricted evidence refused without a token", noAuth.status === 403);
const withAuth = await fetch(`${BASE}/api/evidence-file/${uploaded.evidenceId}`, {
  headers: { "x-civora-tracking-token": report.token }
});
check("restricted evidence served to its reporter", withAuth.status === 200);
check("evidence never served as HTML", withAuth.headers.get("content-type") === "image/jpeg");

// ────────────────────────────────────────────────── Scenario B: corroboration
console.log("\nScenario B — corroboration");
const second = await j(await post("/api/reports", {
  category: "safety",
  description: "The panel by the east stair on level two is sparking again and the cover is still missing entirely.",
  locationGeneral: "East stair, level two",
  privacyMode: "anonymous"
}));
check("possible match surfaced to the reporter", (second.possibleMatches || []).some((m) => m.caseId === report.caseId));
const stillUnverified = (await j(await post("/api/cases/view", { caseId: report.caseId, token: report.token }))).view;
check("original case NOT silently verified", stillUnverified.verification === "unverified");
check("no public corroboration claim on the timeline",
  !stillUnverified.events.some((e) => /corroborat/i.test(e.title)));

// ──────────────────────────────────────────────── Scenario C: confidential
console.log("\nScenario C — confidential report");
const confidential = await j(await post("/api/reports", {
  category: "service",
  description: "No water supply on this street since early this morning and several neighbours report the same.",
  locationGeneral: "Ridgeway Close",
  privacyMode: "confidential",
  contact: { name: "A Real Name", email: "person@example.com", preferredChannel: "email" }
}));
check("confidential case created", Boolean(confidential.caseId), JSON.stringify(confidential).slice(0, 120));
const confidentialView = (await j(await post("/api/cases/view", { caseId: confidential.caseId, token: confidential.token }))).view;
const serialized = JSON.stringify(confidentialView ?? {});
check("reporter name absent from the reporter view", !serialized.includes("A Real Name"));
check("reporter email absent from the reporter view", !serialized.includes("person@example.com"));
check("public label used for the reporter",
  confidentialView.events.some((e) => e.actorLabel === "Confidential reporter"));

// ──────────────────────────────────────────────── Scenario E: responder
console.log("\nScenario E — responder");
const login = await post("/api/responder/session", { code: "civora-demo" });
const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
check("responder signs in with the demo code", login.ok && cookie.startsWith("civora_session="));
const auth = { headers: { cookie } };

async function act(body) {
  const res = await fetch(`${BASE}/api/responder/actions`, {
    method: "POST", headers: { ...H, cookie }, body: JSON.stringify(body)
  });
  return { status: res.status, body: await j(res) };
}

const seededCase = await fetch(`${BASE}/responder/cases/CS-1042`, { headers: { cookie } });
check("demo administrator can open a case routed to an organization", seededCase.status === 200, String(seededCase.status));

const assign = await act({ caseId: report.caseId, action: "assign", orgId: null, note: "Triage: routing to facilities." });
check("case can be assigned", assign.status === 200, assign.body.error || "");

const badClose = await act({ caseId: report.caseId, action: "close", note: "Done", publicUpdate: "All fine now." });
check("cannot close a received case", badClose.status === 400, badClose.body.error);

const ack = await act({ caseId: report.caseId, action: "acknowledge", note: "Inspection requested with the contractor." });
check("acknowledge works", ack.status === 200, ack.body.error || "");

const askInfo = await act({
  caseId: report.caseId, action: "request_info",
  publicUpdate: "Which end of the stair is the panel on, and is the area cordoned off?"
});
check("information request created", askInfo.status === 200, askInfo.body.error || "");

// reporter answers
const reporterView = (await j(await post("/api/cases/view", { caseId: report.caseId, token: report.token }))).view;
const openRequest = reporterView.openInfoRequests?.[0];
check("reporter sees the question", Boolean(openRequest), openRequest?.message?.slice(0, 40));
const answered = await post("/api/cases/info-response", {
  caseId: report.caseId, token: report.token, requestId: openRequest?.id,
  body: "It is the upper landing, and the area has been taped off."
});
check("reporter can answer", answered.ok, String(answered.status));

const verification = await act({
  caseId: report.caseId, action: "set_verification", verification: "partially_verified",
  note: "Two independent reports and a photo describe the same panel."
});
check("verification change requires and records a reason", verification.status === 200, verification.body.error || "");

const noReason = await act({ caseId: report.caseId, action: "set_verification", verification: "documented" });
check("verification refused without a reason", noReason.status === 400);

await act({ caseId: report.caseId, action: "start_progress" });
const recorded = await act({ caseId: report.caseId, action: "record_action", note: "Contractor isolated the panel and made the area safe." });
check("action recorded", recorded.status === 200, recorded.body.error || "");

const publish = await act({
  caseId: report.caseId, action: "set_publication", publicationState: "public_case",
  publicSummary: "An exposed electrical panel near a stairwell was reported and has since been isolated.",
  note: "Reviewed: no personal detail in the summary."
});
check("case can be published deliberately", publish.status === 200, publish.body.error || "");
const nowPublic = await fetch(`${BASE}/community/${report.caseId}`);
check("published case appears on the public board", nowPublic.status === 200);

const closed = await act({
  caseId: report.caseId, action: "close", note: "Work complete and signed off by the contractor.",
  publicUpdate: "The panel has been isolated and the stairwell is safe to use again."
});
check("case closes with a documented outcome", closed.status === 200, closed.body.error || "");
check("closure records the response state", closed.body.response === "closed");
check("closure does not overstate verification", closed.body.verification === "resolved",
  `verification=${closed.body.verification} (partially_verified → resolved is correct)`);

// timeline check
const finalView = (await j(await post("/api/cases/view", { caseId: report.caseId, token: report.token }))).view;
const actors = new Set(finalView.events.map((e) => e.actorLabel));
// Not "Response desk": every state change names the account that made it.
check(
  "timeline attributes actions to a named account",
  [...actors].some((a) => a === "Civora platform administrator"),
  [...actors].join(" | ")
);
check("timeline never says just 'Response desk'", ![...actors].includes("Response desk"));
check("no reporter name anywhere in the final view", !JSON.stringify(finalView).includes("A Real Name"));

// ──────────────────────────────────────────────── civic + AI + demo gating
console.log("\nCivic information, AI and demo tooling");
const civic = await j(await fetch(`${BASE}/api/civic?q=water`));
check("civic search returns items", Array.isArray(civic.items) && civic.items.length > 0, `${civic.items?.length} items`);
check("civic items are labelled fictional", civic.items?.every((i) => i.fictional === true));
check("civic items carry provenance", civic.items?.every((i) => i.officialSource && i.lastVerifiedAt && i.freshnessState));

const translate = await j(await post("/api/ai/translate", { text: "Public areas must have insulated fittings.", locale: "sw" }));
check("translation is honest when no provider is configured", translate.status === "unavailable" && !translate.text);
check("notice is written in the reader's language", /Tafsiri/.test(translate.notice || ""), translate.notice);

const summary = await j(await fetch(`${BASE}/api/ai/case-summary/${report.caseId}`));
check("summary is labelled as not AI-generated", summary.aiGenerated === false);
check("summary carries a disclaimer", /not an official finding/i.test(summary.disclaimer || ""));

const crossOrigin = await fetch(`${BASE}/api/reports`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: "https://attacker.example", host: new URL(BASE).host },
  body: JSON.stringify({ category: "other", description: "x".repeat(40), privacyMode: "anonymous" })
});
check("cross-origin submission refused", crossOrigin.status === 403);

// Left until last: a successful reset wipes everything above.
const resetNoAuth = await fetch(`${BASE}/api/demo/reset`, {
  method: "POST",
  headers: { ...H, "x-forwarded-for": "198.51.100.251" }
});
check("demo reset refuses an unauthenticated caller", resetNoAuth.status === 403, String(resetNoAuth.status));
const resetAsAdmin = await fetch(`${BASE}/api/demo/reset`, {
  method: "POST",
  headers: { ...H, cookie, "x-forwarded-for": "198.51.100.250" }
});
check("demo reset works for the demo platform administrator", resetAsAdmin.status === 200, String(resetAsAdmin.status));
const restored = await j(await fetch(`${BASE}/api/civic`));
check("fictional dataset comes back after a reset", (restored.items || []).length > 0);

console.log(`\n${failures === 0 ? "ALL SCENARIOS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
