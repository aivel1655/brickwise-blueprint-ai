
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import EnhancedChatInterface from '../components/ChatInterface';
import EnhancedPlanPreview from '../components/EnhancedPlanPreview';
import EnhancedWorkflowInterface from '../components/EnhancedWorkflowInterface';
import { ChatMessage, EnhancedBlueprint } from '../types';
import { agentService } from '../services/agentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Settings,
  Lightbulb,
  CheckCircle,
  Clock,
  AlertTriangle,
  Bot,
  Zap
} from 'lucide-react';

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBlueprint, setCurrentBlueprint] = useState<EnhancedBlueprint | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [workflowEngineEnabled, setWorkflowEngineEnabled] = useState(false);

  const user = {
    name: 'Max Mustermann',
    avatar: undefined
  };

  useEffect(() => {
    // Welcome message with enhanced workflow features
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'agent',
      agent: 'iteration',
      content: `Welcome to MultiBuildAgent 2.0! 🏗️✨\n\nI'm your enhanced AI construction assistant, now powered by the Complete Workflow Engine and Groq Cloud AI. I can help you build:\n\n• 🧱 Walls & garden boundaries\n• 🍕 Pizza ovens & fire pits\n• 🏠 Foundations & structures\n\n**New in 2.0:**\n• 🤖 AI-powered construction expert advice\n• 🔄 Advanced conversation management\n• 💾 Session persistence & recovery\n• 🎯 Intelligent agent routing\n• 📊 Real-time workflow monitoring\n\nJust tell me what you want to build, and I'll create a professional plan with AI-enhanced insights!\n\n*Tip: Configure AI settings in the Options tab for enhanced features.*`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    
    // Check workflow engine status
    checkWorkflowEngineStatus();
  }, []);

  const checkWorkflowEngineStatus = () => {
    try {
      const sessionInfo = agentService.getSessionInfo();
      setWorkflowEngineEnabled(true); // Workflow engine is always enabled
      console.log('Workflow Engine Status:', sessionInfo);
    } catch (error) {
      console.error('Error checking workflow engine:', error);
      setWorkflowEngineEnabled(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setSuggestions([]); // Clear suggestions when processing

    try {
      // Get conversation state to determine processing type
      const conversationState = agentService.getConversationState();
      let processingTime = 1500; // Default processing time

      if (conversationState.phase === 'planning') {
        processingTime = 3000; // Longer for plan generation
      }

      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      const response = await agentService.processUserMessage(content, { messages });
      
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        type: 'agent',
        agent: response.agent as any,
        content: response.message,
        timestamp: new Date(),
        data: response.data
      };

      setMessages(prev => [...prev, agentMessage]);

      // Handle blueprint data
      if (response.data?.blueprint) {
        setCurrentBlueprint(response.data.blueprint);
        setActiveTab('plan'); // Auto-switch to plan view when blueprint is ready
      }

      // Handle suggestions
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'agent',
        content: 'Sorry, I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhaseClick = (phaseIndex: number) => {
    setCurrentPhase(phaseIndex);
  };

  const getProjectStats = () => {
    if (!currentBlueprint) return null;
    
    return {
      totalSteps: currentBlueprint.detailedSteps.length,
      completedSteps: Math.floor(currentBlueprint.detailedSteps.length * (currentPhase / currentBlueprint.phases.length)),
      safetyItems: currentBlueprint.safetyGuidelines.length,
      totalCost: currentBlueprint.totalCost
    };
  };

  const stats = getProjectStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Header user={user} />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Chat Interface */}
          <div className="xl:col-span-1 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg shadow-lg flex flex-col">
            <EnhancedChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              currentBlueprint={currentBlueprint}
              suggestions={suggestions}
            />
          </div>

          {/* Right Panel - Enhanced Project View */}
          <div className="xl:col-span-2 space-y-6">
            {/* Enhanced Status Bar */}
            {workflowEngineEnabled && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Zap className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200">
                          Enhanced Workflow Engine Active
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Advanced conversation management with AI integration ready
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      <Bot className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{stats.completedSteps}/{stats.totalSteps}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Steps</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{currentBlueprint?.estimatedTime.split('-')[0] || '0'}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Days Min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold">{stats.safetyItems}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Safety Items</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">€{stats.totalCost.toFixed(0)}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Cost</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content Tabs */}
            <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg shadow-lg flex flex-col flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden sm:inline">Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="plan" className="flex items-center gap-2" disabled={!currentBlueprint}>
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Plan</span>
                      {currentBlueprint && <Badge variant="secondary" className="ml-1 h-5 text-xs">New</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="progress" className="flex items-center gap-2" disabled={!currentBlueprint}>
                      <BarChart3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Progress</span>
                    </TabsTrigger>
                    <TabsTrigger value="workflow" className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span className="hidden sm:inline">Workflow</span>
                      {workflowEngineEnabled && <Badge variant="secondary" className="ml-1 h-5 text-xs">2.0</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="options" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Options</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="chat" className="h-full p-6">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-500" />
                          Chat Tips & Guidance
                        </CardTitle>
                        <CardDescription>
                          Maximize your MultiBuildAgent experience
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">🎯 Be Specific</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Include dimensions, materials, and your experience level for better plans
                            </p>
                          </div>
                          
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">💡 Ask Questions</h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Request alternatives, safety tips, or modifications to your plan
                            </p>
                          </div>
                          
                          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">🔧 Experience Matters</h4>
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                              Mention if you're a beginner, intermediate, or expert for tailored instructions
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="font-medium mb-2">Example Requests:</h4>
                          <div className="space-y-2 text-sm">
                            <p className="p-2 bg-gray-50 dark:bg-gray-800 rounded">"I want to build a 1.2m pizza oven, I'm a beginner"</p>
                            <p className="p-2 bg-gray-50 dark:bg-gray-800 rounded">"Help me build a garden wall 3m long and 1.5m high"</p>
                            <p className="p-2 bg-gray-50 dark:bg-gray-800 rounded">"What's the safest way to build a fire pit?"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="plan" className="h-full p-6 overflow-y-auto">
                    {currentBlueprint ? (
                      <EnhancedPlanPreview
                        blueprint={currentBlueprint}
                        currentPhase={currentPhase}
                        onPhaseClick={handlePhaseClick}
                      />
                    ) : (
                      <Card className="h-full flex items-center justify-center">
                        <CardContent>
                          <div className="text-center">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Plan Yet</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              Start a conversation to generate your construction plan
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="progress" className="h-full p-6">
                    {currentBlueprint ? (
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Construction Progress</CardTitle>
                            <CardDescription>Track your project phases and milestones</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {currentBlueprint.phases.map((phase, index) => (
                                <div key={phase.id} className="flex items-center gap-4">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    index < currentPhase 
                                      ? 'bg-green-500 text-white' 
                                      : index === currentPhase 
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                  }`}>
                                    {index < currentPhase ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium">{phase.name}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{phase.duration}</p>
                                  </div>
                                  <Badge variant={index <= currentPhase ? 'default' : 'outline'}>
                                    {index < currentPhase ? 'Complete' : index === currentPhase ? 'Current' : 'Upcoming'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card className="h-full flex items-center justify-center">
                        <CardContent>
                          <div className="text-center">
                            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Progress to Track</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              Generate a plan first to track your construction progress
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="alternatives" className="h-full p-6 overflow-y-auto">
                    <ProjectTabs activeProject={currentBlueprint} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
