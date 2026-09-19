import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'

const profileSchema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'Must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match", path: ['confirmPassword'],
})

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { theme, toggle } = useTheme()
  const { language: currentLang, setLanguage } = useLanguage()

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  })

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })

  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  const onSaveProfile = async (data) => {
    setSaving(true)
    try {
      await authApi.updateProfile(data)
      toast.success(t('settings.saved'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const onChangePassword = async (data) => {
    setChangingPwd(true)
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Password updated successfully.')
      passwordForm.reset()
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'))
    } finally {
      setChangingPwd(false)
    }
  }

  const InputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.heading')}</h1>

      {/* Profile */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">{t('settings.profile')}</h2>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.name')}</label>
            <input {...profileForm.register('name')} className={InputClass} />
            {profileForm.formState.errors.name && <p className="text-xs text-red-500">{profileForm.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.email')}</label>
            <input type="email" {...profileForm.register('email')} className={InputClass} />
            {profileForm.formState.errors.email && <p className="text-xs text-red-500">{profileForm.formState.errors.email.message}</p>}
          </div>
          <Button type="submit" loading={saving}>{saving ? t('settings.saving') : t('settings.save')}</Button>
        </form>
      </Card>

      {/* Appearance */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Appearance</h2>
        <div className="space-y-5">
          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.language')}</label>
            <div className="flex gap-2 flex-wrap">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${currentLang === lang.code ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-700'}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.theme')}</label>
            <div className="flex gap-2">
              {['light', 'dark'].map(th => (
                <button
                  key={th}
                  onClick={() => theme !== th && toggle()}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${theme === th ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-700'}`}
                >
                  {t(`settings.${th}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">{t('settings.changePassword')}</h2>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
          {[
            { name: 'currentPassword', label: t('settings.currentPassword') },
            { name: 'newPassword',     label: t('settings.newPassword') },
            { name: 'confirmPassword', label: t('settings.confirmPassword') },
          ].map(f => (
            <div key={f.name} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
              <input type="password" {...passwordForm.register(f.name)} className={InputClass} />
              {passwordForm.formState.errors[f.name] && (
                <p className="text-xs text-red-500">{passwordForm.formState.errors[f.name].message}</p>
              )}
            </div>
          ))}
          <Button type="submit" loading={changingPwd}>{t('settings.updatePassword')}</Button>
        </form>
      </Card>
    </div>
  )
}
