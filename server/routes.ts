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

// Function to handle document processing with realistic progress updates
async function processDocumentWithProgress(docId: number, file: Express.Multer.File) {
  try {
    let currentProgress = 15; // Start with 15% (upload complete)
    
    // Generate realistic progress increments based on file size
    const fileSizeKB = file.size / 1024;
    const baseProcessingTime = Math.min(Math.max(fileSizeKB / 100, 2), 8); // 2-8 seconds based on file size
    const progressSteps = [
      { stage: 'type_detection', targetProgress: 35, minTime: 800, maxTime: 1500 },
      { stage: 'field_extraction', targetProgress: 72, minTime: 1500, maxTime: 2800 },
      { stage: 'data_validation', targetProgress: 94, minTime: 1200, maxTime: 2200 }
    ];
    
    // Create realistic progress animation
    const animateProgress = async (targetProgress: number, duration: number, stage: string) => {
      const steps = Math.max(5, Math.floor(duration / 200)); // Update every ~200ms
      const progressPerStep = (targetProgress - currentProgress) / steps;
      const timePerStep = duration / steps;
      
      for (let i = 0; i < steps; i++) {
        await new Promise(resolve => setTimeout(resolve, timePerStep + Math.random() * 100 - 50)); // Add slight randomness
        currentProgress = Math.min(targetProgress, currentProgress + progressPerStep + Math.random() * 2 - 1);
        
        await storage.updateDocument(docId, {
          processingProgress: Math.round(currentProgress),
          processingStage: stage
        });
      }
    };
    
    // Execute processing stages with realistic timing
    for (const step of progressSteps) {
      const duration = step.minTime + Math.random() * (step.maxTime - step.minTime);
      await animateProgress(step.targetProgress, duration, step.stage);
    }
    
    // Final processing - call actual XTractFlow service
    try {
      const result = await xtractFlowService.processDocument(
        file.buffer, 
        file.originalname, 
        file.mimetype
      );
      
      // Complete to 100% quickly
      await animateProgress(100, 300, 'complete');
      
      await storage.updateDocument(docId, {
        status: result.status,
        processedAt: new Date(),
        confidence: result.confidence || null,
        extractedData: result.extractedData || null,
        validationIssues: result.validationIssues || null,
        processingErrors: result.processingErrors || null,
        processingProgress: 100,
        processingStage: 'complete',
      });
    } catch (error) {
      console.error('Document processing error:', error);
      await storage.updateDocument(docId, {
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
        processingProgress: 0,
        processingStage: 'error',
      });
    }
  } catch (error) {
    console.error('Progress tracking error:', error);
  }
}

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

  app.post('/api/xtractflow/config', async (req, res) => {
    const { apiUrl, apiKey } = req.body;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ message: 'Both XTractFlow API URL and API Key are required' });
    }

    try {
      await xtractFlowService.updateConfig({ apiUrl, apiKey });
      res.json({ message: 'XTractFlow configuration updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update configuration' });
    }
  });

  app.delete('/api/xtractflow/config', async (req, res) => {
    try {
      await xtractFlowService.clearConfig();
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
          processingProgress: 10,
          processingStage: 'upload_complete',
        });

        uploadedDocuments.push(document);

        // Process document with XTractFlow and real-time progress tracking
        processDocumentWithProgress(document.id, file);
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

  // Export all processed documents as JSON
  app.get("/api/documents/export/json", async (req, res) => {
    try {
      const processedDocs = await storage.getDocumentsByStatus("processed");
      
      if (processedDocs.length === 0) {
        return res.status(404).json({ message: "No processed documents found" });
      }

      const cleanExportData = {
        export_metadata: {
          generated_at: new Date().toISOString().split('T')[0],
          generated_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          total_documents: processedDocs.length,
          export_format_version: "1.0",
          source_system: "Nutrient BOL Processor"
        },
        documents: processedDocs.flatMap(doc => {
          const bolData = doc.extractedData as any;
          const documents = [];
          
          // Primary BOL
          documents.push({
            document_info: {
              internal_id: doc.id,
              source_filename: doc.originalName,
              processed_date: doc.processedAt ? new Date(doc.processedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              confidence_score: Math.round((doc.confidence || 0) * 100) / 100,
              validation_status: doc.validationIssues ? "requires_review" : "validated",
              bol_sequence: 1,
              total_bols_in_document: bolData?.totalBOLs || 1
            },
            bill_of_lading: {
              bol_number: bolData?.bolNumber || "N/A",
              bol_issuer: bolData?.bolIssuer || "N/A",
              ship_date: bolData?.shipDate || "N/A",
              carrier_info: {
                name: bolData?.carrier?.name || "N/A",
                scac_code: bolData?.carrier?.scac || "N/A"
              },
              shipper: {
                company_name: bolData?.shipper?.name || "N/A",
                address: bolData?.shipper?.address || "N/A"
              },
              consignee: {
                company_name: bolData?.consignee?.name || "N/A", 
                address: bolData?.consignee?.address || "N/A"
              },
              shipment_details: {
                total_weight_lbs: bolData?.totalWeight || 0,
                item_count: bolData?.items?.length || 0,
                items: (bolData?.items || []).map((item: any, index: number) => ({
                  line_number: index + 1,
                  description: item.description || "N/A",
                  quantity: item.quantity || 0,
                  weight_lbs: item.weight || 0,
                  freight_class: item.class || "N/A"
                }))
              }
            }
          });

          // Additional BOLs from multi-BOL documents
          if (bolData?.additionalBOLs && bolData.additionalBOLs.length > 0) {
            bolData.additionalBOLs.forEach((additionalBOL: any, index: number) => {
              documents.push({
                document_info: {
                  internal_id: `${doc.id}-${index + 2}`,
                  source_filename: doc.originalName,
                  processed_date: doc.processedAt ? new Date(doc.processedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  confidence_score: Math.round((additionalBOL.confidence || 0) * 100) / 100,
                  validation_status: "validated",
                  bol_sequence: index + 2,
                  total_bols_in_document: bolData.totalBOLs || 1
                },
                bill_of_lading: {
                  bol_number: additionalBOL.bolNumber || "N/A",
                  bol_issuer: additionalBOL.bolIssuer || "N/A",
                  ship_date: additionalBOL.shipDate || "N/A",
                  carrier_info: {
                    name: additionalBOL.carrier?.name || "N/A",
                    scac_code: additionalBOL.carrier?.scac || "N/A"
                  },
                  shipper: {
                    company_name: additionalBOL.shipper?.name || "N/A",
                    address: additionalBOL.shipper?.address || "N/A"
                  },
                  consignee: {
                    company_name: additionalBOL.consignee?.name || "N/A",
                    address: additionalBOL.consignee?.address || "N/A"
                  },
                  shipment_details: {
                    total_weight_lbs: additionalBOL.totalWeight || 0,
                    item_count: additionalBOL.items?.length || 0,
                    items: (additionalBOL.items || []).map((item: any, itemIndex: number) => ({
                      line_number: itemIndex + 1,
                      description: item.description || "N/A",
                      quantity: item.quantity || 0,
                      weight_lbs: item.weight || 0,
                      freight_class: item.class || "N/A"
                    }))
                  }
                }
              });
            });
          }

          return documents;
        })
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="bol_export_${new Date().toISOString().split('T')[0]}.json"`);
      res.send(JSON.stringify(cleanExportData, null, 2));
    } catch (error) {
      res.status(500).json({ message: "Failed to export documents" });
    }
  });

  // Helper function to get flattened export data for CSV/Excel/XML
  const getFlattenedExportData = async () => {
    const allDocs = await storage.getAllDocuments();
    const processedDocs = allDocs.filter(doc => doc.status === 'processed');
    
    return processedDocs.flatMap(doc => {
      const bolData = doc.extractedData as any;
      const documents = [];
      
      // Primary BOL
      const primaryBOL = {
        internal_id: doc.id,
        source_filename: doc.originalName,
        processed_date: doc.processedAt ? new Date(doc.processedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        confidence_score: Math.round((doc.confidence || 0) * 100) / 100,
        validation_status: doc.validationIssues ? "requires_review" : "validated",
        bol_sequence: 1,
        total_bols_in_document: bolData?.totalBOLs || 1,
        bol_number: bolData?.bolNumber || "N/A",
        bol_issuer: bolData?.bolIssuer || "N/A",
        ship_date: bolData?.shipDate || "N/A",
        carrier_name: bolData?.carrier?.name || "N/A",  
        carrier_scac: bolData?.carrier?.scac || "N/A",
        shipper_name: bolData?.shipper?.name || "N/A",
        shipper_address: bolData?.shipper?.address || "N/A",
        consignee_name: bolData?.consignee?.name || "N/A",
        consignee_address: bolData?.consignee?.address || "N/A",
        total_weight_lbs: bolData?.totalWeight || 0,
        item_count: bolData?.items?.length || 0,
        items_description: (bolData?.items || []).map((item: any) => item.description || "N/A").join("; "),
        items_quantity: (bolData?.items || []).map((item: any) => item.quantity || 0).join("; "),
        items_weight: (bolData?.items || []).map((item: any) => item.weight || 0).join("; "),
        items_class: (bolData?.items || []).map((item: any) => item.class || "N/A").join("; ")
      };
      documents.push(primaryBOL);

      // Additional BOLs from multi-BOL documents
      if (bolData?.additionalBOLs && bolData.additionalBOLs.length > 0) {
        bolData.additionalBOLs.forEach((additionalBOL: any, index: number) => {
          documents.push({
            internal_id: `${doc.id}-${index + 2}`,
            source_filename: doc.originalName,
            processed_date: doc.processedAt ? new Date(doc.processedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            confidence_score: Math.round((additionalBOL.confidence || 0) * 100) / 100,
            validation_status: "validated",
            bol_sequence: index + 2,
            total_bols_in_document: bolData.totalBOLs || 1,
            bol_number: additionalBOL.bolNumber || "N/A",
            bol_issuer: additionalBOL.bolIssuer || "N/A",
            ship_date: additionalBOL.shipDate || "N/A",
            carrier_name: additionalBOL.carrier?.name || "N/A",
            carrier_scac: additionalBOL.carrier?.scac || "N/A",
            shipper_name: additionalBOL.shipper?.name || "N/A",
            shipper_address: additionalBOL.shipper?.address || "N/A",
            consignee_name: additionalBOL.consignee?.name || "N/A",
            consignee_address: additionalBOL.consignee?.address || "N/A",
            total_weight_lbs: additionalBOL.totalWeight || 0,
            item_count: additionalBOL.items?.length || 0,
            items_description: (additionalBOL.items || []).map((item: any) => item.description || "N/A").join("; "),
            items_quantity: (additionalBOL.items || []).map((item: any) => item.quantity || 0).join("; "),
            items_weight: (additionalBOL.items || []).map((item: any) => item.weight || 0).join("; "),
            items_class: (additionalBOL.items || []).map((item: any) => item.class || "N/A").join("; ")
          });
        });
      }

      return documents;
    });
  };

  // Export as CSV
  app.get('/api/documents/export/csv', async (req, res) => {
    try {
      const data = await getFlattenedExportData();
      
      if (data.length === 0) {
        return res.status(404).json({ message: 'No processed documents available for export' });
      }

      // Create CSV content manually
      const headers = [
        'Internal ID', 'Source Filename', 'Processed Date', 'Confidence Score', 'Validation Status',
        'BOL Sequence', 'Total BOLs in Document', 'BOL Number', 'BOL Issuer', 'Ship Date', 
        'Carrier Name', 'Carrier SCAC', 'Shipper Name', 'Shipper Address', 'Consignee Name', 
        'Consignee Address', 'Total Weight (lbs)', 'Item Count', 'Items Description', 
        'Items Quantity', 'Items Weight', 'Items Class'
      ];

      const csvRows = [
        headers.join(','),
        ...data.map(row => [
          row.internal_id, row.source_filename, row.processed_date, row.confidence_score,
          row.validation_status, row.bol_sequence, row.total_bols_in_document, row.bol_number,
          row.bol_issuer, row.ship_date, row.carrier_name, row.carrier_scac, row.shipper_name,
          row.shipper_address, row.consignee_name, row.consignee_address, row.total_weight_lbs,
          row.item_count, `"${row.items_description}"`, `"${row.items_quantity}"`, 
          `"${row.items_weight}"`, `"${row.items_class}"`
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="bol_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ message: 'Failed to generate CSV export' });
    }
  });

  // Export as Excel
  app.get('/api/documents/export/excel', async (req, res) => {
    try {
      const XLSX = await import('xlsx');
      const data = await getFlattenedExportData();
      
      if (data.length === 0) {
        return res.status(404).json({ message: 'No processed documents available for export' });
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Internal ID
        { wch: 25 }, // Source Filename
        { wch: 15 }, // Processed Date
        { wch: 15 }, // Confidence Score
        { wch: 18 }, // Validation Status
        { wch: 12 }, // BOL Sequence
        { wch: 20 }, // Total BOLs
        { wch: 15 }, // BOL Number
        { wch: 12 }, // Ship Date
        { wch: 20 }, // Carrier Name
        { wch: 12 }, // Carrier SCAC
        { wch: 25 }, // Shipper Name
        { wch: 40 }, // Shipper Address
        { wch: 25 }, // Consignee Name
        { wch: 40 }, // Consignee Address
        { wch: 15 }, // Total Weight
        { wch: 10 }, // Item Count
        { wch: 50 }, // Items Description
        { wch: 20 }, // Items Quantity
        { wch: 20 }, // Items Weight
        { wch: 20 }  // Items Class
      ];
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'BOL Export');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="bol_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Excel export error:', error);
      res.status(500).json({ message: 'Failed to generate Excel export' });
    }
  });

  // Export as XML
  app.get('/api/documents/export/xml', async (req, res) => {
    try {
      const xml2js = await import('xml2js');
      const data = await getFlattenedExportData();
      
      if (data.length === 0) {
        return res.status(404).json({ message: 'No processed documents available for export' });
      }

      const xmlData = {
        bol_export: {
          $: {
            generated_at: new Date().toISOString().split('T')[0],
            total_documents: data.length,
            export_format_version: "1.0",
            source_system: "Nutrient BOL Processor"
          },
          document: data.map(item => ({
            $: {
              internal_id: item.internal_id,
              bol_sequence: item.bol_sequence,
              total_bols_in_document: item.total_bols_in_document
            },
            source_filename: item.source_filename,
            processed_date: item.processed_date,
            confidence_score: item.confidence_score,
            validation_status: item.validation_status,
            bill_of_lading: {
              bol_number: item.bol_number,
              ship_date: item.ship_date,
              carrier: {
                name: item.carrier_name,
                scac_code: item.carrier_scac
              },
              shipper: {
                company_name: item.shipper_name,
                address: item.shipper_address
              },
              consignee: {
                company_name: item.consignee_name,
                address: item.consignee_address
              },
              shipment_details: {
                total_weight_lbs: item.total_weight_lbs,
                item_count: item.item_count,
                items_description: item.items_description,
                items_quantity: item.items_quantity,
                items_weight: item.items_weight,
                items_class: item.items_class
              }
            }
          }))
        }
      };

      const builder = new xml2js.Builder({
        rootName: 'bol_export',
        xmldec: { version: '1.0', encoding: 'UTF-8' },
        renderOpts: { pretty: true }
      });
      
      const xmlString = builder.buildObject(xmlData);

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="bol_export_${new Date().toISOString().split('T')[0]}.xml"`);
      res.send(xmlString);
    } catch (error) {
      console.error('XML export error:', error);
      res.status(500).json({ message: 'Failed to generate XML export' });
    }
  });

  // Download individual document data as JSON
  app.get("/api/documents/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.status !== "processed") {
        return res.status(400).json({ message: "Document is not processed yet" });
      }

      const bolData = document.extractedData as any;
      const filename = bolData?.bolNumber 
        ? `BOL_${bolData.bolNumber}_${document.id}.json`
        : `BOL_${document.id}_${document.processedAt ? new Date(document.processedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}.json`;

      const cleanExportData = {
        document_info: {
          internal_id: document.id,
          source_filename: document.originalName,
          processed_date: document.processedAt ? new Date(document.processedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          confidence_score: Math.round((document.confidence || 0) * 100) / 100,
          validation_status: document.validationIssues ? "requires_review" : "validated",
          export_timestamp: new Date().toISOString()
        },
        bill_of_lading: {
          bol_number: bolData?.bolNumber || "N/A",
          ship_date: bolData?.shipDate || "N/A",
          carrier_info: {
            name: bolData?.carrier?.name || "N/A",
            scac_code: bolData?.carrier?.scac || "N/A"
          },
          shipper: {
            company_name: bolData?.shipper?.name || "N/A",
            address: bolData?.shipper?.address || "N/A"
          },
          consignee: {
            company_name: bolData?.consignee?.name || "N/A",
            address: bolData?.consignee?.address || "N/A"
          },
          shipment_details: {
            total_weight_lbs: bolData?.totalWeight || 0,
            item_count: bolData?.items?.length || 0,
            items: (bolData?.items || []).map((item: any, index: number) => ({
              line_number: index + 1,
              description: item.description || "N/A",
              quantity: item.quantity || 0,
              weight_lbs: item.weight || 0,
              freight_class: item.class || "N/A"
            }))
          }
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(cleanExportData, null, 2));
    } catch (error) {
      res.status(500).json({ message: "Failed to export document" });
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
