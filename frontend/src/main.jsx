import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { DEMO } from './api'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/theme.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { installPhotoFallback } from './photos'

installPhotoFallback()

// The demo build uses #/ links so it works without server configuration
const Router = DEMO ? HashRouter : BrowserRouter

const container = document.getElementById('root')
if (window.__ffRoot) window.__ffRoot.unmount()
window.__ffRoot = ReactDOM.createRoot(container)
window.__ffRoot.render(
  <React.StrictMode>
    <Router>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  </React.StrictMode>
)
