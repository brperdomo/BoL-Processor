// Vercel serverless function for document management
import { nanoid } from 'nanoid';

// Simple in-memory storage for Vercel demo (shared with upload.js)
let documentsStore = [];

class MemStorage {
  constructor() {
    // Use shared store instead of Map for cross-function compatibility
  }

  async create(document) {
    documentsStore.push(document);
    return document;
  }

  async getAll() {
    return [...documentsStore];
  }

  async getById(id) {
    return documentsStore.find(doc => doc.id === id);
  }

  async update(id, updates) {
    const index = documentsStore.findIndex(doc => doc.id === id);
    if (index === -1) throw new Error('Document not found');
    
    const updated = { ...documentsStore[index], ...updates };
    documentsStore[index] = updated;
    return updated;
  }

  async delete(id) {
    const index = documentsStore.findIndex(doc => doc.id === id);
    if (index === -1) return false;
    
    documentsStore.splice(index, 1);
    return true;
  }
}

const storage = new MemStorage();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        const documents = await storage.getAll();
        return res.status(200).json(documents);

      case 'POST':
        const newDoc = {
          id: nanoid(),
          filename: req.body.filename || 'Unknown',
          status: 'processing',
          uploadedAt: new Date().toISOString(),
          processedAt: null,
          extractedData: null
        };
        await storage.create(newDoc);
        return res.status(201).json(newDoc);

      case 'PUT':
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Document ID required' });
        }
        const updated = await storage.update(id, req.body);
        return res.status(200).json(updated);

      case 'DELETE':
        const { id: deleteId } = req.query;
        if (!deleteId) {
          return res.status(400).json({ error: 'Document ID required' });
        }
        await storage.delete(deleteId);
        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}