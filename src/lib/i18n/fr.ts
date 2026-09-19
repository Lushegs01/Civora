// French translations
import type en from "./en";

const fr: Record<keyof typeof en, string> = {
  // Navigation
  "nav.home": "Accueil",
  "nav.cases": "Mes dossiers",
  "nav.explore": "Explorer",
  "nav.community": "Communauté",
  "nav.report": "Signaler",
  "nav.more": "Plus",
  "nav.privacy": "Confidentialité",
  "nav.resources": "Obtenir de l'aide",
  "nav.responder": "Intervenant",
  "nav.settings": "Paramètres",

  // Actions
  "action.report": "Signaler un problème",
  "action.explore": "Explorer les informations civiques",
  "action.track": "Suivre un dossier",
  "action.apply": "Postuler",
  "action.contact": "Contacter",
  "action.share": "Partager",
  "action.save": "Enregistrer pour plus tard",
  "action.view_source": "Voir la source originale",
  "action.corroborate": "Corroborer",
  "action.add_evidence": "Ajouter des preuves",
  "action.request_update": "Demander une mise à jour",
  "action.learn_more": "En savoir plus",
  "action.search": "Rechercher",
  "action.filter": "Filtrer",
  "action.back": "Retour",
  "action.next": "Suivant",
  "action.submit": "Soumettre",
  "action.cancel": "Annuler",
  "action.close": "Fermer",
  "action.retry": "Réessayer",
  "action.explain_simply": "Expliquer simplement",
  "action.how_verified": "Comment cela a été vérifié",
  "action.why_trusted": "Pourquoi cette information est fiable",

  // Reporting categories
  "category.safety": "Sécurité",
  "category.community": "Problème communautaire",
  "category.service": "Service public",
  "category.infrastructure": "Infrastructure",
  "category.dispute": "Conflit",
  "category.other": "Autre",

  // Civic categories
  "civic.category.service": "Service public",
  "civic.category.right": "Droits",
  "civic.category.policy": "Politique",
  "civic.category.opportunity": "Opportunité",
  "civic.category.project": "Projet public",
  "civic.category.safety": "Information de sécurité",
  "civic.category.procedure": "Procédure",

  // Privacy states
  "privacy.anonymous": "Anonyme",
  "privacy.anonymous.desc": "Votre identité n'est pas attachée au dossier",
  "privacy.confidential": "Confidentiel",
  "privacy.confidential.desc": "Visible uniquement par les intervenants autorisés",
  "privacy.identified": "Identifié",
  "privacy.identified.desc": "Partagé avec les intervenants autorisés",

  // Verification states
  "verification.unverified": "Non vérifié",
  "verification.unverified.desc": "Seul le rapport initial existe. Rien n'a encore été confirmé.",
  "verification.partially_verified": "Partiellement vérifié",
  "verification.partially_verified.desc": "Plusieurs rapports concordants ou preuves partielles existent.",
  "verification.documented": "Documenté",
  "verification.documented.desc": "Une source primaire pertinente ou des preuves solides documentent la réclamation.",
  "verification.conflicting": "Contradictoire",
  "verification.conflicting.desc": "Les sources de preuves sont en désaccord. La divergence est documentée, non jugée.",
  "verification.resolved": "Résolu",
  "verification.resolved.desc": "Le dossier a une réponse documentée et est considéré comme clos.",

  // Response states
  "response.not_assigned": "Non assigné",
  "response.received": "Reçu",
  "response.acknowledged": "Reconnu",
  "response.in_progress": "En cours",
  "response.action_recorded": "Action enregistrée",
  "response.closed": "Clos",

  // Freshness states
  "freshness.current": "Actuel",
  "freshness.current.desc": "Cette information a été vérifiée récemment et est considérée comme à jour.",
  "freshness.review_needed": "Révision nécessaire",
  "freshness.review_needed.desc": "Cette information n'a pas été revérifiée récemment. Elle peut nécessiter confirmation.",
  "freshness.outdated": "Obsolète",
  "freshness.outdated.desc": "La source est connue pour avoir changé ou l'information est trop ancienne.",
  "freshness.conflicting": "Contradictoire",
  "freshness.conflicting.desc": "Plusieurs sources crédibles sont en désaccord. La divergence est documentée.",

  // Trust labels
  "trust.source_identified": "Source identifiée",
  "trust.document_linked": "Document officiel lié",
  "trust.verified_recently": "Vérifié récemment",
  "trust.evidence_attached": "Preuves jointes",
  "trust.conflicts_disclosed": "Conflits divulgués",
  "trust.ai_not_authority": "L'IA n'a pas déterminé la vérification",
  "trust.why_trusted": "Pourquoi cette information est fiable",
  "trust.what_uncertain": "Ce qui reste incertain",
  "trust.known": "Ce que nous savons",
  "trust.uncertain": "Ce qui reste incertain",

  // Next action labels
  "next.report_issue": "Signaler ce problème",
  "next.contact_org": "Contacter l'organisation",
  "next.view_source": "Voir la source officielle",
  "next.add_evidence": "Ajouter des preuves",
  "next.track_case": "Suivre ce dossier",
  "next.share_info": "Partager des informations vérifiées",
  "next.apply_now": "Postuler maintenant",
  "next.request_clarification": "Demander des éclaircissements",
  "next.save_later": "Enregistrer pour plus tard",

  // Jurisdiction
  "jurisdiction.applies_to": "S'applique à",
  "jurisdiction.federal": "Fédéral",
  "jurisdiction.state": "État",
  "jurisdiction.local": "Local",
  "jurisdiction.not_applicable": "Ne s'applique pas à votre région",

  // System messages
  "system.offline": "Vous êtes hors ligne. Les brouillons sont enregistrés localement.",
  "system.online": "Vous êtes de retour en ligne.",
  "system.syncing": "Synchronisation des rapports en attente…",
  "system.sync_complete": "Tous les rapports ont été synchronisés.",
  "system.sync_failed": "Certains rapports n'ont pas pu être synchronisés. Nouvel essai prévu.",
  "system.ai_assisted": "Explication assistée par IA",
  "system.ai_summary": "Résumé assisté par IA",
  "system.ai_translation": "Traduction assistée par IA",
  "system.demo_data": "Données fictives de démonstration",
  "system.original_source": "Source originale",
  "system.translated_from": "Traduit de",
  "system.loading": "Chargement…",
  "system.no_results": "Aucun résultat trouvé",
  "system.error": "Un problème est survenu",

  // Explore page
  "explore.title": "Explorateur civique",
  "explore.subtitle": "Trouvez des informations fiables sur les services, droits, politiques et problèmes communautaires.",
  "explore.search_placeholder": "Rechercher des services, droits, politiques…",
  "explore.tab.all": "Tout",
  "explore.tab.services": "Services",
  "explore.tab.rights": "Droits",
  "explore.tab.policies": "Politiques",
  "explore.tab.issues": "Problèmes",
  "explore.tab.opportunities": "Opportunités",
  "explore.tab.safety": "Sécurité",
  "explore.tab.projects": "Projets",

  // Trust card
  "trustcard.heading": "Information civique fiable",
  "trustcard.source": "Source",
  "trustcard.published": "Publié",
  "trustcard.last_verified": "Dernière vérification",
  "trustcard.jurisdiction": "Juridiction",
  "trustcard.what_means": "Ce que cela signifie",
  "trustcard.what_uncertain": "Ce qui reste incertain",
  "trustcard.evidence": "Preuves",
  "trustcard.original_source": "Source originale",
  "trustcard.what_you_can_do": "Ce que vous pouvez faire",
  "trustcard.eligibility": "Admissibilité",
  "trustcard.requirements": "Exigences",
  "trustcard.fees": "Frais",
  "trustcard.deadlines": "Délais",
  "trustcard.contact": "Contact",

  // Simple mode
  "simple.enable": "Vue simplifiée",
  "simple.disable": "Vue standard",
  "simple.description": "Texte plus grand, mise en page plus simple, plus facile à lire",

  // Landing
  "landing.headline": "Une information en laquelle vous pouvez avoir confiance",
  "landing.subheadline": "Sachez ce qui se passe. Sachez ce qui est vérifié. Sachez quoi faire ensuite.",
  "landing.problem": "L'accès aux droits et services dépend de la recherche d'informations fiables. Pour de nombreuses communautés, les informations essentielles sont fragmentées ou obsolètes.",
  "landing.solution": "Civora rend l'information civique visible, vérifiable et exploitable.",

  // Language
  "lang.en": "Anglais",
  "lang.sw": "Swahili",
  "lang.fr": "Français",
  "lang.switch": "Langue"
};

export default fr;
