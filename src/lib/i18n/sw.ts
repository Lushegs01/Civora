// Swahili translations
import type en from "./en";

const sw: Record<keyof typeof en, string> = {
  // Navigation
  "nav.more": "Kari",
  "nav.privacy": "Sirri",
  "nav.resources": "Nemi Taimako",
  "nav.responder": "Mai bada amsa",
  "nav.settings": "Tsari",

  // Actions
  "action.report": "Kawo rahoton matsala",
  "action.explore": "Bincika bayanan gwamnati",
  "action.track": "Bibiyi korafi",
  "action.apply": "Nema",
  "action.contact": "Tuntubi",
  "action.share": "Raba",
  "action.save": "Ajiye don gaba",
  "action.view_source": "Duba ainihin tushe",
  "action.corroborate": "Tabbatar",
  "action.add_evidence": "Kara shaida",
  "action.request_update": "Nemi karin bayani",
  "action.learn_more": "Koyi fiye",
  "action.search": "Nema",
  "action.filter": "Tace",
  "action.back": "Baya",
  "action.next": "Gaba",
  "action.submit": "Aika",
  "action.cancel": "Soke",
  "action.close": "Rufe",
  "action.retry": "Sake gwadawa",
  "action.explain_simply": "Yi bayani a saukake",
  "action.how_verified": "Yadda aka tabbatar da wannan",
  "action.why_trusted": "Me yasa wannan bayanin abin dogaro ne",

  // Reporting categories
  "category.safety": "Tsaro",
  "category.community": "Matsalar al'umma",
  "category.service": "Ayyukan gwamnati",
  "category.infrastructure": "Kayan more rayuwa",
  "category.dispute": "Rikici",
  "category.other": "Sauran",

  // Civic categories
  "civic.category.service": "Ayyukan gwamnati",
  "civic.category.right": "Hakkoki",
  "civic.category.policy": "Tsari",
  "civic.category.opportunity": "Dama",
  "civic.category.project": "Aikin gwamnati",
  "civic.category.safety": "Bayanin tsaro",
  "civic.category.procedure": "Ka'ida",

  // Privacy states
  "privacy.anonymous": "Ba a bayyana suna ba",
  "privacy.anonymous.desc": "Ba a nuna sunanka ga korafe-korafen ba",
  "privacy.confidential": "A asirce",
  "privacy.confidential.desc": "Masu bada amsa kawai za su iya gani",
  "privacy.identified": "An gane",
  "privacy.identified.desc": "An raba tare da masu bada amsa",

  // Verification states
  "verification.unverified": "Ba a tabbatar ba",
  "verification.unverified.desc": "Rahoto na farko kawai ke nan. Babu abin da aka tabbatar tukunna.",
  "verification.partially_verified": "An tabbatar wani bangare",
  "verification.partially_verified.desc": "Akwai rahotanni ko wasu shaidu masu goyon baya.",
  "verification.documented": "An rubuta",
  "verification.documented.desc": "Tushe na asali ko shaidu masu karfi sun tabbatar da wannan.",
  "verification.conflicting": "Mai karo da juna",
  "verification.conflicting.desc": "Shaidu ba su yarda da juna ba. An rubuta bambancin, ba a yanke hukunci ba.",
  "verification.resolved": "An warware",
  "verification.resolved.desc": "An kammala wannan korafin tare da bayanin abin da aka yi.",

  // Response states
  "response.not_assigned": "Ba a ba da ba",
  "response.received": "An karba",
  "response.acknowledged": "An amsa",
  "response.in_progress": "Ana kan yi",
  "response.action_recorded": "An dauki mataki",
  "response.closed": "A rufe",

  // Freshness states
  "freshness.current": "Na yanzu",
  "freshness.current.desc": "An tabbatar da wannan bayanin kwanan nan kuma ana ganin dai-dai ne.",
  "freshness.review_needed": "Yana bukatar dubawa",
  "freshness.review_needed.desc": "Ba a sake tabbatar da wannan bayanin kwanan nan ba. Ana bukatar karin haske.",
  "freshness.outdated": "Ya wuce lokaci",
  "freshness.outdated.desc": "Tushen ya canza ko bayanin ya tsufa sosai.",
  "freshness.conflicting": "Mai karo da juna",
  "freshness.conflicting.desc": "Wasu tushe masu karfi basu yarda da juna ba. An rubuta bambancin.",

  // Trust labels
  "trust.source_identified": "An gane tushe",
  "trust.document_linked": "An sanya takardar hukuma",
  "trust.verified_recently": "An tabbatar kwanan nan",
  "trust.evidence_attached": "An sanya shaida",
  "trust.conflicts_disclosed": "An bayyana inda aka samu sabani",
  "trust.ai_not_authority": "Ba AI ne ya tabbatar ba",
  "trust.why_trusted": "Me yasa wannan bayanin abin dogaro ne",
  "trust.what_uncertain": "Abin da bai tabbata ba",
  "trust.known": "Abin da muka sani",
  "trust.uncertain": "Abin da bai tabbata ba",

  // Next action labels
  "next.report_issue": "Kawo rahoton wannan",
  "next.contact_org": "Tuntubi hukumar da ke da alhaki",
  "next.view_source": "Duba asalin tushen",
  "next.add_evidence": "Kara shaida",
  "next.track_case": "Bibiyi wannan korafin",
  "next.share_info": "Raba ingantaccen bayani",
  "next.apply_now": "Nema yanzu",
  "next.request_clarification": "Nemi karin haske",
  "next.save_later": "Ajiye don gaba",

  // Jurisdiction
  "jurisdiction.applies_to": "Ya shafi",
  "jurisdiction.federal": "Gwamnatin Tarayya",
  "jurisdiction.state": "Jiha",
  "jurisdiction.local": "Karamar Hukuma",
  "jurisdiction.not_applicable": "Ba ya shafi yankin da kake",

  // System messages
  "system.offline": "Baka da intanet. An ajiye rahoton a wayarka.",
  "system.online": "Yanzu kana kan intanet.",
  "system.syncing": "Ana aikawa da rahotanni...",
  "system.sync_complete": "An aika dukkan rahotanni lami lafiya.",
  "system.sync_failed": "Wasu rahotanni ba su tafi ba. Za a sake gwadawa.",
  "system.ai_assisted": "Bayani tare da taimakon AI",
  "system.ai_summary": "Takaicecen bayani da taimakon AI",
  "system.ai_translation": "Fassara tare da taimakon AI",
  "system.demo_data": "Bayanin gwaji",
  "system.original_source": "Asalin tushe",
  "system.translated_from": "An fassara daga",
  "system.loading": "Ana lodawa...",
  "system.no_results": "Babu sakamako",
  "system.error": "Wani abu ya same matsala",

  // Explore page
  "explore.title": "Binciken Al'umma",
  "explore.subtitle": "Nemi amintattun bayanai game da ayyuka, hakkoki, da matsalolin al'umma.",
  "explore.search_placeholder": "Bincika ayyuka, hakkoki...",
  "explore.tab.all": "Duka",
  "explore.tab.services": "Ayyuka",
  "explore.tab.rights": "Hakkoki",
  "explore.tab.policies": "Tsare-tsare",
  "explore.tab.issues": "Matsaloli",
  "explore.tab.opportunities": "Dama",
  "explore.tab.safety": "Tsaro",
  "explore.tab.projects": "Ayyukan gwamnati",

  // Trust card
  "trustcard.heading": "Amintaccen bayanin al'umma",
  "trustcard.source": "Tushe",
  "trustcard.published": "An wallafa",
  "trustcard.last_verified": "An tabbatar dashi na karshe",
  "trustcard.jurisdiction": "Yanki",
  "trustcard.what_means": "Abin da wannan ke nufi",
  "trustcard.what_uncertain": "Abin da bai tabbata ba",
  "trustcard.evidence": "Shaida",
  "trustcard.original_source": "Asalin tushe",
  "trustcard.what_you_can_do": "Abin da zaku iya yi",
  "trustcard.eligibility": "Wanda ya cancanta",
  "trustcard.requirements": "Abubuwan da ake bukata",
  "trustcard.fees": "Kudi",
  "trustcard.deadlines": "Ranar cikawa",
  "trustcard.contact": "Tuntubi",

  // Simple mode
  "simple.enable": "Sauki gani",
  "simple.disable": "Gani na asali",
  "simple.description": "Manyan rubutu, saukin tsari, saukin karantawa",

  // Landing
  "landing.headline": "Bayani da zaku iya dogaro da shi",
  "landing.subheadline": "San abin da ke faruwa. San abin da aka tabbatar. San abin da za'a yi gaba.",
  "landing.problem": "Samun damar hakkoki da ayyuka ya danganta ga samun bayani wanda zaku iya ganewa kuma ku dogara dashi. Ga al'ummomi da yawa, bayani na yau da kullum yana da wahalar samu ko ya tsufa.",
  "landing.solution": "Civora yana sa bayanin al'umma ya kasance a bayyane, mai tabbatarwa, kuma mai amfani.",
  "landing.hero.super": "Taarifa unayoweza kuiamini",
  "landing.hero.title1": "Jua haki zako.",
  "landing.hero.title2": "Ripoti kwa usalama.",
  "landing.hero.title3": "Thibitisha pamoja.",
  "landing.hero.desc": "Civora inakusaidia kupata taarifa zilizothibitishwa kuhusu huduma na fursa, na kuunganisha ripoti, ushahidi, na majibu katika mtiririko mmoja wazi.",
  "landing.hero.btn1": "Tafuta taarifa za kuaminika",
  "landing.hero.btn2": "Ripoti tatizo",
  "landing.try.title": "Jaribu onyesho",
  "landing.try.desc": "Pata uzoefu wa jukwaa kutoka kwa mitazamo mitatu. Data zote ni za kubuni tu.",
  "landing.try.btn1": "Chunguza kama raia",
  "landing.try.btn2": "Fungua nafasi ya mtoa majibu",
  "landing.try.btn3": "Vinjari kesi za umma",

  // Language
  "lang.en": "English",
  "lang.sw": "Kiswahili",
  "lang.fr": "Français",
  "lang.switch": "Lugha",
};

export default sw;
