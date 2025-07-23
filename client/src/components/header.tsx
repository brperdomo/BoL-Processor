import { User } from "lucide-react";
import NutrientLogo from "@/assets/nutrient-logo.svg";

export default function Header() {
  return (
    <header className="bg-nutrient-card border-b border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3">
                <img src={NutrientLogo} alt="Nutrient" className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-nutrient-text">Nutrient</h1>
                <p className="text-sm text-nutrient-text-secondary">BOL Processing System</p>
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
