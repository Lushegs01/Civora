const fs = require('fs');
let file = fs.readFileSync('src/components/report/ReportWizard.tsx', 'utf8');

file = file.replace(
  'import { useCallback, useEffect, useMemo, useRef, useState } from "react";',
  'import { useCallback, useEffect, useMemo, useRef, useState } from "react";\nimport { useLocale } from "@/components/system/LocaleProvider";\nimport { t } from "@/lib/i18n/i18n";'
);

file = file.replace(
  'export function ReportWizard() {',
  'export function ReportWizard() {\n  const { locale } = useLocale();'
);

file = file.replace(/Step \$\{step \+ 1\} of \$\{STEPS.length\} · \$\{STEPS\[step\]\}/, `\${t("report.step", locale)} \${step + 1} \${t("report.of", locale)} \${STEPS.length} · \${t(\`report.step_name.\${STEPS[step].toLowerCase()}\`, locale)}`);
file = file.replace(/"Leave report"/g, 't("report.leave_report", locale)');
file = file.replace(/"Previous step"/g, 't("report.previous_step", locale)');

file = file.replace(
  /<strong className="font-semibold">No connection.<\/strong> You can keep writing — your\s*draft is saved on this device./g,
  '<strong className="font-semibold">{t("report.no_connection.title", locale)}</strong> {t("report.no_connection.desc", locale)}'
);

file = file.replace(
  /<strong className="font-semibold">Draft restored<\/strong>/,
  '<strong className="font-semibold">{t("report.draft_restored.title", locale)}</strong>'
);

file = file.replace(
  /<span className="text-ink-soft"> — saved \{relativeTime\(draftRestored\)\}<\/span>/,
  '<span className="text-ink-soft"> {t("report.draft_restored.desc", locale)} {relativeTime(draftRestored)}</span>'
);

file = file.replace(
  />\s*Start over\s*<\/button>/,
  '>{t("report.draft_restored.start_over", locale)}</button>'
);

file = file.replace(
  /step === 0\s*\?\s*"Choose the category that fits best."\s*:\s*step === 1\s*\?\s*"Please describe what happened in at least 20 characters."\s*:\s*step === 3\s*\?\s*"Pick the date and time it happened."\s*:\s*step === 5\s*\?\s*"Choose how your identity should be handled."\s*:\s*"This step needs your attention."/,
  `step === 0
          ? t("report.error.category", locale)
          : step === 1
            ? t("report.error.description", locale)
            : step === 3
              ? t("report.error.time", locale)
              : step === 5
                ? t("report.error.privacy", locale)
                : t("report.error.general", locale)`
);

file = file.replace(
  />\s*Back\s*<\/Button>/g,
  '>{t("report.action.back", locale)}</Button>'
);
file = file.replace(
  />\s*Continue\s*<\/Button>/,
  '>{t("report.action.continue", locale)}</Button>'
);

file = file.replace(
  /Submitting…/,
  '{t("report.action.submitting", locale)}'
);
file = file.replace(
  /Submit secure report/,
  '{t("report.action.submit_secure", locale)}'
);

file = file.replace(
  /title="Leave this report\?"/,
  'title={t("report.leave.title", locale)}'
);

file = file.replace(
  /Your draft stays saved on this device. You can pick up where you left off any time./,
  '{t("report.leave.desc", locale)}'
);

file = file.replace(
  />\s*Keep editing\s*<\/Button>/,
  '>{t("report.leave.keep_editing", locale)}</Button>'
);
file = file.replace(
  />\s*Leave for now\s*<\/Button>/,
  '>{t("report.leave.leave_now", locale)}</Button>'
);

file = file.replace(
  /"Something went wrong while submitting your report."/g,
  't("report.error.submit", locale)'
);


file = file.replace(
  /function CategoryStep\(\{ data, onChange \}: \{ data: WizardData; onChange: \(p: Partial<WizardData>\) => void \}\) \{/,
  'function CategoryStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {\n  const { locale } = useLocale();'
);
file = file.replace(
  /title="What would you like to report\?"/,
  'title={t("report.category.title", locale)}'
);
file = file.replace(
  /hint="Pick the closest fit — the responding organization can adjust it later."/,
  'hint={t("report.category.hint", locale)}'
);
file = file.replace(
  /<strong className="font-semibold">Immediate danger\?<\/strong>/,
  '<strong className="font-semibold">{t("report.category.immediate_danger", locale)}</strong>'
);
file = file.replace(
  /Contact the appropriate\s*emergency or protection service first./,
  '{t("report.category.danger_desc1", locale)}'
);
file = file.replace(
  />\s*Get help\s*<\/Link>/,
  '>{t("report.category.danger_help", locale)}</Link>'
);
file = file.replace(
  /\. Civora is not an emergency service\./,
  '{t("report.category.danger_desc2", locale)}'
);

file = file.replace(
  /function DescriptionStep\(\{ data, onChange \}: \{ data: WizardData; onChange: \(p: Partial<WizardData>\) => void \}\) \{/,
  'function DescriptionStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {\n  const { locale } = useLocale();'
);
file = file.replace(
  /title="What happened\?"/,
  'title={t("report.description.title", locale)}'
);
file = file.replace(
  /placeholder="Describe what you saw or experienced…"/,
  'placeholder={t("report.description.placeholder", locale)}'
);
file = file.replace(
  /<p>You don't need to know who is responsible to submit a report.<\/p>/,
  '<p>{t("report.description.hint", locale)}</p>'
);
file = file.replace(
  /Description\s*<\/label>/,
  '{t("report.step_name.description", locale)}\n      </label>'
);

file = file.replace(
  /function LocationStep\(\{ data, onChange \}: \{ data: WizardData; onChange: \(p: Partial<WizardData>\) => void \}\) \{/,
  'function LocationStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {\n  const { locale } = useLocale();'
);
file = file.replace(
  /title="Where did it happen\?"/,
  'title={t("report.location.title", locale)}'
);
file = file.replace(
  /hint="A general area or landmark is enough. Location is optional."/,
  'hint={t("report.location.hint", locale)}'
);
file = file.replace(
  /<span className="block text-\[14.5px\] font-semibold text-ink">Use current location<\/span>/,
  '<span className="block text-[14.5px] font-semibold text-ink">{t("report.location.use_current", locale)}</span>'
);
file = file.replace(
  /Shared:/,
  '{t("report.location.shared", locale)}'
);
file = file.replace(
  /"Adds approximate coordinates to the report"/,
  't("report.location.adds_approx", locale)'
);
file = file.replace(
  /Select location manually/,
  '{t("report.location.select_manual", locale)}'
);
file = file.replace(
  /placeholder="e\.g\. North walkway, near Halls B entrance"/,
  'placeholder={t("report.location.placeholder", locale)}'
);
file = file.replace(
  /Skip location/,
  '{t("report.location.skip", locale)}'
);
file = file.replace(
  /The report can still be submitted without it/,
  '{t("report.location.skip_hint", locale)}'
);
file = file.replace(
  /"Location isn't available on this device. You can type an area instead."/,
  't("report.location.error_unavailable", locale)'
);
file = file.replace(
  /"We couldn't get your location. You can type a general area instead."/,
  't("report.location.error_failed", locale)'
);

file = file.replace(
  /function TimeStep\(\{ data, onChange \}: \{ data: WizardData; onChange: \(p: Partial<WizardData>\) => void \}\) \{/,
  'function TimeStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {\n  const { locale } = useLocale();'
);
file = file.replace(
  /const options: Array<\{ key: "now" \| "earlier" \| "custom"; label: string; hint: string \}> = \[[\s\S]*?\];/,
  `const options: Array<{ key: "now" | "earlier" | "custom"; label: string; hint: string }> = [
    { key: "now", label: t("report.time.now.label", locale), hint: t("report.time.now.hint", locale) },
    { key: "earlier", label: t("report.time.earlier.label", locale), hint: t("report.time.earlier.hint", locale) },
    { key: "custom", label: t("report.time.custom.label", locale), hint: t("report.time.custom.hint", locale) }
  ];`
);
file = file.replace(
  /title="When did it happen\?"/,
  'title={t("report.time.title", locale)}'
);
file = file.replace(
  /hint="An approximate time is fine."/,
  'hint={t("report.time.hint", locale)}'
);
file = file.replace(
  /Date and time\s*<\/label>/,
  '{t("report.time.date_time_label", locale)}\n            </label>'
);

file = file.replace(
  /function EvidenceStep\(\{ data, onChange \}: \{ data: WizardData; onChange: \(p: Partial<WizardData>\) => void \}\) \{/,
  'function EvidenceStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {\n  const { locale } = useLocale();'
);
file = file.replace(
  /title="Add evidence"/,
  'title={t("report.evidence.title", locale)}'
);
file = file.replace(
  /hint="Photo, video, document or other supporting material. Evidence is optional — you can submit a report without attaching anything."/,
  'hint={t("report.evidence.hint", locale)}'
);
file = file.replace(
  /\{preparing \? "Preparing files…" : "Attach files"\}/,
  '{preparing ? t("report.evidence.preparing", locale) : t("report.evidence.attach", locale)}'
);
file = file.replace(
  />Photos are compressed automatically · max 8 MB each</,
  '>{t("report.evidence.compress_hint", locale)}<'
);
file = file.replace(
  /aria-label="Attach evidence files"/,
  'aria-label={t("report.evidence.attach_label", locale)}'
);
file = file.replace(
  /aria-label=\{\`Remove \$\{f.fileName\}\`\}/,
  'aria-label={`${t("report.evidence.remove", locale)} ${f.fileName}`}'
);
file = file.replace(
  /KB · checksum recorded on submit/,
  '{t("report.evidence.kb", locale)}'
);
file = file.replace(
  /Evidence is stored with its source and a SHA-256 checksum so its integrity can be checked\s*later\./,
  '{t("report.evidence.integrity", locale)}'
);

file = file.replace(
  /function PrivacyStep\(\{ data, onChange \}: \{ data: WizardData; onChange: \(p: Partial<WizardData>\) => void \}\) \{/,
  'function PrivacyStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {\n  const { locale } = useLocale();'
);
file = file.replace(
  /title="Your privacy"/,
  'title={t("report.privacy.title", locale)}'
);
file = file.replace(
  /hint="Choose how your identity is handled. You can report without identifying yourself."/,
  'hint={t("report.privacy.hint", locale)}'
);
file = file.replace(
  /<span className="chip bg-success-soft text-success">Recommended default<\/span>/,
  '<span className="chip bg-success-soft text-success">{t("report.privacy.recommended", locale)}</span>'
);
file = file.replace(
  /Name or contact \{data.privacyMode === "identified" \? "\(optional\)" : "\(optional\)"\}/,
  '{t("report.privacy.name_label", locale)}'
);
file = file.replace(
  /placeholder="e\.g\. Amina, Halls B resident"/,
  'placeholder={t("report.privacy.name_placeholder", locale)}'
);
file = file.replace(
  /Only visible to authorized case handlers — never shown publicly\./,
  '{t("report.privacy.name_hint", locale)}'
);


file = file.replace(
  /function ReviewStep\(\{ data, onEdit \}: \{ data: WizardData; onEdit: \(step: number\) => void \}\) \{/,
  'function ReviewStep({ data, onEdit }: { data: WizardData; onEdit: (step: number) => void }) {\n  const { locale } = useLocale();'
);
file = file.replace(
  /"Now \(at submission\)"/,
  't("report.review.when_now", locale)'
);
file = file.replace(
  /"Not set"/,
  't("report.review.not_set", locale)'
);
file = file.replace(
  /label: "Category"/,
  'label: t("report.step_name.category", locale)'
);
file = file.replace(
  /label: "Description"/,
  'label: t("report.step_name.description", locale)'
);
file = file.replace(
  /label: "Location"/,
  'label: t("report.step_name.location", locale)'
);
file = file.replace(
  /"plus device coordinates"/,
  't("report.review.plus_coordinates", locale)'
);
file = file.replace(
  /"Not shared"/,
  't("report.review.not_shared", locale)'
);
file = file.replace(
  /label: "When"/,
  'label: t("report.step_name.time", locale)'
);
file = file.replace(
  /label: "Evidence"/,
  'label: t("report.step_name.evidence", locale)'
);
file = file.replace(
  /"None attached \(optional\)"/,
  't("report.review.none_attached", locale)'
);
file = file.replace(
  /\`\$\{data.evidence.length\} file\$\{data.evidence.length === 1 \? "" : "s"\}\`/,
  '`${data.evidence.length} ${data.evidence.length === 1 ? t("report.review.file", locale) : t("report.review.files", locale)}`'
);
file = file.replace(
  /label: "Privacy"/,
  'label: t("report.step_name.privacy", locale)'
);
file = file.replace(
  /"—"/g,
  't("report.review.none", locale)'
);
file = file.replace(
  /title="Review your report"/,
  'title={t("report.review.title", locale)}'
);
file = file.replace(
  /hint="Check everything before you submit. You can edit any section."/,
  'hint={t("report.review.hint", locale)}'
);
file = file.replace(
  /aria-label=\{\`Edit \$\{r.label\}\`\}/,
  'aria-label={`${t("report.review.edit", locale)} ${r.label}`}'
);
file = file.replace(
  />\s*Edit\s*<\/button>/g,
  '>{t("report.review.edit", locale)}</button>'
);
file = file.replace(
  /Your identity is handled according to the privacy\s*mode you select\./,
  '{t("report.review.privacy_note", locale)}'
);
file = file.replace(
  /Submitting is not the same as verifying. New reports start as/,
  '{t("report.review.unverified_note_1", locale)}'
);
file = file.replace(
  /<strong className="font-semibold text-ink">Unverified<\/strong>\./,
  '<strong className="font-semibold text-ink">{t("report.review.unverified_note_2", locale)}</strong>'
);

file = file.replace(
  /function OutcomeScreen\(\{\s*outcome,\s*category,\s*privacyMode\s*\}\: \{/m,
  'function OutcomeScreen({ outcome, category, privacyMode }: { outcome: SubmitOutcome; category?: CaseCategory; privacyMode?: PrivacyMode; }) {\n  const { locale } = useLocale();\n'
);
file = file.replace(
  /function OutcomeScreen\(\{[\s\S]*?privacyMode\?: PrivacyMode;\s*\}\) \{\s*const \{ locale \} = useLocale\(\);\s*/,
  'function OutcomeScreen({ outcome, category, privacyMode }: { outcome: SubmitOutcome; category?: CaseCategory; privacyMode?: PrivacyMode; }) {\n  const { locale } = useLocale();\n'
);

file = file.replace(
  /No connection<\/h1>/,
  '{t("report.outcome.queued.title", locale)}</h1>'
);
file = file.replace(
  /Your report has been saved securely on this device.\s*<br \/>\s*We'll submit it when you're back online./,
  '{t("report.outcome.queued.desc", locale)}'
);
file = file.replace(
  /Your cases<\/Button>/,
  '{t("report.outcome.queued.your_cases", locale)}</Button>'
);
file = file.replace(
  /Back to home<\/Button>/g,
  '{t("report.outcome.success.back_home", locale)}</Button>'
);
file = file.replace(
  /Something went wrong while submitting your report.<\/h1>/,
  '{t("report.outcome.error.title", locale)}</h1>'
);
file = file.replace(
  /Try again<\/Button>/,
  '{t("report.outcome.error.try_again", locale)}</Button>'
);
file = file.replace(
  /\{outcome.linkedTo \? "Report submitted safely." : "Report submitted safely."\}/,
  '{t("report.outcome.success.title", locale)}'
);
file = file.replace(
  /CASE #/,
  '{t("report.outcome.success.case", locale)}'
);
file = file.replace(
  /"Your report matched an existing case and was recorded as an independent corroborating report."/,
  't("report.outcome.success.linked_desc", locale)'
);
file = file.replace(
  /"Your report has been added to Civora."/,
  't("report.outcome.success.new_desc", locale)'
);
file = file.replace(
  /It has <strong className="font-semibold text-ink">not yet been verified<\/strong> — that\s*happens through evidence and review\./,
  '{t("report.outcome.success.not_verified_1", locale)} <strong className="font-semibold text-ink">{t("report.outcome.success.not_verified_2", locale)}</strong> {t("report.outcome.success.not_verified_3", locale)}'
);
file = file.replace(
  /View case<\/Button>/,
  '{t("report.outcome.success.view_case", locale)}</Button>'
);


fs.writeFileSync('src/components/report/ReportWizard.tsx', file);
