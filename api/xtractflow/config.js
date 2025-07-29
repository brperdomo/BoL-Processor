// Vercel serverless function for XTractFlow configuration
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
          configured: false,
          mockMode: true,
          message: 'Running in Vercel demo mode - XTractFlow not configured'
        });

      case 'POST':
        // Handle config save for demo (doesn't actually save)
        const config = req.body;
        
        // Validate required fields
        if (!config.apiKey || !config.baseUrl) {
          return res.status(400).json({
            error: 'Missing required configuration fields',
            required: ['apiKey', 'baseUrl']
          });
        }

        // For Vercel demo, just return success without actually configuring
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