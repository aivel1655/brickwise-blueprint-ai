import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Settings, 
  BarChart3, 
  Zap, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Bot,
  Cpu,
  Network
} from 'lucide-react';
import { agentService } from '../services/agentService';
import ApiKeySettings from './ApiKeySettings';

interface WorkflowStatus {
  sessionId: string;
  messageCount: number;
  currentPhase: string;
  hasApiKey: boolean;
}

interface EnhancedWorkflowInterfaceProps {
  className?: string;
}

const EnhancedWorkflowInterface: React.FC<EnhancedWorkflowInterfaceProps> = ({ className }) => {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({
    sessionId: '',
    messageCount: 0,
    currentPhase: 'input',
    hasApiKey: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    updateWorkflowStatus();
  }, []);

  const updateWorkflowStatus = () => {
    try {
      const sessionInfo = agentService.getSessionInfo();
      setWorkflowStatus(sessionInfo);
    } catch (error) {
      console.error('Error updating workflow status:', error);
    }
  };

  const handleNewSession = () => {
    setIsLoading(true);
    try {
      agentService.clearSession();
      updateWorkflowStatus();
      // Trigger a page refresh to reset the entire interface
      window.location.reload();
    } catch (error) {
      console.error('Error starting new session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeyUpdate = (hasKey: boolean) => {
    setWorkflowStatus(prev => ({ ...prev, hasApiKey: hasKey }));
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'input':
        return <MessageSquare className="w-4 h-4" />;
      case 'clarification':
        return <AlertTriangle className="w-4 h-4" />;
      case 'planning':
        return <Cpu className="w-4 h-4" />;
      case 'review':
        return <CheckCircle className="w-4 h-4" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Network className="w-4 h-4" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'input':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'clarification':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'planning':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'review':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'complete':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getPhaseDescription = (phase: string) => {
    switch (phase) {
      case 'input':
        return 'Ready to receive project information';
      case 'clarification':
        return 'Gathering additional project details';
      case 'planning':
        return 'Creating comprehensive construction plan';
      case 'review':
        return 'Plan complete - ready for questions and modifications';
      case 'complete':
        return 'Project planning completed';
      default:
        return 'Workflow in progress';
    }
  };

  return (
    <div className={className}>
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="ai-settings">AI Settings</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
        </TabsList>

        {/* Workflow Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Workflow Engine Status
              </CardTitle>
              <CardDescription>
                Enhanced conversation management with AI integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Phase */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Phase:</span>
                <Badge className={`flex items-center gap-1 ${getPhaseColor(workflowStatus.currentPhase)}`}>
                  {getPhaseIcon(workflowStatus.currentPhase)}
                  {workflowStatus.currentPhase.charAt(0).toUpperCase() + workflowStatus.currentPhase.slice(1)}
                </Badge>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getPhaseDescription(workflowStatus.currentPhase)}
              </div>

              {/* Conversation Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {workflowStatus.messageCount}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Messages</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold">
                    {workflowStatus.hasApiKey ? (
                      <span className="text-green-600">AI</span>
                    ) : (
                      <span className="text-gray-400">STD</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Mode</div>
                </div>
              </div>

              {/* AI Status */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">AI Enhancement:</span>
                  <Badge variant={workflowStatus.hasApiKey ? "default" : "outline"} className="flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    {workflowStatus.hasApiKey ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {workflowStatus.hasApiKey 
                    ? 'AI construction expert providing enhanced advice and optimization'
                    : 'Standard mode - Configure AI settings for enhanced features'
                  }
                </div>
              </div>

              {/* Workflow Features */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Enhanced Features
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Multi-turn conversation handling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Intelligent agent routing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Session persistence & recovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Context-aware responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {workflowStatus.hasApiKey ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-gray-400" />
                    )}
                    <span className={workflowStatus.hasApiKey ? '' : 'text-gray-400'}>
                      AI expert construction advice
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings Tab */}
        <TabsContent value="ai-settings">
          <ApiKeySettings onApiKeyUpdate={handleApiKeyUpdate} />
        </TabsContent>

        {/* Session Management Tab */}
        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Session Management
              </CardTitle>
              <CardDescription>
                Manage your conversation session and workflow state
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Session Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Session ID:</span>
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {workflowStatus.sessionId.split('-').pop()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Conversation Started:</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    This session
                  </span>
                </div>
              </div>

              {/* Session Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-3">Session Actions</h4>
                
                <div className="space-y-2">
                  <Button
                    onClick={handleNewSession}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {isLoading ? 'Starting...' : 'Start New Project'}
                  </Button>
                  
                  <Button
                    onClick={updateWorkflowStatus}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Refresh Status
                  </Button>
                </div>
              </div>

              {/* Session Info */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <p>💾 Your conversation is automatically saved in your browser</p>
                <p>🔄 Session persists across page refreshes</p>
                <p>🚀 Enhanced workflow engine provides intelligent conversation management</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedWorkflowInterface;