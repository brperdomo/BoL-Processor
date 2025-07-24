import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ApiConfigDialogProps {
  apiStatus: {
    configured: boolean;
    mockMode: boolean;
    description: string;
  };
  onConfigUpdate: () => void;
}

export function ApiConfigDialog({ apiStatus, onConfigUpdate }: ApiConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  // Load current configuration when dialog opens
  useEffect(() => {
    if (open) {
      loadCurrentConfig();
    }
  }, [open]);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/xtractflow/config');
      if (response.ok) {
        const config = await response.json();
        setApiUrl(config.apiUrl || '');
        setApiKey(config.apiKey || '');
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const testConnection = async () => {
    if (!apiUrl || !apiKey) {
      toast({
        title: "Missing Configuration",
        description: "Please provide both XTractFlow API URL and API Key",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/xtractflow/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiUrl, apiKey }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Connection Successful",
          description: "XTractFlow API is accessible and ready",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message || "Failed to connect to XTractFlow API",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Network error while testing connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    if (!apiUrl || !apiKey) {
      toast({
        title: "Missing Information",
        description: "Please provide both API URL and API Key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/xtractflow/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiUrl, apiKey }),
      });

      if (response.ok) {
        toast({
          title: "Configuration Saved",
          description: "XTractFlow API configuration updated successfully",
        });
        setOpen(false);
        onConfigUpdate();
      } else {
        const result = await response.json();
        toast({
          title: "Save Failed",
          description: result.message || "Failed to save configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Network error while saving configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/xtractflow/config', {
        method: 'DELETE',
      });

      if (response.ok) {
        setApiUrl('');
        setApiKey('');
        toast({
          title: "Configuration Cleared",
          description: "Switched back to mock mode for development",
        });
        setOpen(false);
        onConfigUpdate();
      } else {
        toast({
          title: "Clear Failed",
          description: "Failed to clear configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Clear Error",
        description: "Network error while clearing configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">API Setup</span>
          {apiStatus.configured ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Production
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Mock Mode
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>XTractFlow API Configuration</DialogTitle>
          <DialogDescription>
            Configure your Nutrient XTractFlow API credentials for production document processing.
            Leave empty to use mock mode for development and testing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {apiStatus.configured ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="font-medium">
                {apiStatus.configured ? 'Production Mode' : 'Mock Mode'}
              </p>
              <p className="text-sm text-muted-foreground">
                {apiStatus.description}
              </p>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">XTractFlow API URL</Label>
              <Input
                id="apiUrl"
                placeholder="https://your-xtractflow-api.com"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Your XTractFlow API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                onClick={testConnection}
                variant="outline"
                disabled={(!apiUrl || !apiKey) || isTestingConnection}
                className="flex-1"
              >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={(!apiUrl || !apiKey) || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Saving...' : 'Save & Activate'}
              </Button>
            </div>
            {apiStatus.configured && (
              <Button
                onClick={clearConfiguration}
                variant="destructive"
                disabled={isLoading}
                className="w-full"
              >
                Clear Configuration (Use Mock Mode)
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Getting Started:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Deploy the .NET XTractFlow service using the provided Docker setup</li>
              <li>Contact Nutrient for XTractFlow SDK license and credentials</li>
              <li>Point the API URL to your XTractFlow service endpoint</li>
              <li>Test the connection to verify BOL processing is working</li>
              <li>Mock mode generates sample data for development purposes</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}