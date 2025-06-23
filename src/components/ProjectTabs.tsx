
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectTabsProps {
  activeProject?: any;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({ activeProject }) => {
  const [showContent, setShowContent] = useState(false);

  const handleDemoClick = () => {
    setShowContent(true);
  };

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
            {!showContent ? (
              <div className="text-center text-gray-500 py-8">
                <div 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-4 rounded-lg transition-colors"
                  onClick={handleDemoClick}
                >
                  <p className="mb-2">I want to build a pizza oven</p>
                  <p className="text-sm mt-2">How big should the oven be?</p>
                  <p className="text-sm mt-1">About 1 meter * 1 meter</p>
                  <p className="text-xs text-orange-500 mt-4">Click to see chatbot response</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm font-medium">You:</p>
                    <p className="text-sm">I want to build a pizza oven</p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Agent:</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">How big should the oven be?</p>
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm font-medium">You:</p>
                    <p className="text-sm">About 1 meter * 1 meter</p>
                  </div>
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
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="route" className="mt-4">
          {!showContent ? (
            <div className="text-center text-gray-500 py-8">
              <p>Complete the demo in Alternatives tab first</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Store Navigation Route</h3>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <span className="text-sm">Enter through main entrance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <span className="text-sm">Head to Aisle 5 - Refractory Materials</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <span className="text-sm">Collect firebrick panels</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <span className="text-sm">Proceed to checkout</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Estimated walking time: 8 minutes
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="prices" className="mt-4">
          {!showContent ? (
            <div className="text-center text-gray-500 py-8">
              <p>Complete the demo in Alternatives tab first</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Price Comparison</h3>
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Standard Firebrick Panels</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Basic refractory bricks</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">10.00 €</p>
                      <p className="text-xs text-green-600">In Stock</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Premium Firebrick Set</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">High-temperature resistant</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">12.50 €</p>
                      <p className="text-xs text-green-600">In Stock</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Economy Bricks</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Budget option</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">7.50 €</p>
                      <p className="text-xs text-red-600">Limited Stock</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectTabs;
