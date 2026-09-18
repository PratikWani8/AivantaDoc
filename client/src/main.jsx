import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  fontSize: '0.875rem',
                  fontFamily: 'Inter, system-ui, sans-serif',
                },
              }}
            />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
