import { motion } from 'framer-motion'
import { XCircle, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function AboutSection() {
  const { t } = useLanguage()
  const problems  = t('about.problems')

  return (
    <section id="about" className="py-20 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Problems */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('about.heading')}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t('about.problem')}</p>
            <ul className="space-y-3">
              {problems.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: Solution */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-950/30 dark:to-indigo-950/30 rounded-3xl border border-primary-100 dark:border-primary-900 p-8 space-y-5"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('about.solution')}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('about.solutionDesc')}</p>
            <div className="space-y-3 pt-2">
              {[
                'Automated data extraction from any format',
                'Real-time cross-document verification',
                'AI-powered anomaly and risk detection',
                'Natural language business intelligence',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
