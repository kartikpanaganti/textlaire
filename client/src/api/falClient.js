import * as fal from '@fal-ai/serverless-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MODEL_ID = 'fal-ai/fast-lightning-sdxl';

// Configure the fal client to use our proxy
const configureClient = () => {
  // console.log('Configuring fal client with proxy URL:', `${API_URL}/api/proxy`);
  try {
    fal.config({
      proxyUrl: `${API_URL}/api/proxy`,
      // Don't set credentials here, they will be set by the WebSocket connection
      requestOptionsTransformer: (options) => ({
        ...options,
        headers: {
          ...options.headers,
          'x-fal-target-url': options.url,
        },
      }),
    });
    // console.log('Fal client configured successfully');
  } catch (error) {
    console.error('Error configuring fal client:', error);
    throw error;
  }
};

// Get WebSocket connection details from our server
const getWebSocketDetails = async () => {
  try {
    // console.log('Fetching WebSocket details from:', `${API_URL}/api/ws-proxy`);
    const response = await fetch(`${API_URL}/api/ws-proxy`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WebSocket details error:', response.status, errorText);
      throw new Error(`Failed to get WebSocket details: ${errorText}`);
    }
    
    const data = await response.json();
    // console.log('Received WebSocket details:', { wsUrl: data.wsUrl });
    return data;
  } catch (error) {
    console.error('Error fetching WebSocket details:', error);
    throw error;
  }
};

// Connect to the fal.ai realtime API
const connectRealtime = async (modelId = MODEL_ID, options = {}) => {
  try {
    // console.log('Connecting to realtime API for model:', modelId);
    const { wsUrl, apiKey } = await getWebSocketDetails();
    
    if (!wsUrl || !apiKey) {
      throw new Error('Missing WebSocket configuration');
    }

    const defaultOptions = {
      connectionKey: 'lightning-sdxl',
      throttleInterval: 64,
      credentials: {
        baseUrl: wsUrl,
        key: apiKey,
      }
    };
    
    const connection = await fal.realtime.connect(modelId, {
      ...defaultOptions,
      ...options,
      credentials: {
        ...defaultOptions.credentials,
        ...(options.credentials || {})
      }
    });
    
    // console.log('Successfully connected to realtime API');
    return connection;
  } catch (error) {
    console.error('Error connecting to realtime API:', error);
    throw error;
  }
};

export { configureClient, connectRealtime, MODEL_ID }; 