import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, FileText, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import { useLanguage } from '../../context/LanguageContext'

function FloatingDoc({ className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className={`absolute bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-4 ${className}`}
    >
      {/* Document mock */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
            <FileText className="w-3 h-3 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded w-full" />
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">Trust Score</span>
          <span className="text-xs font-semibold text-green-600">96%</span>
        </div>
      </div>
    </motion.div>
  )
}

function AnomalyChip({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="absolute right-0 top-1/3 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900 shadow-card p-3 flex items-center gap-2.5"
    >
      <div className="w-7 h-7 bg-red-50 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
        <Shield className="w-3.5 h-3.5 text-red-500" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Anomaly Detected</p>
        <p className="text-xs text-gray-400">Duplicate invoice risk</p>
      </div>
    </motion.div>
  )
}

export default function Hero() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-white dark:bg-gray-950">
      {/* Background subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400 text-xs font-semibold border border-primary-100 dark:border-primary-900 mb-6">
                <Zap className="w-3 h-3" />
                AI-Powered Document Intelligence
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                {t('hero.headline')}
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl"
            >
              {t('hero.sub')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-3"
            >
              <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={() => navigate('/register')}>
                {t('hero.cta')}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('hero.secondary')}
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800"
            >
              {[
                { label: 'Document Types', value: '7+' },
                { label: 'Languages', value: '3'  },
                { label: 'AI Models', value: 'Mistral 7B' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — visual */}
          <div className="relative h-[500px] hidden lg:block">
            {/* Main center card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-8 bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-950/40 dark:to-indigo-950/40 rounded-3xl border border-primary-100 dark:border-primary-900 flex items-center justify-center"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-2xl mx-auto flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">Document Intelligence</p>
                <div className="space-y-1.5 px-8">
                  {['Extracting data...', 'Verifying PO match...', 'Checking for anomalies...', 'Scoring trust level...'].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 0.5 + i * 0.3, duration: 0.6 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                        {step}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <FloatingDoc className="top-4 left-0 w-48" delay={0.5} />
            <FloatingDoc className="bottom-8 left-8 w-44" delay={0.8} />
            <AnomalyChip delay={1} />

            {/* Trust score chip */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-0 right-4 bg-white dark:bg-gray-800 rounded-xl border border-green-100 dark:border-green-900 shadow-card p-3 flex items-center gap-2"
            >
              <div className="w-7 h-7 bg-green-50 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-green-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">High Trust</p>
                <p className="text-xs text-gray-400">Score: 94/100</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-300 dark:text-gray-700"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  )
}
