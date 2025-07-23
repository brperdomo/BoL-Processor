import { User, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NutrientLogo from "@assets/Nutrient_Logo_RGB_OffWhite_1753286682769.png";
import { ApiConfigDialog } from "./api-config-dialog";

interface XTractFlowStatus {
  configured: boolean;
  mockMode: boolean;
  description: string;
}

function XTractFlowStatusIndicator() {
  const { data: status } = useQuery<XTractFlowStatus>({
    queryKey: ['/api/xtractflow/status'],
    refetchInterval: 10000, // Check every 10 seconds
  });

  if (!status) return null;

  const getStatusColor = () => {
    if (status.configured && !status.mockMode) return "text-green-400";
    if (status.mockMode) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusIcon = () => {
    if (status.configured && !status.mockMode) return <CheckCircle className="w-4 h-4" />;
    if (status.mockMode) return <Settings className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (status.configured && !status.mockMode) return "XTractFlow API Connected";
    if (status.mockMode) return "Mock Processing Mode";
    return "XTractFlow API Not Configured";
  };

  return (
    <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
    </div>
  );
}

export default function Header() {
  const queryClient = useQueryClient();
  const { data: apiStatus } = useQuery<XTractFlowStatus>({
    queryKey: ['/api/xtractflow/status'],
    refetchInterval: 10000,
  });

  const handleConfigUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/xtractflow/status'] });
  };

  return (
    <header className="bg-nutrient-card border-b border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-8 mr-3">
                <img src={NutrientLogo} alt="Nutrient" className="h-full w-auto" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-nutrient-text">Nutrient BOL Processor</h1>
                <p className="text-sm text-nutrient-text-secondary">AI-Powered Document Processing</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <XTractFlowStatusIndicator />
            
            {apiStatus && (
              <ApiConfigDialog 
                apiStatus={apiStatus} 
                onConfigUpdate={handleConfigUpdate}
              />
            )}
            
            <div className="flex items-center space-x-2 text-nutrient-text-secondary">
              <User className="w-5 h-5" />
              <span className="text-sm">Admin User</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
