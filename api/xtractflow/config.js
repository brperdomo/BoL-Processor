// Vercel serverless function for XTractFlow configuration
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        // Return current config status for Vercel demo
        return res.status(200).json({
          configured: configurationState.configured,
          mockMode: true,
          apiKey: configurationState.apiKey ? '***masked***' : null,
          baseUrl: configurationState.baseUrl,
          message: 'Running in Vercel demo mode'
        });

      case 'POST':
        // Handle config save for demo (doesn't actually save)
        const config = req.body || {};
        
        // For demo mode, be lenient with validation
        if (!config.apiKey && !config.baseUrl) {
          return res.status(400).json({
            error: 'Missing configuration data',
            message: 'Please provide API configuration',
            demo: true
          });
        }

        // Save configuration for demo mode
        configurationState.configured = true;
        configurationState.apiKey = config.apiKey;
        configurationState.baseUrl = config.baseUrl;
        
        return res.status(200).json({
          success: true,
          message: 'Configuration saved successfully (demo mode)',
          configured: true,
          mockMode: true
        });

      case 'PUT':
        // Handle config updates
        return res.status(200).json({
          success: true,
          message: 'Configuration updated successfully (demo mode)',
          configured: true,
          mockMode: true
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Config API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}