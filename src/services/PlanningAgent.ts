import { 
  BuildTemplate, 
  ParsedRequest, 
  MaterialCalculation, 
  EnhancedBlueprint, 
  TemplateStep,
  SafetyGuideline,
  TroubleshootingGuide,
  Blueprint,
  BuildPhase
} from '../types';
import { MockCatalogAgent } from './MockCatalogAgent';
import buildTemplatesData from '../data/build-templates.json';

export class PlanningAgent {
  private templates: BuildTemplate[];
  private catalogAgent: MockCatalogAgent;

  constructor(catalogAgent: MockCatalogAgent) {
    this.templates = buildTemplatesData.templates as BuildTemplate[];
    this.catalogAgent = catalogAgent;
  }

  // Create a structured plan based on parsed request and materials
  createStructuredPlan(request: ParsedRequest, materials: MaterialCalculation): EnhancedBlueprint {
    const template = this.selectTemplate(request.buildType, request.experience);
    
    if (!template) {
      throw new Error(`No template found for build type: ${request.buildType}`);
    }

    // Calculate time estimates based on experience
    const timeEstimates = this.calculateTimeEstimates(template, request.experience || 'beginner');
    
    // Generate phases with real material data
    const phases = this.generateEnhancedPhases(template, materials, request);
    
    // Create detailed steps
    const detailedSteps = this.generateDetailedSteps(template, request.experience || 'beginner');
    
    // Get safety guidelines
    const safetyGuidelines = this.adaptSafetyGuidelines(template, request.experience || 'beginner');
    
    // Generate troubleshooting guide
    const troubleshooting = this.generateTroubleshootingGuide(template, request);

    return {
      id: `blueprint-${template.buildType}-${Date.now()}`,
      templateId: template.id,
      phases: phases,
      totalCost: materials.totalCost,
      estimatedTime: `${timeEstimates.min}-${timeEstimates.max} days`,
      materials: materials.materials.map(calc => ({
        id: calc.material.id,
        name: calc.material.name,
        quantity: calc.quantity,
        unit: calc.material.unit,
        pricePerUnit: calc.material.price,
        totalPrice: calc.totalCost,
        sapSku: calc.material.id,
        inStock: calc.material.inStock
      })),
      experienceLevel: request.experience || 'beginner',
      difficulty: template.difficulty,
      safetyGuidelines,
      detailedSteps,
      qualityChecks: this.extractQualityChecks(template),
      troubleshooting
    };
  }

  // Select the best template for a build type and experience level
  private selectTemplate(buildType: string, experienceLevel?: string): BuildTemplate | undefined {
    const compatibleTemplates = this.templates.filter(t => t.buildType === buildType);
    
    if (compatibleTemplates.length === 0) {
      // Fallback to generic template if available
      return this.templates.find(t => t.buildType === 'wall');
    }
    
    if (compatibleTemplates.length === 1) {
      return compatibleTemplates[0];
    }
    
    // If multiple templates, prefer based on experience level
    const experiencePreferences = {
      'beginner': ['Beginner', 'Intermediate', 'Advanced'],
      'intermediate': ['Intermediate', 'Beginner', 'Advanced'],
      'expert': ['Advanced', 'Intermediate', 'Beginner']
    };
    
    const preferences = experiencePreferences[experienceLevel as keyof typeof experiencePreferences] || experiencePreferences.beginner;
    
    for (const difficulty of preferences) {
      const template = compatibleTemplates.find(t => t.difficulty === difficulty);
      if (template) return template;
    }
    
    return compatibleTemplates[0];
  }

  // Calculate time estimates based on template and experience
  private calculateTimeEstimates(template: BuildTemplate, experienceLevel: string): { min: number; max: number } {
    const adaptation = template.experienceAdaptations.find(a => a.experienceLevel === experienceLevel);
    const multiplier = adaptation?.timeMultiplier || 1.0;
    
    return {
      min: Math.ceil(template.estimatedTimeRange.min * multiplier),
      max: Math.ceil(template.estimatedTimeRange.max * multiplier)
    };
  }

  // Generate enhanced phases with real material data
  private generateEnhancedPhases(template: BuildTemplate, materials: MaterialCalculation, request: ParsedRequest): BuildPhase[] {
    return template.phases.map((templatePhase, index) => {
      // Get materials for this phase
      const phaseMaterials = materials.materials.filter(calc => 
        templatePhase.materialCategories.some(category => 
          calc.material.category === category
        )
      );

      // Calculate phase duration
      const adaptation = template.experienceAdaptations.find(a => a.experienceLevel === (request.experience || 'beginner'));
      const timeMultiplier = adaptation?.timeMultiplier || 1.0;
      const estimatedHours = (templatePhase.estimatedDuration.min + templatePhase.estimatedDuration.max) / 2 * timeMultiplier;
      const estimatedDays = Math.ceil(estimatedHours / 8); // 8 hours per day

      return {
        id: templatePhase.id,
        name: templatePhase.name,
        description: this.adaptDescription(templatePhase.description, request.experience || 'beginner'),
        duration: estimatedDays === 1 ? '1 day' : `${estimatedDays} days`,
        order: templatePhase.order,
        materials: phaseMaterials.map(calc => ({
          id: calc.material.id,
          name: calc.material.name,
          quantity: calc.quantity,
          unit: calc.material.unit,
          pricePerUnit: calc.material.price,
          totalPrice: calc.totalCost,
          inStock: calc.material.inStock
        })),
        tools: templatePhase.requiredTools
      };
    });
  }

  // Generate detailed steps with experience adaptations
  private generateDetailedSteps(template: BuildTemplate, experienceLevel: string): TemplateStep[] {
    const allSteps: TemplateStep[] = [];
    
    template.phases.forEach(phase => {
      phase.steps.forEach(step => {
        // Adapt step based on experience level
        const adaptedStep = this.adaptStep(step, experienceLevel);
        allSteps.push(adaptedStep);
      });
    });
    
    return allSteps;
  }

  // Adapt step instructions based on experience level
  private adaptStep(step: TemplateStep, experienceLevel: string): TemplateStep {
    const experienceNotes = step.tips[experienceLevel as keyof typeof step.tips] || [];
    const generalTips = step.tips.general || [];
    
    return {
      ...step,
      description: this.adaptDescription(step.description, experienceLevel),
      tips: {
        ...step.tips,
        general: [...generalTips, ...experienceNotes]
      }
    };
  }

  // Adapt descriptions based on experience level
  private adaptDescription(description: string, experienceLevel: string): string {
    const adaptations = {
      'beginner': 'Take your time and follow each step carefully. ',
      'intermediate': 'Work methodically and apply your existing skills. ',
      'expert': 'Use your experience to optimize the process. '
    };
    
    const prefix = adaptations[experienceLevel as keyof typeof adaptations] || '';
    return prefix + description;
  }

  // Adapt safety guidelines based on experience
  private adaptSafetyGuidelines(template: BuildTemplate, experienceLevel: string): SafetyGuideline[] {
    const baseSafety = template.safetyGuidelines;
    const adaptation = template.experienceAdaptations.find(a => a.experienceLevel === experienceLevel);
    
    if (adaptation?.additionalSafety) {
      const additionalGuidelines: SafetyGuideline[] = adaptation.additionalSafety.map((safety, index) => ({
        id: `additional-safety-${index}`,
        category: 'General' as const,
        title: `${experienceLevel} Safety Note`,
        description: safety,
        severity: 'Warning' as const,
        applicablePhases: template.phases.map(p => p.id)
      }));
      
      return [...baseSafety, ...additionalGuidelines];
    }
    
    return baseSafety;
  }

  // Extract quality checks from template
  private extractQualityChecks(template: BuildTemplate): string[] {
    const qualityChecks: string[] = [];
    
    template.phases.forEach(phase => {
      phase.steps.forEach(step => {
        qualityChecks.push(...step.qualityChecks);
      });
    });
    
    return [...new Set(qualityChecks)]; // Remove duplicates
  }

  // Generate troubleshooting guide
  private generateTroubleshootingGuide(template: BuildTemplate, request: ParsedRequest): TroubleshootingGuide[] {
    const buildType = template.buildType;
    const experienceLevel = request.experience || 'beginner';
    
    const commonIssues = this.getCommonIssues(buildType);
    
    return commonIssues.map((issue, index) => ({
      id: `trouble-${buildType}-${index}`,
      problem: issue.problem,
      symptoms: issue.symptoms,
      solutions: this.adaptSolutions(issue.solutions, experienceLevel),
      prevention: issue.prevention,
      experienceLevel: experienceLevel
    }));
  }

  // Get common issues for each build type
  private getCommonIssues(buildType: string) {
    const issueDatabase = {
      'wall': [
        {
          problem: 'Uneven brick courses',
          symptoms: ['Bricks not aligned', 'Visible gaps between courses', 'Wall looks wavy'],
          solutions: ['Check level frequently', 'Use string line guides', 'Remove and re-lay incorrect bricks'],
          prevention: ['Use a spirit level every 3-4 bricks', 'Set up string lines for guidance', 'Take time with first course']
        },
        {
          problem: 'Mortar consistency issues',
          symptoms: ['Mortar too wet or dry', 'Difficult to spread', 'Poor adhesion'],
          solutions: ['Adjust water content gradually', 'Re-mix mortar', 'Use fresh mortar'],
          prevention: ['Follow mixing ratios exactly', 'Mix small batches', 'Keep mortar covered when not in use']
        }
      ],
      'pizza_oven': [
        {
          problem: 'Dome collapse',
          symptoms: ['Cracks in dome', 'Bricks falling', 'Structural instability'],
          solutions: ['Stop work immediately', 'Assess damage', 'Rebuild affected section', 'Consult expert'],
          prevention: ['Use proper dome template', 'Ensure adequate curing time', 'Use correct mortar ratios']
        },
        {
          problem: 'Poor heat retention',
          symptoms: ['Oven cools quickly', 'Uneven cooking', 'High fuel consumption'],
          solutions: ['Add more insulation', 'Check for air leaks', 'Improve door seal'],
          prevention: ['Use adequate insulation thickness', 'Ensure complete coverage', 'Proper door construction']
        }
      ],
      'garden_wall': [
        {
          problem: 'Wall movement or settling',
          symptoms: ['Cracks appearing', 'Wall leaning', 'Mortar joints opening'],
          solutions: ['Check foundation', 'Add drainage', 'Rebuild if necessary'],
          prevention: ['Ensure good foundation', 'Provide adequate drainage', 'Don\'t build too high without reinforcement']
        }
      ]
    };
    
    return issueDatabase[buildType as keyof typeof issueDatabase] || issueDatabase['wall'];
  }

  // Adapt solutions based on experience level
  private adaptSolutions(solutions: string[], experienceLevel: string): string[] {
    if (experienceLevel === 'beginner') {
      return solutions.map(solution => `${solution} (Consider getting help from experienced builder)`);
    }
    return solutions;
  }

  // Get all available templates
  getAvailableTemplates(): BuildTemplate[] {
    return this.templates;
  }

  // Get template by ID
  getTemplate(templateId: string): BuildTemplate | undefined {
    return this.templates.find(t => t.id === templateId);
  }

  // Get templates by build type
  getTemplatesByBuildType(buildType: string): BuildTemplate[] {
    return this.templates.filter(t => t.buildType === buildType);
  }

  // Get difficulty assessment for a build type and experience level
  getDifficultyAssessment(buildType: string, experienceLevel: string): { 
    suitable: boolean; 
    recommendation: string; 
    timeEstimate: string;
  } {
    const template = this.selectTemplate(buildType, experienceLevel);
    
    if (!template) {
      return {
        suitable: false,
        recommendation: 'No suitable template found for this build type',
        timeEstimate: 'Unknown'
      };
    }
    
    const timeEstimates = this.calculateTimeEstimates(template, experienceLevel);
    const suitabilityMap = {
      'beginner': { 'Beginner': true, 'Intermediate': false, 'Advanced': false },
      'intermediate': { 'Beginner': true, 'Intermediate': true, 'Advanced': false },
      'expert': { 'Beginner': true, 'Intermediate': true, 'Advanced': true }
    };
    
    const suitable = suitabilityMap[experienceLevel as keyof typeof suitabilityMap]?.[template.difficulty] || false;
    
    const recommendations = {
      true: `This project is well-suited for your ${experienceLevel} level. ${template.description}`,
      false: `This ${template.difficulty} project may be challenging for a ${experienceLevel}. Consider getting help or starting with a simpler project.`
    };
    
    return {
      suitable,
      recommendation: recommendations[suitable.toString() as keyof typeof recommendations],
      timeEstimate: `${timeEstimates.min}-${timeEstimates.max} days`
    };
  }
}