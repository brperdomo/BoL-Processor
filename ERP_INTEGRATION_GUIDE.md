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

### Clean, Professional Export Format
The new export format is specifically designed for enterprise ERP integration with clean field names and structured hierarchy:

```json
{
  "export_metadata": {
    "generated_at": "2025-07-29",
    "generated_time": "19:17:30",
    "total_documents": 1,
    "export_format_version": "1.0",
    "source_system": "Nutrient BOL Processor"
  },
  "documents": [
    {
      "document_info": {
        "internal_id": 1,
        "source_filename": "sample_bol_3.pdf",
        "processed_date": "2025-07-29",
        "confidence_score": 0.94,
        "validation_status": "validated"
      },
      "bill_of_lading": {
        "bol_number": "BOL126854408",
        "ship_date": "2025-07-01",
        "carrier_info": {
          "name": "Old Dominion",
          "scac_code": "ODFL"
        },
        "shipper": {
          "company_name": "Acme Production Inc",
          "address": "456 Factory Row, Detroit, MI 48201"
        },
        "consignee": {
          "company_name": "Eastern Logistics Terminal",
          "address": "741 Cargo St, Newark, NJ 07102"
        },
        "shipment_details": {
          "total_weight_lbs": 2408,
          "item_count": 2,
          "items": [
            {
              "line_number": 1,
              "description": "Construction Materials",
              "quantity": 13,
              "weight_lbs": 1108,
              "freight_class": "Class 70"
            },
            {
              "line_number": 2,
              "description": "Chemical Containers",
              "quantity": 13,
              "weight_lbs": 959,
              "freight_class": "Class 55"
            }
          ]
        }
      }
    }
  ]
}
```

### Key Improvements
- **Clean field naming**: `company_name` instead of nested objects
- **Structured hierarchy**: Clear separation of document info vs BOL data
- **Line numbering**: Items numbered for easy mapping to ERP line items
- **Validation flags**: `validated` vs `requires_review` for automated processing
- **Confidence scoring**: Rounded to 2 decimal places for readability
- **Date formatting**: Simple YYYY-MM-DD format instead of full timestamps

## Integration Patterns

### 1. ERP System Integration

**SAP, Oracle, Microsoft Dynamics**
- Import BOL data into Purchase Orders, Goods Receipts
- Map `bol_number` to PO references
- Use `shipper`/`consignee` company names for vendor/customer lookups
- Import `items` array for line item details with proper line numbering

**Example Mapping:**
```javascript
// ERP Import Script - Clean Format
const exportData = JSON.parse(exportedBOL);
exportData.documents.forEach(doc => {
  const bol = doc.bill_of_lading;
  const purchaseOrder = {
    documentNumber: bol.bol_number,
    vendor: bol.shipper.company_name,
    vendorAddress: bol.shipper.address,
    customer: bol.consignee.company_name,
    deliveryAddress: bol.consignee.address,
    carrier: bol.carrier_info.name,
    scacCode: bol.carrier_info.scac_code,
    expectedDate: bol.ship_date,
    totalWeight: bol.shipment_details.total_weight_lbs,
    lineItems: bol.shipment_details.items.map(item => ({
      lineNumber: item.line_number,
      description: item.description,
      quantity: item.quantity,
      weightLbs: item.weight_lbs,
      freightClass: item.freight_class
    })),
    validationStatus: doc.document_info.validation_status,
    confidenceScore: doc.document_info.confidence_score
  };
  
  // Auto-import if validated and high confidence
  if (doc.document_info.validation_status === 'validated' && 
      doc.document_info.confidence_score > 0.90) {
    importToERP(purchaseOrder);
  } else {
    flagForReview(purchaseOrder);
  }
});
```

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