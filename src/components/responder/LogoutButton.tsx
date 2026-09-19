"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { locale } = useLocale();
  return (
    <button
      onClick={async () => {
        setBusy(true);
        await fetch("/api/responder/session", { method: "DELETE" });
        router.push("/responder/access");
        router.refresh();
      }}
      disabled={busy}
      className="press inline-flex min-h-9 items-center gap-1.5 rounded-btn border border-line bg-surface px-3 text-[13px] font-medium text-ink-soft hover:bg-muted hover:text-ink"
    >
      <Icon name="logout" className="h-4 w-4" />
      {t("responder.logout", locale) || "Sign out"}
    </button>
  );
}