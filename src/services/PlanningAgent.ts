
import { ParsedRequest, EnhancedBlueprint, Material, BuildPhase, SafetyGuideline, QualityCheck } from '../types';
import { MockCatalogAgent } from './MockCatalogAgent';

export class PlanningAgent {
  private catalogAgent: MockCatalogAgent;

  constructor() {
    this.catalogAgent = new MockCatalogAgent();
  }

  async createEnhancedBlueprint(parsedRequest: ParsedRequest): Promise<EnhancedBlueprint> {
    console.log('🏗️ Creating enhanced blueprint for:', parsedRequest.buildType);

    try {
      // Calculate materials using the catalog agent
      const materialCalculation = this.catalogAgent.calculateMaterialNeeds(parsedRequest.buildType, {
        length: parsedRequest.dimensions.length || 1,
        width: parsedRequest.dimensions.width || 1,
        height: parsedRequest.dimensions.height || 1,
        diameter: parsedRequest.dimensions.diameter
      });

      // Convert MaterialCalculationItem[] to Material[]
      const materials: Material[] = materialCalculation.materials.map(item => ({
        id: item.material.id,
        name: item.material.name,
        quantity: item.quantity,
        unit: item.material.unit,
        pricePerUnit: item.material.price,
        totalPrice: item.totalCost,
        sapSku: item.material.id,
        alternatives: [],
        inStock: item.material.inStock
      }));

      // Create phases based on build type
      const phases = this.createPhases(parsedRequest.buildType, parsedRequest.dimensions);
      
      // Create safety guidelines
      const safetyGuidelines = this.createSafetyGuidelines(parsedRequest.buildType);
      
      // Create quality checks
      const qualityChecks = this.createQualityChecks(parsedRequest.buildType);

      const blueprint: EnhancedBlueprint = {
        id: `blueprint-${Date.now()}`,
        templateId: `template-${parsedRequest.buildType}`,
        buildType: parsedRequest.buildType,
        dimensions: parsedRequest.dimensions,
        experienceLevel: parsedRequest.experience || 'intermediate',
        difficulty: this.getDifficultyLevel(parsedRequest.buildType),
        phases,
        totalCost: materialCalculation.totalCost,
        estimatedTime: this.getEstimatedTime(parsedRequest.buildType),
        materials,
        safetyGuidelines,
        qualityChecks,
        detailedSteps: [],
        troubleshooting: [],
        tools: this.getRequiredTools(parsedRequest.buildType),
        permits: this.getRequiredPermits(parsedRequest.buildType),
        weatherConsiderations: this.getWeatherConsiderations(parsedRequest.buildType),
        maintenanceSchedule: this.getMaintenanceSchedule(parsedRequest.buildType)
      };

      console.log('✅ Blueprint created successfully');
      return blueprint;

    } catch (error) {
      console.error('❌ Error creating blueprint:', error);
      throw new Error(`Failed to create blueprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createPhases(buildType: string, dimensions: any): BuildPhase[] {
    const basePhases = this.getBasePhases(buildType);
    
    return basePhases.map((phase, index) => ({
      id: `phase-${index + 1}`,
      name: phase.name,
      title: phase.title || phase.name,
      description: phase.description,
      duration: phase.duration || '1-2 hours',
      order: index + 1,
      materials: [],
      tools: phase.tools || [],
      estimatedHours: phase.estimatedHours || 4,
      weatherDependent: phase.weatherDependent || false,
      skillLevel: phase.skillLevel || 'intermediate',
      safetyPriority: phase.safetyPriority || 'medium'
    }));
  }

  private getBasePhases(buildType: string) {
    switch (buildType) {
      case 'pizza_oven':
        return [
          {
            name: 'Foundation Preparation',
            description: 'Prepare the foundation base and ensure level surface',
            duration: '2-3 hours',
            estimatedHours: 3,
            tools: ['shovel', 'level', 'measuring_tape'],
            weatherDependent: true,
            skillLevel: 'intermediate' as const,
            safetyPriority: 'medium' as const
          },
          {
            name: 'Base Construction',
            description: 'Build the insulated base platform',
            duration: '3-4 hours',
            estimatedHours: 4,
            tools: ['trowel', 'mixer', 'level'],
            skillLevel: 'intermediate' as const,
            safetyPriority: 'high' as const
          },
          {
            name: 'Dome Construction',
            description: 'Build the oven dome using fire bricks',
            duration: '6-8 hours',
            estimatedHours: 7,
            tools: ['trowel', 'hammer', 'chisel'],
            skillLevel: 'advanced' as const,
            safetyPriority: 'high' as const
          },
          {
            name: 'Insulation & Finishing',
            description: 'Apply insulation layer and finishing touches',
            duration: '2-3 hours',
            estimatedHours: 3,
            tools: ['trowel', 'brush'],
            skillLevel: 'intermediate' as const,
            safetyPriority: 'medium' as const
          }
        ];
      case 'garden_wall':
        return [
          {
            name: 'Foundation Digging',
            description: 'Dig foundation trench to required depth',
            duration: '2-4 hours',
            estimatedHours: 3,
            tools: ['shovel', 'pickaxe', 'measuring_tape'],
            weatherDependent: true,
            skillLevel: 'beginner' as const,
            safetyPriority: 'medium' as const
          },
          {
            name: 'Foundation Laying',
            description: 'Pour and level concrete foundation',
            duration: '2-3 hours',
            estimatedHours: 3,
            tools: ['mixer', 'trowel', 'level'],
            skillLevel: 'intermediate' as const,
            safetyPriority: 'high' as const
          },
          {
            name: 'Wall Construction',
            description: 'Lay bricks with proper mortar joints',
            duration: '4-8 hours',
            estimatedHours: 6,
            tools: ['trowel', 'level', 'string_line'],
            skillLevel: 'intermediate' as const,
            safetyPriority: 'medium' as const
          },
          {
            name: 'Pointing & Finishing',
            description: 'Complete mortar joints and clean the wall',
            duration: '1-2 hours',
            estimatedHours: 2,
            tools: ['pointing_trowel', 'brush', 'sponge'],
            skillLevel: 'beginner' as const,
            safetyPriority: 'low' as const
          }
        ];
      default:
        return [
          {
            name: 'Preparation',
            description: 'Prepare materials and work area',
            duration: '1-2 hours',
            estimatedHours: 2,
            tools: ['measuring_tape', 'level'],
            skillLevel: 'beginner' as const,
            safetyPriority: 'medium' as const
          },
          {
            name: 'Construction',
            description: 'Main construction phase',
            duration: '4-6 hours',
            estimatedHours: 5,
            tools: ['trowel', 'hammer'],
            skillLevel: 'intermediate' as const,
            safetyPriority: 'high' as const
          },
          {
            name: 'Finishing',
            description: 'Final touches and cleanup',
            duration: '1-2 hours',
            estimatedHours: 2,
            tools: ['brush', 'sponge'],
            skillLevel: 'beginner' as const,
            safetyPriority: 'low' as const
          }
        ];
    }
  }

  private createSafetyGuidelines(buildType: string): SafetyGuideline[] {
    const commonSafety: SafetyGuideline[] = [
      {
        id: 'ppe-001',
        category: 'PPE',
        title: 'Personal Protective Equipment',
        description: 'Always wear safety glasses, work gloves, and closed-toe shoes',
        severity: 'Critical',
        applicablePhases: ['all']
      },
      {
        id: 'tools-001',
        category: 'Tools',
        title: 'Tool Safety',
        description: 'Inspect all tools before use and keep them clean and sharp',
        severity: 'Warning',
        applicablePhases: ['all']
      }
    ];

    const specificSafety: SafetyGuideline[] = [];
    
    if (buildType === 'pizza_oven') {
      specificSafety.push({
        id: 'fire-001',
        category: 'Materials',
        title: 'Fire Brick Handling',
        description: 'Fire bricks are heavy and can be sharp. Handle with care and use proper lifting techniques',
        severity: 'Warning',
        applicablePhases: ['phase-3']
      });
    }

    return [...commonSafety, ...specificSafety];
  }

  private createQualityChecks(buildType: string): QualityCheck[] {
    return [
      {
        id: 'level-check',
        phase: 'foundation',
        description: 'Verify foundation is level using spirit level',
        criticalPath: true,
        toolsRequired: ['spirit_level']
      },
      {
        id: 'alignment-check',
        phase: 'construction',
        description: 'Check vertical alignment every 3-4 courses',
        criticalPath: true,
        toolsRequired: ['plumb_line', 'level']
      }
    ];
  }

  private getDifficultyLevel(buildType: string): 'beginner' | 'intermediate' | 'advanced' {
    switch (buildType) {
      case 'garden_wall':
        return 'intermediate';
      case 'pizza_oven':
        return 'advanced';
      case 'fire_pit':
        return 'intermediate';
      default:
        return 'intermediate';
    }
  }

  private getEstimatedTime(buildType: string): string {
    switch (buildType) {
      case 'garden_wall':
        return '2-3 days';
      case 'pizza_oven':
        return '3-5 days';
      case 'fire_pit':
        return '1-2 days';
      default:
        return '2-4 days';
    }
  }

  private getRequiredTools(buildType: string): string[] {
    const commonTools = ['trowel', 'level', 'measuring_tape', 'hammer'];
    
    switch (buildType) {
      case 'pizza_oven':
        return [...commonTools, 'chisel', 'angle_grinder', 'mixer'];
      case 'garden_wall':
        return [...commonTools, 'string_line', 'shovel', 'wheelbarrow'];
      default:
        return commonTools;
    }
  }

  private getRequiredPermits(buildType: string): string[] {
    switch (buildType) {
      case 'pizza_oven':
        return ['Building permit may be required for permanent structures'];
      case 'garden_wall':
        return ['Check local regulations for wall height restrictions'];
      default:
        return ['Check local building codes and regulations'];
    }
  }

  private getWeatherConsiderations(buildType: string): string[] {
    return [
      'Avoid construction during rain or extreme temperatures',
      'Allow proper curing time in dry conditions',
      'Protect work from frost during winter months'
    ];
  }

  private getMaintenanceSchedule(buildType: string): string[] {
    switch (buildType) {
      case 'pizza_oven':
        return [
          'Clean ash and debris after each use',
          'Inspect for cracks annually',
          'Reapply protective coating every 2-3 years'
        ];
      case 'garden_wall':
        return [
          'Inspect mortar joints annually',
          'Clear vegetation growth',
          'Repoint damaged joints as needed'
        ];
      default:
        return [
          'Regular visual inspections',
          'Clean as needed',
          'Repair damage promptly'
        ];
    }
  }
}
