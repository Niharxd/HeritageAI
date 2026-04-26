import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const DarkModeContext = createContext<{ dark: boolean; toggle: () => void }>({
  dark: false, toggle: () => {}
});

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <DarkModeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
