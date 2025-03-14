export const config = {
  port: process.env.PORT || 5000,
  falApiKey: process.env.FAL_KEY,
  allowedUrls: [
    "https://rest.alpha.fal.ai",
    "wss://realtime.fal.ai",
    "https://realtime.fal.ai"
  ],
  wsUrl: 'wss://realtime.fal.ai/handler',
  corsOptions: {
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'OPTIONS'],
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