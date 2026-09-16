import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-gray-950 dark:bg-gray-950 text-gray-400 mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Aivanta<span className="text-primary-400">Doc</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{t('footer.tagline')}</p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Platform</h3>
            <ul className="space-y-2.5">
              {[
                { label: t('footer.links.about'),      href: '/#about'        },
                { label: t('footer.links.howItWorks'), href: '/#how-it-works' },
                { label: t('footer.links.privacy'),    href: '/#privacy'      },
              ].map(link => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm hover:text-white transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Legal</h3>
            <ul className="space-y-2.5">
              {[
                { label: t('footer.links.terms'),   href: '#' },
                { label: t('footer.links.contact'), href: '#' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm hover:text-white transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">{t('footer.copy')}</p>
          <p className="text-xs text-gray-600">Built with AI for intelligent finance teams.</p>
        </div>
      </div>
    </footer>
  )
}
