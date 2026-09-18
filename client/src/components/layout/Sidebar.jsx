import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Upload, CreditCard,
  AlertTriangle, Users, BarChart2, MessageSquare,
  Settings, LogOut, FileText as Logo, X, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { key: 'overview',    icon: LayoutDashboard, path: '/dashboard'             },
  { key: 'documents',   icon: FileText,         path: '/dashboard/documents'   },
  { key: 'upload',      icon: Upload,            path: '/dashboard/upload'      },
  { key: 'transactions',icon: CreditCard,        path: '/dashboard/transactions'},
  { key: 'risks',       icon: AlertTriangle,     path: '/dashboard/risks'       },
  { key: 'vendors',     icon: Users,             path: '/dashboard/vendors'     },
  { key: 'analytics',   icon: BarChart2,         path: '/dashboard/analytics'   },
  { key: 'aiAssistant', icon: MessageSquare,     path: '/dashboard/ai'          },
  { key: 'settings',    icon: Settings,          path: '/dashboard/settings'    },
]

export default function Sidebar({ onClose, isMobile = false }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully.')
    navigate('/')
  }

  const baseLink = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group'
  const active   = 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400'
  const inactive = 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 w-64">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
            <Logo className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white tracking-tight">
            Aivanta<span className="text-primary-600">Doc</span>
          </span>
        </NavLink>
        {isMobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-thin">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.path === '/dashboard'}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) => `${baseLink} ${isActive ? active : inactive}`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{t(`dashboard.${item.key}`)}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-2 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`${baseLink} ${inactive} w-full`}
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  )
}
