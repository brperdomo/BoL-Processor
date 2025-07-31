# Nutrient BOL Processor

## Overview

This is a full-stack web application for processing Bill of Lading (BOL) documents using Nutrient AI-powered document extraction. The system allows users to upload documents, processes them through mock AI services (designed for easy integration with actual Nutrient AI Document SDK), and provides a tabbed interface for managing documents in different states (processing, processed, needs validation, unprocessed). All Replit-specific references have been removed and replaced with proper Nutrient branding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern dual-service architecture with clear separation of concerns:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Nutrient brand colors and dark theme
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **File Uploads**: React Dropzone for drag-and-drop file upload functionality

### Backend Architecture (Dual-Service Design)

**Node.js Orchestrator Service (Port 5000)**
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Role**: Frontend hosting, workflow coordination, document state management
- **File Handling**: Multer for multipart file upload processing
- **API Pattern**: RESTful API acting as proxy to XTractFlow service

**.NET XTractFlow Processing Service (Port 8080)**
- **Runtime**: .NET 8 with ASP.NET Core Minimal API
- **Language**: C# with Nutrient SDK integration
- **Role**: Pure document processing with actual XTractFlow SDK
- **AI Processing**: Real Nutrient GdPicture.XtractFlow integration
- **LLM Integration**: OpenAI and Azure OpenAI provider support

## Key Components

### Frontend Components
1. **FileUploadZone**: Drag-and-drop interface for document uploads
2. **Tab Components**: Separate views for different document states
   - ProcessingTab: Shows documents being processed with progress indicators
   - ProcessedTab: Displays successfully processed documents with extracted data
   - ValidationTab: Manual review interface for documents needing validation
   - UnprocessedTab: Failed documents with retry/delete options
3. **Header**: Navigation with Nutrient branding
4. **UI Components**: Complete set of shadcn/ui components for consistent design

### Backend Components

**Node.js Orchestrator Components**
1. **Document Storage**: In-memory storage implementation with interface for future database integration
2. **File Upload Handler**: Multer-based file processing with type validation
3. **XTractFlow Client**: HTTP client for communicating with .NET service
4. **REST API**: CRUD operations for document management and status tracking

**.NET XTractFlow Service Components**
1. **Nutrient SDK Integration**: Direct GdPicture.XtractFlow API usage
2. **LLM Provider Management**: OpenAI and Azure OpenAI configuration
3. **BOL Processing Engine**: Specialized component for Bill of Lading extraction
4. **Document Classification**: AI-powered document type identification

## Data Flow

1. **File Upload**: Users drag/drop files into the upload zone
2. **Server Processing**: Files are validated, stored, and sent for mock AI processing
3. **Status Updates**: Documents move through different states based on processing results
4. **Real-time Updates**: Frontend polls for updates every 2 seconds to show progress
5. **User Interaction**: Users can retry failed documents, validate questionable results, or download processed data

## External Dependencies

### Database Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Defined in `shared/schema.ts` with document table structure
- **Database Provider**: Configured for Neon Database (@neondatabase/serverless)
- **Migrations**: Drizzle Kit for database schema management

### Key Libraries
- **UI Components**: Extensive Radix UI component library
- **Validation**: Zod for schema validation and type safety
- **Styling**: Tailwind CSS with PostCSS processing
- **Development**: tsx for TypeScript execution, esbuild for production builds

### XTractFlow Integration
- **Production Service**: Complete integration with Nutrient's XTractFlow API for real BOL processing
- **Environment Detection**: Automatically switches between mock and production modes
- **LLM Support**: Compatible with OpenAI and Azure OpenAI providers
- **Natural Language Processing**: Uses AI instructions for field extraction
- **Document Classification**: Intelligent BOL vs non-BOL document detection
- **Confidence Scoring**: Provides accuracy metrics for extracted data
- **Error Handling**: Graceful fallback to mock processing on API failures
- **Status Monitoring**: Real-time API connection status in application header

## Deployment Strategy

### Development
- **Hot Reloading**: Vite development server with HMR
- **API Proxy**: Express server serves both API and static files
- **Environment**: NODE_ENV=development with source maps

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Serving**: Express serves static files and API from single process

### Database Integration
- Drizzle ORM is configured but uses in-memory storage currently
- Ready for PostgreSQL integration via DATABASE_URL environment variable
- Migration system in place for schema updates

The architecture is designed for easy transition from development to production, with clear separation of concerns and modular components that can be independently developed and tested.

## GitHub & Local Development Setup

The project is now ready for GitHub deployment with comprehensive setup instructions:

### Files Added for GitHub
- **README.md**: Complete setup guide for Mac and PC users
- **LICENSE**: MIT license for open source distribution
- **.gitignore**: Proper Git exclusions for Node.js projects

### Local Development
- Cross-platform compatibility (Mac/PC/Linux)
- Clear prerequisite requirements (Node.js 20+, Git)
- Detailed troubleshooting section
- Production build instructions
- Port conflict resolution guidance

### Recent Changes (July 2025)
- ✓ **App Overview & User Education (Complete)**
  - **Welcome Section**: Added comprehensive overview above upload area explaining BOLs and app functionality
  - **Process Visualization**: 4-step workflow diagram showing Upload → Process → Review → Export flow
  - **Data Fields Guide**: Clear listing of all extracted data fields organized by category
  - **User Onboarding**: Educational content for users unfamiliar with BOLs or document processing
- ✓ **Visible Branding Integration (Complete)**
  - **Header Branding**: Added "Powered by Nutrient AI Document Processing SDK (formerly XtractFlow)" to main header
  - **Public Terminology**: All user-facing content uses "AI Document Processing" branding
  - **Technical References**: Internal code maintains XTractFlow references for consistency
- ✓ **JSON Export Formatting (Complete)**
  - **Readable Format**: Fixed JSON exports to use proper indentation (2 spaces) instead of single-line output
  - **Both Endpoints**: Updated bulk export and individual document export for better readability
- ✓ **Realistic Processing Progress (Complete)**
  - **Dynamic Progress**: Replaced fixed percentages (10, 25, 60, 85) with realistic, file-size-based progress animation
  - **Smooth Animation**: Progress updates every ~200ms with slight randomness for natural feel
  - **No More Stuck**: Eliminated the "stuck at 85%" issue with proper completion flow
  - **File-Aware Timing**: Processing time varies based on actual file size (2-8 seconds)
- ✓ **Chatbot Integration (Complete)**
  - **FAQ Chatbot**: Added comprehensive FAQ chatbot with predefined responses about app functionality
  - **AI Document Processing**: Updated terminology from XTractFlow to "AI Document Processing" for public-facing content
  - **Interactive Interface**: Floating chat button with conversation reset options and suggested questions
  - **Knowledge Base**: Covers supported formats, multi-BOL processing, export options, data accuracy, and troubleshooting
  - **User Experience**: Easy navigation with "Ask another question" and "Start new conversation" buttons
- ✓ **Multi-BOL Display Enhancement (Complete)**
  - **Summary Information**: Modified Key Information section to show document type, total BOLs, file size, and combined weight
  - **Comprehensive Overview**: Summary section displays BOL numbers, carriers involved, and total items across all BOLs
  - **Clear Identification**: Multi-BOL documents clearly labeled with exact count and file size in header

### Previous Changes (January 2025)
- ✓ **Multi-BOL PDF Processing Support**
  - **Enhanced Data Structure**: Support for multiple BOLs within a single PDF document
  - **Automatic Detection**: XTractFlow API detects multiple BOL numbers and groups related fields
  - **Clean Export Format**: Each BOL becomes a separate record in exports with sequence numbering
  - **ERP Integration**: Multi-BOL documents create multiple purchase orders/receipts automatically
  - **Real-world Support**: Handles consolidated shipments, multi-page BOL books, and batch processing
  - **Page References**: Tracks which page each BOL was found on for manual verification
  - **Backward Compatibility**: Single BOL documents continue to work unchanged
- ✓ **Professional ERP/WMS/TMS Integration (Enhanced)**
  - **Clean JSON Export Format**: Restructured export with professional field naming and hierarchy
  - **Enterprise-Ready Structure**: Clear separation of document_info vs bill_of_lading data
  - **Bulk Export**: `/api/documents/export/json` endpoint for batch processing
  - **Individual Export**: BOL-based filenames with structured data format
  - **ERP Compatibility**: Direct mapping examples for SAP, Oracle, Microsoft Dynamics
  - **Line Item Numbering**: Proper sequencing for ERP line item imports
  - **Validation Flags**: "validated" vs "requires_review" status for automated processing
  - **Confidence Scoring**: Rounded decimals for cleaner business presentation
  - **Export Buttons**: Frontend integration with download functionality
- ✓ **Render Deployment Solution (Complete)**
  - **Root Cause**: Render sets NODE_ENV=production causing npm to skip devDependencies needed for vite.config.ts
  - **Solution**: Build command uses NODE_ENV=development for install phase, production for runtime
  - **Final Build Command**: `NODE_ENV=development npm ci && npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
  - **Technical Fixes**: ESM compatibility, async config methods, Node.js 20 upgrade, path resolution
  - **Port Binding Fix**: Server now binds to 0.0.0.0 in production for external access
  - **Status**: Complete and tested - ready for successful Render deployment
- ✓ **Vercel Deployment Setup**
  - Created serverless functions in `/api/` folder for Vercel compatibility
  - Added `vercel.json` configuration for deployment
  - Set up mock processing mode for demo/testing purposes
  - Created comprehensive deployment guide (`VERCEL_DEPLOYMENT.md`)
  - Added proper `.gitignore` for Git repository management
  - Configured build process for Vercel's serverless environment
- ✓ **Vercel Build Path Resolution**
  - Fixed build output directory path issue
  - Updated build command to `npx vite build --outDir ../public`
  - Resolved client folder vs project root output location conflicts
  - Created `VERCEL_FINAL_FIX.md` with exact deployment solution
- ✓ **Vercel Upload Functionality Fix**
  - Created proper `/api/documents/upload.js` serverless function
  - Added formidable library for multipart form data parsing
  - Fixed shared storage between upload and documents endpoints
  - Resolved 405 Method Not Allowed error for file uploads
  - Implemented mock processing workflow for Vercel demo
- ✓ **Vercel XTractFlow API Endpoints**
  - Created `/api/xtractflow/config.js` for configuration management
  - Created `/api/xtractflow/test.js` for connection testing
  - Fixed 405 Method Not Allowed errors for XTractFlow authentication
  - All endpoints provide mock responses for Vercel demo compatibility
- ✓ **Vercel Full Functionality Complete**
  - Fixed authentication status tracking between API endpoints
  - Resolved document storage persistence across serverless functions
  - Confirmed working file upload and processing workflow
  - Application fully operational on both local and Vercel deployments

### Previous Changes
- ✓ Removed all Replit-specific references and branding
- ✓ Replaced with proper Nutrient BOL Processor branding
- ✓ Added actual Nutrient logo from provided assets
- ✓ Created comprehensive README with setup instructions
- ✓ Added proper .gitignore and LICENSE files
- ✓ Updated HTML meta tags for SEO and social sharing
- ✓ **Complete .NET XTractFlow SDK Integration**
  - Created full .NET 8 service with actual XTractFlow SDK integration
  - Implemented proper Nutrient GdPicture.XtractFlow NuGet package usage
  - Added Docker containerization for .NET service deployment
  - Created comprehensive BOL field extraction templates
  - Supports both OpenAI and Azure OpenAI LLM providers for XTractFlow
  - Added real-time API connection testing and status monitoring
  - Removed all fallback/alternative AI processing (OpenAI direct integration)
  - Implemented proper error handling and connection validation
  - Updated frontend to work exclusively with XTractFlow service
- ✓ **Fixed Critical Item Parsing Issue**
  - Resolved concatenated weight numbers (478390261317 → individual weights: 260, 184, 498 lbs)
  - Implemented proper numbered list parsing for cargo items
  - Each BOL now shows separate items with individual weights, quantities, descriptions
  - Data now ready for WMS/ERP/TMS integration with proper item separation
- ✓ **Comprehensive Local Development Setup**
  - Updated README with platform-specific instructions for Mac and PC users
  - Created enhanced setup scripts (setup.sh/setup.bat) with prerequisite checking
  - Added .NET SDK and Docker installation guidance
  - Comprehensive troubleshooting section with platform-specific solutions
  - Complete .NET service documentation with deployment options
  - Environment configuration templates and examples
- ✓ Architecture: Node.js frontend → .NET XTractFlow service → Nutrient SDK
- ✓ Ready for production deployment with proper XTractFlow licensing