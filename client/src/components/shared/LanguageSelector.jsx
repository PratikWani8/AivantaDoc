import { useRef, useState, useEffect } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const languages = [
  { code: 'en', label: 'EN',      full: 'English' },
  { code: 'hi', label: 'हिन्दी', full: 'Hindi' },
  { code: 'mr', label: 'मराठी',  full: 'Marathi' },
]

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = languages.find(l => l.code === language) || languages[0]

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span>{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg py-1 z-50 animate-fade-in">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setOpen(false) }}
              className={[
                'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                lang.code === language
                  ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              <span className="font-medium w-12 text-left">{lang.label}</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs">{lang.full}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
