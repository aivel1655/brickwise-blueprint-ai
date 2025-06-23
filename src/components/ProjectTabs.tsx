
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectTabsProps {
  activeProject?: any;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({ activeProject }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
      <Tabs defaultValue="alternatives" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
          <TabsTrigger value="route">Route</TabsTrigger>
          <TabsTrigger value="prices">Prices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="alternatives" className="mt-4">
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              <p>I want to build a pizza oven</p>
              <p className="text-sm mt-2">How big should the oven be?</p>
              <p className="text-sm mt-1">About 1 meter * 1 meter</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Alright, let's walk through this together as if I were standing next to you in the store: 
                Keep the big orange "Refractory Materials" signs in sight. I'll point out each item, aisle by aisle:
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                <img src="/lovable-uploads/b24a5ff1-32b1-415f-9ef1-b90759284a47.png" alt="Firebrick panels" className="w-full h-24 object-cover rounded mb-2" />
                <h3 className="font-medium text-sm">Firebrick panels</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Aisle 5</p>
                <p className="font-bold text-orange-600">10 €</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="route" className="mt-4">
          <div className="text-center text-gray-500 py-8">
            <p>Route planning coming soon...</p>
          </div>
        </TabsContent>
        
        <TabsContent value="prices" className="mt-4">
          <div className="text-center text-gray-500 py-8">
            <p>Price comparison coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectTabs;
