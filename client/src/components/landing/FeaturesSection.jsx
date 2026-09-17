import { motion } from 'framer-motion'
import {
  Scan, GitCompare, ShieldCheck, DollarSign, AlertCircle,
  TrendingUp, Database, Cpu, Server, Globe, FileCheck, BarChart2
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const ICONS = [Scan, GitCompare, ShieldCheck, DollarSign, AlertCircle, TrendingUp, Database, Cpu, Server, Globe, FileCheck, BarChart2]

export default function FeaturesSection() {
  const { t } = useLanguage()
  const items = t('features.items')

  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{t('features.heading')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('features.sub')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-card hover:shadow-card-hover hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200"
              >
                <div className="w-9 h-9 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" style={{ width: 18, height: 18 }} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
