import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "./context/ThemeProvider"; // Import ThemeProvider

import './index.css'
import App from './App.jsx'
import './api/axiosConfig'; // Import axios config globally

// Emit a test message after connection

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
