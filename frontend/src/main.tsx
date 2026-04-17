import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppMessageProvider } from './components/AppMessageProvider.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppMessageProvider>
        <App />
      </AppMessageProvider>
    </BrowserRouter>
  </StrictMode>,
)
