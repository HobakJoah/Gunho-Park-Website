import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  //gives additional checks and warnings when developing an app
  <StrictMode>
    <App />
  </StrictMode>,
)
