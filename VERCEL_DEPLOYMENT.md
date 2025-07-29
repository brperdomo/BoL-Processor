# Vercel Deployment Guide

## 🚀 **Quick Deployment Steps**

### 1. **Prepare Repository for GitHub**
```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit - Nutrient BOL Processor"

# Push to GitHub
git remote add origin https://github.com/yourusername/nutrient-bol-processor.git
git branch -M main
git push -u origin main
```

### 2. **Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com) and connect your GitHub account
2. Click "New Project" and select your GitHub repository
3. Vercel will automatically detect the configuration from `vercel.json`
4. Click "Deploy"

### 3. **Environment Variables (Optional)**
For production XTractFlow integration, add these in Vercel dashboard:
- `OPENAI_API_KEY` - Your OpenAI API key
- `XTRACTFLOW_API_URL` - Your XTractFlow service URL
- `XTRACTFLOW_API_KEY` - Your XTractFlow API key

## 📋 **What's Different in Vercel Version**

### **Architecture Changes**
- **Serverless Functions**: Express routes converted to Vercel serverless functions in `/api/` folder
- **Mock Mode**: XTractFlow .NET service replaced with mock processing for demo purposes
- **File Handling**: Simplified file upload using `formidable` instead of `multer`
- **Storage**: In-memory storage (resets on each function call - perfect for demos)

### **Demo Limitations**
- ✅ **Full UI Experience**: All tabs, drag-and-drop, and interfaces work perfectly
- ✅ **File Upload**: Users can upload real BOL documents
- ✅ **Mock Processing**: Simulated AI extraction with realistic BOL data
- ❌ **Real XTractFlow**: .NET containerized service not available on Vercel
- ❌ **Persistent Storage**: Documents reset between deployments

### **For Internal Testing**
This Vercel deployment is perfect for:
- **UI/UX Demos**: Show complete user interface and workflows
- **Stakeholder Presentations**: Demonstrate document processing flow
- **Frontend Testing**: Test all React components and interactions
- **Mock Data Validation**: Preview realistic BOL extraction results

## 🔧 **Development vs Production**

| Feature | Local Development | Vercel Demo | Full Production |
|---------|------------------|-------------|----------------|
| Frontend | ✅ Full React App | ✅ Full React App | ✅ Full React App |
| File Upload | ✅ Real files | ✅ Real files | ✅ Real files |
| XTractFlow | ✅ Real .NET service | ❌ Mock processing | ✅ Real .NET service |
| Data Persistence | ✅ In-memory | ❌ Resets | ✅ Database |
| AI Processing | ✅ Real extraction | ❌ Simulated | ✅ Real extraction |

## 🎯 **Perfect for Internal Demos**

This Vercel deployment gives you:
1. **Professional UI** - Complete Nutrient-branded interface
2. **Real Interactions** - Drag-and-drop, file uploads, tab navigation
3. **Realistic Data** - Mock BOL extraction with proper field structure
4. **Zero Setup** - No local installation required for stakeholders
5. **Instant Access** - Share a URL for immediate testing

## 🔄 **Transitioning to Production**

When ready for production XTractFlow:
1. Deploy the .NET service to a cloud provider (AWS, Azure, Google Cloud)
2. Update environment variables with real XTractFlow endpoints
3. The same codebase works - just flip from mock to production mode

## 📁 **File Structure**
```
├── api/                    # Vercel serverless functions
│   ├── documents.js        # Document CRUD operations
│   ├── upload.js          # File upload handling
│   └── xtractflow/
│       └── status.js      # XTractFlow status (mock mode)
├── client/                # React frontend (unchanged)
├── vercel.json           # Vercel deployment configuration
└── ...                   # Other project files
```

This setup provides a perfect balance of **full functionality for demos** while maintaining **easy transition to production** when ready.