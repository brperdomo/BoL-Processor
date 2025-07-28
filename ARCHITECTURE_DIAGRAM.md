# 🏗️ Nutrient BOL Processor - Architecture Diagram

## Visual Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NUTRIENT BOL PROCESSOR                                │
│                          Full-Stack Architecture                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐    HTTP/REST    ┌──────────────────────┐    HTTP/JSON    ┌─────────────────────────┐
│                     │    Requests     │                      │    Requests     │                         │
│   REACT FRONTEND    │◄──────────────► │   NODE.JS BACKEND    │◄──────────────► │   XTRACTFLOW SERVICE    │
│                     │                 │                      │                 │                         │
│ ┌─────────────────┐ │                 │ ┌──────────────────┐ │                 │ ┌─────────────────────┐ │
│ │ File Upload     │ │                 │ │ Express Server   │ │                 │ │ .NET 8 Service      │ │
│ │ - Drag & Drop   │ │                 │ │ - REST API       │ │                 │ │ - Docker Ready      │ │
│ │ - Multi-Format  │ │                 │ │ - File Handling  │ │                 │ │ - Production Grade  │ │
│ │ - Progress UI   │ │                 │ │ - State Mgmt     │ │                 │ └─────────────────────┘ │
│ └─────────────────┘ │                 │ └──────────────────┘ │                 │                         │
│                     │                 │                      │                 │ ┌─────────────────────┐ │
│ ┌─────────────────┐ │                 │ ┌──────────────────┐ │                 │ │ Nutrient SDK        │ │
│ │ Status Tabs     │ │                 │ │ Document Storage │ │                 │ │ - XTractFlow API    │ │
│ │ - Processing    │ │                 │ │ - In-Memory DB   │ │                 │ │ - Computer Vision   │ │
│ │ - Processed     │ │                 │ │ - CRUD Ops       │ │                 │ │ - AI Processing     │ │
│ │ - Validation    │ │                 │ │ - Status Updates │ │                 │ │ - Field Extraction  │ │
│ │ - Unprocessed   │ │                 │ └──────────────────┘ │                 │ └─────────────────────┘ │
│ └─────────────────┘ │                 │                      │                 │                         │
│                     │                 │ ┌──────────────────┐ │                 │ ┌─────────────────────┐ │
│ ┌─────────────────┐ │                 │ │ XTractFlow       │ │                 │ │ LLM Integration     │ │
│ │ Data Viewer     │ │                 │ │ Client Service   │ │                 │ │                     │ │
│ │ - JSON Display  │ │                 │ │ - Mock/Prod Mode │ │                 │ │ ┌─────────────────┐ │ │
│ │ - Download      │ │                 │ │ - Status Monitor │ │                 │ │ │ OpenAI Provider │ │ │
│ │ - Integration   │ │                 │ │ - Config Mgmt    │ │                 │ │ └─────────────────┘ │ │
│ └─────────────────┘ │                 │ └──────────────────┘ │                 │           OR            │ │
└─────────────────────┘                 └──────────────────────┘                 │ ┌─────────────────┐ │ │
                                                                                  │ │Azure OpenAI     │ │ │
                                                                                  │ │Provider         │ │ │
                                                                                  │ └─────────────────┘ │ │
                                                                                  └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW SEQUENCE                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

1. USER UPLOAD
   ┌─────────┐    File Upload     ┌─────────┐
   │ Browser │ ─────────────────► │ React   │
   └─────────┘    (Drag & Drop)   └─────────┘
                                       │
2. FRONTEND PROCESSING                  │ FormData + File
   ┌─────────┐    React Query     ┌─────▼─────┐
   │ UI      │ ◄─────────────────── │ API Call  │
   │ Updates │                     └───────────┘
   └─────────┘                           │
                                         │ POST /api/documents/upload
3. BACKEND ORCHESTRATION                 │
   ┌─────────┐    Document        ┌─────▼─────┐
   │ Storage │ ◄─────────────────── │ Express   │
   │ Create  │                     │ Server    │
   └─────────┘                     └───────────┘
                                         │
                                         │ HTTP Request + Binary
4. XTRACTFLOW PROCESSING                 │
   ┌─────────┐    AI Analysis     ┌─────▼─────┐    ┌─────────────────┐
   │ Nutrient│ ◄─────────────────── │ .NET      │───►│ OpenAI/Azure    │
   │ SDK     │                     │ Service   │    │ LLM Provider    │
   └─────────┘                     └───────────┘    └─────────────────┘
       │                                 │
       │ Structured JSON                 │ Processing Result
       ▼                                 ▼
   ┌─────────┐    Update Status    ┌─────────────┐
   │ BOL     │ ─────────────────► │ Document    │
   │ Data    │                     │ Storage     │
   └─────────┘                     └─────────────┘
                                         │
5. REAL-TIME UPDATES                     │ Polling Every 2s
   ┌─────────┐    Status Query     ┌─────▼─────┐
   │ React   │ ◄─────────────────── │ Backend   │
   │ UI      │                     │ API       │
   └─────────┘                     └───────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            TECHNOLOGY STACK                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

FRONTEND (React + TypeScript)
├── React 18 + TypeScript
├── Vite (Build Tool)
├── TanStack Query (State Management)
├── Wouter (Routing)
├── shadcn/ui (Component Library)
├── Tailwind CSS (Styling)
└── React Dropzone (File Upload)

BACKEND (Node.js + Express)
├── Express.js Server
├── TypeScript + ES Modules
├── Multer (File Upload)
├── Axios (HTTP Client)
├── In-Memory Storage
└── RESTful API Design

XTRACTFLOW SERVICE (.NET 8)
├── ASP.NET Core Minimal API
├── GdPicture14.XTractFlow SDK
├── Docker Containerization
├── OpenAI/Azure OpenAI Integration
├── Production-Ready Architecture
└── Enterprise Configuration

EXTERNAL SERVICES
├── Nutrient XTractFlow SDK
├── OpenAI API (GPT-4)
├── Azure OpenAI Service
└── Docker Runtime

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────────┘

DEVELOPMENT MODE
┌─────────────────┐    Same Port     ┌─────────────────┐    HTTP          ┌─────────────────┐
│ React Dev       │    (5000)        │ Express Server  │    (8080)        │ XTractFlow      │
│ Server (Vite)   │◄────────────────►│ + Static Files  │◄────────────────►│ .NET Service    │
│                 │                  │                 │                  │ (Optional)      │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘

PRODUCTION MODE
┌─────────────────┐    Reverse       ┌─────────────────┐    Load          ┌─────────────────┐
│ Load Balancer   │    Proxy         │ Node.js Cluster │    Balanced      │ XTractFlow      │
│ (Nginx/ALB)     │◄────────────────►│ (PM2/Docker)    │◄────────────────►│ Service Cluster │
│                 │                  │                 │                  │ (Kubernetes)    │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
```

## Key Architecture Highlights

### 🔄 **Separation of Concerns**
- **Frontend**: User interface and experience
- **Backend**: Business logic and orchestration  
- **XTractFlow Service**: AI-powered document processing

### 🚀 **Scalability Design**
- **Microservices Architecture**: Independent scaling of components
- **Containerization**: Docker-ready for cloud deployment
- **Stateless Services**: Horizontal scaling capability

### 🔒 **Enterprise Integration**
- **RESTful APIs**: Standard integration patterns
- **Environment Configuration**: Secure credential management
- **Multi-format Support**: Real-world document handling

### ⚡ **Performance Optimization**
- **Real-time Updates**: WebSocket-style polling
- **Concurrent Processing**: Configurable throughput
- **Caching Strategy**: Optimized response times

### 🔧 **Development Experience**
- **Hot Reloading**: Rapid development cycle
- **TypeScript**: End-to-end type safety
- **Docker Development**: Consistent environments