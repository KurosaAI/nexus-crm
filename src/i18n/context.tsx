"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations, LANGUAGES, type Lang, type T } from "./translations"

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: T
  dir: "ltr" | "rtl"
}

const LanguageContext = createContext<LangCtx>({
  lang: "es",
  setLang: () => {},
  t: translations.es,
  dir: "ltr",
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es")

  useEffect(() => {
    const saved = localStorage.getItem("crm-lang") as Lang | null
    if (saved && translations[saved]) setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem("crm-lang", l)
    document.cookie = `crm-lang=${l};path=/;max-age=31536000`
  }

  const dir = LANGUAGES[lang].dir

  useEffect(() => {
    document.documentElement.dir = dir
  }, [dir])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
