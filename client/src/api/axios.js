import axios from 'axios'

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

console.log('API BASE URL:', BASE_URL)

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aivanta-token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Handle API errors
axiosInstance.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    console.error('API ERROR:', {
      url,
      status,
      message: error.message,
      response: error.response?.data,
    })

    if (status === 401) {
      localStorage.removeItem('aivanta-token')
      delete axiosInstance.defaults.headers.common.Authorization

      // Don't redirect for failed login/register
      const isAuthRequest =
        url.includes('/auth/login') ||
        url.includes('/auth/register')

      if (
        !isAuthRequest &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login?session=expired'
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance