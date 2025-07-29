// Vercel serverless function for XTractFlow connection testing
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For Vercel demo, simulate connection test
    const config = req.body;

    // Simulate validation
    if (!config.apiKey || !config.baseUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required configuration fields',
        details: 'API Key and Base URL are required'
      });
    }

    // Simulate connection test with delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Always return success for demo
    return res.status(200).json({
      success: true,
      message: 'Connection test successful (demo mode)',
      details: {
        endpoint: config.baseUrl,
        authenticated: true,
        mockMode: true,
        responseTime: '1.2s'
      }
    });

  } catch (error) {
    console.error('Connection test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Connection test failed',
      details: error.message
    });
  }
}