
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import EnhancedWorkflowInterface from '../components/EnhancedWorkflowInterface';

const Settings = () => {
  const navigate = useNavigate();
  const user = {
    name: 'Max Mustermann',
    avatar: undefined
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                MultiBuildAgent Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure your AI construction assistant
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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

        {/* Settings Content */}
        <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg shadow-lg">
          <EnhancedWorkflowInterface className="p-6" />
        </div>
      </div>
    </div>
  );
};

export default Settings;
