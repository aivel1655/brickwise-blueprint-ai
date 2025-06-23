import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { agentService } from '../services/agentService';

interface ApiKeySettingsProps {
  onApiKeyUpdate?: (hasKey: boolean) => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onApiKeyUpdate }) => {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    // Check if API key is already set
    const sessionInfo = agentService.getSessionInfo();
    setIsKeySet(sessionInfo.hasApiKey);
    
    // Load saved key from localStorage
    try {
      const savedKey = localStorage.getItem('groq_api_key');
      if (savedKey && savedKey !== 'your_groq_api_key_here') {
        setApiKey(savedKey);
        setIsKeySet(true);
      }
    } catch (error) {
      console.warn('Failed to load saved API key:', error);
    }

    onApiKeyUpdate?.(sessionInfo.hasApiKey);
  }, [onApiKeyUpdate]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationResult({ valid: false, message: 'Please enter an API key' });
      return;
    }

    if (!apiKey.startsWith('gsk_')) {
      setValidationResult({ valid: false, message: 'Groq API keys should start with "gsk_"' });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Save the API key
      agentService.setGroqApiKey(apiKey);
      
      // Verify the session info is updated
      const sessionInfo = agentService.getSessionInfo();
      
      if (sessionInfo.hasApiKey) {
        setIsKeySet(true);
        setValidationResult({ valid: true, message: 'API key saved successfully! AI features are now enabled.' });
        onApiKeyUpdate?.(true);
      } else {
        setValidationResult({ valid: false, message: 'Failed to configure API key. Please check the key format.' });
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      setValidationResult({ valid: false, message: 'Error saving API key. Please try again.' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setIsKeySet(false);
    setValidationResult(null);
    
    try {
      localStorage.removeItem('groq_api_key');
      agentService.setGroqApiKey('');
      onApiKeyUpdate?.(false);
    } catch (error) {
      console.warn('Failed to clear API key:', error);
    }
  };

  const handleTestConnection = async () => {
    if (!isKeySet) {
      setValidationResult({ valid: false, message: 'Please save an API key first' });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Test the connection by asking a simple question
      const response = await agentService.processUserMessage('Test AI connection');
      
      if (response.data?.expertAdvice || response.agent === 'ai_expert') {
        setValidationResult({ valid: true, message: 'AI connection successful! All features are working.' });
      } else {
        setValidationResult({ valid: true, message: 'API key is configured. AI features will activate during conversations.' });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setValidationResult({ valid: false, message: 'Connection test failed. Please check your API key.' });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          AI Settings
        </CardTitle>
        <CardDescription>
          Configure Groq Cloud API for enhanced AI construction expertise
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">AI Status:</span>
          <Badge variant={isKeySet ? "default" : "outline"} className="flex items-center gap-1">
            {isKeySet ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Enabled
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Disabled
              </>
            )}
          </Badge>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="api-key">Groq Cloud API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_your_groq_api_key_here"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              onClick={handleSaveApiKey}
              disabled={isValidating || !apiKey.trim()}
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleTestConnection}
            disabled={!isKeySet || isValidating}
            variant="outline"
            size="sm"
          >
            {isValidating ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {isKeySet && (
            <Button
              onClick={handleClearApiKey}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              Clear Key
            </Button>
          )}
        </div>

        {/* Validation Result */}
        {validationResult && (
          <Alert className={validationResult.valid ? "border-green-500" : "border-red-500"}>
            {validationResult.valid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription>
              {validationResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Information Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium mb-2">🤖 AI Features Include:</h4>
          <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <li>• Material optimization and cost analysis</li>
            <li>• Expert construction advice and troubleshooting</li>
            <li>• Project complexity assessment</li>
            <li>• Safety recommendations and warnings</li>
            <li>• Alternative suggestions and improvements</li>
          </ul>
          
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Get Your API Key:</h5>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              Sign up for free at Groq Cloud to get your API key
            </p>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.open('https://console.groq.com/keys', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              Get Groq API Key
            </Button>
          </div>
        </div>

        {/* Usage Information */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>🔒 Your API key is stored locally in your browser and only used for AI features.</p>
          <p>💡 MultiBuildAgent works without AI, but enhanced features require the API key.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeySettings;