import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import FileUploadZone from "@/components/file-upload-zone";
import ProcessingTab from "@/components/processing-tab";
import ProcessedTab from "@/components/processed-tab";
import ValidationTab from "@/components/validation-tab";
import UnprocessedTab from "@/components/unprocessed-tab";
import { Button } from "@/components/ui/button";
import { RotateCcw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { Document } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("processing");

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    refetchInterval: 2000, // Refetch every 2 seconds to show processing updates
  });

  const processingDocs = documents.filter(doc => doc.status === "processing");
  const processedDocs = documents.filter(doc => doc.status === "processed");
  const validationDocs = documents.filter(doc => doc.status === "needs_validation");
  const unprocessedDocs = documents.filter(doc => doc.status === "unprocessed");

  const TabButton = ({ 
    tabId, 
    label, 
    count, 
    icon: Icon, 
    countBgColor 
  }: { 
    tabId: string; 
    label: string; 
    count: number; 
    icon: any; 
    countBgColor: string; 
  }) => (
    <Button
      onClick={() => setActiveTab(tabId)}
      variant={activeTab === tabId ? "default" : "ghost"}
      className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
        activeTab === tabId 
          ? "bg-nutrient-primary text-white hover:bg-blue-700" 
          : "text-nutrient-text-secondary hover:text-nutrient-text hover:bg-slate-700"
      }`}
    >
      <div className="flex items-center justify-center space-x-2">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        <span className={`${countBgColor} px-2 py-0.5 rounded-full text-xs text-white`}>
          {count}
        </span>
      </div>
    </Button>
  );

  return (
    <div className="bg-nutrient-dark text-nutrient-text min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileUploadZone />
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-nutrient-card p-1 rounded-lg">
            <TabButton
              tabId="processing"
              label="Processing"
              count={processingDocs.length}
              icon={RotateCcw}
              countBgColor="bg-white bg-opacity-20"
            />
            <TabButton
              tabId="processed"
              label="Processed"
              count={processedDocs.length}
              icon={CheckCircle}
              countBgColor="bg-nutrient-secondary"
            />
            <TabButton
              tabId="validation"
              label="Needs Validation"
              count={validationDocs.length}
              icon={AlertTriangle}
              countBgColor="bg-nutrient-warning"
            />
            <TabButton
              tabId="unprocessed"
              label="Unprocessed"
              count={unprocessedDocs.length}
              icon={XCircle}
              countBgColor="bg-nutrient-error"
            />
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "processing" && <ProcessingTab documents={processingDocs} />}
        {activeTab === "processed" && <ProcessedTab documents={processedDocs} />}
        {activeTab === "validation" && <ValidationTab documents={validationDocs} />}
        {activeTab === "unprocessed" && <UnprocessedTab documents={unprocessedDocs} />}
      </div>
    </div>
  );
}
