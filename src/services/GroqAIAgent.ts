import Groq from 'groq-sdk';
import { ChatMessage, ParsedRequest, EnhancedBlueprint, MaterialCalculation } from '../types';

interface GroqAIAgentConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

interface AIAnalysisResult {
  materialOptimization: {
    suggestedAlternatives: string[];
    costSavings: number;
    qualityImprovements: string[];
  };
  constructionAdvice: {
    expertTips: string[];
    safetyWarnings: string[];
    difficultyAssessment: string;
  };
  projectAnalysis: {
    complexityRating: number;
    timeOptimization: string[];
    riskFactors: string[];
  };
  response: string;
}

export class GroqAIAgent {
  private groq: Groq | null = null;
  private model: string;
  private maxTokens: number;
  private conversationHistory: { role: string; content: string }[] = [];

  constructor(config: GroqAIAgentConfig) {
    this.model = config.model || 'llama-3.3-70b-versatile';
    this.maxTokens = config.maxTokens || 4096;
    
    if (config.apiKey && config.apiKey !== 'your_groq_api_key_here') {
      try {
        this.groq = new Groq({
          apiKey: config.apiKey,
          dangerouslyAllowBrowser: true
        });
      } catch (error) {
        console.warn('Groq initialization failed:', error);
        this.groq = null;
      }
    }
  }

  async analyzeProject(
    parsedRequest: ParsedRequest,
    blueprint: EnhancedBlueprint | null,
    materials: MaterialCalculation | null,
    conversationContext: ChatMessage[]
  ): Promise<AIAnalysisResult> {
    if (!this.groq) {
      return this.generateFallbackAnalysis(parsedRequest, blueprint, materials);
    }

    try {
      const systemPrompt = this.createSystemPrompt();
      const userPrompt = this.createAnalysisPrompt(parsedRequest, blueprint, materials, conversationContext);

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory,
          { role: 'user', content: userPrompt }
        ],
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.7,
        top_p: 0.9,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: response }
      );

      // Keep conversation history manageable
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return this.parseAIResponse(response, parsedRequest, blueprint, materials);
    } catch (error) {
      console.error('Groq AI analysis failed:', error);
      return this.generateFallbackAnalysis(parsedRequest, blueprint, materials);
    }
  }

  async provideExpertAdvice(
    question: string,
    context: {
      parsedRequest?: ParsedRequest;
      blueprint?: EnhancedBlueprint;
      materials?: MaterialCalculation;
    }
  ): Promise<string> {
    if (!this.groq) {
      return this.generateFallbackAdvice(question, context);
    }

    try {
      const systemPrompt = this.createExpertAdvicePrompt();
      const contextualPrompt = this.createContextualPrompt(question, context);

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory.slice(-10), // Last 10 messages for context
          { role: 'user', content: contextualPrompt }
        ],
        model: this.model,
        max_tokens: 2048,
        temperature: 0.6,
        top_p: 0.9,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: contextualPrompt },
        { role: 'assistant', content: response }
      );

      return response;
    } catch (error) {
      console.error('Groq expert advice failed:', error);
      return this.generateFallbackAdvice(question, context);
    }
  }

  private createSystemPrompt(): string {
    return `You are an expert construction AI assistant that replaces SAP Joule for the MultiBuildAgent system. You are specialized in:

1. MATERIAL OPTIMIZATION: Analyzing material lists, suggesting cost-effective alternatives, and identifying quality improvements
2. CONSTRUCTION EXPERTISE: Providing professional construction advice, safety guidelines, and best practices
3. PROJECT ANALYSIS: Assessing project complexity, identifying risk factors, and suggesting optimizations
4. COST OPTIMIZATION: Finding ways to reduce costs while maintaining quality and safety
5. TROUBLESHOOTING: Helping solve construction problems and providing preventive advice

RESPONSE FORMAT: Provide structured analysis with specific sections for material optimization, construction advice, and project analysis. Always prioritize safety and practicality.

EXPERTISE AREAS:
- Masonry and bricklaying
- Foundation work
- Pizza oven construction
- Garden walls and structures
- Material compatibility and alternatives
- Construction safety and regulations
- Project time estimation
- Cost analysis and optimization

Always provide actionable, practical advice that considers the user's experience level and project requirements.`;
  }

  private createAnalysisPrompt(
    parsedRequest: ParsedRequest,
    blueprint: EnhancedBlueprint | null,
    materials: MaterialCalculation | null,
    conversationContext: ChatMessage[]
  ): string {
    let prompt = `CONSTRUCTION PROJECT ANALYSIS REQUEST

PROJECT DETAILS:
- Build Type: ${parsedRequest.buildType.replace('_', ' ')}
- Experience Level: ${parsedRequest.experience || 'Not specified'}
- Dimensions: ${JSON.stringify(parsedRequest.dimensions)}
- Materials Preferences: ${parsedRequest.materials.join(', ') || 'None specified'}
- Constraints: ${parsedRequest.constraints.join(', ') || 'None specified'}
- Budget: ${parsedRequest.budget ? `€${parsedRequest.budget}` : 'Not specified'}
- Urgency: ${parsedRequest.urgency || 'Not specified'}

`;

    if (blueprint) {
      prompt += `CURRENT BLUEPRINT:
- Difficulty: ${blueprint.difficulty}
- Estimated Time: ${blueprint.estimatedTime}
- Total Cost: €${blueprint.totalCost.toFixed(2)}
- Phases: ${blueprint.phases.length}
- Safety Guidelines: ${blueprint.safetyGuidelines.length}

`;
    }

    if (materials) {
      prompt += `MATERIAL ANALYSIS:
- Total Materials: ${materials.materials.length}
- Total Cost: €${materials.totalCost.toFixed(2)}
- Build Type: ${materials.buildType}
- Waste Factor: ${materials.wasteFactorApplied}
- Delivery Time: ${materials.deliveryTime}

KEY MATERIALS:
${materials.materials.slice(0, 5).map(m => 
  `- ${m.material.name}: ${m.quantity} ${m.material.unit} @ €${m.material.price} each (Total: €${m.totalCost.toFixed(2)})`
).join('\n')}

`;
    }

    prompt += `ANALYSIS REQUEST:
Please provide a comprehensive analysis focusing on:

1. MATERIAL OPTIMIZATION:
   - Alternative materials that could reduce costs
   - Quality improvements possible within budget
   - Compatibility issues or recommendations

2. CONSTRUCTION ADVICE:
   - Expert tips specific to this project type
   - Safety warnings based on difficulty level
   - Difficulty assessment for the user's experience level

3. PROJECT ANALYSIS:
   - Complexity rating (1-10)
   - Time optimization opportunities
   - Risk factors to consider

Provide specific, actionable recommendations.`;

    return prompt;
  }

  private createExpertAdvicePrompt(): string {
    return `You are an expert construction advisor providing specific, practical advice for construction projects. Focus on:

1. SAFETY FIRST: Always prioritize safety in your recommendations
2. PRACTICAL SOLUTIONS: Provide actionable, real-world advice
3. EXPERIENCE-APPROPRIATE: Tailor advice to the user's skill level
4. COST-CONSCIOUS: Consider budget implications
5. QUALITY FOCUS: Maintain high construction standards

Provide clear, concise answers that a builder can immediately act upon.`;
  }

  private createContextualPrompt(
    question: string,
    context: {
      parsedRequest?: ParsedRequest;
      blueprint?: EnhancedBlueprint;
      materials?: MaterialCalculation;
    }
  ): string {
    let prompt = `EXPERT ADVICE REQUEST: ${question}

`;

    if (context.parsedRequest) {
      prompt += `PROJECT CONTEXT:
- Building: ${context.parsedRequest.buildType.replace('_', ' ')}
- Experience: ${context.parsedRequest.experience || 'Not specified'}
- Budget: ${context.parsedRequest.budget ? `€${context.parsedRequest.budget}` : 'Not specified'}

`;
    }

    if (context.blueprint) {
      prompt += `CURRENT PLAN:
- Difficulty: ${context.blueprint.difficulty}
- Duration: ${context.blueprint.estimatedTime}
- Cost: €${context.blueprint.totalCost.toFixed(2)}

`;
    }

    prompt += `Please provide expert advice addressing this question specifically.`;

    return prompt;
  }

  private parseAIResponse(
    response: string,
    parsedRequest: ParsedRequest,
    blueprint: EnhancedBlueprint | null,
    materials: MaterialCalculation | null
  ): AIAnalysisResult {
    // Extract structured information from AI response
    // This is a simplified parsing - you could make it more sophisticated
    
    const suggestedAlternatives = this.extractAlternatives(response);
    const expertTips = this.extractTips(response);
    const safetyWarnings = this.extractSafetyWarnings(response);
    const complexityRating = this.extractComplexityRating(response);
    const costSavings = this.calculatePotentialSavings(response, materials);

    return {
      materialOptimization: {
        suggestedAlternatives,
        costSavings,
        qualityImprovements: this.extractQualityImprovements(response)
      },
      constructionAdvice: {
        expertTips,
        safetyWarnings,
        difficultyAssessment: this.extractDifficultyAssessment(response)
      },
      projectAnalysis: {
        complexityRating,
        timeOptimization: this.extractTimeOptimizations(response),
        riskFactors: this.extractRiskFactors(response)
      },
      response
    };
  }

  private extractAlternatives(response: string): string[] {
    const alternatives: string[] = [];
    const lines = response.split('\n');
    let inAlternativesSection = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('alternative') || line.toLowerCase().includes('substitute')) {
        inAlternativesSection = true;
      }
      if (inAlternativesSection && line.trim().startsWith('-')) {
        alternatives.push(line.replace(/^-\s*/, '').trim());
      }
      if (line.trim() === '' && inAlternativesSection) {
        inAlternativesSection = false;
      }
    }

    return alternatives.slice(0, 5); // Limit to 5 alternatives
  }

  private extractTips(response: string): string[] {
    const tips: string[] = [];
    const lines = response.split('\n');
    let inTipsSection = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('tip') || line.toLowerCase().includes('advice') || line.toLowerCase().includes('recommend')) {
        inTipsSection = true;
      }
      if (inTipsSection && line.trim().startsWith('-')) {
        tips.push(line.replace(/^-\s*/, '').trim());
      }
      if (line.trim() === '' && inTipsSection) {
        inTipsSection = false;
      }
    }

    return tips.slice(0, 5); // Limit to 5 tips
  }

  private extractSafetyWarnings(response: string): string[] {
    const warnings: string[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('safety') || line.toLowerCase().includes('warning') || line.toLowerCase().includes('caution')) {
        warnings.push(line.trim());
      }
    }

    return warnings.slice(0, 3); // Limit to 3 warnings
  }

  private extractComplexityRating(response: string): number {
    const complexityMatch = response.match(/complexity.*?(\d+)/i);
    if (complexityMatch) {
      return parseInt(complexityMatch[1], 10);
    }
    return 5; // Default medium complexity
  }

  private calculatePotentialSavings(response: string, materials: MaterialCalculation | null): number {
    if (!materials) return 0;
    
    // Look for cost savings mentions in the response
    const savingsMatch = response.match(/save.*?€?(\d+)/i);
    if (savingsMatch) {
      return parseInt(savingsMatch[1], 10);
    }
    
    // Estimate 5-15% savings potential
    return Math.round(materials.totalCost * 0.1);
  }

  private extractQualityImprovements(response: string): string[] {
    const improvements: string[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('quality') || line.toLowerCase().includes('improve') || line.toLowerCase().includes('better')) {
        improvements.push(line.trim());
      }
    }

    return improvements.slice(0, 3); // Limit to 3 improvements
  }

  private extractDifficultyAssessment(response: string): string {
    const difficultyMatch = response.match(/difficulty.*?(beginner|intermediate|advanced|expert)/i);
    if (difficultyMatch) {
      return difficultyMatch[1];
    }
    return 'Suitable for your experience level';
  }

  private extractTimeOptimizations(response: string): string[] {
    const optimizations: string[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('time') || line.toLowerCase().includes('faster') || line.toLowerCase().includes('quicker')) {
        optimizations.push(line.trim());
      }
    }

    return optimizations.slice(0, 3); // Limit to 3 optimizations
  }

  private extractRiskFactors(response: string): string[] {
    const risks: string[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('risk') || line.toLowerCase().includes('problem') || line.toLowerCase().includes('issue')) {
        risks.push(line.trim());
      }
    }

    return risks.slice(0, 3); // Limit to 3 risk factors
  }

  private generateFallbackAnalysis(
    parsedRequest: ParsedRequest,
    blueprint: EnhancedBlueprint | null,
    materials: MaterialCalculation | null
  ): AIAnalysisResult {
    return {
      materialOptimization: {
        suggestedAlternatives: [
          'Consider local suppliers for better pricing',
          'Buy materials in bulk for discounts',
          'Check for seasonal sales on construction materials'
        ],
        costSavings: materials ? Math.round(materials.totalCost * 0.05) : 0,
        qualityImprovements: [
          'Use weather-resistant materials for outdoor projects',
          'Consider premium options for high-stress areas'
        ]
      },
      constructionAdvice: {
        expertTips: [
          'Take your time with measurements and planning',
          'Always check local building codes before starting',
          'Consider weather conditions when scheduling work'
        ],
        safetyWarnings: [
          'Wear appropriate safety equipment',
          'Check for underground utilities before digging',
          'Ensure proper ventilation when using chemicals'
        ],
        difficultyAssessment: `This project is suitable for ${parsedRequest.experience || 'your'} level`
      },
      projectAnalysis: {
        complexityRating: 5,
        timeOptimization: [
          'Prepare all materials in advance',
          'Work during optimal weather conditions',
          'Consider working in phases'
        ],
        riskFactors: [
          'Weather delays may extend timeline',
          'Material availability may vary',
          'Skill level may affect completion time'
        ]
      },
      response: `I've analyzed your ${parsedRequest.buildType.replace('_', ' ')} project. While AI analysis is currently limited, I recommend focusing on proper planning, safety, and quality materials. Consider consulting with local professionals for complex aspects of your build.`
    };
  }

  private generateFallbackAdvice(
    question: string,
    context: {
      parsedRequest?: ParsedRequest;
      blueprint?: EnhancedBlueprint;
      materials?: MaterialCalculation;
    }
  ): string {
    return `I understand your question about "${question}". While AI assistance is currently limited, here are some general recommendations:

1. **Safety First**: Always prioritize safety in your construction project
2. **Professional Consultation**: Consider consulting with local professionals for specific technical questions
3. **Quality Materials**: Use appropriate materials for your project type and local conditions
4. **Proper Planning**: Take time to plan each phase carefully
5. **Building Codes**: Check local building codes and regulations

For detailed technical advice specific to your project, I recommend consulting with local construction professionals or building supply experts.`;
  }

  clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  isConfigured(): boolean {
    return this.groq !== null;
  }
}