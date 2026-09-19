"use client";

import { createContext, useContext, useEffect, useState } from "react";

type SimpleModeContextType = {
  isSimpleMode: boolean;
  setSimpleMode: (v: boolean) => void;
};

const SimpleModeContext = createContext<SimpleModeContextType>({
  isSimpleMode: false,
  setSimpleMode: () => {},
});

export function SimpleModeProvider({ children }: { children: React.ReactNode }) {
  const [isSimpleMode, setSimpleModeState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("civora-simple-mode") === "true";
    setSimpleModeState(saved);
    
    if (saved) {
      document.documentElement.setAttribute("data-simple", "true");
    } else {
      document.documentElement.removeAttribute("data-simple");
    }
    
    setMounted(true);
  }, []);

  const setSimpleMode = (v: boolean) => {
    setSimpleModeState(v);
    localStorage.setItem("civora-simple-mode", String(v));
    
    if (v) {
      document.documentElement.setAttribute("data-simple", "true");
    } else {
      document.documentElement.removeAttribute("data-simple");
    }
  };

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <SimpleModeContext.Provider value={{ isSimpleMode, setSimpleMode }}>
      {children}
    </SimpleModeContext.Provider>
  );
}

export function useSimpleMode() {
  return useContext(SimpleModeContext);
}
