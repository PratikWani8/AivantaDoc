import { motion } from 'framer-motion'
import { Lock, ShieldCheck, Server, Activity, CheckSquare, Eye } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const ICONS = [Lock, ShieldCheck, Server, Activity, CheckSquare, Eye]

export default function PrivacySafety() {
  const { t } = useLanguage()
  const items = t('privacy.items')

  return (
    <section id="privacy" className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{t('privacy.heading')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('privacy.sub')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-card"
              >
                <div className="w-9 h-9 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-4.5 h-4.5 text-green-600 dark:text-green-400" style={{ width: 18, height: 18 }} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Disclaimer */}
        <div className="max-w-3xl mx-auto bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-2xl p-5">
          <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed text-center">
            {t('privacy.disclaimer')}
          </p>
        </div>
      </div>
    </section>
  )
}
