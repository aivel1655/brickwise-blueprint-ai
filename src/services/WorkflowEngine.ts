import { 
  ParsedRequest, 
  ChatMessage, 
  EnhancedBlueprint, 
  MaterialCalculation,
  WorkflowPhase,
  WorkflowState 
} from '../types';
import { InputAgent } from './InputAgent';
import { PlanningAgent } from './PlanningAgent';
import { MockCatalogAgent } from './MockCatalogAgent';
import { GroqAIAgent } from './GroqAIAgent';
import { RecommendationEngine } from './RecommendationEngine';

interface WorkflowConfig {
  groqApiKey?: string;
  enableAI?: boolean;
}

export class WorkflowEngine {
  private inputAgent: InputAgent;
  private planningAgent: PlanningAgent;
  private catalogAgent: MockCatalogAgent;
  private aiAgent: GroqAIAgent | null = null;
  private recommendationEngine: RecommendationEngine;
  
  private state: WorkflowState = {
    phase: 'input',
    sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    messageCount: 0,
    parsedRequest: null,
    blueprint: null,
    materials: null,
    conversationHistory: [],
    aiAnalysis: null,
    lastError: null
  };

  constructor(config: WorkflowConfig = {}) {
    this.inputAgent = new InputAgent();
    this.planningAgent = new PlanningAgent();
    this.catalogAgent = new MockCatalogAgent();
    this.recommendationEngine = new RecommendationEngine();
    
    if (config.groqApiKey && config.enableAI) {
      this.aiAgent = new GroqAIAgent({
        apiKey: config.groqApiKey,
        model: 'llama-3.3-70b-versatile',
        maxTokens: 4096
      });
    }

    console.log('🚀 WorkflowEngine initialized:', {
      sessionId: this.state.sessionId,
      aiEnabled: !!this.aiAgent?.isConfigured(),
      phase: this.state.phase
    });
  }

  async processMessage(message: string): Promise<{
    response: string;
    blueprint?: EnhancedBlueprint;
    materials?: MaterialCalculation;
    phase: WorkflowPhase;
    aiAnalysis?: any;
    recommendations?: any[];
  }> {
    console.log('💬 Processing message:', { 
      message: message.substring(0, 100) + '...', 
      currentPhase: this.state.phase,
      messageCount: this.state.messageCount + 1
    });

    this.state.messageCount++;
    
    // Add message to conversation history
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: message,
      type: 'user',
      timestamp: new Date()
    };
    this.state.conversationHistory.push(userMessage);

    try {
      let response: string;
      let newPhase: WorkflowPhase = this.state.phase;
      let recommendations: any[] = [];

      switch (this.state.phase) {
        case 'input':
          const result = await this.handleInputPhase(message);
          response = result.response;
          newPhase = result.newPhase;
          break;

        case 'planning':
          const planResult = await this.handlePlanningPhase(message);
          response = planResult.response;
          newPhase = planResult.newPhase;
          break;

        case 'materials':
          const matResult = await this.handleMaterialsPhase(message);
          response = matResult.response;
          newPhase = matResult.newPhase;
          break;

        case 'ai_analysis':
          const aiResult = await this.handleAIAnalysisPhase(message);
          response = aiResult.response;
          newPhase = aiResult.newPhase;
          break;

        case 'interactive':
          const interactiveResult = await this.handleInteractivePhase(message);
          response = interactiveResult.response;
          recommendations = interactiveResult.recommendations || [];
          break;

        default:
          response = "I'm not sure how to help with that. Could you please describe what you'd like to build?";
          newPhase = 'input';
      }

      // Update phase if it changed
      if (newPhase !== this.state.phase) {
        console.log(`🔄 Phase transition: ${this.state.phase} → ${newPhase}`);
        this.state.phase = newPhase;
      }

      // Add assistant response to history
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        content: response,
        type: 'agent',
        timestamp: new Date()
      };
      this.state.conversationHistory.push(assistantMessage);

      // Clear any previous errors
      this.state.lastError = null;

      return {
        response,
        blueprint: this.state.blueprint || undefined,
        materials: this.state.materials || undefined,
        phase: this.state.phase,
        aiAnalysis: this.state.aiAnalysis || undefined,
        recommendations
      };

    } catch (error) {
      console.error('❌ Error processing message:', error);
      this.state.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        response: "I encountered an error processing your request. Could you please try rephrasing your question?",
        phase: this.state.phase,
        blueprint: this.state.blueprint || undefined,
        materials: this.state.materials || undefined
      };
    }
  }

  private async handleInputPhase(message: string): Promise<{ response: string; newPhase: WorkflowPhase }> {
    console.log('🎯 Handling input phase');
    
    try {
      this.state.parsedRequest = this.inputAgent.parsePrompt(message);
      console.log('✅ Request parsed successfully:', this.state.parsedRequest);
      
      const response = `Great! I understand you want to build a ${this.state.parsedRequest.buildType.replace('_', ' ')}. Let me create a detailed plan for you.`;
      
      return { response, newPhase: 'planning' };
    } catch (error) {
      console.error('❌ Input parsing failed:', error);
      return { 
        response: "I didn't quite understand what you'd like to build. Could you please provide more details about your project? For example: 'I want to build a pizza oven that's 1.5m wide and 1m deep'",
        newPhase: 'input'
      };
    }
  }

  private async handlePlanningPhase(message: string): Promise<{ response: string; newPhase: WorkflowPhase }> {
    console.log('📋 Handling planning phase');
    
    if (!this.state.parsedRequest) {
      return { response: "Let me first understand what you'd like to build.", newPhase: 'input' };
    }

    try {
      this.state.blueprint = await this.planningAgent.createEnhancedBlueprint(this.state.parsedRequest);
      console.log('✅ Blueprint created successfully');

      const response = `Perfect! I've created a detailed ${this.state.blueprint.difficulty} level plan for your ${this.state.blueprint.buildType.replace('_', ' ')}. 

**Project Overview:**
- Estimated time: ${this.state.blueprint.estimatedTime}
- Difficulty: ${this.state.blueprint.difficulty}
- Number of phases: ${this.state.blueprint.phases.length}
- Total estimated cost: €${this.state.blueprint.totalCost.toFixed(2)}

The plan includes ${this.state.blueprint.phases.length} detailed phases with safety guidelines and quality checks. Would you like me to calculate the exact materials needed?`;

      return { response, newPhase: 'materials' };
    } catch (error) {
      console.error('❌ Planning failed:', error);
      return { 
        response: "I had trouble creating your build plan. Let me try a different approach. Could you tell me more about the specific requirements?",
        newPhase: 'input'
      };
    }
  }

  private async handleMaterialsPhase(message: string): Promise<{ response: string; newPhase: WorkflowPhase }> {
    console.log('🧱 Handling materials phase');
    
    if (!this.state.parsedRequest || !this.state.blueprint) {
      return { response: "Let me first create your build plan.", newPhase: 'planning' };
    }

    try {
      this.state.materials = this.catalogAgent.calculateMaterialNeeds(this.state.parsedRequest.buildType, {
        length: this.state.parsedRequest.dimensions.length || 1,
        width: this.state.parsedRequest.dimensions.width || 1,
        height: this.state.parsedRequest.dimensions.height || 1,
        diameter: this.state.parsedRequest.dimensions.diameter
      });
      console.log('✅ Materials calculated successfully');

      const topMaterials = this.state.materials.materials.slice(0, 5);
      const materialsList = topMaterials.map(m => 
        `• ${m.material.name}: ${m.quantity} ${m.material.unit} (€${m.totalCost.toFixed(2)})`
      ).join('\n');

      const response = `Excellent! I've calculated all the materials you'll need:

**Material Summary:**
${materialsList}

**Total Cost:** €${this.state.materials.totalCost.toFixed(2)}
**Estimated Delivery:** ${this.state.materials.deliveryTime}

💡 **Smart Recommendations Available:**
I can now suggest alternative materials to help you:
• Save money with cheaper alternatives
• Upgrade to premium options for better quality
• Find faster delivery options
• Optimize for your experience level

${this.aiAgent?.isConfigured() ? 
  "Now let me analyze your project with AI to provide expert recommendations and optimizations." : 
  "Your complete build plan is ready! Ask me about alternatives or modifications anytime."
}`;

      return { 
        response, 
        newPhase: this.aiAgent?.isConfigured() ? 'ai_analysis' : 'interactive'
      };
    } catch (error) {
      console.error('❌ Materials calculation failed:', error);
      return { 
        response: "I had trouble calculating the materials. Let me help you with a basic materials list based on your project type.",
        newPhase: 'interactive'
      };
    }
  }

  private async handleAIAnalysisPhase(message: string): Promise<{ response: string; newPhase: WorkflowPhase }> {
    console.log('🤖 Handling AI analysis phase');
    
    if (!this.aiAgent || !this.state.parsedRequest) {
      return { response: "AI analysis is not available. Let me help you with your build!", newPhase: 'interactive' };
    }

    try {
      this.state.aiAnalysis = await this.aiAgent.analyzeProject(
        this.state.parsedRequest,
        this.state.blueprint,
        this.state.materials,
        this.state.conversationHistory
      );

      const analysis = this.state.aiAnalysis;
      const response = `🤖 **AI Analysis Complete!**

**💰 Cost Optimization:**
- Potential savings: €${analysis.materialOptimization.costSavings}
- ${analysis.materialOptimization.suggestedAlternatives.slice(0, 2).join('\n- ')}

**🏗️ Expert Construction Advice:**
- Difficulty: ${analysis.constructionAdvice.difficultyAssessment}
- ${analysis.constructionAdvice.expertTips.slice(0, 2).join('\n- ')}

**⚠️ Safety Priorities:**
- ${analysis.constructionAdvice.safetyWarnings.slice(0, 2).join('\n- ')}

**📊 Project Complexity:** ${analysis.projectAnalysis.complexityRating}/10

Your complete build plan is now ready with AI-powered insights! How would you like to proceed?`;

      return { response, newPhase: 'interactive' };
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      return { 
        response: "AI analysis encountered an issue, but your build plan is complete! How can I help you get started?",
        newPhase: 'interactive'
      };
    }
  }

  private async handleInteractivePhase(message: string): Promise<{ response: string; recommendations?: any[] }> {
    console.log('💬 Handling interactive phase');
    
    // Check for recommendation requests
    if (this.isAskingForRecommendations(message)) {
      return await this.handleRecommendationRequest(message);
    }
    
    // Check if user is asking for AI advice
    if (this.aiAgent?.isConfigured() && this.isAskingForAdvice(message)) {
      try {
        const advice = await this.aiAgent.provideExpertAdvice(message, {
          parsedRequest: this.state.parsedRequest || undefined,
          blueprint: this.state.blueprint || undefined,
          materials: this.state.materials || undefined
        });
        return { response: `🤖 **Expert Advice:**\n\n${advice}` };
      } catch (error) {
        console.error('❌ AI advice failed:', error);
        return { response: "I'd be happy to help, but I'm having trouble accessing my AI advisor right now. Could you be more specific about what aspect of the build you need help with?" };
      }
    }

    // Handle specific queries about the project
    if (this.state.blueprint) {
      if (message.toLowerCase().includes('phase') || message.toLowerCase().includes('step')) {
        return { response: this.describePhases() };
      }
      
      if (message.toLowerCase().includes('material') || message.toLowerCase().includes('supply')) {
        return { response: this.describeMaterials() };
      }
      
      if (message.toLowerCase().includes('safety') || message.toLowerCase().includes('danger')) {
        return { response: this.describeSafety() };
      }
      
      if (message.toLowerCase().includes('time') || message.toLowerCase().includes('schedule')) {
        return { response: this.describeTimeline() };
      }
      
      if (message.toLowerCase().includes('cost') || message.toLowerCase().includes('budget')) {
        return { response: this.describeCosts() };
      }
    }

    return { response: "I'm here to help with your build! You can ask me about:\n• Build phases and steps\n• Materials and suppliers\n• Safety guidelines\n• Timeline and scheduling\n• Costs and budgeting\n• **Alternative materials and recommendations** 💡\n• Specific construction techniques\n\nWhat would you like to know?" };
  }

  private isAskingForRecommendations(message: string): boolean {
    const recommendationKeywords = [
      'alternative', 'alternatives', 'recommend', 'suggestion', 'suggestions', 
      'cheaper', 'better', 'upgrade', 'downgrade', 'substitute', 'replace',
      'different option', 'other options', 'save money', 'cost effective',
      'premium', 'budget', 'faster delivery'
    ];
    return recommendationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private async handleRecommendationRequest(message: string): Promise<{ response: string; recommendations: any[] }> {
    if (!this.state.materials || !this.state.parsedRequest) {
      return {
        response: "I need to calculate your materials first. Let me know what you'd like to build!",
        recommendations: []
      };
    }

    const context = {
      buildType: this.state.parsedRequest.buildType,
      budget: this.state.parsedRequest.budget,
      prioritizeQuality: message.toLowerCase().includes('quality') || message.toLowerCase().includes('premium'),
      prioritizeCost: message.toLowerCase().includes('cheap') || message.toLowerCase().includes('save') || message.toLowerCase().includes('budget'),
      userExperience: this.state.parsedRequest.experience || 'intermediate'
    };

    const recommendations = this.recommendationEngine.getRecommendations(
      this.state.materials.materials,
      context
    );

    if (recommendations.length === 0) {
      return {
        response: "I couldn't find any suitable alternatives for your current materials. Your selection is already well-optimized for your project!",
        recommendations: []
      };
    }

    let response = "🔍 **Smart Material Recommendations:**\n\n";
    
    recommendations.slice(0, 3).forEach((rec, index) => {
      response += `**${index + 1}. ${rec.original.name} Alternatives:**\n`;
      
      rec.alternatives.slice(0, 2).forEach(alt => {
        const savingsText = alt.costDifference < 0 ? 
          `💰 Save €${Math.abs(alt.costDifference).toFixed(2)}` : 
          `⬆️ +€${alt.costDifference.toFixed(2)}`;
        
        response += `• **${alt.material.name}** - ${savingsText}\n`;
        response += `  └ ${alt.reason}\n`;
        if (alt.qualityImprovement) {
          response += `  └ Quality: ${alt.qualityImprovement}\n`;
        }
      });
      response += "\n";
    });

    // Add cost optimization summary
    const costOptimization = this.recommendationEngine.getCostOptimizations(
      this.state.materials.materials,
      this.state.parsedRequest.budget || 1000
    );

    if (costOptimization.totalSavings > 0) {
      response += `💡 **Potential Total Savings: €${costOptimization.totalSavings.toFixed(2)}**\n\n`;
    }

    response += "Would you like me to show you more details about any of these alternatives?";

    return {
      response,
      recommendations: recommendations.map(rec => ({
        original: rec.original,
        alternatives: rec.alternatives.slice(0, 2)
      }))
    };
  }

  private isAskingForAdvice(message: string): boolean {
    const adviceKeywords = ['how', 'what', 'why', 'when', 'where', 'should', 'recommend', 'suggest', 'advice', 'help', 'problem', 'issue', 'best', 'better'];
    return adviceKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  getStatus() {
    return {
      sessionId: this.state.sessionId,
      messageCount: this.state.messageCount,
      currentPhase: this.state.phase,
      hasApiKey: !!this.aiAgent?.isConfigured(),
      lastError: this.state.lastError
    };
  }

  getCurrentState(): WorkflowState {
    return { ...this.state };
  }

  resetSession(): void {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.state = {
      phase: 'input',
      sessionId: newSessionId,
      messageCount: 0,
      parsedRequest: null,
      blueprint: null,
      materials: null,
      conversationHistory: [],
      aiAnalysis: null,
      lastError: null
    };
    
    // Clear AI conversation history if available
    this.aiAgent?.clearConversationHistory();
    
    console.log('🔄 Session reset:', { sessionId: newSessionId });
  }

  updateApiKey(apiKey: string): void {
    if (apiKey && apiKey !== 'your_groq_api_key_here') {
      this.aiAgent = new GroqAIAgent({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        maxTokens: 4096
      });
      console.log('🔑 API key updated, AI agent configured');
    } else {
      this.aiAgent = null;
      console.log('🔑 API key cleared, AI agent disabled');
    }
  }

  private describePhases(): string {
    if (!this.state.blueprint) return "No build plan available yet.";
    
    const phases = this.state.blueprint.phases.map((phase, index) => 
      `**Phase ${index + 1}: ${phase.title || phase.name}**\n${phase.description}\n- Time: ${phase.estimatedHours || 'TBD'} hours\n- Tools: ${phase.tools?.join(', ') || 'Standard tools'}`
    ).join('\n\n');
    
    return `Here are your build phases:\n\n${phases}`;
  }

  private describeMaterials(): string {
    if (!this.state.materials) return "Materials haven't been calculated yet.";
    
    const materials = this.state.materials.materials.slice(0, 10).map(m => 
      `• ${m.material.name}: ${m.quantity} ${m.material.unit} - €${m.totalCost.toFixed(2)}`
    ).join('\n');
    
    return `**Materials List:**\n${materials}\n\n**Total Cost:** €${this.state.materials.totalCost.toFixed(2)}`;
  }

  private describeSafety(): string {
    if (!this.state.blueprint) return "No safety guidelines available yet.";
    
    const safety = this.state.blueprint.safetyGuidelines.map(sg => 
      `**${sg.title}** (${sg.severity})\n${sg.description}`
    ).join('\n\n');
    
    return `**Safety Guidelines:**\n\n${safety}`;
  }

  private describeTimeline(): string {
    if (!this.state.blueprint) return "No timeline available yet.";
    
    return `**Project Timeline:**\n• Total Duration: ${this.state.blueprint.estimatedTime}\n• Difficulty Level: ${this.state.blueprint.difficulty}\n• Number of Phases: ${this.state.blueprint.phases.length}\n\nThe timeline may vary based on weather conditions and your experience level.`;
  }

  private describeCosts(): string {
    if (!this.state.materials || !this.state.blueprint) return "Cost information not available yet.";
    
    const breakdown = this.state.materials.materials.slice(0, 5).map(m => 
      `• ${m.material.name}: €${m.totalCost.toFixed(2)}`
    ).join('\n');
    
    return `**Cost Breakdown:**\n${breakdown}\n\n**Total Materials:** €${this.state.materials.totalCost.toFixed(2)}\n**Estimated Labor:** €${Math.round(this.state.blueprint.totalCost * 0.3).toFixed(2)} (if hiring help)\n\n*Note: Costs may vary by location and supplier.*`;
  }
}
