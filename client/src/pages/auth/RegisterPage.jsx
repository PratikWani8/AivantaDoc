import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword'],
})

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setApiError('')
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password })
      toast.success('Account created! Welcome to AivantaDoc.')
      navigate('/dashboard')
    } catch (err) {
      // Network error = no backend running
      if (!err.response) {
        setApiError('Cannot connect to the backend server. Make sure your API server is running at ' + (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + ' and try again.')
      } else {
        const msg = err.response?.data?.message || err.response?.data?.error || t('common.error')
        setApiError(msg)
      }
    }
  }

  const fields = [
    { name: 'name',            label: t('auth.name'),            type: 'text',     auto: 'name'           },
    { name: 'email',           label: t('auth.email'),           type: 'email',    auto: 'email'          },
    { name: 'password',        label: t('auth.password'),        type: 'password', auto: 'new-password'   },
    { name: 'confirmPassword', label: t('auth.confirmPassword'), type: 'password', auto: 'new-password'   },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
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

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.register')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your AivantaDoc account.</p>
            </div>

            {apiError && (
              <div className="mb-5 flex items-start gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {fields.map(f => (
                <div key={f.name} className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
                  <div className="relative">
                    <input
                      type={f.type === 'password' ? (showPwd ? 'text' : 'password') : f.type}
                      autoComplete={f.auto}
                      {...register(f.name)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${errors[f.name] ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} ${f.type === 'password' ? 'pr-10' : ''}`}
                    />
                    {f.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Toggle password"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {errors[f.name] && <p className="text-xs text-red-500">{errors[f.name].message}</p>}
                </div>
              ))}

              <Button type="submit" loading={isSubmitting} className="w-full">
                {isSubmitting ? t('auth.registering') : t('auth.registerBtn')}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                {t('auth.loginBtn')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
