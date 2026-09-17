import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import { useLanguage } from '../../context/LanguageContext'

export default function CTASection() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <section className="py-20 bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-3xl p-12 sm:p-16 relative overflow-hidden"
        >
          {/* BG pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
          <div className="relative space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{t('cta.heading')}</h2>
            <p className="text-primary-100 text-lg">{t('cta.sub')}</p>
            <Button
              size="xl"
              variant="secondary"
              rightIcon={<ArrowRight className="w-5 h-5" />}
              onClick={() => navigate('/register')}
              className="mx-auto"
            >
              {t('cta.button')}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
