import { StrictMode } from 'react'
import { io } from "socket.io-client"; // Import Socket.IO client
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "./context/ThemeProvider"; // Import ThemeProvider

import './index.css'
import App from './App.jsx'

const socket = io("http://localhost:5000"); // Establish connection to Socket.IO server

// Emit a test message after connection
socket.emit("message", "Hello from the client!");

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <ThemeProvider>
    <App />
  </ThemeProvider>
  </StrictMode>,
)
