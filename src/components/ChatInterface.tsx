
import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus } from 'lucide-react';
import { ChatMessage, AgentResponse } from '../types';
import ChatBubble from './ChatBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isProcessing
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-4 max-w-md">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-orange-600 dark:text-orange-300 text-sm">Agent is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-orange-200 dark:border-orange-700 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-orange-200 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-900/30"
          >
            <Plus className="w-4 h-4 text-orange-600" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What's in your mind..."
              className="pr-12 border-orange-200 focus:border-orange-400 dark:border-orange-700"
              disabled={isProcessing}
            />
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
      </div>
    </div>
  );
};

export default ChatInterface;
