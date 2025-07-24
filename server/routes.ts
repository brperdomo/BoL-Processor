import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertDocumentSchema, bolDataSchema, type BOLData, type ValidationIssue, type ProcessingError } from "@shared/schema";
import { createXTractFlowService } from "./xtractflow-service";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, and TIFF files are allowed.'));
    }
  },
});

// Initialize XTractFlow service
const xtractFlowService = createXTractFlowService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Get XTractFlow configuration status
  app.get("/api/xtractflow/status", async (req, res) => {
    try {
      const status = xtractFlowService.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get XTractFlow status" });
    }
  });

  // XTractFlow configuration endpoints
  app.get('/api/xtractflow/config', (req, res) => {
    const config = xtractFlowService.getConfig();
    res.json({
      apiUrl: config.apiUrl || '',
      apiKey: config.apiKey ? '***' : '', // Mask the actual key
      configured: !!(config.apiUrl && config.apiKey)
    });
  });

  app.post('/api/xtractflow/config', (req, res) => {
    const { apiUrl, apiKey } = req.body;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ message: 'Both XTractFlow API URL and API Key are required' });
    }

    try {
      xtractFlowService.updateConfig({ apiUrl, apiKey });
      res.json({ message: 'XTractFlow configuration updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update configuration' });
    }
  });

  app.delete('/api/xtractflow/config', (req, res) => {
    try {
      xtractFlowService.clearConfig();
      res.json({ message: 'Configuration cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to clear configuration' });
    }
  });

  app.post('/api/xtractflow/test', async (req, res) => {
    const { apiUrl, apiKey } = req.body;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both XTractFlow API URL and API Key are required' 
      });
    }

    try {
      const result = await xtractFlowService.testConnection(apiUrl, apiKey);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'XTractFlow connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get documents by status
  app.get("/api/documents/status/:status", async (req, res) => {
    try {
      const { status } = req.params;
      const documents = await storage.getDocumentsByStatus(status);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents by status" });
    }
  });

  // Upload documents
  app.post("/api/documents/upload", upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedDocuments = [];

      for (const file of files) {
        // Create initial document record
        const document = await storage.createDocument({
          filename: `${Date.now()}_${file.originalname}`,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          status: 'processing',
          processedAt: null,
          confidence: null,
          extractedData: null,
          validationIssues: null,
          processingErrors: null,
        });

        uploadedDocuments.push(document);

        // Process document with XTractFlow (with simulated delay for demo purposes)
        setTimeout(async () => {
          try {
            const result = await xtractFlowService.processDocument(
              file.buffer, 
              file.originalname, 
              file.mimetype
            );
            
            await storage.updateDocument(document.id, {
              status: result.status,
              processedAt: new Date(),
              confidence: result.confidence || null,
              extractedData: result.extractedData || null,
              validationIssues: result.validationIssues || null,
              processingErrors: result.processingErrors || null,
            });
          } catch (error) {
            console.error('Document processing error:', error);
            await storage.updateDocument(document.id, {
              status: 'unprocessed',
              processedAt: new Date(),
              confidence: null,
              extractedData: null,
              validationIssues: null,
              processingErrors: [
                {
                  code: 'PROCESSING_FAILED',
                  message: 'Document processing service error',
                  details: error instanceof Error ? error.message : 'Unknown error occurred'
                }
              ],
            });
          }
        }, Math.random() * 5000 + 2000); // Random delay between 2-7 seconds
      }

      res.json({ 
        message: `${files.length} file(s) uploaded successfully`,
        documents: uploadedDocuments
      });
    } catch (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File size too large. Maximum size is 10MB." });
        }
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Upload failed" });
    }
  });

  // Update document (for validation workflow)
  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const document = await storage.updateDocument(id, updates);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Retry processing
  app.post("/api/documents/:id/retry", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Reset to processing status
      await storage.updateDocument(id, {
        status: 'processing',
        processedAt: null,
        confidence: null,
        extractedData: null,
        validationIssues: null,
        processingErrors: null,
      });

      // Reprocess with XTractFlow
      setTimeout(async () => {
        try {
          // For retry, we don't have the file buffer, so we'll use mock processing
          // In a real implementation, you might store file buffers or have a file storage system
          const result = await xtractFlowService.processDocument(
            Buffer.from(''), // Empty buffer - will fallback to mock
            document.originalName, 
            document.mimeType
          );
          
          await storage.updateDocument(id, {
            status: result.status,
            processedAt: new Date(),
            confidence: result.confidence || null,
            extractedData: result.extractedData || null,
            validationIssues: result.validationIssues || null,
            processingErrors: result.processingErrors || null,
          });
        } catch (error) {
          console.error('Document retry error:', error);
          await storage.updateDocument(id, {
            status: 'unprocessed',
            processedAt: new Date(),
            confidence: null,
            extractedData: null,
            validationIssues: null,
            processingErrors: [
              {
                code: 'RETRY_FAILED',
                message: 'Document reprocessing failed',
                details: error instanceof Error ? error.message : 'Unknown error occurred'
              }
            ],
          });
        }
      }, Math.random() * 3000 + 1000);

      res.json({ message: "Document processing restarted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to retry processing" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
