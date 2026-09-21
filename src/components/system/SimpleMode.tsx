"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type SimpleModeContextType = {
  isSimpleMode: boolean;
  setSimpleMode: (v: boolean) => void;
};

const SimpleModeContext = createContext<SimpleModeContextType>({
  isSimpleMode: false,
  setSimpleMode: () => {}
});

/**
 * Simplified reading mode, remembered per device.
 *
 * Two things here were load-bearing enough to be worth stating.
 *
 * The preference is read inside a try/catch. `localStorage` is not merely
 * empty when a browser is in private mode, has site data blocked, or is
 * managed by an enterprise policy — *accessing the property itself throws*.
 * This provider wraps the whole application, so an unguarded read took the
 * entire page down, and with no error boundary above it the visible result
 * was a blank screen carrying one line about a client-side exception.
 *
 * And children render immediately rather than behind `visibility: hidden`
 * until mount. Hiding the application until an effect has run costs every
 * visitor a blank first paint, breaks server-rendered content for search and
 * screen readers, and — when the effect throws before it can clear the flag —
 * never reveals the page at all. LocaleProvider had the same pattern removed
 * for the same reason; this is the other half of that change. A reader who
 * has chosen simple mode may see one frame of the standard layout, which is
 * the honest cost of never showing anyone nothing.
 */
export function SimpleModeProvider({ children }: { children: React.ReactNode }) {
  const [isSimpleMode, setSimpleModeState] = useState(false);

  /** Mirrors the flag onto <html> so CSS can key off it. */
  const apply = (v: boolean) => {
    if (v) document.documentElement.setAttribute("data-simple", "true");
    else document.documentElement.removeAttribute("data-simple");
  };

  useEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem("civora-simple-mode") === "true";
    } catch {
      // Storage blocked — stay on the default rather than taking the page down.
    }
    setSimpleModeState(saved);
    apply(saved);
  }, []);

  const setSimpleMode = useCallback((v: boolean) => {
    setSimpleModeState(v);
    apply(v);
    try {
      localStorage.setItem("civora-simple-mode", String(v));
    } catch {
      // Preference simply won't persist.
    }
  }, []);

  const value = useMemo(() => ({ isSimpleMode, setSimpleMode }), [isSimpleMode, setSimpleMode]);

  return <SimpleModeContext.Provider value={value}>{children}</SimpleModeContext.Provider>;
}

export function useSimpleMode() {
  return useContext(SimpleModeContext);
}
