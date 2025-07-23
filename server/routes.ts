import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertDocumentSchema, bolDataSchema, type BOLData, type ValidationIssue, type ProcessingError } from "@shared/schema";

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

// Mock Nutrient AI processing
function mockNutrientAIProcessing(filename: string, mimeType: string): {
  status: string;
  confidence?: number;
  extractedData?: BOLData;
  validationIssues?: ValidationIssue[];
  processingErrors?: ProcessingError[];
} {
  const random = Math.random();
  
  // Simulate different processing outcomes based on filename patterns
  if (filename.toLowerCase().includes('invoice') || filename.toLowerCase().includes('not_bol')) {
    return {
      status: 'unprocessed',
      processingErrors: [
        {
          code: 'DOCUMENT_TYPE_MISMATCH',
          message: 'Document type classification failed: Detected as Invoice, not BOL',
          details: 'No BOL-specific fields found in document structure'
        }
      ]
    };
  }

  if (filename.toLowerCase().includes('blurry') || filename.toLowerCase().includes('damaged')) {
    return {
      status: 'unprocessed',
      processingErrors: [
        {
          code: 'IMAGE_QUALITY_LOW',
          message: 'Image quality too low for OCR processing',
          details: 'Excessive blur and poor lighting conditions detected'
        }
      ]
    };
  }

  if (filename.toLowerCase().includes('scan') || random < 0.3) {
    // Needs validation
    return {
      status: 'needs_validation',
      confidence: 0.67,
      extractedData: {
        bolNumber: `XYZ${Math.floor(Math.random() * 100000000)}`,
        carrier: {
          name: 'XYZ Freight Services',
          scac: 'XYZF'
        },
        shipper: {
          name: 'Manufacturing Corp',
          address: '123 Industrial Blvd, Chicago, IL 60601'
        },
        consignee: {
          name: 'Regional Distrib. Warehouse',
          address: '789 Commerce St\nMiami FL 33101-'
        },
        shipDate: '2024-12-01',
        totalWeight: 2105,
        items: [
          {
            description: 'Industrial Equipment',
            quantity: '15 pcs',
            weight: 1200,
            class: 'Class 85'
          }
        ],
        confidence: 0.67,
        processingTimestamp: new Date().toISOString()
      },
      validationIssues: [
        {
          field: 'bolNumber',
          message: 'BOL number field partially obscured - manual verification required',
          severity: 'warning' as const
        },
        {
          field: 'consignee.address',
          message: 'Consignee address format doesn\'t match standard patterns',
          severity: 'warning' as const
        },
        {
          field: 'totalWeight',
          message: 'Total weight calculation mismatch (2,105 lbs vs 2,350 lbs)',
          severity: 'error' as const
        }
      ]
    };
  }

  // Successfully processed
  return {
    status: 'processed',
    confidence: 0.96,
    extractedData: {
      bolNumber: `ABC${Math.floor(Math.random() * 1000000000)}`,
      carrier: {
        name: 'ABC Logistics Inc.',
        scac: 'ABCL'
      },
      shipper: {
        name: 'Acme Manufacturing',
        address: '123 Industrial Blvd, Chicago, IL 60601'
      },
      consignee: {
        name: 'Global Distribution Center',
        address: '456 Warehouse Dr, Dallas, TX 75201'
      },
      shipDate: '2024-12-01',
      totalWeight: 2450,
      items: [
        {
          description: 'Industrial Pumps',
          quantity: 12,
          weight: 1200,
          class: 'Class 85'
        },
        {
          description: 'Pipe Fittings',
          quantity: '48 boxes',
          weight: 850,
          class: 'Class 55'
        },
        {
          description: 'Gaskets & Seals',
          quantity: '6 pallets',
          weight: 400,
          class: 'Class 60'
        }
      ],
      confidence: 0.96,
      processingTimestamp: new Date().toISOString()
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
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

        // Simulate processing delay and update document
        setTimeout(async () => {
          const result = mockNutrientAIProcessing(file.originalname, file.mimetype);
          
          await storage.updateDocument(document.id, {
            status: result.status,
            processedAt: new Date(),
            confidence: result.confidence || null,
            extractedData: result.extractedData || null,
            validationIssues: result.validationIssues || null,
            processingErrors: result.processingErrors || null,
          });
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

      // Simulate reprocessing
      setTimeout(async () => {
        const result = mockNutrientAIProcessing(document.originalName, document.mimeType);
        
        await storage.updateDocument(id, {
          status: result.status,
          processedAt: new Date(),
          confidence: result.confidence || null,
          extractedData: result.extractedData || null,
          validationIssues: result.validationIssues || null,
          processingErrors: result.processingErrors || null,
        });
      }, Math.random() * 3000 + 1000);

      res.json({ message: "Document processing restarted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to retry processing" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
