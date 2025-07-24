# XTractFlow Service

This is a .NET 8 web service that provides the real Nutrient XTractFlow API integration for the BOL Processor application.

## Prerequisites

- .NET 8.0 SDK
- Nutrient XTractFlow SDK license
- OpenAI API key or Azure OpenAI credentials

## Setup

1. **Install Dependencies**
   ```bash
   dotnet restore
   ```

2. **Configure XTractFlow Resources**
   - Download XTractFlow OCR resources from Nutrient
   - Place them in the `/app/resources` directory (or update `XTractFlow:ResourceFolder` in appsettings.json)

3. **Configure LLM Provider**
   
   **Option A: OpenAI**
   ```json
   {
     "OpenAI": {
       "ApiKey": "sk-your-openai-key-here"
     }
   }
   ```
   
   **Option B: Azure OpenAI**
   ```json
   {
     "AzureOpenAI": {
       "Endpoint": "https://your-resource.openai.azure.com/",
       "ApiKey": "your-azure-openai-key",
       "DeploymentName": "gpt-4"
     }
   }
   ```

## Running the Service

### Development
```bash
dotnet run
```
The service will be available at `http://localhost:5000`

### Production with Docker
```bash
docker build -t xtractflow-service .
docker run -p 8080:8080 \
  -e OpenAI__ApiKey="sk-your-key" \
  xtractflow-service
```

## API Endpoints

### Health Check
```http
GET /health
```

### Process Document
```http
POST /api/process
Content-Type: multipart/form-data

file: [BOL document file]
componentId: [optional component ID]
```

### Create BOL Component
```http
POST /api/components/bol
```

## Integration with Node.js Application

Update your Node.js XTractFlow service configuration to point to this service:

```javascript
// In your Node.js app configuration
const XTRACTFLOW_API_URL = 'http://localhost:8080'; // or your Docker container URL
```

## Environment Variables

- `XTractFlow__ResourceFolder`: Path to XTractFlow OCR resources
- `OpenAI__ApiKey`: OpenAI API key
- `AzureOpenAI__Endpoint`: Azure OpenAI endpoint
- `AzureOpenAI__ApiKey`: Azure OpenAI API key
- `AzureOpenAI__DeploymentName`: Azure OpenAI deployment name

## Production Deployment

For production deployment:

1. Build and publish the Docker image
2. Deploy to your container orchestration platform
3. Ensure XTractFlow resources are available in the container
4. Configure environment variables for your LLM provider
5. Update your Node.js application to use the production URL

## License Requirements

This service requires a valid Nutrient XTractFlow license. Contact Nutrient for licensing information.