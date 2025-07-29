// Vercel serverless function for XTractFlow status
// Global configuration state shared across serverless functions
if (!global.xtractflowConfig) {
  global.xtractflowConfig = {
    configured: false,
    apiKey: null,
    baseUrl: null
  };
}
const configurationState = global.xtractflowConfig;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return current configuration status
  return res.status(200).json({
    configured: configurationState.configured,
    mockMode: true, // Always mock mode in Vercel
    description: configurationState.configured 
      ? 'XTractFlow Configured - Demo Mode Active'
      : 'XTractFlow Not Configured - Demo Mode',
    environment: 'vercel',
    hasApiKey: !!configurationState.apiKey,
    hasBaseUrl: !!configurationState.baseUrl
  });
}

