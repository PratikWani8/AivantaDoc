import { createContext, useContext, useEffect, useState } from 'react'
import en from '../i18n/en'
import hi from '../i18n/hi'
import mr from '../i18n/mr'

const translations = { en, hi, mr }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('aivanta-lang') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('aivanta-lang', language)
  }, [language])

  const t = (key) => {
    const parts = key.split('.')
    let result = translations[language]
    for (const part of parts) {
      result = result?.[part]
    }
    // Fallback to English
    if (result === undefined) {
      let fallback = translations['en']
      for (const part of parts) {
        fallback = fallback?.[part]
      }
      return fallback ?? key
    }
    return result
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
