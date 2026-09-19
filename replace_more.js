const fs = require('fs');
let file = fs.readFileSync('src/app/(citizen)/more/page.tsx', 'utf8');

file = file.replace(
  'import { useSimpleMode } from "@/components/system/SimpleMode";',
  'import { useSimpleMode } from "@/components/system/SimpleMode";\nimport { useLocale } from "@/components/system/LocaleProvider";\nimport { t } from "@/lib/i18n/i18n";'
);

file = file.replace(
  'export default function MorePage() {',
  'export default function MorePage() {\n  const { locale } = useLocale();'
);

file = file.replace(
  /"More"/,
  't("more.title", locale)'
);
file = file.replace(
  /Settings, guidance and demo tools\./,
  '{t("more.subtitle", locale)}'
);

file = file.replace(
  /label: "Privacy", body: "How identity and evidence are handled"/,
  'label: t("more.link.privacy.label", locale), body: t("more.link.privacy.body", locale)'
);
file = file.replace(
  /label: "Get help", body: "Emergency guidance and referral pathways"/,
  'label: t("more.link.help.label", locale), body: t("more.link.help.body", locale)'
);
file = file.replace(
  /label: "Community cases", body: "Browse public case progress"/,
  'label: t("more.link.community.label", locale), body: t("more.link.community.body", locale)'
);
file = file.replace(
  /label: "Responder workspace", body: "Demo access for institutional responders"/,
  'label: t("more.link.responder.label", locale), body: t("more.link.responder.body", locale)'
);

file = file.replace(
  />Language & Display</,
  '>{t("more.settings.title", locale)}<'
);
file = file.replace(
  />Simple Mode</,
  '>{t("more.settings.simple.title", locale)}<'
);
file = file.replace(
  /Larger text, simpler layout, easier to read\./,
  '{t("more.settings.simple.desc", locale)}'
);
file = file.replace(
  />Language</,
  '>{t("more.settings.lang.title", locale)}<'
);
file = file.replace(
  /Select your preferred language\./,
  '{t("more.settings.lang.desc", locale)}'
);
file = file.replace(
  />Reduce motion</,
  '>{t("more.settings.motion.title", locale)}<'
);
file = file.replace(
  /Minimize transitions\. Follows your system preference automatically\./,
  '{t("more.settings.motion.desc", locale)}'
);

file = file.replace(
  />Demo tools</,
  '>{t("more.demo.title", locale)}<'
);
file = file.replace(
  /Demo data restored to the original fictional dataset\./,
  '{t("more.demo.reset_done", locale)}'
);
file = file.replace(
  />\s*Reset demo data\s*<\/Button>/,
  '>{t("more.demo.reset_btn", locale)}</Button>'
);
file = file.replace(
  />\s*Clear device tracking\s*<\/Button>/,
  '>{t("more.demo.clear_btn", locale)}</Button>'
);
file = file.replace(
  /Reset restores the seeded fictional cases — useful before a demo run\. Clearing device\s*tracking removes this device's case links \(drafts kept\)\./,
  '{t("more.demo.hint", locale)}'
);

file = file.replace(
  />About Civora</,
  '>{t("more.about.title", locale)}<'
);
file = file.replace(
  /Civora is a trusted civic incident platform: report community problems safely, preserve\s*and organize evidence, coordinate appropriate response, and transparently track what\s*happens next\./,
  '{t("more.about.p1", locale)}'
);
file = file.replace(
  /It separates <strong className="font-semibold text-ink">reported<\/strong>,\s*<strong className="font-semibold text-ink">verified<\/strong>,\s*<strong className="font-semibold text-ink">responded<\/strong> and\s*<strong className="font-semibold text-ink">resolved<\/strong> — because collapsing them\s*is how communities lose trust in information\./,
  '{t("more.about.p2_1", locale)} <strong className="font-semibold text-ink">{t("more.about.p2_reported", locale)}</strong>{t("more.about.p2_2", locale)} <strong className="font-semibold text-ink">{t("more.about.p2_verified", locale)}</strong>{t("more.about.p2_3", locale)} <strong className="font-semibold text-ink">{t("more.about.p2_responded", locale)}</strong> {t("more.about.p2_4", locale)} <strong className="font-semibold text-ink">{t("more.about.p2_resolved", locale)}</strong> {t("more.about.p2_5", locale)}'
);

file = file.replace(
  /title="Reset demo data\?"/,
  'title={t("more.dialog.title", locale)}'
);
file = file.replace(
  /description="All cases return to the original fictional dataset, including the primary demo case CS-1042\. Reports you submitted in this session will be removed\."/,
  'description={t("more.dialog.desc", locale)}'
);
file = file.replace(
  /confirmLabel="Reset demo data"/,
  'confirmLabel={t("more.dialog.confirm", locale)}'
);

file = file.replace(
  /"Device-local tracking cleared\. Demo tracking will re-seed on your next visit to Home\."/,
  't("more.clear_notice", locale)'
);

fs.writeFileSync('src/app/(citizen)/more/page.tsx', file);
