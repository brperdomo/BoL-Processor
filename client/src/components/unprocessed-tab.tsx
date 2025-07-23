import { FileText, XCircle, RefreshCw, Trash2, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Document, ProcessingError } from "@shared/schema";

interface UnprocessedTabProps {
  documents: Document[];
}

function UnprocessedCard({ document }: { document: Document }) {
  const { toast } = useToast();
  const processingErrors = document.processingErrors as ProcessingError[];

  const retryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/documents/${document.id}/retry`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Processing Restarted",
        description: "Document processing has been restarted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: () => {
      toast({
        title: "Retry Failed",
        description: "Failed to restart document processing",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/documents/${document.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Deleted",
        description: "Document has been removed from the system",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const isImageFile = document.mimeType.startsWith('image/');
  const isPDFFile = document.mimeType === 'application/pdf';

  return (
    <Card className="bg-nutrient-card border border-slate-700 border-l-4 border-l-nutrient-error">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-12 rounded flex items-center justify-center ${
              isImageFile ? 'bg-red-800' : 'bg-nutrient-error'
            }`}>
              {isImageFile ? (
                <Image className="w-6 h-6 text-white" />
              ) : (
                <FileText className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-nutrient-text">{document.originalName}</h4>
              <p className="text-sm text-nutrient-text-secondary">
                Failed processing {Math.floor((Date.now() - new Date(document.processedAt || document.uploadedAt).getTime()) / 60000)} minutes ago
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className="bg-nutrient-error bg-opacity-20 text-nutrient-error hover:bg-nutrient-error hover:bg-opacity-30">
                  <XCircle className="w-3 h-3 mr-1" />
                  {isImageFile ? 'OCR Failed' : 'Processing Failed'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="px-4 py-2 bg-nutrient-primary hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
              Retry Processing
            </Button>
            <Button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              variant="outline"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors border-slate-600"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
        
        {/* Error Details */}
        {processingErrors && processingErrors.length > 0 && (
          <div className="bg-nutrient-error bg-opacity-10 border border-nutrient-error border-opacity-30 rounded-lg p-4">
            <h5 className="text-nutrient-error font-medium text-sm mb-2">
              {isImageFile ? 'Image Quality Issues' : 'Processing Errors'}
            </h5>
            <ul className="space-y-2 text-sm text-nutrient-text">
              {processingErrors.map((error, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <XCircle className="w-4 h-4 text-nutrient-error mt-0.5 flex-shrink-0" />
                  <div>
                    <span>{error.message}</span>
                    {error.details && (
                      <p className="text-xs text-nutrient-text-secondary mt-1">{error.details}</p>
                    )}
                  </div>
                </li>
              ))}
              {isImageFile && (
                <li className="flex items-start space-x-2">
                  <XCircle className="w-4 h-4 text-nutrient-error mt-0.5 flex-shrink-0" />
                  <span>Recommendation: Rescan document with better lighting and focus</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function UnprocessedTab({ documents }: UnprocessedTabProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-nutrient-card flex items-center justify-center">
          <XCircle className="w-8 h-8 text-nutrient-text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-nutrient-text mb-2">No Unprocessed Documents</h3>
        <p className="text-nutrient-text-secondary">Documents that failed processing will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {documents.map((document) => (
        <UnprocessedCard key={document.id} document={document} />
      ))}
    </div>
  );
}
