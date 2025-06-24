
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import EnhancedChatInterface from '../components/ChatInterface';
import { ChatMessage, EnhancedBlueprint } from '../types';
import { agentService } from '../services/agentService';

const Index = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBlueprint, setCurrentBlueprint] = useState<EnhancedBlueprint | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const user = {
    name: 'Max Mustermann',
    avatar: undefined
  };

  useEffect(() => {
    // Initialize the service with Supabase API key if user hasn't set one
    initializeApiKey();
    
    // Welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'agent',
      agent: 'iteration',
      content: `Welcome to MultiBuildAgent 2.0! 🏗️✨\n\nI'm your enhanced AI construction assistant, now powered by the Complete Workflow Engine and Groq Cloud AI. I can help you build:\n\n• 🧱 Walls & garden boundaries\n• 🍕 Pizza ovens & fire pits\n• 🏠 Foundations & structures\n\n**Enhanced Features:**\n• 🤖 AI-powered construction expert advice\n• 🔄 Advanced conversation management\n• 💾 Session persistence & recovery\n• 🎯 Intelligent agent routing\n• 📊 Real-time workflow monitoring\n\nJust tell me what you want to build, and I'll create a professional plan with AI-enhanced insights!\n\n*Tip: Visit Settings to configure additional AI options.*`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const initializeApiKey = async () => {
    try {
      // Check if user has already set an API key
      const sessionInfo = agentService.getSessionInfo();
      
      if (!sessionInfo.hasApiKey) {
        // Try to use the Supabase secret if available
        try {
          const response = await fetch('/lovable-uploads/api/get-groq-key');
          if (response.ok) {
            const data = await response.json();
            if (data.apiKey) {
              agentService.setGroqApiKey(data.apiKey);
              console.log('✅ Using Supabase VITE_GROQ_API_KEY');
            }
          }
        } catch (error) {
          // If Supabase key is not available, that's okay - user can still use the app
          console.log('ℹ️ Supabase API key not available, AI features can be configured in Settings');
        }
      }
    } catch (error) {
      console.error('Error initializing API key:', error);
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
    setSuggestions([]);

    try {
      // Get conversation state to determine processing time
      const conversationState = agentService.getConversationState();
      let processingTime = 1500;

      if (conversationState.phase === 'planning') {
        processingTime = 3000;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🏗️ MultiBuildAgent 2.0
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your AI-powered construction planning assistant
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </Button>
            
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user.name}
            </span>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg shadow-lg h-[calc(100vh-200px)]">
          <EnhancedChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            currentBlueprint={currentBlueprint}
            suggestions={suggestions}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
