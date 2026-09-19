const fs = require('fs');

function updateDictionaries() {
    const enFile = "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\lib\\i18n\\en.ts";
    const swFile = "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\lib\\i18n\\sw.ts";
    const frFile = "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\lib\\i18n\\fr.ts";
    
    const newKeysEn = `
  // ── Responder Case Panel ──────────────────────────────────────────────────
  "responder.action.error.note": "A short description is required — it becomes part of the case record.",
  "responder.action.error.update": "A public update documenting the action/resolution is required.",
  "responder.action.error.failed": "That action could not be completed. Please try again.",
  "responder.action.flash.recorded": "Action recorded on the case timeline.",
  
  "responder.dialog.acknowledge.title": "Acknowledge this case?",
  "responder.dialog.acknowledge.desc": "Acknowledgement is public — the reporter and community will see that the responsible organization has received the report.",
  "responder.dialog.acknowledge.confirm": "Acknowledge case",
  "responder.dialog.acknowledge.note_label": "Internal note (optional)",
  "responder.dialog.acknowledge.note_placeholder": "Context for the response desk — not shown publicly",
  
  "responder.dialog.assign.title": "Assign this case",
  "responder.dialog.assign.desc": "Route the case to the organization responsible for responding.",
  "responder.dialog.assign.confirm": "Assign case",
  "responder.dialog.assign.note_label": "Routing note (optional)",
  "responder.dialog.assign.note_placeholder": "Why this organization",
  
  "responder.dialog.progress.title": "Mark response in progress?",
  "responder.dialog.progress.desc": "Signals to everyone following the case that work has started. A public update is recommended.",
  "responder.dialog.progress.confirm": "Mark in progress",
  "responder.dialog.progress.note_label": "Internal note (optional)",
  "responder.dialog.progress.note_placeholder": "What is being done",
  
  "responder.dialog.record.title": "Record action taken",
  "responder.dialog.record.desc": "Describe the concrete action taken. This becomes a permanent, public part of the case record.",
  "responder.dialog.record.confirm": "Record action",
  "responder.dialog.record.note_label": "Action description",
  "responder.dialog.record.note_placeholder": "e.g. Electrical contractor inspected the panel and isolated the circuit",
  
  "responder.dialog.request.title": "Request more information",
  "responder.dialog.request.desc": "The case will show that additional information has been requested from the reporter.",
  "responder.dialog.request.confirm": "Request information",
  "responder.dialog.request.note_label": "What is needed (optional)",
  "responder.dialog.request.note_placeholder": "e.g. Photo of the panel in daylight would help the inspection",
  
  "responder.dialog.update.title": "Add a public update",
  "responder.dialog.update.desc": "Updates are shown to everyone following the case. Keep them factual and calm; never name individuals.",
  "responder.dialog.update.confirm": "Publish update",
  "responder.dialog.update.note_label": "Internal note (optional)",
  "responder.dialog.update.note_placeholder": "Context for the response desk",
  
  "responder.dialog.verification.title": "Change verification state",
  "responder.dialog.verification.desc": "Verification reflects documented evidence — never a judgment about anyone. State the evidence basis in the note.",
  "responder.dialog.verification.confirm": "Update verification",
  "responder.dialog.verification.note_label": "Evidence basis",
  "responder.dialog.verification.note_placeholder": "e.g. Two consistent reports plus a dated photo refer to the same panel",
  
  "responder.dialog.close.title": "Close this case?",
  "responder.dialog.close.desc": "Closing sets verification to Resolved and records the outcome publicly. This cannot be casually undone in the demo.",
  "responder.dialog.close.confirm": "Close case",
  "responder.dialog.close.note_label": "Internal Resolution summary",
  "responder.dialog.close.note_placeholder": "e.g. Fault repaired and tested; walkway reopened",
  
  "responder.dialog.note.title": "Add internal note",
  "responder.dialog.note.desc": "Responder-only. Never shown publicly. Use for coordination between handlers.",
  "responder.dialog.note.confirm": "Add note",
  "responder.dialog.note.note_label": "Note",
  "responder.dialog.note.note_placeholder": "e.g. Contractor scheduled for tomorrow 08:00",
  
  "responder.action.acknowledge": "Accept & acknowledge",
  "responder.action.assign": "Assign",
  "responder.action.start_progress": "Start progress",
  "responder.action.record_action": "Record action",
  "responder.action.request_info": "Request info",
  "responder.action.add_update": "Public update",
  "responder.action.verification": "Verification",
  "responder.action.internal_note": "Internal note",
  "responder.action.close_case": "Close case",
  "responder.action.done": "done",
  
  "responder.panel.back": "Response overview",
  "responder.panel.case": "CASE",
  "responder.panel.no_location": "No location shared",
  "responder.panel.reported": "reported",
  "responder.panel.updated": "updated",
  
  "responder.panel.privacy.title": "Reporter privacy state",
  "responder.panel.privacy.anon_desc": "No identity is stored for this report — there is nothing to reveal, even to responders.",
  "responder.panel.privacy.auth_contact": "Authorized contact: ",
  "responder.panel.privacy.contact_note": "Visible to responders only. Never shown on public case pages.",
  "responder.panel.privacy.reports_linked": "reports linked",
  "responder.panel.privacy.corroborating": "corroborating",
  
  "responder.panel.summary.title": "Original report",
  "responder.panel.summary.incident_at": "Incident at",
  "responder.panel.summary.area": "Area",
  "responder.panel.summary.not_shared": "Not shared",
  
  "responder.panel.notes.title": "Internal notes",
  "responder.panel.notes.add": "Add note",
  "responder.panel.notes.empty": "No internal notes yet.",
  
  "responder.panel.actions.title": "Actions",
  "responder.panel.actions.audit": "Every action requires a short record and becomes a permanent timeline event. Auditability is the point — if it happened, it's on the record.",
  
  "responder.panel.verification.title": "Verification reference",
  "responder.panel.verification.current": "current",
  
  "responder.dialog.field.org": "Organization",
  "responder.dialog.field.new_verification": "New verification state",
  "responder.dialog.field.public_update": "Public update",
  "responder.dialog.field.public_update_placeholder": "Shown to everyone following this case — factual and calm",
  "responder.dialog.field.preview": "Preview:",
  "responder.dialog.field.required": "Required.",
  "responder.dialog.field.optional": "Optional for most actions — required when publishing an update.",
  "responder.dialog.cancel": "Cancel",
  "responder.dialog.signing_in": "Signing in…",
  "responder.dialog.enter_workspace": "Enter workspace",
  
  // ── Logout Button ─────────────────────────────────────────────────────────
  "responder.logout": "Sign out",
  
  // ── Access Page ───────────────────────────────────────────────────────────
  "responder.access.failed": "Sign-in failed. Please try again.",
  "responder.access.title": "Responder workspace",
  "responder.access.desc": "For institutional responders handling assigned cases. Roles are verified by the server — not by the app running in your browser.",
  "responder.access.code_label": "Access code",
  "responder.access.code_placeholder": "Enter the demo access code",
  "responder.access.demo_eval": "Demo evaluation:",
  "responder.access.demo_code_msg": "the shared demo access code is",
  "responder.access.demo_prod_msg": "In production this is replaced by your organization's identity provider; no case data is shown here without a verified session.",
  
  // ── Responder Dashboard ───────────────────────────────────────────────────
  "responder.dashboard.title": "Response overview",
  "responder.dashboard.open_cases": "open cases",
  "responder.dashboard.open_case": "open case",
  "responder.dashboard.across": "across",
  "responder.dashboard.configured_orgs": "configured organizations. Demo data.",
  "responder.dashboard.primary_demo": "Primary demo case",
  
  "responder.dashboard.metrics.new": "New",
  "responder.dashboard.metrics.verification": "Verification",
  "responder.dashboard.metrics.assigned": "Assigned",
  "responder.dashboard.metrics.in_progress": "In progress",
  "responder.dashboard.metrics.resolved": "Resolved",
  
  "responder.dashboard.cases.title": "Cases",
  "responder.dashboard.cases.note": "Cases are ordered by priority, then recency. Reporter identities stay protected in every view; anonymous reports show no identity at all.",
  
  // ── Landing Content ───────────────────────────────────────────────────────
  "landing.live.title": "Follow a live case",
  "landing.live.safety": "Safety",
  "landing.live.fictional": "Fictional demo case for evaluation.",
  "landing.live.see_details": "See full details",
  
  "landing.trust.principles": "Core Principles",
  "landing.trust.title": "Trust by design",
  "landing.trust.desc": "Civic information is often fragmented and unverified. Civora was built to demonstrate how platforms can protect reporter privacy, establish ground truth, and demand accountability.",
  "landing.trust.zk_identity": "Zero-Knowledge Identity",
  "landing.trust.private_default": "Private by default",
  "landing.trust.private_desc": "Report anonymously or confidentially. Reporter identity is isolated from incident facts — never accessible to the public, and protected from responder exposure.",
  "landing.trust.loc_optional": "Location is optional",
  "landing.trust.no_account": "No account required",
  "landing.trust.evidence_linked": "Evidence-linked",
  "landing.trust.evidence_desc": "Every claim stays connected to its source, with cryptographic hashes verified at ingestion.",
  "landing.trust.sealed": "SEALED",
  "landing.trust.corroborated": "Corroborated",
  "landing.trust.integrity": "Integrity intact",
  "landing.trust.distinct_states": "Distinct States",
  "landing.trust.transparent": "Transparent status",
  "landing.trust.transparent_desc": "Reported ≠ verified ≠ responded. Distinct operational stages prevent premature closure.",
  "landing.trust.workflow.reported": "Reported",
  "landing.trust.workflow.verified": "Verified",
  "landing.trust.workflow.responded": "Responded",
  "landing.trust.workflow.assigned": "Assigned",
  "landing.trust.no_hidden": "No hidden decisions",
  "landing.trust.no_hidden_desc": "Changes, reclassifications, and retractions are logged in a permanent public audit trail. Every action has an attributable timestamp and rationale.",
  "landing.trust.audit_ledger": "Public Audit Ledger",
  
  "landing.trust.audit.citizen": "Citizen Submission",
  "landing.trust.audit.citizen_desc": "Infrastructure hazard flagged with anonymous cryptographic token.",
  "landing.trust.audit.evidence": "Evidence Verification",
  "landing.trust.audit.evidence_desc": "2 independent field photographs confirmed at coordinate radius.",
  "landing.trust.audit.agency": "Agency Assignment",
  "landing.trust.audit.agency_desc": "Routed to Department of Public Works. Response team scheduled.",
  
  "landing.loop.title": "The Lifecycle",
  "landing.loop.headline": "One traceable lifecycle",
  "landing.loop.desc": "Every case moves through the same transparent loop. Reported never collapses into verified; verified never collapses into resolved.",
  "landing.loop.1.label": "Report",
  "landing.loop.1.detail": "Safely, with or without your name.",
  "landing.loop.2.label": "Protect",
  "landing.loop.2.detail": "Privacy-first by design.",
  "landing.loop.3.label": "Verify",
  "landing.loop.3.detail": "Evidence and corroboration, carefully.",
  "landing.loop.4.label": "Coordinate",
  "landing.loop.4.detail": "Routed to a responsible organization.",
  "landing.loop.5.label": "Respond",
  "landing.loop.5.detail": "Acknowledged, acted on, recorded.",
  "landing.loop.6.label": "Account",
  "landing.loop.6.detail": "Status and timeline, in the open.",
  "landing.loop.7.label": "Inform",
  "landing.loop.7.detail": "Everyone knows what happens next.",
  
  "landing.conditions.super": "Field ready",
  "landing.conditions.title": "Built for real conditions",
  "landing.conditions.1.title": "Works offline",
  "landing.conditions.1.desc": "Drafts are stored on the device and submitted automatically when connection returns.",
  "landing.conditions.2.title": "Low-bandwidth friendly",
  "landing.conditions.2.desc": "Text and status first; photos are compressed before upload.",
  "landing.conditions.3.title": "Neutral by design",
  "landing.conditions.3.desc": "Civora organizes evidence and response. It doesn't judge people.",
  
  "landing.footer.slogan": "Know your rights. Report safely. Verify together.",
  "landing.footer.privacy": "Privacy",
  "landing.footer.help": "Get help",
  "landing.footer.about": "About this demo",
`;

    const newKeysSw = `
  // ── Responder Case Panel ──────────────────────────────────────────────────
  "responder.action.error.note": "Maelezo mafupi yanahitajika — yanakuwa sehemu ya rekodi ya kesi.",
  "responder.action.error.update": "Sasisho la umma linaloandika hatua/utatuzi linahitajika.",
  "responder.action.error.failed": "Hatua hiyo haikuweza kukamilika. Tafadhali jaribu tena.",
  "responder.action.flash.recorded": "Hatua imerekodiwa kwenye kalenda ya matukio ya kesi.",
  
  "responder.dialog.acknowledge.title": "Kubali kesi hii?",
  "responder.dialog.acknowledge.desc": "Kukubali ni kwa umma — mtoa taarifa na jamii wataona kuwa shirika linalohusika limepokea ripoti.",
  "responder.dialog.acknowledge.confirm": "Kubali kesi",
  "responder.dialog.acknowledge.note_label": "Dokezo la ndani (si lazima)",
  "responder.dialog.acknowledge.note_placeholder": "Muktadha wa dawati la majibu — hauonyeshwi hadharani",
  
  "responder.dialog.assign.title": "Pangia kesi hii",
  "responder.dialog.assign.desc": "Elekeza kesi kwa shirika linalohusika kujibu.",
  "responder.dialog.assign.confirm": "Pangia kesi",
  "responder.dialog.assign.note_label": "Dokezo la uelekezaji (si lazima)",
  "responder.dialog.assign.note_placeholder": "Kwa nini shirika hili",
  
  "responder.dialog.progress.title": "Weka alama majibu yanaendelea?",
  "responder.dialog.progress.desc": "Inaashiria kwa kila mtu anayefuatilia kesi kuwa kazi imeanza. Sasisho la umma linapendekezwa.",
  "responder.dialog.progress.confirm": "Weka alama inaendelea",
  "responder.dialog.progress.note_label": "Dokezo la ndani (si lazima)",
  "responder.dialog.progress.note_placeholder": "Kile kinachofanywa",
  
  "responder.dialog.record.title": "Rekodi hatua iliyochukuliwa",
  "responder.dialog.record.desc": "Eleza hatua madhubuti iliyochukuliwa. Hii inakuwa sehemu ya kudumu, ya umma ya rekodi ya kesi.",
  "responder.dialog.record.confirm": "Rekodi hatua",
  "responder.dialog.record.note_label": "Maelezo ya hatua",
  "responder.dialog.record.note_placeholder": "mf. Mkandarasi wa umeme alikagua paneli na kutenga saketi",
  
  "responder.dialog.request.title": "Omba taarifa zaidi",
  "responder.dialog.request.desc": "Kesi itaonyesha kwamba taarifa za ziada zimeombwa kutoka kwa mtoa taarifa.",
  "responder.dialog.request.confirm": "Omba taarifa",
  "responder.dialog.request.note_label": "Kinachohitajika (si lazima)",
  "responder.dialog.request.note_placeholder": "mf. Picha ya paneli mchana ingesaidia ukaguzi",
  
  "responder.dialog.update.title": "Ongeza sasisho la umma",
  "responder.dialog.update.desc": "Masasisho yanaonyeshwa kwa kila mtu anayefuatilia kesi. Yaweke ya kweli na ya utulivu; kamwe usitaje watu binafsi.",
  "responder.dialog.update.confirm": "Chapisha sasisho",
  "responder.dialog.update.note_label": "Dokezo la ndani (si lazima)",
  "responder.dialog.update.note_placeholder": "Muktadha wa dawati la majibu",
  
  "responder.dialog.verification.title": "Badilisha hali ya uthibitishaji",
  "responder.dialog.verification.desc": "Uthibitishaji unaonyesha ushahidi uliorekodiwa — kamwe si hukumu kuhusu mtu yeyote. Taja msingi wa ushahidi katika dokezo.",
  "responder.dialog.verification.confirm": "Sasisha uthibitishaji",
  "responder.dialog.verification.note_label": "Msingi wa ushahidi",
  "responder.dialog.verification.note_placeholder": "mf. Ripoti mbili thabiti pamoja na picha yenye tarehe zinarejelea paneli hiyo hiyo",
  
  "responder.dialog.close.title": "Funga kesi hii?",
  "responder.dialog.close.desc": "Kufunga kunaweka uthibitishaji kuwa Imetatuliwa na kurekodi matokeo hadharani. Hili haliwezi kutenguliwa kwa urahisi katika onyesho.",
  "responder.dialog.close.confirm": "Funga kesi",
  "responder.dialog.close.note_label": "Muhtasari wa Utatuzi wa Ndani",
  "responder.dialog.close.note_placeholder": "mf. Hitilafu imerekebishwa na kujaribiwa; njia imefunguliwa tena",
  
  "responder.dialog.note.title": "Ongeza dokezo la ndani",
  "responder.dialog.note.desc": "Kwa mjibu tu. Haliwezi kuonyeshwa hadharani kamwe. Tumia kwa uratibu kati ya washughulikiaji.",
  "responder.dialog.note.confirm": "Ongeza dokezo",
  "responder.dialog.note.note_label": "Dokezo",
  "responder.dialog.note.note_placeholder": "mf. Mkandarasi amepangwa kwa kesho 08:00",
  
  "responder.action.acknowledge": "Kubali na ukubali",
  "responder.action.assign": "Pangia",
  "responder.action.start_progress": "Anza maendeleo",
  "responder.action.record_action": "Rekodi hatua",
  "responder.action.request_info": "Omba taarifa",
  "responder.action.add_update": "Sasisho la umma",
  "responder.action.verification": "Uthibitishaji",
  "responder.action.internal_note": "Dokezo la ndani",
  "responder.action.close_case": "Funga kesi",
  "responder.action.done": "tayari",
  
  "responder.panel.back": "Muhtasari wa majibu",
  "responder.panel.case": "KESI",
  "responder.panel.no_location": "Hakuna eneo lililoshirikiwa",
  "responder.panel.reported": "imeripotiwa",
  "responder.panel.updated": "imesasishwa",
  
  "responder.panel.privacy.title": "Hali ya faragha ya mtoa taarifa",
  "responder.panel.privacy.anon_desc": "Hakuna utambulisho uliohifadhiwa kwa ripoti hii — hakuna kitu cha kufichua, hata kwa watoa majibu.",
  "responder.panel.privacy.auth_contact": "Mwasiliani aliyeidhinishwa: ",
  "responder.panel.privacy.contact_note": "Inaonekana kwa watoa majibu pekee. Haionyeshwi kamwe kwenye kurasa za kesi za umma.",
  "responder.panel.privacy.reports_linked": "ripoti zimeunganishwa",
  "responder.panel.privacy.corroborating": "kuthibitisha",
  
  "responder.panel.summary.title": "Ripoti ya asili",
  "responder.panel.summary.incident_at": "Tukio saa",
  "responder.panel.summary.area": "Eneo",
  "responder.panel.summary.not_shared": "Haijashirikiwa",
  
  "responder.panel.notes.title": "Madokezo ya ndani",
  "responder.panel.notes.add": "Ongeza dokezo",
  "responder.panel.notes.empty": "Hakuna madokezo ya ndani bado.",
  
  "responder.panel.actions.title": "Hatua",
  "responder.panel.actions.audit": "Kila hatua inahitaji rekodi fupi na inakuwa tukio la kudumu la kalenda ya matukio. Uwezo wa kukagua ndio jambo la msingi — ikiwa ilitokea, iko kwenye rekodi.",
  
  "responder.panel.verification.title": "Rejeleo la uthibitishaji",
  "responder.panel.verification.current": "ya sasa",
  
  "responder.dialog.field.org": "Shirika",
  "responder.dialog.field.new_verification": "Hali mpya ya uthibitishaji",
  "responder.dialog.field.public_update": "Sasisho la umma",
  "responder.dialog.field.public_update_placeholder": "Inaonyeshwa kwa kila mtu anayefuatilia kesi hii — ya kweli na ya utulivu",
  "responder.dialog.field.preview": "Onyesho la kukagua:",
  "responder.dialog.field.required": "Inahitajika.",
  "responder.dialog.field.optional": "Si lazima kwa hatua nyingi — inahitajika wakati wa kuchapisha sasisho.",
  "responder.dialog.cancel": "Ghairi",
  "responder.dialog.signing_in": "Inaingia…",
  "responder.dialog.enter_workspace": "Ingia kwenye nafasi ya kazi",
  
  // ── Logout Button ─────────────────────────────────────────────────────────
  "responder.logout": "Toka",
  
  // ── Access Page ───────────────────────────────────────────────────────────
  "responder.access.failed": "Kuingia kumeshindwa. Tafadhali jaribu tena.",
  "responder.access.title": "Nafasi ya kazi ya mtoa majibu",
  "responder.access.desc": "Kwa watoa majibu wa taasisi wanaoshughulikia kesi zilizopangiwa. Majukumu yanathibitishwa na seva — si kwa programu inayoendeshwa katika kivinjari chako.",
  "responder.access.code_label": "Nambari ya ufikiaji",
  "responder.access.code_placeholder": "Weka nambari ya ufikiaji ya onyesho",
  "responder.access.demo_eval": "Tathmini ya onyesho:",
  "responder.access.demo_code_msg": "nambari ya ufikiaji ya onyesho iliyoshirikiwa ni",
  "responder.access.demo_prod_msg": "Katika uzalishaji hii inabadilishwa na mtoa huduma wa utambulisho wa shirika lako; hakuna data ya kesi inayoonyeshwa hapa bila kipindi kilichothibitishwa.",
  
  // ── Responder Dashboard ───────────────────────────────────────────────────
  "responder.dashboard.title": "Muhtasari wa majibu",
  "responder.dashboard.open_cases": "kesi wazi",
  "responder.dashboard.open_case": "kesi wazi",
  "responder.dashboard.across": "katika",
  "responder.dashboard.configured_orgs": "mashirika yaliyosanidiwa. Data ya onyesho.",
  "responder.dashboard.primary_demo": "Kesi kuu ya onyesho",
  
  "responder.dashboard.metrics.new": "Mpya",
  "responder.dashboard.metrics.verification": "Uthibitishaji",
  "responder.dashboard.metrics.assigned": "Imepangiwa",
  "responder.dashboard.metrics.in_progress": "Inaendelea",
  "responder.dashboard.metrics.resolved": "Imetatuliwa",
  
  "responder.dashboard.cases.title": "Kesi",
  "responder.dashboard.cases.note": "Kesi zimepangwa kwa kipaumbele, kisha wepesi. Vitambulisho vya watoa taarifa hukaa salama katika kila mwonekano; ripoti zisizojulikana hazionyeshi utambulisho wowote.",
  
  // ── Landing Content ───────────────────────────────────────────────────────
  "landing.live.title": "Fuatilia kesi ya moja kwa moja",
  "landing.live.safety": "Usalama",
  "landing.live.fictional": "Kesi ya onyesho ya kubuni kwa tathmini.",
  "landing.live.see_details": "Tazama maelezo kamili",
  
  "landing.trust.principles": "Misingi Mikuu",
  "landing.trust.title": "Uaminifu kwa muundo",
  "landing.trust.desc": "Taarifa za kiraia mara nyingi hugawanywa na hazijathibitishwa. Civora ilijengwa ili kuonyesha jinsi majukwaa yanaweza kulinda faragha ya mtoa taarifa, kuanzisha ukweli wa msingi, na kudai uwajibikaji.",
  "landing.trust.zk_identity": "Utambulisho wa Zero-Knowledge",
  "landing.trust.private_default": "Faragha kwa chaguo-msingi",
  "landing.trust.private_desc": "Ripoti bila kujulikana au kwa siri. Utambulisho wa mtoa taarifa umetengwa na ukweli wa tukio — haupatikani kamwe kwa umma, na unalindwa kutokana na mfiduo wa mtoa majibu.",
  "landing.trust.loc_optional": "Eneo si lazima",
  "landing.trust.no_account": "Hakuna akaunti inayohitajika",
  "landing.trust.evidence_linked": "Imeunganishwa na ushahidi",
  "landing.trust.evidence_desc": "Kila madai hubaki yameunganishwa na chanzo chake, na hashi za kriptografia zilizothibitishwa wakati wa kumeza.",
  "landing.trust.sealed": "IMEFUNGWA",
  "landing.trust.corroborated": "Imethibitishwa",
  "landing.trust.integrity": "Uadilifu uko sawa",
  "landing.trust.distinct_states": "Hali Tofauti",
  "landing.trust.transparent": "Hali ya uwazi",
  "landing.trust.transparent_desc": "Imeripotiwa ≠ imethibitishwa ≠ imejibiwa. Hatua tofauti za utendaji huzuia kufungwa mapema.",
  "landing.trust.workflow.reported": "Imeripotiwa",
  "landing.trust.workflow.verified": "Imethibitishwa",
  "landing.trust.workflow.responded": "Imejibiwa",
  "landing.trust.workflow.assigned": "Imepangiwa",
  "landing.trust.no_hidden": "Hakuna maamuzi yaliyofichwa",
  "landing.trust.no_hidden_desc": "Mabadiliko, uainishaji upya, na ubatilishaji huwekwa kwenye njia ya ukaguzi wa umma ya kudumu. Kila hatua ina muhuri wa muda unaohusishwa na mantiki.",
  "landing.trust.audit_ledger": "Leja ya Ukaguzi wa Umma",
  
  "landing.trust.audit.citizen": "Uwasilishaji wa Raia",
  "landing.trust.audit.citizen_desc": "Hatari ya miundombinu imewekwa alama na ishara isiyojulikana ya kriptografia.",
  "landing.trust.audit.evidence": "Uthibitishaji wa Ushahidi",
  "landing.trust.audit.evidence_desc": "Picha 2 za uwanja za kujitegemea zimethibitishwa katika eneo la uratibu.",
  "landing.trust.audit.agency": "Ugawaji wa Wakala",
  "landing.trust.audit.agency_desc": "Imeelekezwa kwa Idara ya Ujenzi. Timu ya majibu imepangwa.",
  
  "landing.loop.title": "Mzunguko wa Maisha",
  "landing.loop.headline": "Mzunguko mmoja unaofuatiliwa",
  "landing.loop.desc": "Kila kesi hupitia kitanzi kile kile cha uwazi. Imeripotiwa haiwezi kamwe kuporomoka kuwa imethibitishwa; imethibitishwa haiwezi kamwe kuporomoka kuwa imetatuliwa.",
  "landing.loop.1.label": "Ripoti",
  "landing.loop.1.detail": "Kwa usalama, na au bila jina lako.",
  "landing.loop.2.label": "Linda",
  "landing.loop.2.detail": "Faragha-kwanza kwa muundo.",
  "landing.loop.3.label": "Thibitisha",
  "landing.loop.3.detail": "Ushahidi na uthibitisho, kwa uangalifu.",
  "landing.loop.4.label": "Kuratibu",
  "landing.loop.4.detail": "Imeelekezwa kwa shirika linalowajibika.",
  "landing.loop.5.label": "Jibu",
  "landing.loop.5.detail": "Imekubaliwa, imefanyiwa kazi, imerekodiwa.",
  "landing.loop.6.label": "Akaunti",
  "landing.loop.6.detail": "Hali na kalenda ya matukio, waziwazi.",
  "landing.loop.7.label": "Arifu",
  "landing.loop.7.detail": "Kila mtu anajua nini kinatokea baadaye.",
  
  "landing.conditions.super": "Tayari kwa uwanja",
  "landing.conditions.title": "Imejengwa kwa hali halisi",
  "landing.conditions.1.title": "Inafanya kazi nje ya mtandao",
  "landing.conditions.1.desc": "Rasimu huhifadhiwa kwenye kifaa na kuwasilishwa moja kwa moja mtandao unaporudi.",
  "landing.conditions.2.title": "Inafaa kwa kipimo data cha chini",
  "landing.conditions.2.desc": "Maandishi na hali kwanza; picha hubanwa kabla ya kupakia.",
  "landing.conditions.3.title": "Huru kwa muundo",
  "landing.conditions.3.desc": "Civora hupanga ushahidi na majibu. Haihukumu watu.",
  
  "landing.footer.slogan": "Jua haki zako. Ripoti kwa usalama. Thibitisha pamoja.",
  "landing.footer.privacy": "Faragha",
  "landing.footer.help": "Pata msaada",
  "landing.footer.about": "Kuhusu onyesho hili",
`;

    const newKeysFr = `
  // ── Responder Case Panel ──────────────────────────────────────────────────
  "responder.action.error.note": "Une brève description est requise — elle fera partie du dossier.",
  "responder.action.error.update": "Une mise à jour publique documentant l'action/la résolution est requise.",
  "responder.action.error.failed": "Cette action n'a pas pu être complétée. Veuillez réessayer.",
  "responder.action.flash.recorded": "Action enregistrée sur la chronologie du dossier.",
  
  "responder.dialog.acknowledge.title": "Reconnaître ce dossier ?",
  "responder.dialog.acknowledge.desc": "La reconnaissance est publique — le déclarant et la communauté verront que l'organisation responsable a reçu le rapport.",
  "responder.dialog.acknowledge.confirm": "Reconnaître le dossier",
  "responder.dialog.acknowledge.note_label": "Note interne (facultatif)",
  "responder.dialog.acknowledge.note_placeholder": "Contexte pour le bureau d'intervention — non visible publiquement",
  
  "responder.dialog.assign.title": "Assigner ce dossier",
  "responder.dialog.assign.desc": "Acheminer le dossier à l'organisation responsable de l'intervention.",
  "responder.dialog.assign.confirm": "Assigner le dossier",
  "responder.dialog.assign.note_label": "Note d'acheminement (facultatif)",
  "responder.dialog.assign.note_placeholder": "Pourquoi cette organisation",
  
  "responder.dialog.progress.title": "Marquer la réponse en cours ?",
  "responder.dialog.progress.desc": "Signale à tous ceux qui suivent le dossier que le travail a commencé. Une mise à jour publique est recommandée.",
  "responder.dialog.progress.confirm": "Marquer en cours",
  "responder.dialog.progress.note_label": "Note interne (facultatif)",
  "responder.dialog.progress.note_placeholder": "Ce qui est fait",
  
  "responder.dialog.record.title": "Enregistrer l'action entreprise",
  "responder.dialog.record.desc": "Décrire l'action concrète entreprise. Cela devient une partie permanente et publique du dossier.",
  "responder.dialog.record.confirm": "Enregistrer l'action",
  "responder.dialog.record.note_label": "Description de l'action",
  "responder.dialog.record.note_placeholder": "ex. L'entrepreneur en électricité a inspecté le panneau et isolé le circuit",
  
  "responder.dialog.request.title": "Demander plus d'informations",
  "responder.dialog.request.desc": "Le dossier montrera que des informations supplémentaires ont été demandées au déclarant.",
  "responder.dialog.request.confirm": "Demander des informations",
  "responder.dialog.request.note_label": "Ce qui est nécessaire (facultatif)",
  "responder.dialog.request.note_placeholder": "ex. Une photo du panneau en plein jour aiderait l'inspection",
  
  "responder.dialog.update.title": "Ajouter une mise à jour publique",
  "responder.dialog.update.desc": "Les mises à jour sont montrées à tous ceux qui suivent le dossier. Gardez-les factuelles et calmes ; ne nommez jamais de personnes.",
  "responder.dialog.update.confirm": "Publier la mise à jour",
  "responder.dialog.update.note_label": "Note interne (facultatif)",
  "responder.dialog.update.note_placeholder": "Contexte pour le bureau d'intervention",
  
  "responder.dialog.verification.title": "Changer l'état de vérification",
  "responder.dialog.verification.desc": "La vérification reflète les preuves documentées — jamais un jugement sur quiconque. Indiquez la base des preuves dans la note.",
  "responder.dialog.verification.confirm": "Mettre à jour la vérification",
  "responder.dialog.verification.note_label": "Base des preuves",
  "responder.dialog.verification.note_placeholder": "ex. Deux rapports cohérents plus une photo datée font référence au même panneau",
  
  "responder.dialog.close.title": "Fermer ce dossier ?",
  "responder.dialog.close.desc": "La fermeture définit la vérification sur Résolu et enregistre publiquement le résultat. Cela ne peut pas être annulé facilement dans la démo.",
  "responder.dialog.close.confirm": "Fermer le dossier",
  "responder.dialog.close.note_label": "Résumé de la résolution interne",
  "responder.dialog.close.note_placeholder": "ex. Défaut réparé et testé ; allée rouverte",
  
  "responder.dialog.note.title": "Ajouter une note interne",
  "responder.dialog.note.desc": "Intervenant uniquement. Jamais montré publiquement. Utiliser pour la coordination entre les gestionnaires.",
  "responder.dialog.note.confirm": "Ajouter une note",
  "responder.dialog.note.note_label": "Note",
  "responder.dialog.note.note_placeholder": "ex. Entrepreneur prévu pour demain à 08h00",
  
  "responder.action.acknowledge": "Accepter & reconnaître",
  "responder.action.assign": "Assigner",
  "responder.action.start_progress": "Démarrer",
  "responder.action.record_action": "Enregistrer l'action",
  "responder.action.request_info": "Demander des infos",
  "responder.action.add_update": "Mise à jour publique",
  "responder.action.verification": "Vérification",
  "responder.action.internal_note": "Note interne",
  "responder.action.close_case": "Fermer le dossier",
  "responder.action.done": "terminé",
  
  "responder.panel.back": "Aperçu de la réponse",
  "responder.panel.case": "DOSSIER",
  "responder.panel.no_location": "Aucun emplacement partagé",
  "responder.panel.reported": "signalé",
  "responder.panel.updated": "mis à jour",
  
  "responder.panel.privacy.title": "État de confidentialité du déclarant",
  "responder.panel.privacy.anon_desc": "Aucune identité n'est stockée pour ce rapport — il n'y a rien à révéler, même aux intervenants.",
  "responder.panel.privacy.auth_contact": "Contact autorisé : ",
  "responder.panel.privacy.contact_note": "Visible uniquement par les intervenants. Jamais montré sur les pages publiques.",
  "responder.panel.privacy.reports_linked": "rapports liés",
  "responder.panel.privacy.corroborating": "corroborant",
  
  "responder.panel.summary.title": "Rapport original",
  "responder.panel.summary.incident_at": "Incident à",
  "responder.panel.summary.area": "Zone",
  "responder.panel.summary.not_shared": "Non partagé",
  
  "responder.panel.notes.title": "Notes internes",
  "responder.panel.notes.add": "Ajouter une note",
  "responder.panel.notes.empty": "Aucune note interne pour le moment.",
  
  "responder.panel.actions.title": "Actions",
  "responder.panel.actions.audit": "Chaque action nécessite un bref enregistrement et devient un événement permanent. L'auditabilité est le point — si c'est arrivé, c'est enregistré.",
  
  "responder.panel.verification.title": "Référence de vérification",
  "responder.panel.verification.current": "actuel",
  
  "responder.dialog.field.org": "Organisation",
  "responder.dialog.field.new_verification": "Nouvel état de vérification",
  "responder.dialog.field.public_update": "Mise à jour publique",
  "responder.dialog.field.public_update_placeholder": "Montré à tous ceux qui suivent ce dossier — factuel et calme",
  "responder.dialog.field.preview": "Aperçu :",
  "responder.dialog.field.required": "Requis.",
  "responder.dialog.field.optional": "Facultatif pour la plupart des actions — requis lors de la publication d'une mise à jour.",
  "responder.dialog.cancel": "Annuler",
  "responder.dialog.signing_in": "Connexion en cours…",
  "responder.dialog.enter_workspace": "Entrer dans l'espace de travail",
  
  // ── Logout Button ─────────────────────────────────────────────────────────
  "responder.logout": "Se déconnecter",
  
  // ── Access Page ───────────────────────────────────────────────────────────
  "responder.access.failed": "La connexion a échoué. Veuillez réessayer.",
  "responder.access.title": "Espace intervenant",
  "responder.access.desc": "Pour les intervenants institutionnels traitant les dossiers assignés. Les rôles sont vérifiés par le serveur — pas par l'application dans votre navigateur.",
  "responder.access.code_label": "Code d'accès",
  "responder.access.code_placeholder": "Entrez le code d'accès de démo",
  "responder.access.demo_eval": "Évaluation de la démo :",
  "responder.access.demo_code_msg": "le code d'accès partagé de la démo est",
  "responder.access.demo_prod_msg": "En production, cela est remplacé par le fournisseur d'identité de votre organisation ; aucune donnée de dossier n'est montrée ici sans une session vérifiée.",
  
  // ── Responder Dashboard ───────────────────────────────────────────────────
  "responder.dashboard.title": "Aperçu de la réponse",
  "responder.dashboard.open_cases": "dossiers ouverts",
  "responder.dashboard.open_case": "dossier ouvert",
  "responder.dashboard.across": "sur",
  "responder.dashboard.configured_orgs": "organisations configurées. Données de démo.",
  "responder.dashboard.primary_demo": "Dossier de démo principal",
  
  "responder.dashboard.metrics.new": "Nouveau",
  "responder.dashboard.metrics.verification": "Vérification",
  "responder.dashboard.metrics.assigned": "Assigné",
  "responder.dashboard.metrics.in_progress": "En cours",
  "responder.dashboard.metrics.resolved": "Résolu",
  
  "responder.dashboard.cases.title": "Dossiers",
  "responder.dashboard.cases.note": "Les dossiers sont classés par priorité, puis par récence. L'identité des déclarants reste protégée dans toutes les vues ; les rapports anonymes ne montrent aucune identité.",
  
  // ── Landing Content ───────────────────────────────────────────────────────
  "landing.live.title": "Suivre un dossier en direct",
  "landing.live.safety": "Sécurité",
  "landing.live.fictional": "Dossier de démo fictif pour évaluation.",
  "landing.live.see_details": "Voir tous les détails",
  
  "landing.trust.principles": "Principes fondamentaux",
  "landing.trust.title": "Confiance par conception",
  "landing.trust.desc": "Les informations civiques sont souvent fragmentées et non vérifiées. Civora a été conçu pour démontrer comment les plateformes peuvent protéger la confidentialité des déclarants, établir la vérité et exiger la responsabilité.",
  "landing.trust.zk_identity": "Identité à connaissance nulle",
  "landing.trust.private_default": "Privé par défaut",
  "landing.trust.private_desc": "Signalez de manière anonyme ou confidentielle. L'identité du déclarant est isolée des faits de l'incident — jamais accessible au public et protégée de l'exposition aux intervenants.",
  "landing.trust.loc_optional": "L'emplacement est facultatif",
  "landing.trust.no_account": "Aucun compte requis",
  "landing.trust.evidence_linked": "Lié aux preuves",
  "landing.trust.evidence_desc": "Chaque réclamation reste connectée à sa source, avec des hachages cryptographiques vérifiés lors de l'ingestion.",
  "landing.trust.sealed": "SCELLÉ",
  "landing.trust.corroborated": "Corroboré",
  "landing.trust.integrity": "Intégrité intacte",
  "landing.trust.distinct_states": "États distincts",
  "landing.trust.transparent": "Statut transparent",
  "landing.trust.transparent_desc": "Signalé ≠ vérifié ≠ répondu. Des étapes opérationnelles distinctes empêchent une fermeture prématurée.",
  "landing.trust.workflow.reported": "Signalé",
  "landing.trust.workflow.verified": "Vérifié",
  "landing.trust.workflow.responded": "Répondu",
  "landing.trust.workflow.assigned": "Assigné",
  "landing.trust.no_hidden": "Pas de décisions cachées",
  "landing.trust.no_hidden_desc": "Les modifications, reclassifications et rétractations sont enregistrées dans une piste d'audit publique permanente. Chaque action a un horodatage attribuable et une justification.",
  "landing.trust.audit_ledger": "Registre d'audit public",
  
  "landing.trust.audit.citizen": "Soumission citoyenne",
  "landing.trust.audit.citizen_desc": "Danger d'infrastructure signalé avec un jeton cryptographique anonyme.",
  "landing.trust.audit.evidence": "Vérification des preuves",
  "landing.trust.audit.evidence_desc": "2 photographies de terrain indépendantes confirmées au rayon des coordonnées.",
  "landing.trust.audit.agency": "Assignation d'agence",
  "landing.trust.audit.agency_desc": "Acheminé au département des travaux publics. Équipe d'intervention programmée.",
  
  "landing.loop.title": "Le cycle de vie",
  "landing.loop.headline": "Un cycle de vie traçable",
  "landing.loop.desc": "Chaque dossier passe par la même boucle transparente. Signalé ne se réduit jamais à vérifié ; vérifié ne se réduit jamais à résolu.",
  "landing.loop.1.label": "Signaler",
  "landing.loop.1.detail": "En toute sécurité, avec ou sans votre nom.",
  "landing.loop.2.label": "Protéger",
  "landing.loop.2.detail": "La confidentialité d'abord, par conception.",
  "landing.loop.3.label": "Vérifier",
  "landing.loop.3.detail": "Preuves et corroboration, avec soin.",
  "landing.loop.4.label": "Coordonner",
  "landing.loop.4.detail": "Acheminé à une organisation responsable.",
  "landing.loop.5.label": "Répondre",
  "landing.loop.5.detail": "Reconnu, agi, enregistré.",
  "landing.loop.6.label": "Rendre compte",
  "landing.loop.6.detail": "Statut et chronologie, au grand jour.",
  "landing.loop.7.label": "Informer",
  "landing.loop.7.detail": "Tout le monde sait ce qui se passe ensuite.",
  
  "landing.conditions.super": "Prêt pour le terrain",
  "landing.conditions.title": "Conçu pour des conditions réelles",
  "landing.conditions.1.title": "Fonctionne hors ligne",
  "landing.conditions.1.desc": "Les brouillons sont stockés sur l'appareil et soumis automatiquement lorsque la connexion revient.",
  "landing.conditions.2.title": "Adapté aux faibles bandes passantes",
  "landing.conditions.2.desc": "Texte et statut d'abord ; les photos sont compressées avant le téléchargement.",
  "landing.conditions.3.title": "Neutre par conception",
  "landing.conditions.3.desc": "Civora organise les preuves et les réponses. Il ne juge pas les gens.",
  
  "landing.footer.slogan": "Connaissez vos droits. Signalez en sécurité. Vérifiez ensemble.",
  "landing.footer.privacy": "Confidentialité",
  "landing.footer.help": "Obtenir de l'aide",
  "landing.footer.about": "À propos de cette démo",
`;

    function insertKeys(filePath, keys) {
        let content = fs.readFileSync(filePath, 'utf8');
        let idx = content.lastIndexOf("// ── Language");
        if (idx === -1) {
            idx = content.lastIndexOf("}");
        }
        let newContent = content.substring(0, idx) + keys + content.substring(idx);
        fs.writeFileSync(filePath, newContent, 'utf8');
    }

    insertKeys(enFile, newKeysEn);
    insertKeys(swFile, newKeysSw);
    insertKeys(frFile, newKeysFr);
}

updateDictionaries();
