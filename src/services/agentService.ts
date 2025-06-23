
import { AgentResponse, ProjectSpecs, Blueprint, BuildPlan, ParsedRequest, Question, ConversationState, MaterialCalculation, EnhancedBlueprint } from '../types';
import { InputAgent } from './InputAgent';
import { MockCatalogAgent } from './MockCatalogAgent';
import { PlanningAgent } from './PlanningAgent';

class AgentService {
  private inputAgent: InputAgent;
  private catalogAgent: MockCatalogAgent;
  private planningAgent: PlanningAgent;
  private conversationState: ConversationState;
  private projectSpecs: Partial<ProjectSpecs> = {};

  constructor() {
    this.inputAgent = new InputAgent();
    this.catalogAgent = new MockCatalogAgent();
    this.planningAgent = new PlanningAgent(this.catalogAgent);
    this.conversationState = {
      phase: 'input',
      messages: [],
      currentPlan: null,
      needsInput: true
    };
  }

  async processUserMessage(message: string, context?: any): Promise<AgentResponse> {
    console.log('Processing message:', message);
    console.log('Current phase:', this.conversationState.phase);
    
    // Enhanced input processing using InputAgent
    if (this.conversationState.phase === 'input' || this.conversationState.phase === 'clarification') {
      return this.enhancedIterationResponse(message, context);
    } else if (this.conversationState.phase === 'planning') {
      return this.strategicPlannerResponse();
    } else if (!context?.buildPlan) {
      return this.builderAgentResponse();
    } else {
      return this.jouleIntegrationResponse();
    }
  }

  private enhancedIterationResponse(message: string, context?: any): AgentResponse {
    // Parse the user input using enhanced InputAgent
    const parsed = this.inputAgent.parsePrompt(message);
    this.conversationState.parsedRequest = parsed;
    
    console.log('Parsed request:', parsed);
    
    // Generate clarifying questions if needed
    const questions = this.inputAgent.generateClarifyingQuestions(parsed);
    this.conversationState.pendingQuestions = questions;
    
    // If confidence is high and no questions needed, proceed to planning
    if (parsed.confidence >= 0.7 && questions.length === 0) {
      this.conversationState.phase = 'planning';
      return {
        agent: 'iteration',
        message: `Perfect! I understand you want to build a ${parsed.buildType.replace('_', ' ')}. Let me create a comprehensive plan for you.`,
        data: { 
          parsedRequest: parsed,
          readyForPlanning: true
        }
      };
    }
    
    // If we have questions, ask the first one
    if (questions.length > 0) {
      this.conversationState.phase = 'clarification';
      this.conversationState.needsInput = true;
      
      return {
        agent: 'iteration',
        message: this.buildIterationMessage(parsed, questions[0]),
        suggestions: questions[0].suggestions,
        data: {
          parsedRequest: parsed,
          pendingQuestions: questions,
          needsMoreInfo: true
        }
      };
    }
    
    // Fallback to planning if we have some basic info
    this.conversationState.phase = 'planning';
    return {
      agent: 'iteration',
      message: `I have some information about your ${parsed.buildType.replace('_', ' ')} project. Let me create a plan based on what I understand.`,
      data: { 
        parsedRequest: parsed,
        partialInfo: true
      }
    };
  }

  private buildIterationMessage(parsed: ParsedRequest, question: Question): string {
    let message = '';
    
    // Acknowledge what we understood
    if (parsed.buildType !== 'unknown') {
      message += `Great! I understand you want to build a ${parsed.buildType.replace('_', ' ')}. `;
    }
    
    if (parsed.dimensions && Object.keys(parsed.dimensions).length > 0) {
      const dims = parsed.dimensions;
      if (dims.length && dims.width) {
        message += `I see you mentioned ${dims.length}m x ${dims.width}m${dims.height ? ` x ${dims.height}m` : ''}. `;
      }
    }
    
    if (parsed.materials.length > 0) {
      message += `You mentioned ${parsed.materials.join(', ')} as materials. `;
    }
    
    // Add the question
    message += `\n\n${question.text}`;
    
    return message;
  }

  // Enhanced strategic planner using PlanningAgent templates
  private strategicPlannerResponse(): AgentResponse {
    const parsed = this.conversationState.parsedRequest;
    
    if (!parsed) {
      return this.fallbackPlannerResponse();
    }
    
    try {
      // Get difficulty assessment first
      const difficultyAssessment = this.planningAgent.getDifficultyAssessment(
        parsed.buildType, 
        parsed.experience || 'beginner'
      );

      // Use MockCatalogAgent to calculate materials
      const materials = this.catalogAgent.calculateMaterialNeeds(parsed.buildType, parsed.dimensions);
      
      // Create enhanced blueprint using PlanningAgent templates
      const enhancedBlueprint = this.planningAgent.createStructuredPlan(parsed, materials);
      
      this.conversationState.phase = 'review';
      
      // Create response message with difficulty assessment
      let message = `I've created a comprehensive blueprint for your ${parsed.buildType.replace('_', ' ')} project using our template system.\n\n`;
      
      message += `**Project Assessment:**\n`;
      message += `• Difficulty: ${enhancedBlueprint.difficulty}\n`;
      message += `• Estimated Time: ${enhancedBlueprint.estimatedTime}\n`;
      message += `• Total Cost: €${materials.totalCost.toFixed(2)}\n`;
      message += `• Suitability: ${difficultyAssessment.suitable ? '✅ Well-suited for your level' : '⚠️ May be challenging'}\n\n`;
      
      message += `**What's Included:**\n`;
      message += `• ${enhancedBlueprint.phases.length} detailed construction phases\n`;
      message += `• ${enhancedBlueprint.detailedSteps.length} step-by-step instructions\n`;
      message += `• ${enhancedBlueprint.safetyGuidelines.length} safety guidelines\n`;
      message += `• ${enhancedBlueprint.qualityChecks.length} quality checks\n`;
      message += `• ${enhancedBlueprint.troubleshooting.length} troubleshooting guides\n\n`;
      
      if (!difficultyAssessment.suitable) {
        message += `💡 **Recommendation:** ${difficultyAssessment.recommendation}\n\n`;
      }
      
      message += `The plan includes experience-level adapted instructions and safety guidelines tailored for ${parsed.experience || 'beginner'} builders.`;
      
      return {
        agent: 'planner',
        message: message,
        data: { 
          blueprint: enhancedBlueprint,
          parsedRequest: parsed,
          materialCalculation: materials,
          difficultyAssessment: difficultyAssessment,
          templateUsed: true
        }
      };
    } catch (error) {
      console.error('Error creating template-based plan:', error);
      return this.fallbackPlannerResponse();
    }
  }

  private createEnhancedBlueprint(parsed: ParsedRequest, materials: MaterialCalculation): Blueprint {
    const phases = this.generatePhasesFromMaterials(parsed, materials);
    
    return {
      id: `bp-${parsed.buildType}-${Date.now()}`,
      phases: phases,
      totalCost: materials.totalCost,
      estimatedTime: this.estimateProjectTime(parsed, materials),
      materials: materials.materials.map(calc => ({
        id: calc.material.id,
        name: calc.material.name,
        quantity: calc.quantity,
        unit: calc.material.unit,
        pricePerUnit: calc.material.price,
        totalPrice: calc.totalCost,
        sapSku: calc.material.id,
        inStock: calc.material.inStock
      }))
    };
  }

  private generatePhasesFromMaterials(parsed: ParsedRequest, materials: MaterialCalculation) {
    const buildType = parsed.buildType;
    const phases = [];

    // Phase 1: Preparation and Foundation (if needed)
    const foundationMaterials = materials.materials.filter(m => 
      m.material.category === 'foundation' || m.material.id.includes('concrete')
    );

    if (foundationMaterials.length > 0) {
      phases.push({
        id: 'phase-foundation',
        name: 'Foundation Preparation',
        description: `Prepare and pour foundation for the ${buildType.replace('_', ' ')}`,
        duration: this.estimatePhaseDuration('foundation', parsed),
        order: 1,
        materials: foundationMaterials.map(calc => ({
          id: calc.material.id,
          name: calc.material.name,
          quantity: calc.quantity,
          unit: calc.material.unit,
          pricePerUnit: calc.material.price,
          totalPrice: calc.totalCost,
          inStock: calc.material.inStock
        })),
        tools: ['Level', 'Shovel', 'Wheelbarrow', 'Float']
      });
    }

    // Phase 2: Main Construction
    const constructionMaterials = materials.materials.filter(m => 
      m.material.category === 'brick' || m.material.category === 'mortar'
    );

    if (constructionMaterials.length > 0) {
      phases.push({
        id: 'phase-construction',
        name: 'Main Construction',
        description: `Build the main ${buildType.replace('_', ' ')} structure`,
        duration: this.estimatePhaseDuration('construction', parsed),
        order: phases.length + 1,
        materials: constructionMaterials.map(calc => ({
          id: calc.material.id,
          name: calc.material.name,
          quantity: calc.quantity,
          unit: calc.material.unit,
          pricePerUnit: calc.material.price,
          totalPrice: calc.totalCost,
          inStock: calc.material.inStock
        })),
        tools: ['Trowel', 'Level', 'Rubber mallet', 'Measuring tape']
      });
    }

    // Phase 3: Insulation and Finishing (if applicable)
    const finishingMaterials = materials.materials.filter(m => 
      m.material.category === 'insulation' || m.material.category === 'accessory'
    );

    if (finishingMaterials.length > 0 || buildType === 'pizza_oven') {
      phases.push({
        id: 'phase-finishing',
        name: 'Insulation & Finishing',
        description: `Complete insulation and finishing touches`,
        duration: this.estimatePhaseDuration('finishing', parsed),
        order: phases.length + 1,
        materials: finishingMaterials.map(calc => ({
          id: calc.material.id,
          name: calc.material.name,
          quantity: calc.quantity,
          unit: calc.material.unit,
          pricePerUnit: calc.material.price,
          totalPrice: calc.totalCost,
          inStock: calc.material.inStock
        })),
        tools: ['Trowel', 'Knife', 'Brush']
      });
    }

    return phases;
  }

  private estimateProjectTime(parsed: ParsedRequest, materials: MaterialCalculation): string {
    const buildType = parsed.buildType;
    const dimensions = parsed.dimensions;
    const surfaceArea = (dimensions.length || 1) * (dimensions.height || 1);
    
    let baseDays = 1;
    
    switch (buildType) {
      case 'pizza_oven':
        baseDays = 4 + Math.ceil(surfaceArea * 0.5);
        break;
      case 'wall':
      case 'garden_wall':
        baseDays = 2 + Math.ceil(surfaceArea * 0.3);
        break;
      case 'fire_pit':
        baseDays = 2 + Math.ceil(surfaceArea * 0.4);
        break;
      case 'foundation':
        baseDays = 1 + Math.ceil(surfaceArea * 0.2);
        break;
      case 'structure':
        baseDays = 5 + Math.ceil(surfaceArea * 0.8);
        break;
      default:
        baseDays = 3;
    }

    const minDays = Math.max(baseDays - 1, 1);
    const maxDays = baseDays + 2;
    
    return `${minDays}-${maxDays} days`;
  }

  private estimatePhaseDuration(phase: string, parsed: ParsedRequest): string {
    const buildType = parsed.buildType;
    
    switch (phase) {
      case 'foundation':
        return buildType === 'structure' ? '1-2 days' : '1 day';
      case 'construction':
        if (buildType === 'pizza_oven') return '2-3 days';
        if (buildType === 'structure') return '3-5 days';
        return '1-2 days';
      case 'finishing':
        return buildType === 'pizza_oven' ? '1-2 days' : '0.5-1 day';
      default:
        return '1 day';
    }
  }

  private fallbackPlannerResponse(): AgentResponse {
    // Original pizza oven blueprint as fallback
    const blueprint: Blueprint = {
      id: 'bp-001',
      phases: [
        {
          id: 'phase-1',
          name: 'Foundation Preparation',
          description: 'Prepare the base and foundation for the pizza oven',
          duration: '2-3 days',
          order: 1,
          materials: [
            { id: 'm1', name: 'Concrete mix', quantity: 2, unit: 'bags', pricePerUnit: 8.50, totalPrice: 17.00, inStock: true },
            { id: 'm2', name: 'Rebar', quantity: 6, unit: 'pieces', pricePerUnit: 4.20, totalPrice: 25.20, inStock: true }
          ],
          tools: ['Level', 'Shovel', 'Wheelbarrow']
        },
        {
          id: 'phase-2',
          name: 'Oven Construction',
          description: 'Build the main oven structure with firebricks',
          duration: '3-4 days',
          order: 2,
          materials: [
            { id: 'm3', name: 'Firebrick panels', quantity: 45, unit: 'pieces', pricePerUnit: 10.00, totalPrice: 450.00, sapSku: 'FB-001', inStock: true },
            { id: 'm4', name: 'Refractory mortar', quantity: 3, unit: 'bags', pricePerUnit: 15.80, totalPrice: 47.40, inStock: true }
          ],
          tools: ['Trowel', 'Rubber mallet', 'Measuring tape']
        }
      ],
      totalCost: 539.60,
      estimatedTime: '5-7 days',
      materials: []
    };

    return {
      agent: 'planner',
      message: "I've created a comprehensive blueprint for your pizza oven project. Here's the strategic plan with phases, materials, and cost estimates.",
      data: { blueprint }
    };
  }

  private fallbackPlannerResponse(): AgentResponse {
    const blueprint: Blueprint = {
      id: 'bp-001',
      phases: [
        {
          id: 'phase-1',
          name: 'Foundation Preparation',
          description: 'Prepare the base and foundation for the pizza oven',
          duration: '2-3 days',
          order: 1,
          materials: [
            { id: 'm1', name: 'Concrete mix', quantity: 2, unit: 'bags', pricePerUnit: 8.50, totalPrice: 17.00, inStock: true },
            { id: 'm2', name: 'Rebar', quantity: 6, unit: 'pieces', pricePerUnit: 4.20, totalPrice: 25.20, inStock: true }
          ],
          tools: ['Level', 'Shovel', 'Wheelbarrow']
        },
        {
          id: 'phase-2',
          name: 'Oven Construction',
          description: 'Build the main oven structure with firebricks',
          duration: '3-4 days',
          order: 2,
          materials: [
            { id: 'm3', name: 'Firebrick panels', quantity: 45, unit: 'pieces', pricePerUnit: 10.00, totalPrice: 450.00, sapSku: 'FB-001', inStock: true },
            { id: 'm4', name: 'Refractory mortar', quantity: 3, unit: 'bags', pricePerUnit: 15.80, totalPrice: 47.40, inStock: true }
          ],
          tools: ['Trowel', 'Rubber mallet', 'Measuring tape']
        }
      ],
      totalCost: 539.60,
      estimatedTime: '5-7 days',
      materials: []
    };

    return {
      agent: 'planner',
      message: "I've created a comprehensive blueprint for your pizza oven project. Here's the strategic plan with phases, materials, and cost estimates.",
      data: { blueprint }
    };
  }

  // Keep existing builder and joule methods but add conversation state updates
  private builderAgentResponse(): AgentResponse {
    const buildPlan: BuildPlan = {
      id: 'bp-001',
      steps: [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Site Preparation',
          description: 'Clear and level the construction area. Mark the foundation perimeter.',
          duration: '2 hours',
          materials: [],
          tools: ['Measuring tape', 'Spray paint', 'Level'],
          tips: ['Ensure drainage away from the oven', 'Check local building codes']
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: 'Foundation Pour',
          description: 'Mix and pour concrete foundation. Install rebar reinforcement.',
          duration: '4 hours',
          materials: [
            { id: 'm1', name: 'Concrete mix', quantity: 2, unit: 'bags', pricePerUnit: 8.50, totalPrice: 17.00, inStock: true }
          ],
          tools: ['Wheelbarrow', 'Shovel', 'Float'],
          tips: ['Allow 24-48 hours curing time', 'Keep concrete moist during curing']
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'First Course of Firebricks',
          description: 'Lay the first row of firebricks using refractory mortar.',
          duration: '3 hours',
          materials: [
            { id: 'm3', name: 'Firebrick panels', quantity: 12, unit: 'pieces', pricePerUnit: 10.00, totalPrice: 120.00, inStock: true }
          ],
          tools: ['Trowel', 'Level', 'Rubber mallet'],
          tips: ['Use thin mortar joints', 'Check level frequently']
        }
      ],
      safetyTips: [
        'Wear safety glasses and dust mask when cutting bricks',
        'Use proper lifting techniques for heavy materials',
        'Ensure adequate ventilation when working with mortar'
      ],
      toolList: ['Trowel', 'Level', 'Rubber mallet', 'Measuring tape', 'Shovel', 'Wheelbarrow', 'Float'],
      wasteBuffer: 0.1
    };

    this.conversationState.phase = 'complete';

    return {
      agent: 'builder',
      message: "Here's your detailed step-by-step construction plan. I've included exact material quantities, tools needed, and safety tips for each phase.",
      data: { buildPlan }
    };
  }

  private jouleIntegrationResponse(): AgentResponse {
    // Mock SAP Joule integration
    const catalogCheck = {
      availableItems: ['Firebrick panels', 'Refractory mortar'],
      missingSkus: [],
      alternatives: [
        {
          id: 'alt-1',
          name: 'Premium Firebrick Set',
          pricePerUnit: 12.50,
          availability: 'In Stock',
          sapSku: 'FB-002'
        }
      ]
    };

    return {
      agent: 'joule',
      message: "SAP catalog verification complete! All materials are available. I found some premium alternatives that might interest you.",
      data: catalogCheck
    };
  }

  // Legacy method for backward compatibility
  private getQuestionSuggestions(questionNumber: number): string[] {
    switch (questionNumber) {
      case 1:
        return ['1m x 1m x 0.5m', '1.2m x 1.2m x 0.6m', '80cm x 80cm x 40cm'];
      case 2:
        return ['Concrete slab', 'Existing patio', 'New foundation'];
      case 3:
        return ['Insulation layer', 'Decorative arch', 'Built-in storage'];
      default:
        return [];
    }
  }

  // Public methods for conversation management
  getConversationState(): ConversationState {
    return this.conversationState;
  }

  // Get catalog agent for direct access
  getCatalogAgent(): MockCatalogAgent {
    return this.catalogAgent;
  }

  // Get planning agent for direct access
  getPlanningAgent(): PlanningAgent {
    return this.planningAgent;
  }

  // Get available build templates
  getAvailableTemplates() {
    return this.planningAgent.getAvailableTemplates();
  }

  // Get difficulty assessment for a project
  getDifficultyAssessment(buildType: string, experienceLevel: string) {
    return this.planningAgent.getDifficultyAssessment(buildType, experienceLevel);
  }

  // Get material alternatives for a specific material
  getMaterialAlternatives(materialId: string) {
    return this.catalogAgent.getAlternatives(materialId);
  }

  // Search materials by query
  searchMaterials(query: string) {
    return this.catalogAgent.searchMaterials(query);
  }

  // Get catalog statistics
  getCatalogStats() {
    return this.catalogAgent.getCatalogStats();
  }

  resetSession(): void {
    this.conversationState = {
      phase: 'input',
      messages: [],
      currentPlan: null,
      needsInput: true
    };
    this.projectSpecs = {};
  }

  // Method to update conversation state (for future use)
  updateConversationState(updates: Partial<ConversationState>): void {
    this.conversationState = { ...this.conversationState, ...updates };
  }
}

export const agentService = new AgentService();
