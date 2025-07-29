// Vercel serverless function for file uploads at /api/documents/upload
import { nanoid } from 'nanoid';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false, // Disable body parser for multipart data
  },
};

// Simple in-memory storage for Vercel demo (shared with documents.js)
let documentsStore = [];

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

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
    // Parse the multipart form data
    const { fields, files } = await parseForm(req);
    
    // Extract uploaded files
    const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files].filter(Boolean);
    
    if (!uploadedFiles.length) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process each file
    const documents = uploadedFiles.map(file => ({
      id: nanoid(),
      filename: file.originalFilename || file.name || `document-${Date.now()}.pdf`,
      status: 'processing',
      uploadedAt: new Date().toISOString(),
      processedAt: null,
      extractedData: null,
      mockMode: true,
      size: file.size || 0,
      type: file.mimetype || 'application/pdf'
    }));

    // Store documents (in production this would be in a database)
    documents.forEach(doc => documentsStore.push(doc));

    // Simulate processing for each document (in production this would trigger XTractFlow)
    documents.forEach(document => {
      setTimeout(() => {
        const doc = documentsStore.find(d => d.id === document.id);
        if (doc) {
          doc.status = 'processed';
          doc.processedAt = new Date().toISOString();
          doc.extractedData = {
            bolNumber: 'BOL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            shipper: {
              name: 'ACME Shipping Co.',
              address: '123 Industrial Blvd, Dallas, TX 75201'
            },
            consignee: {
              name: 'Global Logistics Inc.',
              address: '456 Commerce St, Houston, TX 77002'
            },
            carrier: {
              name: 'Express Transport',
              scac: 'EXPT'
            },
            items: [
              {
                description: 'Electronics Components',
                quantity: '50 boxes',
                weight: '1,250 lbs'
              },
              {
                description: 'Automotive Parts',
                quantity: '25 pallets', 
                weight: '3,750 lbs'
              }
            ],
            totalWeight: '5,000 lbs',
            shipmentDate: new Date().toISOString().split('T')[0],
            deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          };
        }
      }, 3000); // 3 second processing simulation
    });

    return res.status(200).json({
      success: true,
      documents,
      message: `${documents.length} file(s) uploaded successfully - processing with mock XTractFlow service`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      details: error.message 
    });
  }
}