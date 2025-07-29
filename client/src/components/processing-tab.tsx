import { FileText, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import type { Document } from "@shared/schema";

interface ProcessingTabProps {
  documents: Document[];
}

const ProcessingStages = [
  { name: "File Upload Complete", stage: "upload_complete" },
  { name: "Document Type Detection", stage: "type_detection" },
  { name: "Field Extraction", stage: "field_extraction" },
  { name: "Data Validation", stage: "data_validation" },
];

function ProcessingCard({ document }: { document: Document }) {
  // Use real processing data from document
  const progressValue = document.processingProgress || 0;
  const currentStageMap = {
    "pending": 0,
    "upload_complete": 1, 
    "type_detection": 2,
    "field_extraction": 3,
    "data_validation": 4
  };
  const currentStage = currentStageMap[document.processingStage as keyof typeof currentStageMap] || 0;

  return (
    <Card className="bg-nutrient-card border border-slate-700 fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-12 bg-nutrient-error rounded flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-nutrient-text">{document.originalName}</h4>
              <p className="text-sm text-nutrient-text-secondary">
                Uploaded {Math.floor((Date.now() - new Date(document.uploadedAt).getTime()) / 60000)} minutes ago • {(document.fileSize / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-nutrient-primary" />
            <span className="text-sm text-nutrient-text-secondary">Processing...</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-nutrient-text-secondary">Document Classification</span>
            <span className="text-nutrient-primary">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
        
        {/* Processing stages */}
        <div className="space-y-2">
          {ProcessingStages.map((stage, index) => (
            <div key={stage.name} className="flex items-center space-x-3 text-sm">
              {index < currentStage ? (
                <div className="w-4 h-4 rounded-full bg-nutrient-secondary flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              ) : index === currentStage ? (
                <Loader2 className="w-4 h-4 animate-spin text-nutrient-primary" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-600 rounded-full"></div>
              )}
              <span className={index <= currentStage ? "text-nutrient-text" : "text-nutrient-text-secondary opacity-50"}>
                {stage.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProcessingTab({ documents }: ProcessingTabProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-nutrient-card flex items-center justify-center">
          <FileText className="w-8 h-8 text-nutrient-text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-nutrient-text mb-2">No Documents Processing</h3>
        <p className="text-nutrient-text-secondary">Upload some documents to see processing status here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {documents.map((document) => (
        <ProcessingCard key={document.id} document={document} />
      ))}
    </div>
  );
}
