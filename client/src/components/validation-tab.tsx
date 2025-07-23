import { useState } from "react";
import { FileText, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Document, BOLData, ValidationIssue } from "@shared/schema";

interface ValidationTabProps {
  documents: Document[];
}

function ValidationCard({ document }: { document: Document }) {
  const { toast } = useToast();
  const [editableData, setEditableData] = useState(document.extractedData as BOLData);
  const validationIssues = document.validationIssues as ValidationIssue[];

  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/documents/${document.id}`, {
        status: 'processed',
        extractedData: editableData,
        validationIssues: null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Approved",
        description: "Document has been moved to processed folder",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve document",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/documents/${document.id}`, {
        status: 'unprocessed',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Rejected",
        description: "Document has been moved to unprocessed folder",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: () => {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject document",
        variant: "destructive",
      });
    },
  });

  const updateField = (field: string, value: any) => {
    setEditableData(prev => {
      const newData = { ...prev };
      const fieldPath = field.split('.');
      let current = newData as any;
      
      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (!current[fieldPath[i]]) current[fieldPath[i]] = {};
        current = current[fieldPath[i]];
      }
      
      current[fieldPath[fieldPath.length - 1]] = value;
      return newData;
    });
  };

  return (
    <Card className="bg-nutrient-card border border-slate-700 border-l-4 border-l-nutrient-warning">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-12 bg-nutrient-warning rounded flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-nutrient-text">{document.originalName}</h4>
              <p className="text-sm text-nutrient-text-secondary">
                Processed {Math.floor((Date.now() - new Date(document.processedAt || document.uploadedAt).getTime()) / 60000)} minutes ago • 
                Confidence: {Math.round((document.confidence || 0) * 100)}%
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className="bg-nutrient-warning bg-opacity-20 text-nutrient-warning hover:bg-nutrient-warning hover:bg-opacity-30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Needs Review
                </Badge>
                <span className="text-xs text-nutrient-text-secondary">
                  BOL: {editableData?.bolNumber || 'N/A'} (Low Confidence)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="px-4 py-2 bg-nutrient-secondary hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              className="px-4 py-2 bg-nutrient-error hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        </div>
        
        {/* Validation Issues */}
        {validationIssues && validationIssues.length > 0 && (
          <div className="bg-nutrient-warning bg-opacity-10 border border-nutrient-warning border-opacity-30 rounded-lg p-4 mb-4">
            <h5 className="text-nutrient-warning font-medium text-sm mb-2">Validation Issues</h5>
            <ul className="space-y-2 text-sm text-nutrient-text">
              {validationIssues.map((issue, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-nutrient-warning mt-0.5 flex-shrink-0" />
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Extracted Data with Editable Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h5 className="font-medium text-nutrient-text mb-3">Extracted Data (Editable)</h5>
            <div className="space-y-3">
              <div>
                <Label className="block text-sm text-nutrient-text-secondary mb-1">BOL Number</Label>
                <Input
                  value={editableData?.bolNumber || ''}
                  onChange={(e) => updateField('bolNumber', e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-nutrient-text focus:border-nutrient-primary"
                />
              </div>
              <div>
                <Label className="block text-sm text-nutrient-text-secondary mb-1">Carrier Name</Label>
                <Input
                  value={editableData?.carrier?.name || ''}
                  onChange={(e) => updateField('carrier.name', e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-nutrient-text focus:border-nutrient-primary"
                />
              </div>
              <div>
                <Label className="block text-sm text-nutrient-text-secondary mb-1">Total Weight</Label>
                <Input
                  type="number"
                  value={editableData?.totalWeight || ''}
                  onChange={(e) => updateField('totalWeight', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-700 border-red-400 text-nutrient-text focus:border-nutrient-primary"
                />
                <p className="text-xs text-nutrient-error mt-1">Discrepancy detected with item totals</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-medium text-nutrient-text mb-3">Consignee Address</h5>
            <div className="space-y-3">
              <div>
                <Label className="block text-sm text-nutrient-text-secondary mb-1">Company Name</Label>
                <Input
                  value={editableData?.consignee?.name || ''}
                  onChange={(e) => updateField('consignee.name', e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-nutrient-text focus:border-nutrient-primary"
                />
              </div>
              <div>
                <Label className="block text-sm text-nutrient-text-secondary mb-1">Address</Label>
                <Textarea
                  rows={3}
                  value={editableData?.consignee?.address || ''}
                  onChange={(e) => updateField('consignee.address', e.target.value)}
                  className="w-full bg-slate-700 border-amber-400 text-nutrient-text focus:border-nutrient-primary resize-none"
                />
                <p className="text-xs text-nutrient-warning mt-1">Address appears incomplete</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ValidationTab({ documents }: ValidationTabProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-nutrient-card flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-nutrient-text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-nutrient-text mb-2">No Documents Need Validation</h3>
        <p className="text-nutrient-text-secondary">Documents requiring manual review will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {documents.map((document) => (
        <ValidationCard key={document.id} document={document} />
      ))}
    </div>
  );
}
