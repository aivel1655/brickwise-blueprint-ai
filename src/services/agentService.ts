

import { AgentResponse, ProjectSpecs, Blueprint, BuildPlan, ParsedRequest, Question, ConversationState, MaterialCalculation, EnhancedBlueprint } from '../types';
import { WorkflowEngine } from './WorkflowEngine';

class AgentService {
  private workflowEngine: WorkflowEngine;
  private projectSpecs: Partial<ProjectSpecs> = {};

  constructor() {
    this.workflowEngine = new WorkflowEngine();
  }

  async processUserMessage(message: string, context?: any): Promise<AgentResponse> {
    console.log('Processing message:', message);
    
    try {
      // Use the enhanced workflow engine to process the message
      const result = await this.workflowEngine.processMessage(message);
      
      return {
        agent: 'workflow',
        message: result.response,
        data: {
          blueprint: result.blueprint,
          materials: result.materials,
          phase: result.phase,
          aiAnalysis: result.aiAnalysis
        }
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        agent: 'system',
        message: 'Sorry, I encountered an error processing your request. Please try again or rephrase your question.',
        data: { error: true }
      };
    }
  }

  // Public methods for conversation management
  getConversationState(): ConversationState {
    const state = this.workflowEngine.getCurrentState();
    return {
      phase: state.phase === 'input' ? 'input' : 
             state.phase === 'planning' ? 'planning' : 
             state.phase === 'materials' ? 'review' : 'complete',
      messages: state.conversationHistory,
      currentPlan: null, // Legacy compatibility
      needsInput: state.phase === 'input',
      parsedRequest: state.parsedRequest || undefined,
      pendingQuestions: []
    };
  }

  // Set Groq API key for AI functionality
  setGroqApiKey(apiKey: string): void {
    this.workflowEngine.updateApiKey(apiKey);
  }

  // Get session information
  getSessionInfo() {
    return this.workflowEngine.getStatus();
  }

  // Clear current session
  clearSession(): void {
    this.workflowEngine.resetSession();
  }

  // Legacy methods for backward compatibility
  getCatalogAgent() {
    return null; // Not directly accessible in new architecture
  }

  getPlanningAgent() {
    return null; // Not directly accessible in new architecture
  }

  getInputAgent() {
    return null; // Not directly accessible in new architecture
  }

  getAvailableTemplates() {
    return []; // Would need to be implemented if needed
  }

  getDifficultyAssessment(buildType: string, experienceLevel: string) {
    return 'intermediate'; // Would need to be implemented if needed
  }

  getMaterialAlternatives(materialId: string) {
    return []; // Would need to be implemented if needed
  }

  searchMaterials(query: string) {
    return []; // Would need to be implemented if needed
  }

  getCatalogStats() {
    return {}; // Would need to be implemented if needed
  }

  resetSession(): void {
    this.workflowEngine.resetSession();
    this.projectSpecs = {};
  }

  // Legacy method for backward compatibility - now simplified
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
}

export const agentService = new AgentService();

