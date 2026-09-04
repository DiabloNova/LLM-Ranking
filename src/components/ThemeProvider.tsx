"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";
type Direction = "ltr" | "rtl";
type Language = "en" | "fa";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  direction: Direction;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provides theme, language, and text-direction settings to descendant components.
 *
 * @param initialLanguage - The language used when no persisted language is available.
 * @returns A context provider containing theme, language, and direction settings.
 */
export function ThemeProvider({
  children,
  initialLanguage = "fa"
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [direction, setDirection] = useState<Direction>(initialLanguage === "fa" ? "rtl" : "ltr");

  const setTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    const root = window.document.documentElement;
    const dir: Direction = newLang === "fa" ? "rtl" : "ltr";

    root.setAttribute("lang", newLang);
    root.setAttribute("dir", dir);
    localStorage.setItem("language", newLang);

    setLanguageState(newLang);
    setDirection(dir);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = storedTheme || systemTheme;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(initialTheme);

    const storedLang = localStorage.getItem("language") as Language | null;
    let currentLang = initialLanguage;
    let currentDir: Direction = initialLanguage === "fa" ? "rtl" : "ltr";

    if (storedLang) {
      currentLang = storedLang;
      currentDir = storedLang === "fa" ? "rtl" : "ltr";
    }

    root.setAttribute("lang", currentLang);
    root.setAttribute("dir", currentDir);

    const timer = setTimeout(() => {
      setThemeState(initialTheme);
      setLanguageState(currentLang);
      setDirection(currentDir);
    }, 0);

    return () => clearTimeout(timer);
  }, [initialLanguage]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, direction, language, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
