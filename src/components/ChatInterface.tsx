import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Lightbulb, AlertCircle } from 'lucide-react';
import { ChatMessage, AgentResponse, EnhancedBlueprint } from '../types';
import ChatBubble from './ChatBubble';
import RecommendationCard from './RecommendationCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnhancedChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  currentBlueprint?: EnhancedBlueprint;
  suggestions?: string[];
  recommendations?: any[];
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  currentBlueprint,
  suggestions = [],
  recommendations = []
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, recommendations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isProcessing) {
      onSendMessage(suggestion);
    }
  };

  const handleSelectAlternative = (originalId: string, alternativeId: string) => {
    onSendMessage(`I'd like to replace ${originalId} with ${alternativeId}. Can you update my plan?`);
  };

  const getConversationPhase = () => {
    if (messages.length === 0) return 'start';
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.data?.readyForPlanning) return 'planning';
    if (lastMessage.data?.blueprint || currentBlueprint) return 'review';
    if (lastMessage.data?.needsMoreInfo) return 'clarification';
    return 'discussion';
  };

  const getPhaseInfo = () => {
    const phase = getConversationPhase();
    switch (phase) {
      case 'start':
        return {
          title: 'Welcome to MultiBuildAgent',
          description: 'Tell me what you want to build and I\'ll create a professional plan',
          color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
        };
      case 'clarification':
        return {
          title: 'Gathering Details',
          description: 'I need a few more details to create the perfect plan',
          color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700'
        };
      case 'planning':
        return {
          title: 'Creating Your Plan',
          description: 'Analyzing requirements and generating blueprint...',
          color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700'
        };
      case 'review':
        return {
          title: 'Plan Ready for Review',
          description: 'Your comprehensive construction plan is complete',
          color: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
        };
      default:
        return {
          title: 'In Discussion',
          description: 'Let\'s refine your project requirements',
          color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700'
        };
    }
  };

  const getInputPlaceholder = () => {
    const phase = getConversationPhase();
    switch (phase) {
      case 'start':
        return 'What would you like to build? (e.g., "I want to build a pizza oven 1m x 1m")';
      case 'clarification':
        return 'Please provide the requested information...';
      case 'review':
        return 'Ask questions about your plan, request alternatives, or ask for modifications...';
      default:
        return 'Type your message...';
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="flex flex-col h-full">
      {/* Phase Indicator */}
      <div className={`p-3 border-b ${phaseInfo.color}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">{phaseInfo.title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{phaseInfo.description}</p>
          </div>
          {currentBlueprint && (
            <Badge variant="outline" className="text-xs">
              {currentBlueprint.difficulty} • {currentBlueprint.experienceLevel}
            </Badge>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        
        {/* Enhanced Blueprint Preview in Chat */}
        {currentBlueprint && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                  📋 Your Construction Plan is Ready!
                </h4>
                <Badge className="bg-blue-500 text-white">
                  {currentBlueprint.phases.length} Phases
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="font-medium">{currentBlueprint.estimatedTime}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Total Cost</p>
                  <p className="font-medium">€{currentBlueprint.totalCost.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Next Steps:</p>
                <p className="text-sm">✓ Review your plan in the right panel</p>
                <p className="text-sm">✓ Check materials and safety guidelines</p>
                <p className="text-sm">✓ Ask for alternatives: "Can you suggest cheaper options?"</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations Display */}
        {recommendations && recommendations.length > 0 && (
          <RecommendationCard 
            recommendations={recommendations}
            onSelectAlternative={handleSelectAlternative}
          />
        )}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-4 max-w-md">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-orange-600 dark:text-orange-300 text-sm">
                  {getConversationPhase() === 'planning' ? 'Creating your blueprint...' : 'Finding recommendations...'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && !isProcessing && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick Suggestions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isProcessing}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Quick Actions */}
      {currentBlueprint && !isProcessing && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-orange-200 hover:bg-orange-100"
              onClick={() => handleSuggestionClick("Can you suggest cheaper alternatives?")}
            >
              💰 Cheaper Options
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-orange-200 hover:bg-orange-100"
              onClick={() => handleSuggestionClick("Show me premium upgrades")}
            >
              ⭐ Premium Options
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-orange-200 hover:bg-orange-100"
              onClick={() => handleSuggestionClick("Find faster delivery materials")}
            >
              🚚 Faster Delivery
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-orange-200 dark:border-orange-700 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-orange-200 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-900/30"
            disabled={isProcessing}
          >
            <Plus className="w-4 h-4 text-orange-600" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={getInputPlaceholder()}
              className="pr-12 border-orange-200 focus:border-orange-400 dark:border-orange-700"
              disabled={isProcessing}
            />
            {getConversationPhase() === 'clarification' && (
              <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500" />
            )}
          </div>
          <Button
            type="submit"
            size="icon"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={!inputValue.trim() || isProcessing}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        {/* Help Text */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {getConversationPhase() === 'start' && (
            <p>💡 Try: "I want to build a garden wall 2m long" or "Help me build a pizza oven"</p>
          )}
          {getConversationPhase() === 'review' && (
            <p>💡 Ask: "Can you suggest alternatives?" or "What are cheaper options?"</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
