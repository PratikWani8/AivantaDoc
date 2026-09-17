import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function HowItWorks() {
  const { t } = useLanguage()
  const steps = t('howItWorks.steps')

  return (
    <section id="how-it-works" className="py-20 bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{t('howItWorks.heading')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('howItWorks.sub')}</p>
        </div>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i}>
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-5"
              >
                {/* Step number */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 pb-2 pt-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{step.label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
              {i < steps.length - 1 && (
                <div className="flex items-center ml-5 my-1">
                  <ArrowDown className="w-4 h-4 text-primary-300 dark:text-primary-700 ml-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
