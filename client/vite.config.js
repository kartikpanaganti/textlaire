import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get target host dynamically based on environment
const getTargetHost = () => {
  // For local development, always use localhost for the backend
  return 'http://localhost:5000';
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // If you need to resolve any module aliases
    },
  },
  server: {
    // Configure server for development
    host: '0.0.0.0', // Allow accessing from network (important for IP access)
    port: 5173,      // Default Vite port
    strictPort: true,// Error if port is already in use
    cors: true,      // Enable CORS for dev server
    hmr: {
      // HMR settings for better network support
      clientPort: 5173,
      timeout: 10000,
    },
    // Configure proxy to handle API requests
    proxy: {
      // Forward all requests to /api to the backend server
      '/api': {
        target: getTargetHost(),
        changeOrigin: true,
        secure: false,
        ws: false, // Not using WebSockets for API
        rewrite: (path) => path,
        headers: {
          'Connection': 'keep-alive',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('API proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending API Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('API Response:', proxyRes.statusCode, req.url);
          });
        }
      },
      // Dedicated Socket.io proxy configuration with enhanced settings
      '/socket.io': {
        target: getTargetHost(),
        changeOrigin: true,
        ws: true, // This is critical for WebSockets to work
        secure: false,
        // Handle connection & reconnection properly
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, _res) => {
            console.log('Socket.io proxy error:', err, 'for request:', req?.url);
          });
          
          // Log all WebSocket traffic for debugging
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            console.log('WebSocket request:', req.url);
            // Set needed headers for cross-origin requests
            proxyReq.setHeader('Origin', 'http://localhost:5000');
          });
          
          proxy.on('open', (proxySocket) => {
            console.log('WebSocket connection opened');
          });
          
          proxy.on('close', (proxyRes, proxySocket, proxyHead) => {
            console.log('WebSocket connection closed');
          });
        }
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
