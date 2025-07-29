# Multi-BOL PDF Processing Capability

## Overview

The Nutrient BOL Processor now supports extracting multiple Bills of Lading from a single PDF document. This is essential for processing consolidated shipment documents that contain multiple BOLs in one file.

## How Multi-BOL Processing Works

### 1. Document Analysis
- XTractFlow API analyzes the entire PDF document
- Detects multiple BOL numbers within the same document
- Groups related fields by proximity and page location
- Assigns page numbers to each BOL for reference

### 2. Data Structure Enhancement
The system now uses an enhanced BOL data structure:

```typescript
{
  documentType: 'single_bol' | 'multi_bol',
  totalBOLs: number, // How many BOLs found in this document
  
  // Primary BOL (first one found)
  bolNumber: string,
  carrier: { name: string, scac: string },
  shipper: { name: string, address: string },
  consignee: { name: string, address: string },
  shipDate: string,
  totalWeight: number,
  items: [...],
  
  // Additional BOLs (for multi-BOL documents)
  additionalBOLs: [
    {
      bolNumber: string,
      carrier: { name: string, scac: string },
      // ... same structure as primary BOL
      pageNumber: number // Which page this BOL was found on
    }
  ]
}
```

### 3. Export Enhancement
When exporting multi-BOL documents, each BOL is treated as a separate record:

```json
{
  "export_metadata": {
    "generated_at": "2025-07-29",
    "total_documents": 3
  },
  "documents": [
    {
      "document_info": {
        "internal_id": 1,
        "source_filename": "multi_bol_shipment.pdf",
        "bol_sequence": 1,
        "total_bols_in_document": 3
      },
      "bill_of_lading": {
        "bol_number": "BOL123456"
        // ... first BOL data
      }
    },
    {
      "document_info": {
        "internal_id": "1-2",
        "source_filename": "multi_bol_shipment.pdf",
        "bol_sequence": 2,
        "total_bols_in_document": 3
      },
      "bill_of_lading": {
        "bol_number": "BOL789012"
        // ... second BOL data
      }
    }
    // ... third BOL
  ]
}
```

## Real-World Use Cases

### Consolidated Shipments
- LTL carriers often combine multiple BOLs in one document
- Each BOL represents a different customer shipment
- System extracts all BOLs and creates separate ERP entries

### Multi-Page BOL Books
- Some carriers print multiple BOLs on multi-page documents
- Each page contains a complete BOL with different shipment data
- System processes each page independently

### Batch Processing
- Warehouses scan multiple BOLs into single PDF files
- System separates and processes each individual BOL
- Creates proper inventory entries for each shipment

## Technical Implementation

### XTractFlow Integration
```javascript
// XTractFlow detects multiple BOL patterns
{
  "detectedTemplate": "Multi-BOL Document",
  "fields": [
    { "fieldName": "bol_number", "value": "BOL123", "pageNumber": 1 },
    { "fieldName": "bol_number", "value": "BOL456", "pageNumber": 2 },
    // ... grouped fields by page/proximity
  ],
  "totalBOLsDetected": 2
}
```

### Processing Logic
1. **Field Grouping**: Analyze field positions and page numbers
2. **BOL Separation**: Group related fields for each BOL
3. **Data Extraction**: Extract complete data for each BOL
4. **Quality Validation**: Ensure each BOL has required fields
5. **Export Generation**: Create separate records for ERP integration

## Benefits for ERP Integration

### Automated Processing
- No manual separation of multi-BOL documents
- Each BOL becomes a separate purchase order/receipt
- Proper line item numbering maintained

### Audit Trail
- Original document filename preserved for all BOLs
- BOL sequence numbers track order within document
- Page references for manual verification

### Scalability
- Process hundreds of BOLs from batch-scanned documents
- Automatic detection eliminates pre-processing steps
- Ready for high-volume logistics operations

## Demo Results

Upload a PDF containing multiple BOLs and see:
- Document type automatically detected as "multi_bol"
- Each BOL processed with separate data
- Export contains individual records for each BOL
- ERP-ready format with proper sequencing

This capability transforms batch document processing from manual separation to fully automated BOL extraction and ERP integration.