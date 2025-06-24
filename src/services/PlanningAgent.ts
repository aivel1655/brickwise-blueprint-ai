import { 
  ParsedRequest, 
  EnhancedBlueprint,
  SafetyGuideline,
  BuildPhase,
  QualityCheck,
  EnhancedTemplate 
} from '../types';
import buildTemplates from '../data/build-templates.json';
import { MockCatalogAgent } from './MockCatalogAgent';

export class PlanningAgent {
  private catalogAgent: MockCatalogAgent;

  constructor() {
    this.catalogAgent = new MockCatalogAgent();
  }

  async createEnhancedBlueprint(request: ParsedRequest): Promise<EnhancedBlueprint> {
    console.log('🏗️ Creating enhanced blueprint for:', request);

    // Get base template
    const template = this.findBestTemplate(request);
    const materials = await this.catalogAgent.calculateMaterials(request);
    
    // Calculate enhanced properties
    const difficulty = this.calculateDifficulty(request, template);
    const phases = this.createDetailedPhases(request, template);
    const safetyGuidelines = this.generateSafetyGuidelines(request, template);
    const qualityChecks = this.generateQualityChecks(request, template);
    
    const blueprint: EnhancedBlueprint = {
      id: `blueprint-${Date.now()}`,
      templateId: template.id,
      buildType: request.buildType,
      dimensions: request.dimensions,
      experienceLevel: request.experience || 'beginner',
      difficulty,
      estimatedTime: this.calculateEstimatedTime(request, template, difficulty),
      totalCost: materials.totalCost,
      phases,
      safetyGuidelines,
      qualityChecks,
      materials: materials.materials,
      tools: this.extractToolsFromPhases(phases),
      permits: this.determineRequiredPermits(request),
      weatherConsiderations: this.generateWeatherConsiderations(request),
      maintenanceSchedule: this.generateMaintenanceSchedule(request)
    };

    console.log('✅ Enhanced blueprint created:', blueprint);
    return blueprint;
  }

  private findBestTemplate(request: ParsedRequest): EnhancedTemplate {
    const templates = buildTemplates as EnhancedTemplate[];
    
    // Find exact match first
    let template = templates.find(t => t.buildType === request.buildType);
    
    // Fallback to similar template
    if (!template) {
      template = templates.find(t => 
        t.buildType.includes(request.buildType.split('_')[0]) ||
        request.buildType.includes(t.buildType.split('_')[0])
      );
    }
    
    // Ultimate fallback
    if (!template) {
      template = templates[0];
    }

    return template;
  }

  private calculateDifficulty(request: ParsedRequest, template: EnhancedTemplate): 'beginner' | 'intermediate' | 'advanced' {
    let difficultyScore = 0;

    // Base difficulty from template
    if (template.difficulty === 'beginner') difficultyScore += 1;
    else if (template.difficulty === 'intermediate') difficultyScore += 2;
    else difficultyScore += 3;

    // Size complexity
    const area = (request.dimensions.width || 1) * (request.dimensions.length || 1);
    if (area > 10) difficultyScore += 1;
    if (area > 25) difficultyScore += 1;

    // Height complexity
    if ((request.dimensions.height || 0) > 2) difficultyScore += 1;

    // Material complexity
    if (request.materials.includes('stone') || request.materials.includes('concrete')) difficultyScore += 1;

    // Experience adjustment
    if (request.experience === 'advanced') difficultyScore = Math.max(1, difficultyScore - 1);
    if (request.experience === 'beginner') difficultyScore += 1;

    if (difficultyScore <= 2) return 'beginner';
    if (difficultyScore <= 4) return 'intermediate';
    return 'advanced';
  }

  private createDetailedPhases(request: ParsedRequest, template: EnhancedTemplate): BuildPhase[] {
    // Enhanced phases with more detail
    const basePhases = template.phases || [];
    
    return basePhases.map((phase, index) => ({
      ...phase,
      id: `phase-${index + 1}`,
      estimatedHours: this.calculatePhaseHours(phase, request),
      weatherDependent: this.isWeatherDependent(phase),
      skillLevel: this.determinePhaseSkillLevel(phase, request),
      safetyPriority: this.calculateSafetyPriority(phase)
    }));
  }

  private generateSafetyGuidelines(request: ParsedRequest, template: EnhancedTemplate): SafetyGuideline[] {
    const guidelines: SafetyGuideline[] = [
      {
        id: 'ppe-1',
        category: 'PPE',
        title: 'Personal Protective Equipment',
        description: 'Always wear safety glasses, work gloves, and steel-toed boots',
        severity: 'Critical',
        applicablePhases: ['foundation', 'construction', 'finishing']
      },
      {
        id: 'tools-1',
        category: 'Tools',
        title: 'Tool Safety',
        description: 'Inspect all tools before use and follow manufacturer guidelines',
        severity: 'High',
        applicablePhases: ['preparation', 'construction']
      },
      {
        id: 'materials-1',
        category: 'Materials',
        title: 'Material Handling',
        description: 'Use proper lifting techniques for heavy materials',
        severity: 'High',
        applicablePhases: ['preparation', 'construction']
      }
    ];

    // Add specific guidelines based on build type
    if (request.buildType.includes('oven') || request.buildType.includes('fire')) {
      guidelines.push({
        id: 'fire-1',
        category: 'Emergency',
        title: 'Fire Safety',
        description: 'Keep fire extinguisher nearby and ensure proper ventilation',
        severity: 'Critical',
        applicablePhases: ['construction', 'testing']
      });
    }

    return guidelines;
  }

  private calculateEstimatedTime(request: ParsedRequest, template: EnhancedTemplate, difficulty: string): string {
    let baseHours = template.estimatedHours || 8;
    
    // Adjust for difficulty
    if (difficulty === 'advanced') baseHours *= 1.5;
    if (difficulty === 'intermediate') baseHours *= 1.2;
    
    // Adjust for size
    const area = (request.dimensions.width || 1) * (request.dimensions.length || 1);
    if (area > 10) baseHours *= 1.3;
    if (area > 25) baseHours *= 1.6;
    
    // Adjust for experience
    if (request.experience === 'beginner') baseHours *= 1.5;
    if (request.experience === 'advanced') baseHours *= 0.8;
    
    // Convert to days
    const days = Math.ceil(baseHours / 8);
    if (days === 1) return '1 day';
    if (days <= 7) return `${days} days`;
    const weeks = Math.ceil(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }

  private generateQualityChecks(request: ParsedRequest, template: EnhancedTemplate): QualityCheck[] {
    return [
      {
        id: 'level-check',
        phase: 'foundation',
        description: 'Verify all foundation elements are level using a spirit level',
        criticalPath: true,
        toolsRequired: ['spirit level', 'measuring tape']
      },
      {
        id: 'alignment-check',
        phase: 'construction',
        description: 'Check structural alignment at each course',
        criticalPath: true,
        toolsRequired: ['string line', 'spirit level']
      },
      {
        id: 'final-inspection',
        phase: 'finishing',
        description: 'Complete final inspection of all joints and surfaces',
        criticalPath: false,
        toolsRequired: ['flashlight', 'measuring tape']
      }
    ];
  }

  private extractToolsFromPhases(phases: BuildPhase[]): string[] {
    const tools = new Set<string>();
    phases.forEach(phase => {
      phase.tools?.forEach(tool => tools.add(tool));
    });
    return Array.from(tools);
  }

  private determineRequiredPermits(request: ParsedRequest): string[] {
    const permits: string[] = [];
    
    if ((request.dimensions.height || 0) > 2) {
      permits.push('Building permit may be required for structures over 2m height');
    }
    
    if (request.buildType.includes('foundation')) {
      permits.push('Foundation work may require inspection');
    }
    
    return permits;
  }

  private generateWeatherConsiderations(request: ParsedRequest): string[] {
    return [
      'Avoid concrete work in freezing temperatures',
      'Cover work area during rain',
      'Allow extra drying time in humid conditions',
      'Plan for seasonal material expansion'
    ];
  }

  private generateMaintenanceSchedule(request: ParsedRequest): string[] {
    const schedule = [
      'Monthly: Visual inspection for cracks or damage',
      'Annually: Deep clean and re-seal if necessary'
    ];
    
    if (request.buildType.includes('oven') || request.buildType.includes('fire')) {
      schedule.push('After each use: Clean ash and debris');
      schedule.push('Seasonally: Inspect chimney and ventilation');
    }
    
    return schedule;
  }

  private calculatePhaseHours(phase: any, request: ParsedRequest): number {
    // Base hours from template or estimate
    let hours = phase.estimatedHours || 4;
    
    // Adjust for project size
    const area = (request.dimensions.width || 1) * (request.dimensions.length || 1);
    if (area > 10) hours *= 1.2;
    
    return Math.ceil(hours);
  }

  private isWeatherDependent(phase: any): boolean {
    const weatherSensitive = ['foundation', 'concrete', 'mortar', 'exterior'];
    return weatherSensitive.some(keyword => 
      phase.title?.toLowerCase().includes(keyword) || 
      phase.description?.toLowerCase().includes(keyword)
    );
  }

  private determinePhaseSkillLevel(phase: any, request: ParsedRequest): 'beginner' | 'intermediate' | 'advanced' {
    const advancedKeywords = ['precision', 'critical', 'complex', 'advanced'];
    const intermediateKeywords = ['alignment', 'level', 'measurement'];
    
    const description = (phase.title + ' ' + phase.description).toLowerCase();
    
    if (advancedKeywords.some(keyword => description.includes(keyword))) {
      return 'advanced';
    }
    if (intermediateKeywords.some(keyword => description.includes(keyword))) {
      return 'intermediate';
    }
    return 'beginner';
  }

  private calculateSafetyPriority(phase: any): 'low' | 'medium' | 'high' | 'critical' {
    const criticalKeywords = ['electrical', 'fire', 'height', 'heavy'];
    const highKeywords = ['tools', 'cutting', 'lifting'];
    
    const description = (phase.title + ' ' + phase.description).toLowerCase();
    
    if (criticalKeywords.some(keyword => description.includes(keyword))) {
      return 'critical';
    }
    if (highKeywords.some(keyword => description.includes(keyword))) {
      return 'high';
    }
    return 'medium';
  }
}
