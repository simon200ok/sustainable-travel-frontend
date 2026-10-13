import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/dark.css'
import './styles/a11y.css'
import App from './App.jsx'
import { startAppUpdates } from './lib/appUpdate'

// Service worker: offline app page + cached campus info, fares and saved trips.
// The newest version is fetched as the app opens; see lib/appUpdate.js for updates while in use.
startAppUpdates()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
