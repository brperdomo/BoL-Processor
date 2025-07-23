import { User } from "lucide-react";
import NutrientLogo from "@assets/Nutrient_Logo_RGB_OffWhite_1753286682769.png";

export default function Header() {
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
                <p className="text-sm text-nutrient-text-secondary">Automated Document Processing</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
