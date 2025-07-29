# ERP/WMS/TMS Integration Guide

## Overview

The Nutrient BOL Processor exports structured JSON data that can be directly integrated into Enterprise Resource Planning (ERP), Warehouse Management Systems (WMS), and Transportation Management Systems (TMS).

## Export Options

### 1. Bulk Export
- **Endpoint**: `GET /api/documents/export/json`
- **Format**: Single JSON file containing all processed documents
- **Use Case**: Daily/weekly batch processing for ERP systems
- **Filename**: `bol_export_YYYY-MM-DD.json`

### 2. Individual Document Export  
- **Endpoint**: `GET /api/documents/{id}/export`
- **Format**: Single document with BOL number in filename
- **Use Case**: Real-time integration, event-driven workflows
- **Filename**: `BOL_{BOL_NUMBER}_{ID}.json`

## Data Structure

### Bulk Export Format
```json
{
  "exportTimestamp": "2025-07-29T18:40:14.123Z",
  "totalDocuments": 5,
  "documents": [
    {
      "documentId": 1,
      "filename": "sample_bol_3.pdf",
      "processedAt": "2025-07-29T18:35:52.396Z",
      "confidence": 0.94264,
      "extractedData": {
        "bolNumber": "BOL126854408",
        "carrier": {
          "name": "Old Dominion",
          "scac": "ODFL"
        },
        "shipper": {
          "name": "Acme Production Inc",
          "address": "456 Factory Row, Detroit, MI 48201"
        },
        "consignee": {
          "name": "Eastern Logistics Terminal", 
          "address": "741 Cargo St, Newark, NJ 07102"
        },
        "shipDate": "2025-07-01",
        "totalWeight": 2408,
        "items": [
          {
            "description": "Construction Materials",
            "quantity": 13,
            "weight": 1108,
            "class": "Class 70"
          },
          {
            "description": "Chemical Containers", 
            "quantity": 13,
            "weight": 959,
            "class": "Class 55"
          }
        ],
        "confidence": 0.94264,
        "processingTimestamp": "2025-07-29T18:35:52.396Z"
      },
      "validationIssues": null
    }
  ]
}
```

## Integration Patterns

### 1. ERP System Integration

**SAP, Oracle, Microsoft Dynamics**
- Import BOL data into Purchase Orders, Goods Receipts
- Map `bolNumber` to PO references
- Use `shipper`/`consignee` for vendor/customer lookups
- Import `items` array for line item details

### 2. WMS Integration

**Manhattan, SAP EWM, HighJump**
- Create inbound shipment notices
- Pre-populate receiving documents
- Generate dock schedules based on shipment data

### 3. TMS Integration

**Oracle TMS, SAP TM, MercuryGate**
- Track shipment progress
- Update carrier performance metrics
- Cost allocation and billing verification

## Automation Workflows

### Real-time Processing
1. Document uploaded via API or web interface
2. XTractFlow processes document (7-10 seconds)
3. Webhook/polling triggers ERP import
4. BOL data automatically creates PO receipts

### Batch Processing
1. Daily export of all processed documents
2. Scheduled ERP import job (overnight)
3. Exception handling for validation issues
4. Reporting on processing success rates

## Data Quality & Validation

### Confidence Scoring
- **> 0.95**: Auto-import to ERP
- **0.85-0.95**: Manual review required  
- **< 0.85**: Flagged for validation

## Security Considerations

- All exports use HTTPS only
- API authentication required
- Data retention policies apply
- SOC 2 compliance maintained