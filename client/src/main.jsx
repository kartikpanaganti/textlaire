import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "./context/ThemeProvider"; // Import ThemeProvider
import { UserProvider } from "./context/UserProvider"; // Import UserProvider
import axios from 'axios'; // Import axios for configuration

import './index.css'
import App from './App.jsx'
import './lib/api'; // Updated import path

// Configure axios defaults for all API requests
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 
    'http://localhost:5000' : 
    `//${window.location.host}`);

// Polyfill for crypto and its methods if not available
if (typeof crypto === 'undefined') {
  window.crypto = {};
}

if (!crypto.getRandomValues) {
  crypto.getRandomValues = function(array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

// Polyfill for crypto.randomUUID if not available
if (!crypto.randomUUID) {
  crypto.randomUUID = () => {
    // Create a v4 UUID using a more basic approach
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };
}

// Emit a test message after connection

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </ThemeProvider>
  </StrictMode>,
)
