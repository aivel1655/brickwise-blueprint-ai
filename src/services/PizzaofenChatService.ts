import { PizzaofenAgents, RequirementsInput, ShoppingList } from './PizzaofenAgents';
import { ChatMessage } from '../types';

interface PizzaofenChatState {
  phase: 'requirements' | 'calculation' | 'image_generation' | 'summary' | 'complete';
  currentAgent: 'requirements' | 'calculation' | 'image' | 'summary';
  requirements: Partial<RequirementsInput>;
  result: ShoppingList | null;
  conversationHistory: ChatMessage[];
}

export class PizzaofenChatService {
  private state: PizzaofenChatState = {
    phase: 'requirements',
    currentAgent: 'requirements',
    requirements: {},
    result: null,
    conversationHistory: []
  };

  private agents = PizzaofenAgents;

  async processMessage(userMessage: string): Promise<ChatMessage> {
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    this.state.conversationHistory.push(userChatMessage);

    let agentResponse: ChatMessage;

    switch (this.state.phase) {
      case 'requirements':
        agentResponse = await this.handleRequirementsPhase(userMessage);
        break;
      case 'calculation':
        agentResponse = await this.handleCalculationPhase();
        break;
      case 'image_generation':
        agentResponse = await this.handleImagePhase();
        break;
      case 'summary':
        agentResponse = await this.handleSummaryPhase();
        break;
      default:
        agentResponse = this.createWelcomeMessage();
    }

    this.state.conversationHistory.push(agentResponse);
    return agentResponse;
  }
  private async handleRequirementsPhase(userMessage: string): Promise<ChatMessage> {
    const lowerMessage = userMessage.toLowerCase();

    // Extrahiere Fläche aus der Nachricht
    const areaMatch = userMessage.match(/(\d+(?:\.\d+)?)\s*(?:qm|quadratmeter|m²|sqm)/i);
    if (areaMatch) {
      this.state.requirements.area_sqm = parseFloat(areaMatch[1]);
    }

    // Extrahiere Qualitätsoption
    if (lowerMessage.includes('günstig') || lowerMessage.includes('budget') || lowerMessage.includes('billig')) {
      this.state.requirements.quality_option = 'günstig';
    } else if (lowerMessage.includes('schnell') || lowerMessage.includes('express') || lowerMessage.includes('fix')) {
      this.state.requirements.quality_option = 'schnell';
    } else if (lowerMessage.includes('premium') || lowerMessage.includes('luxus') || lowerMessage.includes('hochwertig')) {
      this.state.requirements.quality_option = 'premium';
    }

    // Prüfe ob alle Anforderungen erfüllt sind
    if (this.state.requirements.area_sqm && this.state.requirements.quality_option) {
      this.state.phase = 'calculation';
      this.state.currentAgent = 'calculation';
      
      return {
        id: `requirements-${Date.now()}`,
        type: 'agent',
        agent: 'requirements',
        content: `✅ **RequirementsAgent**: Perfekt! Ich habe Ihre Anforderungen erfasst:

📏 **Fläche**: ${this.state.requirements.area_sqm} qm
⚡ **Qualität**: ${this.state.requirements.quality_option}

Alle Anforderungen sind validiert und erfüllen unsere Spezifikationen (1.2-2.5 qm). 

Ich übergebe jetzt an den **CalculationAgent** für die Materialberechnung...`,
        timestamp: new Date(),
        data: { 
          readyForPlanning: true,
          requirements: this.state.requirements
        }
      };
    } else {
      // Noch nicht alle Anforderungen erfüllt
      const missingInfo = [];
      if (!this.state.requirements.area_sqm) {
        missingInfo.push('Fläche in Quadratmetern (z.B. "1.5 qm")');
      }
      if (!this.state.requirements.quality_option) {
        missingInfo.push('Qualitätsstufe (günstig, schnell oder premium)');
      }

      return {
        id: `requirements-${Date.now()}`,
        type: 'agent',
        agent: 'requirements',
        content: `🤖 **RequirementsAgent**: Ich sammle Ihre Anforderungen für den Pizzaofen.

${this.state.requirements.area_sqm ? `✅ Fläche: ${this.state.requirements.area_sqm} qm` : ''}
${this.state.requirements.quality_option ? `✅ Qualität: ${this.state.requirements.quality_option}` : ''}

Noch benötigt: **${missingInfo.join(' und ')}**

Beispiel: "Ich möchte einen 1.8 qm großen Pizzaofen in premium Qualität"`,
        timestamp: new Date(),
        data: { 
          needsMoreInfo: true,
          suggestions: [
            '1.5 qm Pizzaofen günstig',
            '2.0 qm Pizzaofen schnell', 
            '1.2 qm Pizzaofen premium'
          ]
        }
      };
    }
  }
  private async handleCalculationPhase(): Promise<ChatMessage> {
    try {
      const calculationAgent = new this.agents.CalculationAgent();
      const requirementsAgent = new this.agents.RequirementsAgent();
      const requirements = requirementsAgent.validateRequirements(this.state.requirements);
      const calculation = calculationAgent.calculateMaterials(requirements);

      this.state.phase = 'image_generation';
      this.state.currentAgent = 'image';

      return {
        id: `calculation-${Date.now()}`,
        type: 'agent',
        agent: 'calculation',
        content: `💰 **CalculationAgent**: Materialberechnung abgeschlossen!

**Gesamtkosten**: €${calculation.total_cost.toFixed(2)}

**Benötigte Materialien**:
${calculation.components.map(comp => 
  `• ${comp.name}: ${comp.amount} Stück à €${comp.price_per_unit.toFixed(2)} = €${comp.total_price.toFixed(2)}`
).join('\n')}

Die Mengen wurden automatisch an Ihre gewünschte Fläche von ${this.state.requirements.area_sqm} qm angepasst.

Übergabe an **ImageAgent** für die Visualisierung...`,
        timestamp: new Date(),
        data: { 
          calculation,
          materials: calculation.components
        }
      };
    } catch (error) {
      return {
        id: `calculation-error-${Date.now()}`,
        type: 'agent',
        agent: 'calculation',
        content: `❌ **CalculationAgent**: Fehler bei der Berechnung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      };
    }
  }
  private async handleImagePhase(): Promise<ChatMessage> {
    try {
      const imageAgent = new this.agents.ImageAgent();
      const calculationAgent = new this.agents.CalculationAgent();
      const requirementsAgent = new this.agents.RequirementsAgent();
      
      const requirements = requirementsAgent.validateRequirements(this.state.requirements);
      const calculation = calculationAgent.calculateMaterials(requirements);
      
      const imagePrompt = imageAgent.generateImagePrompt(requirements, calculation);
      const imageUrl = imageAgent.generateImageUrl(imagePrompt);

      this.state.phase = 'summary';
      this.state.currentAgent = 'summary';

      return {
        id: `image-${Date.now()}`,
        type: 'agent',
        agent: 'image',
        content: `🎨 **ImageAgent**: Bildvisualisierung erstellt!

**Generierter Prompt**:
"${imagePrompt.description}"

**Stil**: ${imagePrompt.style}
**Details**: ${imagePrompt.details.join(', ')}

![Pizzaofen Visualisierung](${imageUrl})

Übergabe an **SummaryAgent** für die finale Einkaufsliste...`,
        timestamp: new Date(),
        data: { 
          imagePrompt,
          imageUrl
        }
      };
    } catch (error) {
      return {
        id: `image-error-${Date.now()}`,
        type: 'agent',
        agent: 'image',
        content: `❌ **ImageAgent**: Fehler bei der Bildgenerierung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      };
    }
  }

  private async handleSummaryPhase(): Promise<ChatMessage> {
    try {
      const result = this.agents.runDemo(this.state.requirements);
      this.state.result = result;
      this.state.phase = 'complete';

      return {
        id: `summary-${Date.now()}`,
        type: 'agent',
        agent: 'summary',
        content: `📋 **SummaryAgent**: Ihre finale Einkaufsliste ist bereit!

🍕 **${result.project}** (${result.quality_option})
💰 **Gesamtkosten**: €${result.total_cost.toFixed(2)}
⏱️ **Geschätzte Bauzeit**: ${result.estimated_build_time}

**Komplette Einkaufsliste**:
${result.components.map(comp => 
  `${comp.amount}x ${comp.name} - €${comp.total_price.toFixed(2)}`
).join('\n')}

✅ **Alle vier Agenten haben erfolgreich zusammengearbeitet!**

Sie können jetzt:
• Nach Alternativen fragen ("Zeige günstigere Optionen")
• Qualität ändern ("Was kostet premium Qualität?")
• Neue Berechnung starten ("Neuer Pizzaofen mit anderen Maßen")`,
        timestamp: new Date(),
        data: { 
          result,
          blueprint: result,
          complete: true
        }
      };
    } catch (error) {
      return {
        id: `summary-error-${Date.now()}`,
        type: 'agent',
        agent: 'summary',
        content: `❌ **SummaryAgent**: Fehler bei der finalen Zusammenfassung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      };
    }
  }

  private createWelcomeMessage(): ChatMessage {
    return {
      id: `welcome-${Date.now()}`,
      type: 'agent',
      agent: 'requirements',
      content: `🍕 **Willkommen beim Pizzaofen-Konfigurator!**

Ich bin Ihr **RequirementsAgent** und arbeite mit drei weiteren Spezialisten zusammen:

🤖 **RequirementsAgent** (ich): Sammle Ihre Anforderungen
💰 **CalculationAgent**: Berechnet Materialien und Kosten  
🎨 **ImageAgent**: Erstellt Visualisierungen
📋 **SummaryAgent**: Erstellt finale Einkaufsliste

**So starten wir:**
Teilen Sie mir die gewünschte Fläche und Qualitätsstufe mit!

**Beispiele:**
• "Ich möchte einen 1.5 qm Pizzaofen in günstiger Qualität"
• "2.2 qm premium Pizzaofen"
• "Schneller 1.8 qm Ofen"

**Verfügbare Qualitätsstufen:**
🟢 **Günstig** - Budget-freundlich (€100-200)
🟡 **Schnell** - Optimiert für schnelle Fertigstellung (€120-250)  
🟣 **Premium** - Höchste Qualität (€200-400)`,
      timestamp: new Date(),
      data: {
        suggestions: [
          '1.5 qm Pizzaofen günstig',
          '2.0 qm Pizzaofen schnell',
          '1.2 qm Pizzaofen premium'
        ]
      }
    };
  }

  getConversationHistory(): ChatMessage[] {
    return this.state.conversationHistory;
  }

  getCurrentState() {
    return {
      phase: this.state.phase,
      currentAgent: this.state.currentAgent,
      requirements: this.state.requirements,
      result: this.state.result
    };
  }

  reset() {
    this.state = {
      phase: 'requirements',
      currentAgent: 'requirements',
      requirements: {},
      result: null,
      conversationHistory: []
    };
  }

  // Verarbeite alternative Anfragen wenn bereits komplett
  async handleAlternativeRequest(request: string): Promise<ChatMessage> {
    if (this.state.phase !== 'complete') {
      return {
        id: `error-${Date.now()}`,
        type: 'agent',
        agent: 'requirements',
        content: 'Bitte vervollständigen Sie zuerst die Grundkonfiguration.',
        timestamp: new Date()
      };
    }

    const lowerRequest = request.toLowerCase();

    if (lowerRequest.includes('günstig') || lowerRequest.includes('billig') || lowerRequest.includes('cheaper')) {
      // Neue Berechnung mit günstig
      const newRequirements = { ...this.state.requirements, quality_option: 'günstig' as const };
      const result = this.agents.runDemo(newRequirements);

      return {
        id: `alternative-${Date.now()}`,
        type: 'agent',
        agent: 'calculation',
        content: `💰 **Alternative Berechnung - Günstige Option**:

**Neue Kosten**: €${result.total_cost.toFixed(2)} (Ersparnis: €${(this.state.result!.total_cost - result.total_cost).toFixed(2)})

**Angepasste Materialien**:
${result.components.map(comp => 
  `• ${comp.name}: ${comp.amount} Stück à €${comp.price_per_unit.toFixed(2)} = €${comp.total_price.toFixed(2)}`
).join('\n')}`,
        timestamp: new Date(),
        data: { result }
      };
    }

    if (lowerRequest.includes('premium') || lowerRequest.includes('luxus')) {
      const newRequirements = { ...this.state.requirements, quality_option: 'premium' as const };
      const result = this.agents.runDemo(newRequirements);

      return {
        id: `alternative-${Date.now()}`,
        type: 'agent',
        agent: 'calculation',
        content: `⭐ **Alternative Berechnung - Premium Option**:

**Neue Kosten**: €${result.total_cost.toFixed(2)} (Mehrkosten: €${(result.total_cost - this.state.result!.total_cost).toFixed(2)})

**Premium Materialien**:
${result.components.map(comp => 
  `• ${comp.name}: ${comp.amount} Stück à €${comp.price_per_unit.toFixed(2)} = €${comp.total_price.toFixed(2)}`
).join('\n')}`,
        timestamp: new Date(),
        data: { result }
      };
    }

    return {
      id: `help-${Date.now()}`,
      type: 'agent',
      agent: 'summary',
      content: `📋 **SummaryAgent**: Verfügbare Optionen:

• "Zeige günstigere Alternativen"
• "Was kostet premium Qualität?"  
• "Schnelle Variante zeigen"
• "Neuen Pizzaofen konfigurieren"

Oder starten Sie eine neue Konfiguration mit anderen Maßen!`,
      timestamp: new Date(),
      data: {
        suggestions: [
          'Günstigere Alternativen zeigen',
          'Premium Qualität zeigen',
          'Neuen Pizzaofen konfigurieren'
        ]
      }
    };
  }
}
