// Vercel serverless function for file uploads
import { nanoid } from 'nanoid';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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
    // For Vercel demo, we'll simulate file upload processing
    // In production, this would handle multipart form data
    const mockProcessing = {
      id: nanoid(),
      filename: req.body?.filename || `document-${Date.now()}.pdf`,
      status: 'processing',
      uploadedAt: new Date().toISOString(),
      processedAt: null,
      extractedData: null,
      mockMode: true,
      message: 'File uploaded successfully - using mock processing for Vercel demo'
    };

    return res.status(200).json(mockProcessing);

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}