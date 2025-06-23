
import { AgentResponse, ProjectSpecs, Blueprint, BuildPlan, ParsedRequest, Question, ConversationState, MaterialCalculation, EnhancedBlueprint } from '../types';
import { WorkflowEngine } from './WorkflowEngine';

class AgentService {
  private workflowEngine: WorkflowEngine;
  private projectSpecs: Partial<ProjectSpecs> = {};

  constructor() {
    this.workflowEngine = new WorkflowEngine({
      enablePersistence: true
    });
  }

  async processUserMessage(message: string, context?: any): Promise<AgentResponse> {
    console.log('Processing message:', message);
    
    try {
      // Use the enhanced workflow engine to process the message
      return await this.workflowEngine.processMessage(message, context);
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
    return this.workflowEngine.getConversationState();
  }

  // Set Groq API key for AI functionality
  setGroqApiKey(apiKey: string): void {
    this.workflowEngine.setGroqApiKey(apiKey);
  }

  // Get session information
  getSessionInfo() {
    return this.workflowEngine.getSessionInfo();
  }

  // Clear current session
  clearSession(): void {
    this.workflowEngine.clearSession();
  }

  // Get catalog agent for direct access
  getCatalogAgent() {
    return this.workflowEngine.getCatalogAgent();
  }

  // Get planning agent for direct access
  getPlanningAgent() {
    return this.workflowEngine.getPlanningAgent();
  }

  // Get input agent for direct access
  getInputAgent() {
    return this.workflowEngine.getInputAgent();
  }

  // Get available build templates
  getAvailableTemplates() {
    return this.workflowEngine.getPlanningAgent().getAvailableTemplates();
  }

  // Get difficulty assessment for a project
  getDifficultyAssessment(buildType: string, experienceLevel: string) {
    return this.workflowEngine.getPlanningAgent().getDifficultyAssessment(buildType, experienceLevel);
  }

  // Get material alternatives for a specific material
  getMaterialAlternatives(materialId: string) {
    return this.workflowEngine.getCatalogAgent().getAlternatives(materialId);
  }

  // Search materials by query
  searchMaterials(query: string) {
    return this.workflowEngine.getCatalogAgent().searchMaterials(query);
  }

  // Get catalog statistics
  getCatalogStats() {
    return this.workflowEngine.getCatalogAgent().getCatalogStats();
  }

  resetSession(): void {
    this.workflowEngine.clearSession();
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
