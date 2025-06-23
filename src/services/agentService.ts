
import { AgentResponse, ProjectSpecs, Blueprint, BuildPlan, ParsedRequest, Question, ConversationState } from '../types';
import { InputAgent } from './InputAgent';

class AgentService {
  private inputAgent: InputAgent;
  private conversationState: ConversationState;
  private projectSpecs: Partial<ProjectSpecs> = {};

  constructor() {
    this.inputAgent = new InputAgent();
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

  // Keep existing methods but update them to use parsed data
  private strategicPlannerResponse(): AgentResponse {
    const parsed = this.conversationState.parsedRequest;
    
    if (!parsed) {
      return this.fallbackPlannerResponse();
    }
    
    // Create blueprint based on parsed build type
    const blueprint = this.createBlueprintForBuildType(parsed);
    
    this.conversationState.phase = 'review';
    
    return {
      agent: 'planner',
      message: `I've created a comprehensive blueprint for your ${parsed.buildType.replace('_', ' ')} project. Here's the strategic plan with phases, materials, and cost estimates.`,
      data: { blueprint, parsedRequest: parsed }
    };
  }

  private createBlueprintForBuildType(parsed: ParsedRequest): Blueprint {
    // For now, enhanced pizza oven blueprint, but this will be expanded
    // when we implement the Planning Agent Templates
    if (parsed.buildType === 'pizza_oven') {
      return this.createPizzaOvenBlueprint(parsed);
    }
    
    // Basic blueprint for other types - will be enhanced in next phase
    return this.createBasicBlueprint(parsed);
  }

  private createPizzaOvenBlueprint(parsed: ParsedRequest): Blueprint {
    const dimensions = parsed.dimensions;
    const baseSize = dimensions.length || dimensions.width || 1.0;
    const multiplier = baseSize; // Scale materials based on size
    
    return {
      id: 'bp-001',
      phases: [
        {
          id: 'phase-1',
          name: 'Foundation Preparation',
          description: 'Prepare the base and foundation for the pizza oven',
          duration: '2-3 days',
          order: 1,
          materials: [
            { 
              id: 'm1', 
              name: 'Concrete mix', 
              quantity: Math.ceil(2 * multiplier), 
              unit: 'bags', 
              pricePerUnit: 8.50, 
              totalPrice: Math.ceil(2 * multiplier) * 8.50, 
              inStock: true 
            },
            { 
              id: 'm2', 
              name: 'Rebar', 
              quantity: Math.ceil(6 * multiplier), 
              unit: 'pieces', 
              pricePerUnit: 4.20, 
              totalPrice: Math.ceil(6 * multiplier) * 4.20, 
              inStock: true 
            }
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
            { 
              id: 'm3', 
              name: 'Firebrick panels', 
              quantity: Math.ceil(45 * multiplier * multiplier), 
              unit: 'pieces', 
              pricePerUnit: 10.00, 
              totalPrice: Math.ceil(45 * multiplier * multiplier) * 10.00, 
              sapSku: 'FB-001', 
              inStock: true 
            },
            { 
              id: 'm4', 
              name: 'Refractory mortar', 
              quantity: Math.ceil(3 * multiplier), 
              unit: 'bags', 
              pricePerUnit: 15.80, 
              totalPrice: Math.ceil(3 * multiplier) * 15.80, 
              inStock: true 
            }
          ],
          tools: ['Trowel', 'Rubber mallet', 'Measuring tape']
        }
      ],
      totalCost: 0, // Will be calculated
      estimatedTime: `${Math.ceil(5 * multiplier)}-${Math.ceil(7 * multiplier)} days`,
      materials: []
    };
  }

  private createBasicBlueprint(parsed: ParsedRequest): Blueprint {
    return {
      id: 'bp-basic',
      phases: [
        {
          id: 'phase-1',
          name: 'Planning & Preparation',
          description: `Prepare for ${parsed.buildType.replace('_', ' ')} construction`,
          duration: '1-2 days',
          order: 1,
          materials: [
            { id: 'm1', name: 'Basic materials', quantity: 1, unit: 'set', pricePerUnit: 50.00, totalPrice: 50.00, inStock: true }
          ],
          tools: ['Basic tools']
        }
      ],
      totalCost: 50.00,
      estimatedTime: '1-2 days',
      materials: []
    };
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
