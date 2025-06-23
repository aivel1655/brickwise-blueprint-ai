
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ChatInterface from '../components/ChatInterface';
import ProjectTabs from '../components/ProjectTabs';
import { ChatMessage } from '../types';
import { agentService } from '../services/agentService';

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  const user = {
    name: 'Max Mustermann',
    avatar: undefined // Will show default icon
  };

  useEffect(() => {
    // Welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'agent',
      agent: 'iteration',
      content: "Welcome to MultiBuildAgent! I'm here to help you plan and build brick structures. What would you like to build today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Simulate agent processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Header user={user} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Chat Interface */}
          <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg shadow-lg flex flex-col">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
            />
          </div>

          {/* Right Panel - Project Details */}
          <div className="space-y-6">
            <ProjectTabs activeProject={currentProject} />
            
            {/* Build Progress Visualization */}
            <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Build Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Planning Phase</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gathering requirements and specifications</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Blueprint Creation</p>
                    <p className="text-sm text-gray-400">Strategic planning and material estimation</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 opacity-30">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-400">Build Instructions</p>
                    <p className="text-sm text-gray-400">Detailed step-by-step construction guide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
