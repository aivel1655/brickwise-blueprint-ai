
import React from 'react';
import { ChatMessage } from '../types';
import { Bot, User, Wrench, Map, Building, Sparkles } from 'lucide-react';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';
  
  const getAgentIcon = (agent?: string) => {
    switch (agent) {
      case 'iteration': return <Bot className="w-4 h-4" />;
      case 'planner': return <Map className="w-4 h-4" />;
      case 'builder': return <Building className="w-4 h-4" />;
      case 'joule': return <Sparkles className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  const getAgentName = (agent?: string) => {
    switch (agent) {
      case 'iteration': return 'Iteration Agent';
      case 'planner': return 'Strategic Planner';
      case 'builder': return 'Builder Agent';
      case 'joule': return 'SAP Joule';
      default: return 'Assistant';
    }
  };

  const getAgentColor = (agent?: string) => {
    switch (agent) {
      case 'iteration': return 'from-blue-500 to-blue-600';
      case 'planner': return 'from-green-500 to-green-600';
      case 'builder': return 'from-orange-500 to-orange-600';
      case 'joule': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md ${isUser ? 'order-1' : 'order-2'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getAgentColor(message.agent)} flex items-center justify-center text-white`}>
              {getAgentIcon(message.agent)}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getAgentName(message.agent)}
            </span>
          </div>
        )}
        
        <div className={`rounded-lg p-4 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 text-gray-800 dark:text-gray-200'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {message.data && (
            <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-600">
              {message.data.materials && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Materials Required:</h4>
                  {message.data.materials.map((material: any, index: number) => (
                    <div key={index} className="text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                      <span className="font-medium">{material.name}</span>: {material.quantity} {material.unit}
                      {material.totalPrice && <span className="float-right">€{material.totalPrice.toFixed(2)}</span>}
                    </div>
                  ))}
                </div>
              )}
              
              {message.data.steps && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Build Steps:</h4>
                  {message.data.steps.slice(0, 3).map((step: any, index: number) => (
                    <div key={index} className="text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                      <span className="font-medium">Step {step.stepNumber}:</span> {step.title}
                    </div>
                  ))}
                  {message.data.steps.length > 3 && (
                    <p className="text-xs text-gray-500">...and {message.data.steps.length - 3} more steps</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
