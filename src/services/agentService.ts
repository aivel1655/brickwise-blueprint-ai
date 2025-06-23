
import { AgentResponse, ProjectSpecs, Blueprint, BuildPlan } from '../types';

class AgentService {
  private questionCount = 0;
  private projectSpecs: Partial<ProjectSpecs> = {};

  async processUserMessage(message: string, context?: any): Promise<AgentResponse> {
    console.log('Processing message:', message);
    
    // Determine which agent should respond based on context
    if (this.questionCount < 3 && !context?.approved) {
      return this.iterationAgentResponse(message);
    } else if (!context?.blueprint) {
      return this.strategicPlannerResponse();
    } else if (!context?.buildPlan) {
      return this.builderAgentResponse();
    } else {
      return this.jouleIntegrationResponse();
    }
  }

  private iterationAgentResponse(message: string): AgentResponse {
    this.questionCount++;
    
    // Parse user input for specs
    if (message.toLowerCase().includes('pizza oven')) {
      this.projectSpecs.brickType = 'firebrick';
    }
    
    const questions = [
      "What are the exact dimensions you need? Please specify length, width, and height in meters.",
      "What type of foundation do you plan to use? (concrete slab, existing surface, or new foundation)",
      "Do you have any special requirements like insulation, decorative elements, or specific brick patterns?"
    ];

    if (this.questionCount <= questions.length) {
      return {
        agent: 'iteration',
        message: questions[this.questionCount - 1],
        suggestions: this.getQuestionSuggestions(this.questionCount)
      };
    }

    return {
      agent: 'iteration',
      message: "Perfect! I have all the information I need. Let me hand this over to our Strategic Planner to create your blueprint.",
      data: { specsComplete: true }
    };
  }

  private strategicPlannerResponse(): AgentResponse {
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

  resetSession(): void {
    this.questionCount = 0;
    this.projectSpecs = {};
  }
}

export const agentService = new AgentService();
