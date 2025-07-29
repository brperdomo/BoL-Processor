// Vercel serverless function for XTractFlow status
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

  // For Vercel deployment, we'll always return mock mode
  // since we can't run the containerized .NET service
  return res.status(200).json({
    configured: false,
    mockMode: true,
    description: 'Vercel Demo Mode - Using mock processing for demonstration',
    environment: 'vercel'
  });
}