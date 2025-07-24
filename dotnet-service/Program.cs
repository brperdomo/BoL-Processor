using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using GdPicture14.XtractFlow;
using XTractFlow.API;
using XTractFlow.API.LLM.Providers;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseCors("AllowAll");
app.UseRouting();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "XTractFlow API" }));

// Document processing endpoint
app.MapPost("/api/process", async ([FromForm] IFormFile file, 
    [FromForm] string? componentId = null,
    [FromServices] IConfiguration config = null!) =>
{
    if (file == null || file.Length == 0)
    {
        return Results.BadRequest(new { error = "No file provided" });
    }

    try
    {
        // Initialize XTractFlow configuration
        Configuration.ResourceFolder = config["XTractFlow:ResourceFolder"] ?? "/app/resources";
        
        // Set up LLM provider (OpenAI or Azure OpenAI)
        var openAiKey = config["OpenAI:ApiKey"];
        var azureEndpoint = config["AzureOpenAI:Endpoint"];
        var azureKey = config["AzureOpenAI:ApiKey"];
        var azureDeployment = config["AzureOpenAI:DeploymentName"];

        ILLMProvider llmProvider;
        
        if (!string.IsNullOrEmpty(azureEndpoint) && !string.IsNullOrEmpty(azureKey))
        {
            llmProvider = new AzureOpenAIProvider
            {
                AzureOpenAIEndpoint = azureEndpoint,
                AzureOpenAIKey = azureKey,
                AzureOpenAIDeploymentName = azureDeployment ?? "gpt-4"
            };
        }
        else if (!string.IsNullOrEmpty(openAiKey))
        {
            llmProvider = new OpenAIProvider
            {
                OpenAIKey = openAiKey
            };
        }
        else
        {
            return Results.BadRequest(new { error = "No LLM provider configured" });
        }

        // Process the document
        using var stream = file.OpenReadStream();
        var buffer = new byte[stream.Length];
        await stream.ReadAsync(buffer, 0, (int)stream.Length);

        // Create BOL processing component if not exists
        var component = await EnsureBOLComponent(llmProvider);
        
        var processingRequest = new ProcessingRequest
        {
            ComponentId = component.Id,
            FileBuffer = buffer,
            FileName = file.FileName,
            Instructions = "Extract all Bill of Lading information including BOL number, carrier details, shipper/consignee information, dates, weights, and itemized cargo details."
        };

        var result = await ProcessDocument(processingRequest);
        
        return Results.Ok(new
        {
            componentId = component.Id,
            fileName = file.FileName,
            processedAt = DateTime.UtcNow,
            classification = result.Classification,
            fields = result.ExtractedFields,
            confidence = result.OverallConfidence,
            validationState = result.ValidationState
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: ex.Message,
            statusCode: 500,
            title: "XTractFlow Processing Error"
        );
    }
});

// Component management endpoint
app.MapPost("/api/components/bol", async ([FromServices] IConfiguration config) =>
{
    try
    {
        // Set up LLM provider
        var openAiKey = config["OpenAI:ApiKey"];
        var llmProvider = new OpenAIProvider { OpenAIKey = openAiKey };
        
        var component = await EnsureBOLComponent(llmProvider);
        
        return Results.Ok(new
        {
            componentId = component.Id,
            name = component.Name,
            description = "Bill of Lading document processing component",
            fields = component.Templates.FirstOrDefault()?.Fields.Select(f => new
            {
                name = f.Name,
                description = f.SemanticDescription,
                format = f.Format
            })
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: ex.Message,
            statusCode: 500,
            title: "Component Creation Error"
        );
    }
});

app.Run();

// Helper methods
static async Task<Component> EnsureBOLComponent(ILLMProvider llmProvider)
{
    var componentName = "BOL_Processor";
    
    // Try to get existing component first
    var existingComponents = await ComponentManager.GetComponentsAsync();
    var existing = existingComponents.FirstOrDefault(c => c.Name == componentName);
    
    if (existing != null)
    {
        return existing;
    }

    // Create new BOL component
    var component = new Component
    {
        Name = componentName,
        EnableClassifier = true,
        EnableExtraction = true,
        LLMProvider = llmProvider,
        Templates = new List<Template>
        {
            new Template
            {
                Name = "Bill of Lading",
                Identifier = "bol_template",
                SemanticDescription = "A transportation document that details the shipment of goods, including shipper, consignee, carrier information, and itemized cargo details.",
                Fields = new List<Field>
                {
                    new Field { Name = "bol_number", SemanticDescription = "The unique Bill of Lading number or reference number for tracking this shipment", Format = FieldFormat.Text },
                    new Field { Name = "carrier_name", SemanticDescription = "The transportation company responsible for moving the cargo", Format = FieldFormat.Text },
                    new Field { Name = "carrier_scac", SemanticDescription = "The Standard Carrier Alpha Code (SCAC) of the transportation company", Format = FieldFormat.Text },
                    new Field { Name = "shipper_name", SemanticDescription = "The company or individual sending the shipment", Format = FieldFormat.Text },
                    new Field { Name = "shipper_address", SemanticDescription = "The complete address of the shipper including street, city, state, and ZIP code", Format = FieldFormat.Text },
                    new Field { Name = "consignee_name", SemanticDescription = "The company or individual receiving the shipment", Format = FieldFormat.Text },
                    new Field { Name = "consignee_address", SemanticDescription = "The complete delivery address including street, city, state, and ZIP code", Format = FieldFormat.Text },
                    new Field { Name = "ship_date", SemanticDescription = "The date when the shipment was picked up or shipped", Format = FieldFormat.Date },
                    new Field { Name = "delivery_date", SemanticDescription = "The expected or actual delivery date", Format = FieldFormat.Date },
                    new Field { Name = "total_weight", SemanticDescription = "The total weight of all items in the shipment, typically in pounds or kilograms", Format = FieldFormat.Number },
                    new Field { Name = "item_descriptions", SemanticDescription = "Detailed descriptions of all items/commodities being shipped", Format = FieldFormat.Text },
                    new Field { Name = "item_quantities", SemanticDescription = "The quantities of each item (pieces, boxes, pallets, etc.)", Format = FieldFormat.Text },
                    new Field { Name = "item_weights", SemanticDescription = "Individual weights of each item or line item", Format = FieldFormat.Text },
                    new Field { Name = "freight_classes", SemanticDescription = "NMFC freight class codes for each item", Format = FieldFormat.Text }
                }
            }
        }
    };

    var createdComponent = await ComponentManager.CreateComponentAsync(component);
    return createdComponent;
}

static async Task<ProcessingResult> ProcessDocument(ProcessingRequest request)
{
    var processor = new DocumentProcessor();
    var result = await processor.ProcessAsync(request);
    return result;
}

// Data models
public class ProcessingRequest
{
    public string ComponentId { get; set; } = "";
    public byte[] FileBuffer { get; set; } = Array.Empty<byte>();
    public string FileName { get; set; } = "";
    public string Instructions { get; set; } = "";
}

public class ProcessingResult
{
    public string Classification { get; set; } = "";
    public List<ExtractedField> ExtractedFields { get; set; } = new();
    public double OverallConfidence { get; set; }
    public string ValidationState { get; set; } = "";
}

public class ExtractedField
{
    public string FieldName { get; set; } = "";
    public object? Value { get; set; }
    public double Confidence { get; set; }
    public string ValidationState { get; set; } = "";
}