"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export function CheckCase({ variant = "secondary" }: { variant?: "secondary" | "inline" }) {
  const { locale } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(variant === "inline");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function go(e?: React.FormEvent) {
    e?.preventDefault();
    const id = value.trim().toUpperCase();
    const normalized = id.startsWith("CS-") ? id : id ? `CS-${id}` : "";
    if (!/^CS-\d{3,6}$/.test(normalized)) {
      setError(t("check_case.error.format", locale) || "Enter a case ID like CS-1042.");
      return;
    }
    router.push(`/community/${normalized}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="press inline-flex min-h-12 items-center gap-2 rounded-btn border border-line bg-surface px-6 text-base font-medium text-ink hover:bg-muted"
      >
        <Icon name="search" className="h-4 w-4" />
        {t("check_case.button", locale) || "Check a case"}
      </button>
    );
  }

  return (
    <form onSubmit={go} className="w-full max-w-md" role="search" aria-label={t("check_case.aria_label", locale) || "Check a case"}>
      <div className="flex gap-2">
        <label htmlFor="check-case-input" className="sr-only">
          {t("check_case.input.label", locale) || "Case ID"}
        </label>
        <input
          id="check-case-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder={t("check_case.input.placeholder", locale) || "Case ID, e.g. CS-1042"}
          autoComplete="off"
          className="field flex-1"
          inputMode="text"
        />
        <button
          type="submit"
          className="press inline-flex min-h-[48px] items-center gap-2 rounded-btn bg-brand px-4 text-[14px] font-medium text-white hover:bg-brand-deep"
        >
          <Icon name="search" className="h-4 w-4" />
          <span className="hidden sm:inline">{t("check_case.submit", locale) || "Check"}</span>
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
