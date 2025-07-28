# XTractFlow .NET Service

This service provides production-grade integration with Nutrient's XTractFlow SDK for intelligent BOL document processing.

## Overview

The XTractFlow service acts as a bridge between the Node.js frontend and Nutrient's AI-powered document processing capabilities, providing:

- **Real Document Processing**: Using actual Nutrient GdPicture.XtractFlow SDK
- **LLM Integration**: Support for OpenAI and Azure OpenAI providers
- **BOL Field Extraction**: Intelligent extraction of shipment data fields
- **Confidence Scoring**: AI-powered validation and accuracy metrics
- **RESTful API**: Clean HTTP interface for document processing

## Prerequisites

### Required Software

1. **.NET 8 SDK**
   ```bash
   # Verify installation
   dotnet --version
   
   # Download from: https://dotnet.microsoft.com/download/dotnet/8.0
   ```

2. **XTractFlow License** (Production)
   - Contact [Nutrient Sales](https://www.nutrient.io/contact-sales/) for licensing
   - Free trial licenses available for evaluation

3. **LLM Provider** (Choose one):
   - **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com/account/api-keys)
   - **Azure OpenAI**: Set up at [Azure Portal](https://portal.azure.com)

## Installation & Setup

### Option A: Docker (Recommended)

```bash
# Build the Docker image
docker build -t xtractflow-service .

# Run with OpenAI
docker run -p 8080:8080 \
  -e OPENAI_API_KEY=your_openai_key_here \
  xtractflow-service

# Run with Azure OpenAI
docker run -p 8080:8080 \
  -e AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/ \
  -e AZURE_OPENAI_API_KEY=your_azure_key_here \
  xtractflow-service
```

### Option B: Local Development

```bash
# Navigate to service directory
cd dotnet-service

# Restore dependencies
dotnet restore

# Build the project
dotnet build

# Run the service
dotnet run --urls=http://localhost:8080
```

## Configuration

### Environment Variables

```bash
# LLM Provider (choose one)
OPENAI_API_KEY=sk-your-openai-key-here
# OR
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-key-here

# XTractFlow Configuration
XTractFlow__ResourceFolder=/app/resources  # Docker default
XTractFlow__LicenseKey=your-license-key    # Production only

# Service Configuration
ASPNETCORE_URLS=http://+:8080
ASPNETCORE_ENVIRONMENT=Production
```

### appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "XTractFlow": {
    "ResourceFolder": "./resources",
    "MaxConcurrentProcessing": 5,
    "TimeoutSeconds": 30
  }
}
```

## API Endpoints

### Health Check
```
GET /health
Response: 200 OK { "status": "healthy" }
```

### Process Document
```
POST /api/process
Content-Type: multipart/form-data

Request:
- file: BOL document (PDF, JPEG, PNG, TIFF)

Response:
{
  "success": true,
  "confidence": 0.85,
  "extractedData": {
    "bolNumber": "BOL12345",
    "shipper": { "name": "...", "address": "..." },
    "consignee": { "name": "...", "address": "..." },
    "carrier": { "name": "...", "scac": "..." },
    "items": [
      {
        "description": "Product Name",
        "quantity": 10,
        "weight": 150.5,
        "class": "70"
      }
    ]
  }
}
```

## Integration with Node.js Application

The Node.js application automatically connects to this service when:

1. **XTRACTFLOW_API_URL** is set to `http://localhost:8080` (or your deployed URL)
2. **XTRACTFLOW_API_KEY** is configured (can be any value for local development)
3. Service is running and healthy

### Environment Configuration (.env)

```bash
# Enable XTractFlow integration
XTRACTFLOW_API_URL=http://localhost:8080
XTRACTFLOW_API_KEY=local-development-key

# LLM Provider for XTractFlow service
OPENAI_API_KEY=your_openai_key_here
```

## Production Deployment

### Docker Production

```bash
# Build for production
docker build -t xtractflow-service:latest .

# Deploy with production settings
docker run -d \
  --name xtractflow-service \
  -p 8080:8080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e OPENAI_API_KEY=your_production_key \
  -e XTractFlow__LicenseKey=your_license_key \
  --restart unless-stopped \
  xtractflow-service:latest
```

### Cloud Deployment

The service can be deployed to:
- **Azure Container Instances**
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **Kubernetes clusters**

## Troubleshooting

### Common Issues

**Service fails to start:**
```bash
# Check .NET version
dotnet --version

# Verify port availability
netstat -tulpn | grep 8080
```

**XTractFlow license errors:**
```bash
# Verify license key in environment
echo $XTractFlow__LicenseKey

# Check license validity with Nutrient support
```

**LLM provider connection issues:**
```bash
# Test OpenAI connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Test Azure OpenAI
curl -H "api-key: $AZURE_OPENAI_API_KEY" \
  $AZURE_OPENAI_ENDPOINT/openai/deployments
```

### Performance Optimization

- **Resource Allocation**: Minimum 2GB RAM, 2 CPU cores
- **Concurrent Processing**: Adjust `MaxConcurrentProcessing` based on resources
- **Caching**: Enable XTractFlow model caching for better performance
- **Monitoring**: Use application insights for production monitoring

## Development

### Local Development Setup

```bash
# Install development tools
dotnet tool install --global dotnet-ef
dotnet tool install --global dotnet-watch

# Run with hot reload
dotnet watch run --urls=http://localhost:8080

# Run tests
dotnet test
```

### Adding New Features

1. Update `Program.cs` for new endpoints
2. Modify BOL extraction templates as needed
3. Test with various document formats
4. Update API documentation

## Support

For technical support:
1. Check this README and troubleshooting section
2. Review Nutrient XTractFlow documentation
3. Contact Nutrient support for licensing issues
4. Create GitHub issues for application bugs

---

**Powered by Nutrient XTractFlow SDK**