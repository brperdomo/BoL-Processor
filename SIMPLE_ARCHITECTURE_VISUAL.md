# Simple Architecture Visual for Demo

## For Screen Sharing During Demo

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NUTRIENT BOL PROCESSOR                                │
└─────────────────────────────────────────────────────────────────────────────────┘

    USER UPLOADS                 PROCESSING ORCHESTRATION              AI EXTRACTION
         ▼                                ▼                                 ▼

┌─────────────────┐           ┌──────────────────────┐           ┌─────────────────────┐
│                 │           │                      │           │                     │
│  REACT FRONTEND │  ────────►│   NODE.JS BACKEND    │  ────────►│  XTRACTFLOW SERVICE │
│                 │           │                      │           │                     │
│ • File Upload   │           │ • REST API           │           │ • Nutrient SDK      │
│ • Status Tabs   │           │ • Document Storage   │           │ • AI Processing     │
│ • Data Display  │           │ • XTractFlow Client  │           │ • LLM Integration   │
│                 │           │                      │           │                     │
└─────────────────┘           └──────────────────────┘           └─────────────────────┘
         ▲                                ▲                                 │
         │                                │                                 ▼
     Real-time                        Status                      ┌─────────────────────┐
     Updates                          Updates                     │  OPENAI / AZURE     │
         │                                │                      │  OPENAI PROVIDER    │
         └────────────────────────────────┘                      └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DOCUMENT FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Upload (PDF/JPG/PNG/TIFF) → 2. Process with XTractFlow → 3. Extract BOL Data → 4. Display Results

    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   Upload    │ ───► │ Processing  │ ───► │  Processed  │ ───► │ Integration │
    │   Queue     │      │    Tab      │      │    Tab      │      │    Ready    │
    └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘

```

## Key Technical Points to Highlight

**FRONTEND**: React + TypeScript with real-time updates
**BACKEND**: Node.js Express orchestrating the workflow  
**XTRACTFLOW**: Production .NET 8 service with actual Nutrient SDK
**AI**: OpenAI or Azure OpenAI for intelligent field extraction
**OUTPUT**: Structured JSON ready for WMS/ERP/TMS integration