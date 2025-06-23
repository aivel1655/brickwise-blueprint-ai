import React, { useState } from 'react';
import { EnhancedBlueprint, BuildPhase, TemplateStep, SafetyGuideline } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Euro, 
  CheckCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight,
  Hammer,
  Shield,
  Target,
  Wrench,
  Eye
} from 'lucide-react';

interface EnhancedPlanPreviewProps {
  blueprint: EnhancedBlueprint;
  currentPhase?: number;
  onPhaseClick?: (phaseIndex: number) => void;
}

const EnhancedPlanPreview: React.FC<EnhancedPlanPreviewProps> = ({ 
  blueprint, 
  currentPhase = 0,
  onPhaseClick 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getSafetyColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'Warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'Info': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const calculateProgress = () => {
    if (blueprint.phases.length === 0) return 0;
    return Math.round((currentPhase / blueprint.phases.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Project Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">
                {blueprint.phases[0]?.name.replace(/Phase.*?-\s*/, '') || 'Construction Plan'}
              </CardTitle>
              <CardDescription>
                Professional construction blueprint with {blueprint.phases.length} phases
              </CardDescription>
            </div>
            <Badge className={getDifficultyColor(blueprint.difficulty)}>
              {blueprint.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-semibold">{blueprint.estimatedTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                <p className="font-semibold">€{blueprint.totalCost.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Steps</p>
                <p className="font-semibold">{blueprint.detailedSteps.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
                <p className="font-semibold capitalize">{blueprint.experienceLevel}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Project Progress</span>
              <span className="text-sm text-gray-600">{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="phases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="troubleshooting">Help</TabsTrigger>
        </TabsList>

        {/* Phases Tab */}
        <TabsContent value="phases" className="space-y-4">
          {blueprint.phases.map((phase, index) => (
            <Card 
              key={phase.id}
              className={`cursor-pointer transition-all ${
                index === currentPhase 
                  ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                  : index < currentPhase 
                    ? 'bg-green-50/50 dark:bg-green-900/10' 
                    : ''
              }`}
              onClick={() => onPhaseClick?.(index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index < currentPhase 
                        ? 'bg-green-500 text-white' 
                        : index === currentPhase 
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {index < currentPhase ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{phase.name}</CardTitle>
                      <CardDescription>{phase.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{phase.duration}</Badge>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {phase.materials.length} materials
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              {(index === currentPhase || expandedSections.has(`phase-${index}`)) && (
                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Materials Needed
                      </h4>
                      <div className="space-y-2">
                        {phase.materials.map((material) => (
                          <div key={material.id} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <span>{material.name}</span>
                            <span className="font-medium">
                              {material.quantity} {material.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Hammer className="w-4 h-4" />
                        Tools Required
                      </h4>
                      <div className="space-y-1">
                        {phase.tools.map((tool, toolIndex) => (
                          <div key={toolIndex} className="text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                            {tool}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Material List & Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blueprint.materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${material.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {material.quantity} {material.unit} × €{material.pricePerUnit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€{material.totalPrice.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {material.inStock ? 'In Stock' : 'Order Required'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Project Cost</span>
                  <span>€{blueprint.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Steps Tab */}
        <TabsContent value="steps" className="space-y-4">
          {blueprint.detailedSteps.map((step, index) => (
            <Collapsible key={step.id}>
              <CollapsibleTrigger className="w-full">
                <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-300">
                          {step.stepNumber}
                        </div>
                        <div>
                          <CardTitle className="text-base">{step.title}</CardTitle>
                          <CardDescription className="text-left">
                            {step.estimatedTime} minutes • {step.difficulty}
                          </CardDescription>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2 border-l-4 border-blue-500">
                  <CardContent className="pt-4">
                    <p className="mb-4">{step.description}</p>
                    
                    {step.tips.general.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Pro Tips
                        </h5>
                        <ul className="space-y-1 text-sm">
                          {step.tips.general.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {step.qualityChecks.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <h5 className="font-semibold mb-2 flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircle className="w-4 h-4" />
                          Quality Checks
                        </h5>
                        <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
                          {step.qualityChecks.map((check, checkIndex) => (
                            <li key={checkIndex}>✓ {check}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </TabsContent>

        {/* Safety Tab */}
        <TabsContent value="safety" className="space-y-4">
          {blueprint.safetyGuidelines.map((guideline, index) => (
            <Card key={guideline.id} className={`border-l-4 ${getSafetyColor(guideline.severity)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${
                    guideline.severity === 'Critical' ? 'text-red-500' :
                    guideline.severity === 'Warning' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <div>
                    <CardTitle className="text-base">{guideline.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={guideline.severity === 'Critical' ? 'destructive' : 'outline'}>
                        {guideline.severity}
                      </Badge>
                      <Badge variant="outline">{guideline.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{guideline.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Troubleshooting Tab */}
        <TabsContent value="troubleshooting" className="space-y-4">
          {blueprint.troubleshooting.map((guide, index) => (
            <Collapsible key={guide.id}>
              <CollapsibleTrigger className="w-full">
                <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-left">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <CardTitle className="text-base">{guide.problem}</CardTitle>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <h5 className="font-semibold mb-2">Symptoms:</h5>
                      <ul className="space-y-1 text-sm">
                        {guide.symptoms.map((symptom, sIndex) => (
                          <li key={sIndex} className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">⚠</span>
                            <span>{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold mb-2">Solutions:</h5>
                      <ul className="space-y-1 text-sm">
                        {guide.solutions.map((solution, sIndex) => (
                          <li key={sIndex} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{solution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <h5 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Prevention:</h5>
                      <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                        {guide.prevention.map((prevention, pIndex) => (
                          <li key={pIndex} className="flex items-start gap-2">
                            <span className="mt-1">💡</span>
                            <span>{prevention}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedPlanPreview;