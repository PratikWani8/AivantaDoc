import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, FileText, LogOut, LayoutDashboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '../shared/ThemeToggle'
import LanguageSelector from '../shared/LanguageSelector'
import Button from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

const NAV_LINKS = [
  { key: 'home',       href: '/#home'          },
  { key: 'about',      href: '/#about'         },
  { key: 'howItWorks', href: '/#how-it-works'  },
  { key: 'features',   href: '/#features'      },
  { key: 'privacy',    href: '/#privacy'       },
]

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => setOpen(false), [location])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-primary-700 transition-colors">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
              Aivanta<span className="text-primary-600">Doc</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.key}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t(`nav.${link.key}`)}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />} onClick={() => navigate('/dashboard')}>
                  {t('nav.dashboard')}
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>{t('nav.login')}</Button>
                <Button size="sm" onClick={() => navigate('/register')}>{t('nav.getStarted')}</Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map(link => (
                <a
                  key={link.key}
                  href={link.href}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {t(`nav.${link.key}`)}
                </a>
              ))}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              <div className="pt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Button variant="secondary" onClick={() => navigate('/dashboard')}>{t('nav.dashboard')}</Button>
                    <Button variant="ghost" onClick={handleLogout}>{t('nav.logout')}</Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => navigate('/login')}>{t('nav.login')}</Button>
                    <Button onClick={() => navigate('/register')}>{t('nav.getStarted')}</Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
