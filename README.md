# Nutrient BOL Processor

A full-stack web application for processing Bill of Lading (BOL) documents using AI-powered document extraction. The system allows users to upload documents, processes them through mock AI services (designed for easy integration with actual Nutrient AI Document SDK), and provides a tabbed interface for managing documents in different processing states.

![Nutrient BOL Processor](./attached_assets/Nutrient_Logo_RGB_OffWhite_1753286682769.png)

## Features

- **Dark Theme UI**: Professional dark theme with Nutrient brand colors
- **Drag & Drop Upload**: Intuitive file upload supporting PDF, JPG, PNG, TIFF formats
- **Real-time Processing**: Live status updates with progress indicators
- **Smart Classification**: Automatic document type detection and routing
- **Data Extraction**: Structured BOL data extraction with confidence scoring
- **Validation Workflow**: Manual review interface for low-confidence extractions
- **JSON Export**: Download extracted data in structured JSON format
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling with custom Nutrient brand colors
- **shadcn/ui** components built on Radix UI primitives
- **TanStack Query** for server state management
- **React Dropzone** for file upload functionality
- **Wouter** for lightweight client-side routing

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Multer** for file upload handling
- **In-memory storage** (easily replaceable with database)
- **Mock AI processing** (ready for Nutrient AI SDK integration)

## Prerequisites

### For Mac Users
1. **Node.js 20+**: Install from [nodejs.org](https://nodejs.org/) or use Homebrew:
   ```bash
   brew install node@20
   ```

2. **Git**: Usually pre-installed on Mac, or install with:
   ```bash
   brew install git
   ```

### For PC Users
1. **Node.js 20+**: Download and install from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version (20.x.x)
   - During installation, make sure to check "Add to PATH"

2. **Git**: Download from [git-scm.com](https://git-scm.com/download/win)
   - Use default installation options

3. **Windows Terminal** (recommended): Install from Microsoft Store for better command line experience

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-github-repo-url>
cd nutrient-bol-processor
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```

The application will start on `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking

## Project Structure

```
nutrient-bol-processor/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
│   └── index.html         # HTML template
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Data storage interface
├── shared/               # Shared TypeScript types
│   └── schema.ts        # Data schemas and types
├── attached_assets/     # Static assets (logos, images)
└── dist/               # Built files (created after build)
```

## File Upload Requirements

- **Supported formats**: PDF, JPG, JPEG, PNG, TIFF
- **Maximum file size**: 10MB per file
- **Multiple uploads**: Yes, drag and drop multiple files at once

## Processing Workflow

1. **Upload**: Drag and drop BOL documents into the upload zone
2. **Processing**: Documents are automatically classified and processed
3. **Routing**: Based on processing results, documents are routed to:
   - **Processing**: Currently being analyzed
   - **Processed**: Successfully extracted with high confidence
   - **Needs Validation**: Requires manual review due to low confidence
   - **Unprocessed**: Failed processing due to errors

## Mock AI Processing

The current implementation uses mock processing that simulates real Nutrient AI behavior:

- **Document Classification**: Detects BOL vs other document types
- **Field Extraction**: Extracts structured data (BOL number, shipper, consignee, etc.)
- **Confidence Scoring**: Assigns confidence levels to extracted data
- **Error Simulation**: Handles various failure scenarios (poor quality, wrong document type)

## Integration with Nutrient AI

To integrate with actual Nutrient AI Document SDK:

1. Replace mock processing in `server/routes.ts`
2. Add Nutrient AI SDK dependencies
3. Configure API credentials
4. Update processing logic to use real AI endpoints

## Troubleshooting

### Common Issues

**Port 5000 already in use:**
```bash
# Kill any process using port 5000
# Mac/Linux:
lsof -ti :5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**Node.js version issues:**
```bash
# Check your Node.js version
node --version

# Should be 20.x.x or higher
```

**Permission errors on Mac:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

**TypeScript errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Development Tips

1. **Hot Reloading**: The development server supports hot module reloading for instant updates
2. **API Testing**: The backend serves both API endpoints and static files
3. **Real-time Updates**: Document status updates every 2 seconds automatically
4. **Browser DevTools**: Use React Developer Tools for debugging components

## Production Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

The production build:
- Optimizes React bundle with Vite
- Bundles Express server with esbuild
- Serves static files and API from single process
- Ready for deployment to any Node.js hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed description and error logs

---

**Made with ❤️ for Nutrient Document Processing**