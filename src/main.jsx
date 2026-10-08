import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './styles/dark.css'
import './styles/a11y.css'
import App from './App.jsx'

// Service worker: offline app shell + cached campus info, fares and saved trips.
// New versions activate on the next visit, so nobody is interrupted mid-journey.
registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
