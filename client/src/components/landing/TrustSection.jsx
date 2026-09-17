import { motion } from 'framer-motion'
import { Scan, ShieldCheck, AlertCircle, Database, MessageSquare, Globe } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const ICONS = [Scan, ShieldCheck, AlertCircle, Database, MessageSquare, Globe]

export default function TrustSection() {
  const { t } = useLanguage()
  const items = t('trust.items')

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('trust.heading')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200"
              >
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
