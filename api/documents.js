// Vercel serverless function for document management
import { nanoid } from 'nanoid';

// Simple in-memory storage for Vercel demo
class MemStorage {
  constructor() {
    this.documents = new Map();
  }

  async create(document) {
    this.documents.set(document.id, document);
    return document;
  }

  async getAll() {
    return Array.from(this.documents.values());
  }

  async getById(id) {
    return this.documents.get(id);
  }

  async update(id, updates) {
    const existing = this.documents.get(id);
    if (!existing) throw new Error('Document not found');
    
    const updated = { ...existing, ...updates };
    this.documents.set(id, updated);
    return updated;
  }

  async delete(id) {
    return this.documents.delete(id);
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