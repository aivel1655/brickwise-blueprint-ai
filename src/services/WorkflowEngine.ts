import { 
  ConversationState, 
  ChatMessage, 
  ParsedRequest, 
  EnhancedBlueprint, 
  MaterialCalculation,
  Question,
  AgentResponse 
} from '../types';
import { InputAgent } from './InputAgent';
import { MockCatalogAgent } from './MockCatalogAgent';
import { PlanningAgent } from './PlanningAgent';
import { GroqAIAgent } from './GroqAIAgent';

interface WorkflowConfig {
  groqApiKey?: string;
  enablePersistence?: boolean;
  sessionId?: string;
}

interface WorkflowSession {
  id: string;
  conversationState: ConversationState;
  createdAt: Date;
  lastUpdated: Date;
  metadata: {
    totalMessages: number;
    currentAgent: string;
    projectType?: string;
  };
}

export class WorkflowEngine {
  private inputAgent: InputAgent;
  private catalogAgent: MockCatalogAgent;
  private planningAgent: PlanningAgent;
  private aiAgent: GroqAIAgent;
  private conversationState: ConversationState;
  private sessionId: string;
  private enablePersistence: boolean;
  private pendingOperations: Map<string, Promise<any>> = new Map();

  constructor(config: WorkflowConfig = {}) {
    this.sessionId = config.sessionId || this.generateSessionId();
    this.enablePersistence = config.enablePersistence || true;
    
    // Initialize agents
    this.inputAgent = new InputAgent();
    this.catalogAgent = new MockCatalogAgent();
    this.planningAgent = new PlanningAgent(this.catalogAgent);
    this.aiAgent = new GroqAIAgent({
      apiKey: config.groqApiKey || this.getApiKeyFromStorage() || 'your_groq_api_key_here'
    });

    // Initialize conversation state
    this.conversationState = this.loadSessionState() || {
      phase: 'input',
      messages: [],
      currentPlan: null,
      needsInput: true,
      parsedRequest: undefined,
      pendingQuestions: []
    };
  }

  async processMessage(message: string, context?: any): Promise<AgentResponse> {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    this.addMessageToState(userMessage);

    try {
      // Determine which agent should handle this message
      const response = await this.routeToAgent(message, context);
      
      // Add agent response to state
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        type: 'agent',
        agent: response.agent as any,
        content: response.message,
        timestamp: new Date(),
        data: response.data
      };

      this.addMessageToState(agentMessage);

      // Handle state transitions
      await this.handleStateTransition(response);

      // Save session state
      this.saveSessionState();

      return response;
    } catch (error) {
      console.error('Workflow processing error:', error);
      return this.handleError(error as Error, message);
    }
  }

  private async routeToAgent(message: string, context?: any): Promise<AgentResponse> {
    const currentPhase = this.conversationState.phase;
    
    console.log(`Routing message to agent for phase: ${currentPhase}`);

    switch (currentPhase) {
      case 'input':
      case 'clarification':
        return this.handleInputPhase(message);
      
      case 'planning':
        return this.handlePlanningPhase(message, context);
      
      case 'review':
        return this.handleReviewPhase(message, context);
      
      case 'complete':
        return this.handleCompletePhase(message, context);
      
      default:
        return this.handleInputPhase(message);
    }
  }

  private async handleInputPhase(message: string): Promise<AgentResponse> {
    // Use enhanced InputAgent to parse the message
    const parsedRequest = this.inputAgent.parsePrompt(message);
    this.conversationState.parsedRequest = parsedRequest;

    console.log('Parsed request:', parsedRequest);

    // Generate clarifying questions if needed
    const questions = this.inputAgent.generateClarifyingQuestions(parsedRequest);
    this.conversationState.pendingQuestions = questions;

    // Determine if we need more information
    if (parsedRequest.confidence >= 0.7 && questions.length === 0) {
      // We have enough information, transition to planning
      this.conversationState.phase = 'planning';
      this.conversationState.needsInput = false;

      return {
        agent: 'iteration',
        message: `Perfect! I understand you want to build a ${parsedRequest.buildType.replace('_', ' ')}. Let me create a comprehensive plan for you using our advanced planning system.`,
        data: { 
          parsedRequest,
          readyForPlanning: true,
          transitionTo: 'planning'
        }
      };
    }

    // We need more information
    if (questions.length > 0) {
      this.conversationState.phase = 'clarification';
      this.conversationState.needsInput = true;

      const question = questions[0];
      return {
        agent: 'iteration',
        message: this.buildClarificationMessage(parsedRequest, question),
        suggestions: question.suggestions,
        data: {
          parsedRequest,
          pendingQuestions: questions,
          needsMoreInfo: true,
          currentQuestion: question
        }
      };
    }

    // Fallback: proceed with partial information
    this.conversationState.phase = 'planning';
    return {
      agent: 'iteration',
      message: `I have some information about your ${parsedRequest.buildType.replace('_', ' ')} project. Let me create a plan based on what I understand.`,
      data: { 
        parsedRequest,
        partialInfo: true,
        transitionTo: 'planning'
      }
    };
  }

  private async handlePlanningPhase(message: string, context?: any): Promise<AgentResponse> {
    const parsedRequest = this.conversationState.parsedRequest;
    
    if (!parsedRequest) {
      // Fallback to input phase
      this.conversationState.phase = 'input';
      return this.handleInputPhase(message);
    }

    try {
      // Add planning operation to pending operations to prevent race conditions
      const planningKey = `planning-${Date.now()}`;
      const planningPromise = this.executePlanningLogic(parsedRequest);
      this.pendingOperations.set(planningKey, planningPromise);

      const { enhancedBlueprint, materials, difficultyAssessment } = await planningPromise;
      this.pendingOperations.delete(planningKey);

      // Store the blueprint in conversation state
      this.conversationState.currentPlan = enhancedBlueprint;
      this.conversationState.phase = 'review';

      // Get AI analysis if available
      let aiInsights = '';
      if (this.aiAgent.isConfigured()) {
        try {
          const analysis = await this.aiAgent.analyzeProject(
            parsedRequest,
            enhancedBlueprint,
            materials,
            this.conversationState.messages
          );
          aiInsights = this.formatAIInsights(analysis);
        } catch (error) {
          console.warn('AI analysis failed, continuing without it:', error);
        }
      }

      // Create comprehensive response message
      let message = `I've created a comprehensive blueprint for your ${parsedRequest.buildType.replace('_', ' ')} project using our professional template system.\n\n`;
      
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

      if (aiInsights) {
        message += `**AI Expert Analysis:**\n${aiInsights}\n\n`;
      }
      
      message += `The plan includes experience-level adapted instructions and safety guidelines tailored for ${parsedRequest.experience || 'beginner'} builders.\n\n`;
      message += `You can now review the detailed plan, ask questions, or request modifications!`;

      return {
        agent: 'planner',
        message,
        data: { 
          blueprint: enhancedBlueprint,
          parsedRequest,
          materialCalculation: materials,
          difficultyAssessment,
          templateUsed: true,
          aiAnalysis: aiInsights ? true : false
        }
      };

    } catch (error) {
      console.error('Planning phase error:', error);
      return this.handlePlanningError(error as Error, parsedRequest);
    }
  }

  private async handleReviewPhase(message: string, context?: any): Promise<AgentResponse> {
    const blueprint = this.conversationState.currentPlan;
    const parsedRequest = this.conversationState.parsedRequest;

    if (!blueprint || !parsedRequest) {
      this.conversationState.phase = 'input';
      return this.handleInputPhase(message);
    }

    // Check if user is asking for modifications, alternatives, or expert advice
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('alternative') || lowerMessage.includes('different') || lowerMessage.includes('change')) {
      return this.handleAlternativeRequest(message, parsedRequest, blueprint);
    }

    if (lowerMessage.includes('cost') || lowerMessage.includes('cheaper') || lowerMessage.includes('budget')) {
      return this.handleCostOptimization(message, parsedRequest, blueprint);
    }

    if (lowerMessage.includes('safety') || lowerMessage.includes('risk') || lowerMessage.includes('danger')) {
      return this.handleSafetyInquiry(message, parsedRequest, blueprint);
    }

    if (lowerMessage.includes('time') || lowerMessage.includes('faster') || lowerMessage.includes('schedule')) {
      return this.handleTimeOptimization(message, parsedRequest, blueprint);
    }

    // General expert advice using AI agent
    if (this.aiAgent.isConfigured()) {
      try {
        const expertAdvice = await this.aiAgent.provideExpertAdvice(message, {
          parsedRequest,
          blueprint,
          materials: this.conversationState.currentPlan ? undefined : undefined // Add materials if available
        });

        return {
          agent: 'ai_expert',
          message: expertAdvice,
          data: {
            expertAdvice: true,
            blueprint,
            parsedRequest
          }
        };
      } catch (error) {
        console.warn('AI expert advice failed:', error);
      }
    }

    // Fallback to general assistance
    return {
      agent: 'builder',
      message: `I understand you have questions about your ${parsedRequest.buildType.replace('_', ' ')} plan. Here are some ways I can help:\n\n• Ask about specific steps or phases\n• Request cost optimization suggestions\n• Get safety advice and precautions\n• Explore alternative materials or methods\n• Discuss timeline optimization\n\nWhat specific aspect would you like to discuss?`,
      data: {
        blueprint,
        parsedRequest,
        helpOptions: true
      }
    };
  }

  private async handleCompletePhase(message: string, context?: any): Promise<AgentResponse> {
    // Handle post-completion questions and support
    const blueprint = this.conversationState.currentPlan;
    const parsedRequest = this.conversationState.parsedRequest;

    if (this.aiAgent.isConfigured() && blueprint && parsedRequest) {
      try {
        const expertAdvice = await this.aiAgent.provideExpertAdvice(message, {
          parsedRequest,
          blueprint
        });

        return {
          agent: 'ai_expert',
          message: `${expertAdvice}\n\nIs there anything else I can help you with for your ${parsedRequest.buildType.replace('_', ' ')} project?`,
          data: {
            expertAdvice: true,
            projectComplete: true
          }
        };
      } catch (error) {
        console.warn('AI expert advice failed:', error);
      }
    }

    return {
      agent: 'support',
      message: `Thank you for using MultiBuildAgent! Your construction plan is complete. If you need further assistance with your project, feel free to ask any specific questions.\n\nYou can also start a new project by telling me what else you'd like to build!`,
      data: {
        projectComplete: true,
        canStartNew: true
      }
    };
  }

  private async executePlanningLogic(parsedRequest: ParsedRequest) {
    // Get difficulty assessment
    const difficultyAssessment = this.planningAgent.getDifficultyAssessment(
      parsedRequest.buildType,
      parsedRequest.experience || 'beginner'
    );

    // Calculate materials using MockCatalogAgent
    const materials = this.catalogAgent.calculateMaterialNeeds(
      parsedRequest.buildType,
      parsedRequest.dimensions
    );

    // Create enhanced blueprint using PlanningAgent templates
    const enhancedBlueprint = this.planningAgent.createStructuredPlan(parsedRequest, materials);

    return { enhancedBlueprint, materials, difficultyAssessment };
  }

  private formatAIInsights(analysis: any): string {
    let insights = '';

    if (analysis.materialOptimization.suggestedAlternatives.length > 0) {
      insights += `💡 **Material Suggestions:**\n${analysis.materialOptimization.suggestedAlternatives.slice(0, 2).map((alt: string) => `• ${alt}`).join('\n')}\n\n`;
    }

    if (analysis.constructionAdvice.expertTips.length > 0) {
      insights += `🔧 **Expert Tips:**\n${analysis.constructionAdvice.expertTips.slice(0, 2).map((tip: string) => `• ${tip}`).join('\n')}\n\n`;
    }

    if (analysis.materialOptimization.costSavings > 0) {
      insights += `💰 **Potential Savings:** €${analysis.materialOptimization.costSavings}\n\n`;
    }

    return insights.trim();
  }

  private async handleAlternativeRequest(message: string, parsedRequest: ParsedRequest, blueprint: EnhancedBlueprint): Promise<AgentResponse> {
    // Get material alternatives from catalog
    const primaryMaterials = blueprint.materials.slice(0, 3);
    const alternatives = primaryMaterials.map(material => {
      const alts = this.catalogAgent.getAlternatives(material.id);
      return {
        original: material.name,
        alternatives: alts.map(alt => `${alt.name} (€${alt.price}/${alt.unit})`)
      };
    }).filter(item => item.alternatives.length > 0);

    let message_response = `Here are some alternatives for your ${parsedRequest.buildType.replace('_', ' ')} project:\n\n`;

    if (alternatives.length > 0) {
      alternatives.forEach(alt => {
        message_response += `**${alt.original} alternatives:**\n`;
        alt.alternatives.slice(0, 2).forEach(altOption => {
          message_response += `• ${altOption}\n`;
        });
        message_response += '\n';
      });
    } else {
      message_response += 'The current materials are already well-optimized for your project requirements.\n\n';
    }

    // Add AI insights if available
    if (this.aiAgent.isConfigured()) {
      try {
        const advice = await this.aiAgent.provideExpertAdvice(
          `Suggest alternatives for: ${message}`,
          { parsedRequest, blueprint }
        );
        message_response += `**AI Expert Insights:**\n${advice}`;
      } catch (error) {
        console.warn('AI advice failed:', error);
      }
    }

    return {
      agent: 'builder',
      message: message_response,
      data: {
        alternatives: true,
        blueprint,
        parsedRequest
      }
    };
  }

  private async handleCostOptimization(message: string, parsedRequest: ParsedRequest, blueprint: EnhancedBlueprint): Promise<AgentResponse> {
    const totalCost = blueprint.totalCost;
    const costBreakdown = blueprint.materials
      .sort((a, b) => b.totalPrice - a.totalPrice)
      .slice(0, 3);

    let response = `**Cost Optimization for your ${parsedRequest.buildType.replace('_', ' ')}:**\n\n`;
    response += `Current total: €${totalCost.toFixed(2)}\n\n`;
    response += `**Highest cost items:**\n`;
    
    costBreakdown.forEach(material => {
      const percentage = (material.totalPrice / totalCost * 100).toFixed(1);
      response += `• ${material.name}: €${material.totalPrice.toFixed(2)} (${percentage}%)\n`;
    });

    response += '\n**Cost-saving suggestions:**\n';
    response += '• Buy materials in bulk for better prices\n';
    response += '• Consider local suppliers to reduce delivery costs\n';
    response += '• Time purchases with seasonal sales\n';
    response += '• Use standard alternatives where appropriate\n\n';

    // Add AI cost optimization if available
    if (this.aiAgent.isConfigured()) {
      try {
        const advice = await this.aiAgent.provideExpertAdvice(
          `How can I reduce costs for this project: ${message}`,
          { parsedRequest, blueprint }
        );
        response += `**AI Cost Analysis:**\n${advice}`;
      } catch (error) {
        console.warn('AI cost advice failed:', error);
      }
    }

    return {
      agent: 'builder',
      message: response,
      data: {
        costOptimization: true,
        blueprint,
        currentCost: totalCost
      }
    };
  }

  private async handleSafetyInquiry(message: string, parsedRequest: ParsedRequest, blueprint: EnhancedBlueprint): Promise<AgentResponse> {
    const criticalSafety = blueprint.safetyGuidelines.filter(sg => sg.severity === 'Critical');
    const warningSafety = blueprint.safetyGuidelines.filter(sg => sg.severity === 'Warning');

    let response = `**Safety Guidelines for your ${parsedRequest.buildType.replace('_', ' ')}:**\n\n`;

    if (criticalSafety.length > 0) {
      response += `🚨 **Critical Safety Requirements:**\n`;
      criticalSafety.forEach(safety => {
        response += `• ${safety.title}: ${safety.description}\n`;
      });
      response += '\n';
    }

    if (warningSafety.length > 0) {
      response += `⚠️ **Important Safety Warnings:**\n`;
      warningSafety.slice(0, 3).forEach(safety => {
        response += `• ${safety.title}: ${safety.description}\n`;
      });
      response += '\n';
    }

    response += `**General Safety Reminders:**\n`;
    response += `• Always wear appropriate PPE\n`;
    response += `• Work in good weather conditions\n`;
    response += `• Have first aid kit accessible\n`;
    response += `• Don't work alone on complex tasks\n\n`;

    // Add AI safety advice if available
    if (this.aiAgent.isConfigured()) {
      try {
        const advice = await this.aiAgent.provideExpertAdvice(
          `Safety advice for: ${message}`,
          { parsedRequest, blueprint }
        );
        response += `**AI Safety Expert:**\n${advice}`;
      } catch (error) {
        console.warn('AI safety advice failed:', error);
      }
    }

    return {
      agent: 'builder',
      message: response,
      data: {
        safetyAdvice: true,
        blueprint,
        criticalCount: criticalSafety.length
      }
    };
  }

  private async handleTimeOptimization(message: string, parsedRequest: ParsedRequest, blueprint: EnhancedBlueprint): Promise<AgentResponse> {
    const phases = blueprint.phases;
    const totalSteps = blueprint.detailedSteps.length;

    let response = `**Time Optimization for your ${parsedRequest.buildType.replace('_', ' ')}:**\n\n`;
    response += `Current estimate: ${blueprint.estimatedTime}\n`;
    response += `Total phases: ${phases.length}\n`;
    response += `Total steps: ${totalSteps}\n\n`;

    response += `**Time-saving strategies:**\n`;
    response += `• Prepare all materials in advance\n`;
    response += `• Work during optimal weather windows\n`;
    response += `• Consider working in parallel where safe\n`;
    response += `• Have all tools ready before starting each phase\n`;
    response += `• Allow for proper curing/drying times\n\n`;

    if (parsedRequest.experience === 'beginner') {
      response += `**For beginners:**\n`;
      response += `• Don't rush - quality is more important than speed\n`;
      response += `• Take breaks to avoid fatigue-related mistakes\n`;
      response += `• Consider spreading work over more days\n\n`;
    }

    // Add AI time optimization if available
    if (this.aiAgent.isConfigured()) {
      try {
        const advice = await this.aiAgent.provideExpertAdvice(
          `Time optimization advice for: ${message}`,
          { parsedRequest, blueprint }
        );
        response += `**AI Scheduling Expert:**\n${advice}`;
      } catch (error) {
        console.warn('AI time advice failed:', error);
      }
    }

    return {
      agent: 'builder',
      message: response,
      data: {
        timeOptimization: true,
        blueprint,
        estimatedTime: blueprint.estimatedTime
      }
    };
  }

  private buildClarificationMessage(parsedRequest: ParsedRequest, question: Question): string {
    let message = '';
    
    // Acknowledge what we understood
    if (parsedRequest.buildType !== 'unknown') {
      message += `Great! I understand you want to build a ${parsedRequest.buildType.replace('_', ' ')}. `;
    }
    
    if (parsedRequest.dimensions && Object.keys(parsedRequest.dimensions).length > 0) {
      const dims = parsedRequest.dimensions;
      if (dims.length && dims.width) {
        message += `I see you mentioned ${dims.length}m x ${dims.width}m${dims.height ? ` x ${dims.height}m` : ''}. `;
      }
    }
    
    if (parsedRequest.materials.length > 0) {
      message += `You mentioned ${parsedRequest.materials.join(', ')} as materials. `;
    }
    
    // Add the question
    message += `\n\n${question.text}`;
    
    return message;
  }

  private handleStateTransition(response: AgentResponse): Promise<void> {
    // Handle any state transitions needed based on the response
    if (response.data?.transitionTo) {
      this.conversationState.phase = response.data.transitionTo;
    }

    if (response.data?.blueprint) {
      this.conversationState.currentPlan = response.data.blueprint;
    }

    if (response.data?.parsedRequest) {
      this.conversationState.parsedRequest = response.data.parsedRequest;
    }

    return Promise.resolve();
  }

  private handleError(error: Error, originalMessage: string): AgentResponse {
    console.error('Workflow engine error:', error);

    let errorMessage = "I apologize, but I encountered an issue processing your request. ";
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage += "This appears to be a network connectivity issue. Please check your internet connection and try again.";
    } else if (error.message.includes('API') || error.message.includes('key')) {
      errorMessage += "There seems to be an issue with the AI services. I can still help you with basic planning using our template system.";
    } else {
      errorMessage += "Let me try to help you in a different way. Could you please rephrase your request or try asking about a specific aspect of your project?";
    }

    return {
      agent: 'system',
      message: errorMessage,
      data: {
        error: true,
        originalMessage,
        errorType: error.name
      }
    };
  }

  private handlePlanningError(error: Error, parsedRequest: ParsedRequest): AgentResponse {
    console.error('Planning error:', error);

    return {
      agent: 'planner',
      message: `I encountered an issue creating your ${parsedRequest.buildType.replace('_', ' ')} plan. Let me provide you with basic guidance:\n\n• This appears to be a ${parsedRequest.buildType.replace('_', ' ')} project\n• Based on your dimensions, you'll need appropriate materials\n• Consider consulting with local professionals for detailed planning\n\nWould you like me to try a simpler approach or help you with specific questions about your project?`,
      data: {
        error: true,
        parsedRequest,
        fallbackMode: true
      }
    };
  }

  private addMessageToState(message: ChatMessage): void {
    this.conversationState.messages.push(message);
    
    // Keep message history manageable (last 50 messages)
    if (this.conversationState.messages.length > 50) {
      this.conversationState.messages = this.conversationState.messages.slice(-50);
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getApiKeyFromStorage(): string | null {
    try {
      return localStorage.getItem('groq_api_key');
    } catch {
      return null;
    }
  }

  private saveSessionState(): void {
    if (!this.enablePersistence) return;

    try {
      const session: WorkflowSession = {
        id: this.sessionId,
        conversationState: this.conversationState,
        createdAt: new Date(),
        lastUpdated: new Date(),
        metadata: {
          totalMessages: this.conversationState.messages.length,
          currentAgent: this.getCurrentAgent(),
          projectType: this.conversationState.parsedRequest?.buildType
        }
      };

      localStorage.setItem(`workflow_session_${this.sessionId}`, JSON.stringify(session));
      localStorage.setItem('current_session_id', this.sessionId);
    } catch (error) {
      console.warn('Failed to save session state:', error);
    }
  }

  private loadSessionState(): ConversationState | null {
    if (!this.enablePersistence) return null;

    try {
      const currentSessionId = localStorage.getItem('current_session_id');
      if (!currentSessionId) return null;

      const sessionData = localStorage.getItem(`workflow_session_${currentSessionId}`);
      if (!sessionData) return null;

      const session: WorkflowSession = JSON.parse(sessionData);
      this.sessionId = session.id;
      
      return session.conversationState;
    } catch (error) {
      console.warn('Failed to load session state:', error);
      return null;
    }
  }

  private getCurrentAgent(): string {
    switch (this.conversationState.phase) {
      case 'input':
      case 'clarification':
        return 'input';
      case 'planning':
        return 'planner';
      case 'review':
        return 'builder';
      case 'complete':
        return 'ai_expert';
      default:
        return 'unknown';
    }
  }

  // Public methods for external access
  getConversationState(): ConversationState {
    return { ...this.conversationState };
  }

  setGroqApiKey(apiKey: string): void {
    this.aiAgent = new GroqAIAgent({ apiKey });
    
    try {
      localStorage.setItem('groq_api_key', apiKey);
    } catch (error) {
      console.warn('Failed to save API key:', error);
    }
  }

  clearSession(): void {
    this.conversationState = {
      phase: 'input',
      messages: [],
      currentPlan: null,
      needsInput: true,
      parsedRequest: undefined,
      pendingQuestions: []
    };

    this.aiAgent.clearConversationHistory();
    this.sessionId = this.generateSessionId();
    
    try {
      localStorage.removeItem(`workflow_session_${this.sessionId}`);
      localStorage.removeItem('current_session_id');
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }

  getSessionInfo(): { sessionId: string; messageCount: number; currentPhase: string; hasApiKey: boolean } {
    return {
      sessionId: this.sessionId,
      messageCount: this.conversationState.messages.length,
      currentPhase: this.conversationState.phase,
      hasApiKey: this.aiAgent.isConfigured()
    };
  }

  getCatalogAgent(): MockCatalogAgent {
    return this.catalogAgent;
  }

  getPlanningAgent(): PlanningAgent {
    return this.planningAgent;
  }

  getInputAgent(): InputAgent {
    return this.inputAgent;
  }
}