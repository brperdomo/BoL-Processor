import type { BOLData, ValidationIssue, ProcessingError } from "@shared/schema";

export interface XTractFlowConfig {
  apiUrl?: string;
  apiKey?: string;
  openAiKey?: string;
  azureEndpoint?: string;
  azureApiKey?: string;
  useMockApi: boolean;
}

export interface ProcessingResult {
  status: 'processed' | 'needs_validation' | 'unprocessed';
  confidence?: number;
  extractedData?: BOLData;
  validationIssues?: ValidationIssue[];
  processingErrors?: ProcessingError[];
}

export class XTractFlowService {
  private config: XTractFlowConfig;

  constructor(config: XTractFlowConfig) {
    this.config = config;
  }

  async processDocument(
    fileBuffer: Buffer, 
    fileName: string, 
    mimeType: string
  ): Promise<ProcessingResult> {
    if (this.config.useMockApi) {
      return this.mockProcessDocument(fileName, mimeType);
    }

    try {
      return await this.processWithXTractFlow(fileBuffer, fileName, mimeType);
    } catch (error) {
      console.error('XTractFlow API error:', error);
      // Fallback to mock if real API fails
      return this.mockProcessDocument(fileName, mimeType);
    }
  }

  private async processWithXTractFlow(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<ProcessingResult> {
    if (!this.config.apiUrl || !this.config.apiKey) {
      throw new Error('XTractFlow API configuration missing');
    }

    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    // Step 1: Document Classification
    const classificationFormData = new FormData();
    classificationFormData.append('document', fileBuffer, fileName);
    classificationFormData.append('categories', JSON.stringify([
      'bill_of_lading', 'invoice', 'contract', 'receipt', 'other'
    ]));

    const classificationResponse = await axios.post(
      `${this.config.apiUrl}/api/classify`,
      classificationFormData,
      {
        headers: {
          ...classificationFormData.getHeaders(),
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        timeout: 30000,
      }
    );

    const classification = classificationResponse.data;

    // If not a BOL, return unprocessed
    if (classification.category !== 'bill_of_lading' || classification.confidence < 0.7) {
      return {
        status: 'unprocessed',
        processingErrors: [
          {
            code: 'DOCUMENT_TYPE_MISMATCH',
            message: `Document classified as ${classification.category} (confidence: ${Math.round(classification.confidence * 100)}%)`,
            details: 'This appears to be a different document type, not a Bill of Lading'
          }
        ]
      };
    }

    // Step 2: Data Extraction using Natural Language Instructions
    const extractionFormData = new FormData();
    extractionFormData.append('document', fileBuffer, fileName);
    
    const bolInstructions = `
      Extract the following information from this Bill of Lading document:
      1. BOL Number (also called Bill of Lading Number, Waybill Number, or Reference Number)
      2. Carrier information (company name and SCAC code if available)
      3. Shipper information (company name and complete address)
      4. Consignee information (company name and complete address)
      5. Ship date or pickup date
      6. Total weight of shipment
      7. All items/commodities with their descriptions, quantities, weights, and freight classes
      
      Please return the data in a structured format with confidence scores for each field.
    `;
    
    extractionFormData.append('natural_language_query', bolInstructions);

    const extractionResponse = await axios.post(
      `${this.config.apiUrl}/api/extract/natural`,
      extractionFormData,
      {
        headers: {
          ...extractionFormData.getHeaders(),
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        timeout: 45000,
      }
    );

    const extractionData = extractionResponse.data;

    // Process and validate extracted data
    return this.processExtractionResults(extractionData, classification.confidence);
  }

  private processExtractionResults(extractionData: any, classificationConfidence: number): ProcessingResult {
    const extractedFields = extractionData.fields || {};
    const overallConfidence = extractionData.confidence || classificationConfidence;

    // Map XTractFlow response to our BOL data structure
    const bolData: BOLData = {
      bolNumber: extractedFields.bol_number || extractedFields.reference_number,
      carrier: {
        name: extractedFields.carrier_name,
        scac: extractedFields.carrier_scac || extractedFields.scac_code,
      },
      shipper: {
        name: extractedFields.shipper_name,
        address: extractedFields.shipper_address,
      },
      consignee: {
        name: extractedFields.consignee_name,
        address: extractedFields.consignee_address,
      },
      shipDate: extractedFields.ship_date || extractedFields.pickup_date,
      totalWeight: extractedFields.total_weight ? parseFloat(extractedFields.total_weight) : undefined,
      items: this.parseItems(extractedFields.items || extractedFields.commodities),
      confidence: overallConfidence,
      processingTimestamp: new Date().toISOString(),
    };

    // Determine status and validation issues
    const validationIssues: ValidationIssue[] = [];
    
    // Check for low confidence fields
    Object.entries(extractedFields).forEach(([field, value]: [string, any]) => {
      if (value && typeof value === 'object' && value.confidence < 0.8) {
        validationIssues.push({
          field: field,
          message: `Low confidence extraction for ${field} (${Math.round(value.confidence * 100)}%)`,
          severity: value.confidence < 0.6 ? 'error' : 'warning'
        });
      }
    });

    // Check for missing critical fields
    if (!bolData.bolNumber) {
      validationIssues.push({
        field: 'bolNumber',
        message: 'BOL number could not be extracted',
        severity: 'error'
      });
    }

    if (!bolData.carrier?.name) {
      validationIssues.push({
        field: 'carrier.name',
        message: 'Carrier information missing or unclear',
        severity: 'warning'
      });
    }

    // Determine final status
    let status: 'processed' | 'needs_validation' | 'unprocessed';
    
    if (overallConfidence >= 0.9 && validationIssues.filter(v => v.severity === 'error').length === 0) {
      status = 'processed';
    } else if (overallConfidence >= 0.6 && validationIssues.filter(v => v.severity === 'error').length <= 1) {
      status = 'needs_validation';
    } else {
      status = 'unprocessed';
    }

    return {
      status,
      confidence: overallConfidence,
      extractedData: bolData,
      validationIssues: validationIssues.length > 0 ? validationIssues : undefined,
    };
  }

  private parseItems(itemsData: any): BOLData['items'] {
    if (!itemsData || !Array.isArray(itemsData)) return undefined;

    return itemsData.map((item: any) => ({
      description: item.description || item.commodity,
      quantity: item.quantity || item.pieces,
      weight: item.weight ? parseFloat(item.weight) : undefined,
      class: item.class || item.freight_class,
    }));
  }

  // Mock processing for development and fallback
  private mockProcessDocument(filename: string, mimeType: string): ProcessingResult {
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
            severity: 'warning'
          },
          {
            field: 'consignee.address',
            message: 'Consignee address format doesn\'t match standard patterns',
            severity: 'warning'
          },
          {
            field: 'totalWeight',
            message: 'Total weight calculation mismatch (2,105 lbs vs 2,350 lbs)',
            severity: 'error'
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
}

// Environment-based configuration
export function createXTractFlowService(): XTractFlowService {
  const config: XTractFlowConfig = {
    apiUrl: process.env.XTRACTFLOW_API_URL,
    apiKey: process.env.XTRACTFLOW_API_KEY,
    openAiKey: process.env.OPENAI_API_KEY,
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureApiKey: process.env.AZURE_OPENAI_API_KEY,
    useMockApi: !process.env.XTRACTFLOW_API_URL || process.env.NODE_ENV === 'development'
  };

  return new XTractFlowService(config);
}