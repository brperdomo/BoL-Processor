import { FileText, Download, Eye, Copy, FileSpreadsheet, FileX, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Document, BOLData } from "@shared/schema";

interface ProcessedTabProps {
  documents: Document[];
}

// Helper function for bulk export
const handleBulkExport = async (format: 'json' | 'csv' | 'excel' | 'xml', toast: any) => {
  try {
    const response = await fetch(`/api/documents/export/${format}`);
    if (!response.ok) {
      if (response.status === 404) {
        toast({
          title: "No Data Available",
          description: "No processed documents found for export",
          variant: "destructive"
        });
        return;
      }
      throw new Error('Export failed');
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `bol_export.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `BOL data exported as ${format.toUpperCase()}`,
    });
  } catch (error) {
    toast({
      title: "Export Failed",
      description: `Could not export BOL data as ${format.toUpperCase()}`,
      variant: "destructive"
    });
  }
};

function ProcessedCard({ document }: { document: Document }) {
  const { toast } = useToast();
  const extractedData = document.extractedData as BOLData;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
    toast({
      title: "JSON Copied",
      description: "Extracted data copied to clipboard",
    });
  };

  const handleDownloadJson = async () => {
    try {
      const response = await fetch(`/api/documents/${document.id}/export`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `BOL_${document.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "BOL data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export BOL data",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-nutrient-card border border-slate-700 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-12 bg-nutrient-secondary rounded flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-nutrient-text">{document.originalName}</h4>
                <p className="text-sm text-nutrient-text-secondary">
                  Processed {Math.floor((Date.now() - new Date(document.processedAt || document.uploadedAt).getTime()) / 60000)} minutes ago • 
                  Confidence: {Math.round((document.confidence || 0) * 100)}%
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className="bg-nutrient-secondary bg-opacity-20 text-nutrient-secondary hover:bg-nutrient-secondary hover:bg-opacity-30">
                    Processed
                  </Badge>
                  {extractedData?.documentType === 'multi_bol' ? (
                    <span className="text-xs text-nutrient-text-secondary">
                      Multi-BOL: {extractedData?.totalBOLs || 0} BOLs • {(document.fileSize / 1024).toFixed(1)} KB
                    </span>
                  ) : (
                    <span className="text-xs text-nutrient-text-secondary">
                      BOL: {extractedData?.bolNumber || 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadJson}
                className="p-2 hover:bg-slate-700"
              >
                <Download className="w-5 h-5 text-nutrient-text-secondary hover:text-nutrient-text" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-slate-700"
              >
                <Eye className="w-5 h-5 text-nutrient-text-secondary hover:text-nutrient-text" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Extracted Data Display */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Information */}
            <div className="space-y-4">
              <h5 className="font-medium text-nutrient-text mb-3">Key Information</h5>
              <div className="space-y-3">
                {extractedData?.documentType === 'multi_bol' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-nutrient-text-secondary">Document Type:</span>
                      <span className="text-nutrient-text font-semibold">Multi-BOL Document</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nutrient-text-secondary">Total BOLs:</span>
                      <span className="text-nutrient-text font-mono">{extractedData?.totalBOLs || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nutrient-text-secondary">File Size:</span>
                      <span className="text-nutrient-text">{(document.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nutrient-text-secondary">Primary BOL:</span>
                      <span className="text-nutrient-text font-mono">{extractedData?.bolNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nutrient-text-secondary">Total Weight (All BOLs):</span>
                      <span className="text-nutrient-text">
                        {extractedData?.totalWeight && extractedData?.additionalBOLs 
                          ? `${(extractedData.totalWeight + extractedData.additionalBOLs.reduce((sum, bol) => sum + (bol.totalWeight || 0), 0)).toLocaleString()} lbs`
                          : extractedData?.totalWeight 
                            ? `${extractedData.totalWeight.toLocaleString()} lbs`
                            : 'N/A'
                        }
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-nutrient-text-secondary">BOL Number:</span>
                      <span className="text-nutrient-text font-mono">{extractedData?.bolNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nutrient-text-secondary">Carrier:</span>
                      <span className="text-nutrient-text">{extractedData?.carrier?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nutrient-text-secondary">Ship Date:</span>
                      <span className="text-nutrient-text">{extractedData?.shipDate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nutrient-text-secondary">Total Weight:</span>
                      <span className="text-nutrient-text">{extractedData?.totalWeight ? `${extractedData.totalWeight.toLocaleString()} lbs` : 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Addresses */}
            <div className="space-y-4">
              <h5 className="font-medium text-nutrient-text mb-3">Addresses</h5>
              <div className="space-y-3">
                <div>
                  <span className="text-nutrient-text-secondary text-sm">Shipper:</span>
                  <p className="text-nutrient-text text-sm mt-1">
                    {extractedData?.shipper?.name && (
                      <>
                        {extractedData.shipper.name}<br />
                        {extractedData.shipper.address}
                      </>
                    ) || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-nutrient-text-secondary text-sm">Consignee:</span>
                  <p className="text-nutrient-text text-sm mt-1">
                    {extractedData?.consignee?.name && (
                      <>
                        {extractedData.consignee.name}<br />
                        {extractedData.consignee.address}
                      </>
                    ) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Items Table */}
          {extractedData?.items && extractedData.items.length > 0 && (
            <div className="mt-6">
              <h5 className="font-medium text-nutrient-text mb-3">Items</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 text-nutrient-text-secondary font-medium">Description</th>
                      <th className="text-left py-2 text-nutrient-text-secondary font-medium">Quantity</th>
                      <th className="text-left py-2 text-nutrient-text-secondary font-medium">Weight</th>
                      <th className="text-left py-2 text-nutrient-text-secondary font-medium">Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.items.map((item, index) => (
                      <tr key={index} className="border-b border-slate-700 border-opacity-50">
                        <td className="py-3 text-nutrient-text">{item.description || 'N/A'}</td>
                        <td className="py-3 text-nutrient-text">{item.quantity || 'N/A'}</td>
                        <td className="py-3 text-nutrient-text">{item.weight ? `${item.weight} lbs` : 'N/A'}</td>
                        <td className="py-3 text-nutrient-text">{item.class || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* JSON Output Preview */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-nutrient-text">JSON Output</h5>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyJson}
                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 text-nutrient-text border-slate-600"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy JSON
              </Button>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-nutrient-text-secondary">
                <code>{JSON.stringify(extractedData, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProcessedTab({ documents }: ProcessedTabProps) {
  const { toast } = useToast();

  const handleBulkExport = async (format: 'json' | 'csv' | 'excel' | 'xml') => {
    try {
      const response = await fetch(`/api/documents/export/${format}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "No Data Available",
            description: "No processed documents found for export",
            variant: "destructive"
          });
          return;
        }
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `bol_export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Exported ${documents.length} documents as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Could not export documents as ${format.toUpperCase()}`,
        variant: "destructive"
      });
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-nutrient-card flex items-center justify-center">
          <FileText className="w-8 h-8 text-nutrient-text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-nutrient-text mb-2">No Processed Documents</h3>
        <p className="text-nutrient-text-secondary">Successfully processed documents will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Export Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-nutrient-text">Processed Documents</h3>
          <p className="text-sm text-nutrient-text-secondary">{documents.length} documents ready for ERP/WMS integration</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-nutrient-primary hover:bg-nutrient-primary/90 text-white">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-nutrient-card border-slate-600">
            <DropdownMenuItem 
              onClick={() => handleBulkExport('json')}
              className="hover:bg-slate-700 text-nutrient-text"
            >
              <Database className="w-4 h-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleBulkExport('csv')}
              className="hover:bg-slate-700 text-nutrient-text"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleBulkExport('excel')}
              className="hover:bg-slate-700 text-nutrient-text"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleBulkExport('xml')}
              className="hover:bg-slate-700 text-nutrient-text"
            >
              <FileX className="w-4 h-4 mr-2" />
              Export as XML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Documents List */}
      <div className="space-y-6">
        {documents.map((document) => (
          <ProcessedCard key={document.id} document={document} />
        ))}
      </div>
    </div>
  );
}
