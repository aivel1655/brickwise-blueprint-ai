
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingDown, TrendingUp, Star, Clock } from 'lucide-react';

interface Alternative {
  material: {
    id: string;
    name: string;
    price: number;
    supplier: string;
    leadTime?: string;
  };
  reason: string;
  costDifference: number;
  qualityImprovement?: string;
  compatibilityScore: number;
}

interface Recommendation {
  original: {
    id: string;
    name: string;
    price: number;
  };
  alternatives: Alternative[];
}

interface RecommendationCardProps {
  recommendations: Recommendation[];
  onSelectAlternative?: (originalId: string, alternativeId: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendations, 
  onSelectAlternative 
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getCostIcon = (costDifference: number) => {
    if (costDifference < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    if (costDifference > 0) return <TrendingUp className="w-4 h-4 text-blue-500" />;
    return <ArrowRight className="w-4 h-4 text-gray-500" />;
  };

  const getCostBadgeColor = (costDifference: number) => {
    if (costDifference < 0) return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    if (costDifference > 0) return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  };

  return (
    <Card className="mt-4 border-orange-200 dark:border-orange-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-orange-500" />
          Smart Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.slice(0, 2).map((rec, index) => (
          <div key={rec.original.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">
                Alternatives for: {rec.original.name}
              </h4>
              <Badge variant="outline" className="text-xs">
                €{rec.original.price.toFixed(2)}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {rec.alternatives.slice(0, 2).map((alt, altIndex) => (
                <div key={alt.material.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{alt.material.name}</span>
                      {getCostIcon(alt.costDifference)}
                      <Badge className={`text-xs ${getCostBadgeColor(alt.costDifference)}`}>
                        {alt.costDifference < 0 ? '-' : '+'€{Math.abs(alt.costDifference).toFixed(2)}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {alt.reason}
                    </p>
                    
                    {alt.qualityImprovement && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        ✨ {alt.qualityImprovement}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>📦 {alt.material.supplier}</span>
                      {alt.material.leadTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alt.material.leadTime}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {onSelectAlternative && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-3"
                      onClick={() => onSelectAlternative(rec.original.id, alt.material.id)}
                    >
                      Select
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Ask for "more alternatives" or "budget options" for additional suggestions
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;
