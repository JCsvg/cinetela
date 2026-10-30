import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import AuthProvider from './auth/AuthProvider'
import CompraProvider from './compra/CompraProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <CompraProvider>
          <App />
        </CompraProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
