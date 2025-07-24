import type { BOLData, ValidationIssue, ProcessingError } from "@shared/schema";

export interface XTractFlowConfig {
  apiUrl?: string;
  apiKey?: string;
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
    // Use XTractFlow API if configured (production mode)
    if (this.config.apiUrl && this.config.apiKey && !this.config.useMockApi) {
      try {
        return await this.processWithXTractFlow(fileBuffer, fileName, mimeType);
      } catch (error) {
        console.error('XTractFlow API error:', error);
        throw new Error(`XTractFlow processing failed: ${error}`);
      }
    }

    // Fallback to mock processing only for development/demo
    console.log('Using mock processing - configure XTractFlow API for production document processing');
    return this.mockProcessDocument(fileName, mimeType);
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

    try {
      // Step 1: Create BOL processing component if needed (cache this in production)
      const componentId = await this.ensureBOLComponent();

      // Step 2: Process document using XTractFlow API
      const processFormData = new FormData();
      processFormData.append('inputFile', fileBuffer, fileName);
      if (componentId) {
        processFormData.append('componentId', componentId);
      }

      const processResponse = await axios.post(
        `${this.config.apiUrl}/api/process`,
        processFormData,
        {
          headers: {
            ...processFormData.getHeaders(),
            'Authorization': this.config.apiKey,
          },
          timeout: 60000,
        }
      );

      const processResult = processResponse.data;

      // Process and validate extracted data
      return this.processXTractFlowResults(processResult);

    } catch (error: any) {
      console.error('XTractFlow processing error:', error.response?.data || error.message);
      
      // Check if it's a document type mismatch or processing error
      if (error.response?.status === 404) {
        return {
          status: 'unprocessed',
          processingErrors: [
            {
              code: 'COMPONENT_NOT_FOUND',
              message: 'BOL processing component not configured',
              details: 'The XTractFlow service needs to be configured with BOL templates'
            }
          ]
        };
      }

      throw error; // Re-throw to trigger fallback to mock
    }
  }

  private async ensureBOLComponent(): Promise<string | null> {
    try {
      const FormData = (await import('form-data')).default;
      const axios = (await import('axios')).default;

      // Register BOL component with predefined templates
      const component = {
        enableClassifier: true,
        enableExtraction: true,
        templates: [
          {
            name: "Bill of Lading",
            identifier: "bol_template",
            semanticDescription: "A transportation document that details the shipment of goods, including shipper, consignee, carrier information, and itemized cargo details.",
            fields: [
              {
                name: "bol_number",
                semanticDescription: "The unique Bill of Lading number or reference number for tracking this shipment",
                format: "Text"
              },
              {
                name: "carrier_name",
                semanticDescription: "The transportation company responsible for moving the cargo",
                format: "Text"
              },
              {
                name: "carrier_scac",
                semanticDescription: "The Standard Carrier Alpha Code (SCAC) of the transportation company",
                format: "Text"
              },
              {
                name: "shipper_name",
                semanticDescription: "The company or individual sending the shipment",
                format: "Text"
              },
              {
                name: "shipper_address",
                semanticDescription: "The complete address of the shipper including street, city, state, and ZIP code",
                format: "Text"
              },
              {
                name: "consignee_name",
                semanticDescription: "The company or individual receiving the shipment",
                format: "Text"
              },
              {
                name: "consignee_address",
                semanticDescription: "The complete delivery address including street, city, state, and ZIP code",
                format: "Text"
              },
              {
                name: "ship_date",
                semanticDescription: "The date when the shipment was picked up or shipped",
                format: "Date"
              },
              {
                name: "total_weight",
                semanticDescription: "The total weight of all items in the shipment, typically in pounds or kilograms",
                format: "Number"
              },
              {
                name: "item_descriptions",
                semanticDescription: "Detailed descriptions of all items/commodities being shipped",
                format: "Text"
              },
              {
                name: "item_quantities",
                semanticDescription: "The quantities of each item (pieces, boxes, pallets, etc.)",
                format: "Text"
              },
              {
                name: "item_weights",
                semanticDescription: "Individual weights for each item or commodity",
                format: "Text"
              },
              {
                name: "freight_classes",
                semanticDescription: "Freight classification codes for each item (Class 50, 85, etc.)",
                format: "Text"
              }
            ]
          }
        ]
      };

      const registerResponse = await axios.post(
        `${this.config.apiUrl}/api/register-component`,
        component,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.config.apiKey,
          },
          timeout: 30000,
        }
      );

      return registerResponse.data.componentId;

    } catch (error: any) {
      console.error('Failed to register BOL component:', error.response?.data || error.message);
      return null; // Use default component
    }
  }

  private processXTractFlowResults(processResult: any): ProcessingResult {
    // XTractFlow API returns: { detectedTemplate: string, fields: ExtractedField[] }
    const { detectedTemplate, fields } = processResult;

    // Check if document was classified as BOL
    if (!detectedTemplate || !detectedTemplate.toLowerCase().includes('bill') && !detectedTemplate.toLowerCase().includes('bol')) {
      return {
        status: 'unprocessed',
        processingErrors: [
          {
            code: 'DOCUMENT_TYPE_MISMATCH',
            message: `Document classified as ${detectedTemplate || 'unknown'}, not a Bill of Lading`,
            details: 'This document does not match the expected BOL format'
          }
        ]
      };
    }

    if (!fields || fields.length === 0) {
      return {
        status: 'unprocessed',
        processingErrors: [
          {
            code: 'NO_DATA_EXTRACTED',
            message: 'No extractable data found in document',
            details: 'The document may be corrupted, encrypted, or contain only images without text'
          }
        ]
      };
    }

    // Convert XTractFlow fields to our BOL data structure
    const fieldMap = new Map<string, any>(fields.map((f: any) => [f.fieldName, f]));
    
    const bolData: BOLData = {
      bolNumber: this.getFieldValue(fieldMap.get('bol_number')),
      carrier: {
        name: this.getFieldValue(fieldMap.get('carrier_name')),
        scac: this.getFieldValue(fieldMap.get('carrier_scac')),
      },
      shipper: {
        name: this.getFieldValue(fieldMap.get('shipper_name')),
        address: this.getFieldValue(fieldMap.get('shipper_address')),
      },
      consignee: {
        name: this.getFieldValue(fieldMap.get('consignee_name')),
        address: this.getFieldValue(fieldMap.get('consignee_address')),
      },
      shipDate: this.getFieldValue(fieldMap.get('ship_date')),
      totalWeight: this.getNumericValue(fieldMap.get('total_weight')),
      items: this.parseXTractFlowItems(fieldMap),
      confidence: this.calculateOverallConfidence(fields),
      processingTimestamp: new Date().toISOString(),
    };

    // Analyze validation state and confidence
    const validationIssues = this.analyzeValidationIssues(fields, bolData);
    const overallConfidence = bolData.confidence || 0;

    // Determine processing status
    let status: 'processed' | 'needs_validation' | 'unprocessed';
    const errorCount = validationIssues.filter(v => v.severity === 'error').length;
    
    if (overallConfidence >= 0.9 && errorCount === 0) {
      status = 'processed';
    } else if (overallConfidence >= 0.6 && errorCount <= 2) {
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

  private getFieldValue(field: any): string | undefined {
    return field?.value?.value || undefined;
  }

  private getNumericValue(field: any): number | undefined {
    const value = this.getFieldValue(field);
    if (!value) return undefined;
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }

  private parseXTractFlowItems(fieldMap: Map<string, any>): BOLData['items'] {
    const descriptions = this.getFieldValue(fieldMap.get('item_descriptions'))?.split('\n') || [];
    const quantities = this.getFieldValue(fieldMap.get('item_quantities'))?.split('\n') || [];
    const weights = this.getFieldValue(fieldMap.get('item_weights'))?.split('\n') || [];
    const classes = this.getFieldValue(fieldMap.get('freight_classes'))?.split('\n') || [];

    if (descriptions.length === 0) return undefined;

    const items = [];
    const maxLength = Math.max(descriptions.length, quantities.length, weights.length, classes.length);

    for (let i = 0; i < maxLength; i++) {
      const description = descriptions[i]?.trim();
      if (!description) continue;

      items.push({
        description,
        quantity: quantities[i]?.trim() || undefined,
        weight: this.parseWeight(weights[i]),
        class: classes[i]?.trim() || undefined,
      });
    }

    return items.length > 0 ? items : undefined;
  }

  private parseWeight(weightStr: string | undefined): number | undefined {
    if (!weightStr) return undefined;
    const parsed = parseFloat(weightStr.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }

  private calculateOverallConfidence(fields: any[]): number {
    if (!fields || fields.length === 0) return 0;

    // XTractFlow validation states: Undefined, VerificationNeeded, Valid
    const validFields = fields.filter(f => f.validationState === 'Valid').length;
    const needsVerification = fields.filter(f => f.validationState === 'VerificationNeeded').length;
    const totalFields = fields.length;

    // Calculate confidence based on validation states
    const baseConfidence = (validFields + (needsVerification * 0.7)) / totalFields;
    return Math.round(baseConfidence * 100) / 100;
  }

  private analyzeValidationIssues(fields: any[], bolData: BOLData): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check validation states from XTractFlow
    fields.forEach((field: any) => {
      if (field.validationState === 'VerificationNeeded') {
        issues.push({
          field: field.fieldName,
          message: `Field requires manual verification - extracted value may be incomplete`,
          severity: 'warning'
        });
      } else if (field.validationState === 'Undefined' && field.value?.value) {
        issues.push({
          field: field.fieldName,
          message: `Field validation inconclusive - please review extracted data`,
          severity: 'warning'
        });
      }
    });

    // Check for missing critical fields
    if (!bolData.bolNumber) {
      issues.push({
        field: 'bolNumber',
        message: 'BOL number is required but could not be extracted',
        severity: 'error'
      });
    }

    if (!bolData.carrier?.name) {
      issues.push({
        field: 'carrier.name',
        message: 'Carrier information is missing or unclear',
        severity: 'warning'
      });
    }

    if (!bolData.shipper?.name) {
      issues.push({
        field: 'shipper.name',
        message: 'Shipper information is required but missing',
        severity: 'error'
      });
    }

    if (!bolData.consignee?.name) {
      issues.push({
        field: 'consignee.name',
        message: 'Consignee information is required but missing',
        severity: 'error'
      });
    }

    return issues;
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
    // Create deterministic randomness based on filename to ensure consistent results per file
    const fileHash = this.hashString(filename);
    const random = (fileHash % 1000) / 1000; // Convert to 0-1 range
    
    // Extract meaningful parts from filename for realistic data generation
    const filenameBase = filename.replace(/^\d+_/, '').replace(/\.[^.]+$/, '');
    const bolNumber = this.generateBOLNumber(filenameBase, fileHash);
    
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

    // Generate varied mock data based on file characteristics
    const carriers = [
      { name: 'FedEx Freight', scac: 'FXFE' },
      { name: 'UPS Freight', scac: 'UPGF' },
      { name: 'XPO Logistics', scac: 'XPOL' },
      { name: 'Old Dominion', scac: 'ODFL' },
      { name: 'YRC Freight', scac: 'YRCW' }
    ];

    const shippers = [
      { name: 'Global Manufacturing Corp', address: '123 Industrial Blvd, Chicago, IL 60601' },
      { name: 'Acme Production Inc', address: '456 Factory Row, Detroit, MI 48201' },
      { name: 'Prime Industries LLC', address: '789 Commerce Ave, Atlanta, GA 30309' },
      { name: 'Summit Manufacturing', address: '321 Production Dr, Houston, TX 77002' },
      { name: 'Apex Industrial Group', address: '654 Warehouse St, Phoenix, AZ 85001' }
    ];

    const consignees = [
      { name: 'Regional Distribution Center', address: '987 Logistics Way, Dallas, TX 75201' },
      { name: 'Metro Warehouse Solutions', address: '147 Shipping Ln, Miami, FL 33101' },
      { name: 'National Supply Chain Hub', address: '258 Freight Blvd, Denver, CO 80202' },
      { name: 'Pacific Distribution Network', address: '369 Harbor Dr, Los Angeles, CA 90210' },
      { name: 'Eastern Logistics Terminal', address: '741 Cargo St, Newark, NJ 07102' }
    ];

    const selectedCarrier = carriers[fileHash % carriers.length];
    const selectedShipper = shippers[(fileHash * 2) % shippers.length];
    const selectedConsignee = consignees[(fileHash * 3) % consignees.length];

    if (filename.toLowerCase().includes('scan') || random < 0.3) {
      // Needs validation
      return {
        status: 'needs_validation',
        confidence: 0.67 + (random * 0.15), // 67-82% confidence
        extractedData: {
          bolNumber: bolNumber,
          carrier: selectedCarrier,
          shipper: selectedShipper,
          consignee: {
            name: selectedConsignee.name,
            address: selectedConsignee.address.replace(/,/g, '\n') // Simulate formatting issues
          },
          shipDate: this.generateShipDate(fileHash),
          totalWeight: 1800 + (fileHash % 800), // 1800-2600 lbs
          items: this.generateItems(fileHash, 'validation'),
          confidence: 0.67 + (random * 0.15),
          processingTimestamp: new Date().toISOString()
        },
        validationIssues: [
          {
            field: 'bolNumber',
            message: `BOL number confidence: ${Math.round((0.65 + random * 0.2) * 100)}% - verification recommended`,
            severity: 'warning'
          },
          {
            field: 'consignee.address',
            message: 'Address format inconsistent with standard patterns',
            severity: 'warning'
          },
          {
            field: 'totalWeight',
            message: `Weight calculation variance detected`,
            severity: random > 0.5 ? 'error' : 'warning'
          }
        ]
      };
    }

    // Successfully processed
    return {
      status: 'processed',
      confidence: 0.91 + (random * 0.08), // 91-99% confidence
      extractedData: {
        bolNumber: bolNumber,
        carrier: selectedCarrier,
        shipper: selectedShipper,
        consignee: selectedConsignee,
        shipDate: this.generateShipDate(fileHash),
        totalWeight: 2200 + (fileHash % 600), // 2200-2800 lbs
        items: this.generateItems(fileHash, 'processed'),
        confidence: 0.91 + (random * 0.08),
        processingTimestamp: new Date().toISOString()
      }
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private generateBOLNumber(filenameBase: string, hash: number): string {
    const prefixes = ['BOL', 'BL', 'WB', 'REF'];
    const prefix = prefixes[hash % prefixes.length];
    const number = (hash % 900000000) + 100000000; // 9-digit number
    return `${prefix}${number}`;
  }

  private generateShipDate(hash: number): string {
    const days = hash % 30; // Last 30 days
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private generateItems(hash: number, status: string): BOLData['items'] {
    const itemTemplates = [
      { description: 'Industrial Machinery Parts', baseWeight: 1200, class: 'Class 85' },
      { description: 'Steel Pipe Fittings', baseWeight: 850, class: 'Class 55' },
      { description: 'Electronic Components', baseWeight: 300, class: 'Class 92.5' },
      { description: 'Automotive Parts', baseWeight: 600, class: 'Class 65' },
      { description: 'Construction Materials', baseWeight: 1100, class: 'Class 70' },
      { description: 'Chemical Containers', baseWeight: 950, class: 'Class 55' }
    ];

    const itemCount = (hash % 3) + 1; // 1-3 items
    const items = [];

    for (let i = 0; i < itemCount; i++) {
      const template = itemTemplates[(hash + i) % itemTemplates.length];
      const quantity = (hash % 50) + 5; // 5-54 pieces
      const weight = template.baseWeight + ((hash + i) % 400);
      
      items.push({
        description: template.description,
        quantity: status === 'validation' && i === 0 ? `${quantity} pcs` : quantity,
        weight: weight,
        class: template.class
      });
    }

    return items;
  }



  getStatus() {
    const hasXTractFlow = !!(this.config.apiUrl && this.config.apiKey);
    const usingMock = this.config.useMockApi;

    if (hasXTractFlow && !usingMock) {
      return {
        configured: true,
        mockMode: false,
        description: 'XTractFlow API configured and ready for production processing'
      };
    } else {
      return {
        configured: false,
        mockMode: true,
        description: 'Using mock processing - configure XTractFlow API for real document processing'
      };
    }
  }

  updateConfig(newConfig: { apiUrl?: string; apiKey?: string }) {
    this.config = { 
      ...this.config, 
      apiUrl: newConfig.apiUrl,
      apiKey: newConfig.apiKey,
      useMockApi: !newConfig.apiUrl || !newConfig.apiKey
    };
  }

  clearConfig() {
    this.config = {
      apiUrl: '',
      apiKey: '',
      openAiKey: '',
      azureOpenAiKey: '',
      azureOpenAiEndpoint: '',
      azureOpenAiDeployment: '',
      useMockApi: true
    };
  }

  async testConnection(apiUrl: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const axios = (await import('axios')).default;
      
      // Test health endpoint first
      const healthResponse = await axios.get(`${apiUrl}/health`, {
        timeout: 10000
      });
      
      if (healthResponse.status === 200) {
        // Try to create a test BOL component to verify full functionality
        const testResponse = await axios.post(`${apiUrl}/api/components/bol`, {}, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 15000
        });
        
        if (testResponse.status === 200) {
          return { 
            success: true, 
            message: 'XTractFlow API connection successful - ready for BOL processing' 
          };
        }
      }
      
      return { 
        success: false, 
        message: 'XTractFlow API is not responding correctly' 
      };
      
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return { 
          success: false, 
          message: `Cannot connect to XTractFlow API at ${apiUrl}. Please verify the URL and ensure the service is running.` 
        };
      }
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { 
          success: false, 
          message: 'XTractFlow API key is invalid or lacks required permissions' 
        };
      }
      
      return { 
        success: false, 
        message: `XTractFlow API connection failed: ${error.response?.data?.message || error.message}` 
      };
    }
  }

  getConfig() {
    return this.config;
  }

  updateConfig(newConfig: { apiUrl: string; apiKey: string }) {
    this.config = { ...this.config, ...newConfig };
  }

  clearConfig() {
    this.config = { ...this.config, apiUrl: '', apiKey: '' };
  }

  async testConnection(apiUrl: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const axios = (await import('axios')).default;
      
      // Test the health endpoint
      const response = await axios.get(`${apiUrl}/api/health`, {
        headers: {
          'Authorization': apiKey,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return {
          success: true,
          message: 'Successfully connected to XTractFlow API'
        };
      } else {
        return {
          success: false,
          message: `API returned status ${response.status}`
        };
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          message: 'Cannot reach the API endpoint - check the URL'
        };
      } else if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Authentication failed - check your API key'
        };
      } else {
        return {
          success: false,
          message: error.response?.data?.message || error.message || 'Connection test failed'
        };
      }
    }
  }
}

// Environment-based configuration
export function createXTractFlowService(): XTractFlowService {
  const config: XTractFlowConfig = {
    apiUrl: process.env.XTRACTFLOW_API_URL,
    apiKey: process.env.XTRACTFLOW_API_KEY,
    useMockApi: !process.env.XTRACTFLOW_API_URL || process.env.NODE_ENV === 'development'
  };

  return new XTractFlowService(config);
}