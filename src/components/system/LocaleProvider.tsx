"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALES, type Locale } from "@/lib/validation/schemas";
import { localeDirection } from "@/lib/i18n/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => undefined
});

function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as readonly string[]).includes(value);
}

/**
 * Language preference, remembered per device.
 *
 * The previous version hid the entire application behind `visibility: hidden`
 * until it had mounted, which broke server rendering for search, screen
 * readers and anyone on a slow connection. Children now render immediately in
 * the default locale and re-render once the saved preference is read.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("civora-locale");
      if (isLocale(saved)) setLocaleState(saved);
    } catch {
      // Storage blocked (private browsing, policy) — stay on the default.
    }
  }, []);

  useEffect(() => {
    // Keep the document language in step so assistive technology announces
    // content in the right voice, and the direction with it.
    //
    // Setting `dir` on <html> is what flips the layout for Arabic. It only
    // works because the components were converted from physical Tailwind
    // classes to logical ones — ms/me, ps/pe, start/end, text-start — which
    // resolve against this attribute. With ml-4 and text-left the document
    // direction would change and the layout would stay stubbornly
    // left-to-right, which is the usual way "we support RTL" turns out to
    // mean the text merely runs backwards inside a Western layout.
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem("civora-locale", next);
    } catch {
      // Preference simply won't persist.
    }
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
