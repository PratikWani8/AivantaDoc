import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import ThemeToggle from '../../components/shared/ThemeToggle'
import LanguageSelector from '../../components/shared/LanguageSelector'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPwd, setShowPwd] = useState(false)
  const [apiError, setApiError] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'
  const sessionExpired = new URLSearchParams(location.search).get('session') === 'expired'

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setApiError('')
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      if (!err.response) {
        setApiError('Cannot connect to the backend server. Make sure your API server is running at ' + (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + ' and try again.')
      } else {
        const msg = err.response?.data?.message || err.response?.data?.error || t('common.error')
        setApiError(msg)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-xl flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-base">Aivanta<span className="text-primary-600">Doc</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      {/* Center form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.login')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your AivantaDoc account.</p>
            </div>

            {sessionExpired && (
              <div className="mb-5 flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">Your session expired. Please sign in again.</p>
              </div>
            )}

            {apiError && (
              <div className="mb-5 flex items-start gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.email')}</label>
                <input
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${errors.email ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                  placeholder="you@company.com"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${errors.password ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Toggle password visibility"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <Button type="submit" loading={isSubmitting} className="w-full">
                {isSubmitting ? t('auth.loggingIn') : t('auth.loginBtn')}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                {t('nav.getStarted')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
