# Nutrient BOL Processor

## Overview

This is a full-stack web application for processing Bill of Lading (BOL) documents using Nutrient AI-powered document extraction. The system allows users to upload documents, processes them through mock AI services (designed for easy integration with actual Nutrient AI Document SDK), and provides a tabbed interface for managing documents in different states (processing, processed, needs validation, unprocessed). All Replit-specific references have been removed and replaced with proper Nutrient branding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Nutrient brand colors and dark theme
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **File Uploads**: React Dropzone for drag-and-drop file upload functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with JSON responses
- **File Handling**: Multer for multipart file upload processing
- **Mock AI Processing**: Simulated document processing with different outcomes

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
1. **Document Storage**: In-memory storage implementation with interface for future database integration
2. **File Upload Handler**: Multer-based file processing with type validation
3. **Mock AI Service**: Simulates Nutrient AI processing with various outcomes
4. **REST API**: CRUD operations for document management

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

### Mock Services
- Currently uses simulated AI processing that returns different outcomes based on filename patterns
- Designed to be easily replaced with actual Nutrient AI API integration

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