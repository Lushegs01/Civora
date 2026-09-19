// English translations — base locale for Civora.
// Every key used in the UI should appear here. Other locales fall back to
// English for any missing key. Keys are dot-separated namespaces.

const en: Record<string, string> = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  "nav.home": "Home",
  "nav.cases": "My cases",
  "nav.explore": "Explore",
  "nav.community": "Community",
  "nav.report": "Report",
  "nav.more": "More",
  "nav.privacy": "Privacy",
  "nav.resources": "Get help",
  "nav.responder": "Responder",
  "nav.settings": "Settings",

  // ── Actions ─────────────────────────────────────────────────────────────────
  "action.report": "Report an issue",
  "action.explore": "Explore civic information",
  "action.track": "Track a case",
  "action.apply": "Apply",
  "action.contact": "Contact",
  "action.share": "Share",
  "action.save": "Save for later",
  "action.view_source": "View original source",
  "action.corroborate": "Corroborate",
  "action.add_evidence": "Add evidence",
  "action.request_update": "Request update",
  "action.learn_more": "Learn more",
  "action.search": "Search",
  "action.filter": "Filter",
  "action.back": "Back",
  "action.next": "Next",
  "action.submit": "Submit",
  "action.cancel": "Cancel",
  "action.close": "Close",
  "action.retry": "Retry",
  "action.explain_simply": "Explain simply",
  "action.how_verified": "How this was verified",
  "action.why_trusted": "Why this information is trusted",

  // ── Reporting categories ────────────────────────────────────────────────────
  "category.safety": "Safety",
  "category.community": "Community issue",
  "category.service": "Public service",
  "category.infrastructure": "Infrastructure",
  "category.dispute": "Dispute",
  "category.other": "Other",

  // ── Civic categories ────────────────────────────────────────────────────────
  "civic.category.service": "Public service",
  "civic.category.right": "Rights",
  "civic.category.policy": "Policy",
  "civic.category.opportunity": "Opportunity",
  "civic.category.project": "Public project",
  "civic.category.safety": "Safety information",
  "civic.category.procedure": "Procedure",

  // ── Privacy states ──────────────────────────────────────────────────────────
  "privacy.anonymous": "Anonymous",
  "privacy.anonymous.desc": "Your identity is not attached to the case",
  "privacy.confidential": "Confidential",
  "privacy.confidential.desc": "Visible to authorized responders only",
  "privacy.identified": "Identified",
  "privacy.identified.desc": "Shared with authorized case handlers",

  // ── Verification states ─────────────────────────────────────────────────────
  "verification.unverified": "Unverified",
  "verification.unverified.desc": "Only the initial report exists. Nothing has been independently confirmed yet.",
  "verification.partially_verified": "Partially verified",
  "verification.partially_verified.desc": "Multiple consistent reports or partial supporting evidence exist.",
  "verification.documented": "Documented",
  "verification.documented.desc": "A relevant primary source or strong supporting evidence documents the claim.",
  "verification.conflicting": "Conflicting",
  "verification.conflicting.desc": "Evidence sources materially disagree. The discrepancy is documented, not judged.",
  "verification.resolved": "Resolved",
  "verification.resolved.desc": "The case has a documented response and is considered closed.",

  // ── Response states ─────────────────────────────────────────────────────────
  "response.not_assigned": "Not assigned",
  "response.received": "Received",
  "response.acknowledged": "Acknowledged",
  "response.in_progress": "In progress",
  "response.action_recorded": "Action recorded",
  "response.closed": "Closed",

  // ── Freshness states ────────────────────────────────────────────────────────
  "freshness.current": "Current",
  "freshness.current.desc": "This information was verified recently and is believed to be up to date.",
  "freshness.review_needed": "Review needed",
  "freshness.review_needed.desc": "This information has not been re-verified recently. It may still be accurate but should be confirmed.",
  "freshness.outdated": "Outdated",
  "freshness.outdated.desc": "The source is known to have changed or the information is too old to rely on.",
  "freshness.conflicting": "Conflicting",
  "freshness.conflicting.desc": "Multiple credible sources disagree. The discrepancy is documented, not judged.",

  // ── Trust labels ────────────────────────────────────────────────────────────
  "trust.source_identified": "Source identified",
  "trust.document_linked": "Official document linked",
  "trust.verified_recently": "Last verified recently",
  "trust.evidence_attached": "Supporting evidence attached",
  "trust.conflicts_disclosed": "Conflicts disclosed",
  "trust.ai_not_authority": "AI did not determine verification",
  "trust.why_trusted": "Why this information is trusted",
  "trust.what_uncertain": "What remains uncertain",
  "trust.known": "What we know",
  "trust.uncertain": "What remains uncertain",

  // ── Next action labels ──────────────────────────────────────────────────────
  "next.report_issue": "Report this issue",
  "next.contact_org": "Contact responsible organization",
  "next.view_source": "View official source",
  "next.add_evidence": "Add evidence",
  "next.track_case": "Track this case",
  "next.share_info": "Share verified information",
  "next.apply_now": "Apply now",
  "next.request_clarification": "Request clarification",
  "next.save_later": "Save for later",

  // ── Jurisdiction ────────────────────────────────────────────────────────────
  "jurisdiction.applies_to": "Applies to",
  "jurisdiction.federal": "Federal",
  "jurisdiction.state": "State",
  "jurisdiction.local": "Local",
  "jurisdiction.not_applicable": "Not applicable to your selected area",

  // ── System messages ─────────────────────────────────────────────────────────
  "system.offline": "You are offline. Drafts are saved locally.",
  "system.online": "You are back online.",
  "system.syncing": "Syncing pending reports…",
  "system.sync_complete": "All reports synced successfully.",
  "system.sync_failed": "Some reports could not be synced. Will retry.",
  "system.ai_assisted": "AI-assisted explanation",
  "system.ai_summary": "AI-assisted summary",
  "system.ai_translation": "AI-assisted translation",
  "system.demo_data": "Fictional demo data",
  "system.original_source": "Original source",
  "system.translated_from": "Translated from",
  "system.loading": "Loading…",
  "system.no_results": "No results found",
  "system.error": "Something went wrong",

  // ── Explore page ────────────────────────────────────────────────────────────
  "explore.title": "Civic Explorer",
  "explore.subtitle": "Find trusted information about services, rights, policies, and community issues.",
  "explore.search_placeholder": "Search services, rights, policies…",
  "explore.tab.all": "All",
  "explore.tab.services": "Services",
  "explore.tab.rights": "Rights",
  "explore.tab.policies": "Policies",
  "explore.tab.issues": "Issues",
  "explore.tab.opportunities": "Opportunities",
  "explore.tab.safety": "Safety",
  "explore.tab.projects": "Projects",

  // ── Trust card ──────────────────────────────────────────────────────────────
  "trustcard.heading": "Trusted civic information",
  "trustcard.source": "Source",
  "trustcard.published": "Published",
  "trustcard.last_verified": "Last verified",
  "trustcard.jurisdiction": "Jurisdiction",
  "trustcard.what_means": "What this means",
  "trustcard.what_uncertain": "What remains uncertain",
  "trustcard.evidence": "Evidence",
  "trustcard.original_source": "Original source",
  "trustcard.what_you_can_do": "What you can do",
  "trustcard.eligibility": "Eligibility",
  "trustcard.requirements": "Requirements",
  "trustcard.fees": "Fees",
  "trustcard.deadlines": "Deadlines",
  "trustcard.contact": "Contact",

  // ── Simple mode ─────────────────────────────────────────────────────────────
  "simple.enable": "Simple view",
  "simple.disable": "Standard view",
  "simple.description": "Larger text, simpler layout, easier to read",

  // ── Landing ─────────────────────────────────────────────────────────────────
  "landing.headline": "Information you can trust",
  "landing.subheadline": "Know what is happening. Know what is verified. Know what to do next.",
  "landing.problem": "Access to rights, services, and opportunities depends on finding information you understand and trust. For many communities, essential information is fragmented, outdated, or hidden.",
  "landing.solution": "Civora makes civic information visible, verifiable, and actionable.",

  // ── Language ────────────────────────────────────────────────────────────────
  "lang.en": "English",
  "lang.ha": "Hausa",
  "lang.fr": "Français",
  "lang.switch": "Language",
};

export default en;
