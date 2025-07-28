# Simple Architecture Visual for Demo

## For Screen Sharing During Demo

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NUTRIENT BOL PROCESSOR                                │
└─────────────────────────────────────────────────────────────────────────────────┘

    USER UPLOADS              WORKFLOW ORCHESTRATION               DOCUMENT PROCESSING
         ▼                            ▼                                 ▼

┌─────────────────┐           ┌──────────────────────┐           ┌─────────────────────┐
│                 │           │                      │           │                     │
│  REACT FRONTEND │  ────────►│ NODE.JS ORCHESTRATOR │  ────────►│  .NET XTRACTFLOW    │
│                 │           │                      │           │      SERVICE        │
│ • File Upload   │           │ • Frontend Hosting   │           │                     │
│ • Status Tabs   │           │ • Document Storage   │           │ • Nutrient SDK      │
│ • Data Display  │           │ • Status Management  │           │ • AI Processing     │
│                 │           │ • XTractFlow Proxy   │           │ • LLM Integration   │
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
**ORCHESTRATOR**: Node.js Express coordinating workflow (Port 5000)  
**PROCESSING ENGINE**: .NET 8 XTractFlow service with Nutrient SDK (Port 8080)
**AI**: OpenAI or Azure OpenAI for intelligent field extraction
**OUTPUT**: Structured JSON ready for WMS/ERP/TMS integration