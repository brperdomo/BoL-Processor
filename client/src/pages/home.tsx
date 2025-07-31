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
    refetchInterval: (query) => {
      // Only poll if there are documents currently being processed
      const data = query.state.data as Document[] | undefined;
      const hasProcessingDocs = data?.some(doc => doc.status === "processing") ?? false;
      return hasProcessingDocs ? 2000 : false; // Poll every 2 seconds only when processing, otherwise stop
    },
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
        {/* App Overview Section */}
        <div className="mb-8 bg-nutrient-card rounded-lg p-6 border border-slate-700">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-nutrient-text mb-4">Welcome to the Nutrient BOL Processor</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-nutrient-text mb-3">What is a Bill of Lading (BOL)?</h3>
                <p className="text-nutrient-text-secondary mb-4">
                  A Bill of Lading is a legal document that serves as a receipt for shipped goods and contains detailed information about the shipment, including carrier details, shipper and consignee addresses, item descriptions, quantities, and weights.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-nutrient-text mb-3">What does this app do?</h3>
                <p className="text-nutrient-text-secondary mb-4">
                  This application automatically extracts structured data from your BOL documents using advanced AI technology, eliminating manual data entry and reducing errors in your logistics workflow.
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-nutrient-text mb-3">How it works:</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="bg-nutrient-primary rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-white font-bold">1</div>
                  <h4 className="font-medium text-nutrient-text mb-1">Upload</h4>
                  <p className="text-sm text-nutrient-text-secondary">Drag & drop your PDF BOL documents</p>
                </div>
                <div className="text-center">
                  <div className="bg-nutrient-primary rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-white font-bold">2</div>
                  <h4 className="font-medium text-nutrient-text mb-1">Process</h4>
                  <p className="text-sm text-nutrient-text-secondary">AI analyzes and extracts key data fields</p>
                </div>
                <div className="text-center">
                  <div className="bg-nutrient-primary rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-white font-bold">3</div>
                  <h4 className="font-medium text-nutrient-text mb-1">Review</h4>
                  <p className="text-sm text-nutrient-text-secondary">Validate extracted information</p>
                </div>
                <div className="text-center">
                  <div className="bg-nutrient-primary rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-white font-bold">4</div>
                  <h4 className="font-medium text-nutrient-text mb-1">Export</h4>
                  <p className="text-sm text-nutrient-text-secondary">Download in multiple formats (JSON, CSV, Excel, XML)</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="font-medium text-nutrient-text mb-2">What data is extracted:</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-nutrient-text-secondary">
                <ul className="space-y-1">
                  <li>• BOL Number & Date</li>
                  <li>• Carrier Information</li>
                  <li>• Shipper Details</li>
                </ul>
                <ul className="space-y-1">
                  <li>• Consignee Information</li>
                  <li>• Item Descriptions</li>
                  <li>• Quantities & Weights</li>
                </ul>
                <ul className="space-y-1">
                  <li>• Freight Classifications</li>
                  <li>• Special Instructions</li>
                  <li>• Reference Numbers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
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
