export const config = {
  port: process.env.PORT || 5000,
  falApiKey: process.env.FAL_KEY,
  allowedUrls: [
    "https://rest.alpha.fal.ai",
    "wss://realtime.fal.ai",
    "https://realtime.fal.ai",
    "https://textlaire.onrender.com"
  ],
  wsUrl: 'wss://realtime.fal.ai/handler',
  corsOptions: {
    origin: [
      'http://localhost:5173',
      'http://192.168.140.141:5173',
      'http://192.168.101.141:5173',
      'https://textlaire.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-fal-target-url',
      'Accept',
      'Origin',
      'x-requested-with'
    ],
    exposedHeaders: ['x-fal-target-url'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
}; 