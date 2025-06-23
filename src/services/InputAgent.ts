import { ParsedRequest, Question } from '../types';

export class InputAgent {
  parsePrompt(userInput: string): ParsedRequest {
    const lowerInput = userInput.toLowerCase();
    
    return {
      buildType: this.extractBuildType(lowerInput),
      dimensions: this.extractDimensions(userInput),
      materials: this.extractMaterialPreferences(lowerInput),
      constraints: this.extractConstraints(lowerInput),
      confidence: this.calculateParsingConfidence(userInput, lowerInput),
      urgency: this.extractUrgency(lowerInput),
      budget: this.extractBudget(userInput),
      experience: this.extractExperience(lowerInput)
    };
  }

  generateClarifyingQuestions(parsed: ParsedRequest): Question[] {
    const questions: Question[] = [];
    
    // High priority questions first
    if (!this.hasDimensions(parsed.dimensions)) {
      questions.push({
        type: 'dimensions',
        text: 'What are the dimensions you need? Please specify length, width, and height in meters (e.g., "2m x 1.5m x 0.8m").',
        required: true,
        suggestions: this.getDimensionSuggestions(parsed.buildType)
      });
    }
    
    if (parsed.confidence < 0.7 && parsed.buildType === 'unknown') {
      questions.push({
        type: 'clarification',
        text: `I want to make sure I understand correctly. Can you describe what you want to build in more detail?`,
        required: true,
        suggestions: ['Garden wall', 'Pizza oven', 'Fire pit', 'Foundation', 'Retaining wall']
      });
    }
    
    if (!parsed.experience) {
      questions.push({
        type: 'experience',
        text: 'What\'s your experience level with construction projects?',
        required: false,
        suggestions: ['Beginner - First time building', 'Intermediate - Some experience', 'Expert - Very experienced']
      });
    }
    
    if (!parsed.budget && parsed.confidence > 0.6) {
      questions.push({
        type: 'budget',
        text: 'Do you have a budget range in mind for this project?',
        required: false,
        suggestions: ['Under €500', '€500-€1000', '€1000-€2000', 'Over €2000']
      });
    }
    
    // Return max 2 questions to avoid overwhelming the user
    return questions.slice(0, 2);
  }

  private extractBuildType(lowerInput: string): ParsedRequest['buildType'] {
    const buildTypes = {
      'pizza oven': 'pizza_oven',
      'oven': 'pizza_oven', 
      'pizza': 'pizza_oven',
      'wall': 'wall',
      'garden wall': 'garden_wall',
      'retaining wall': 'wall',
      'brick wall': 'wall',
      'fire pit': 'fire_pit',
      'firepit': 'fire_pit',
      'foundation': 'foundation',
      'base': 'foundation',
      'structure': 'structure',
      'building': 'structure',
      'shed': 'structure'
    };

    for (const [keyword, type] of Object.entries(buildTypes)) {
      if (lowerInput.includes(keyword)) {
        return type as ParsedRequest['buildType'];
      }
    }
    
    return 'unknown';
  }

  private extractDimensions(input: string): ParsedRequest['dimensions'] {
    const dimensions: ParsedRequest['dimensions'] = {};
    
    // Look for patterns like "2m x 1.5m", "3 meter by 2 meter", "1.5m wide"
    const patterns = [
      // "2m x 1.5m x 0.8m" or "2 x 1.5 x 0.8"
      /(\d+(?:\.\d+)?)\s*(?:m|meter|metres?)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:m|meter|metres?)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:m|meter|metres?)?/i,
      // "2m x 1.5m" or "2 x 1.5"
      /(\d+(?:\.\d+)?)\s*(?:m|meter|metres?)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:m|meter|metres?)?/i,
      // "2m wide", "1.5m high", "3m long"
      /(\d+(?:\.\d+)?)\s*(?:m|meter|metres?)?\s*(?:wide|width)/i,
      /(\d+(?:\.\d+)?)\s*(?:m|meter|metres?)?\s*(?:high|height|tall)/i,
      /(\d+(?:\.\d+)?)\s*(?:m|meter|metres?)?\s*(?:long|length)/i,
      // Diameter for circular structures
      /(\d+(?:\.\d+)?)\s*(?:m|meter|metres?)?\s*(?:diameter|across)/i
    ];

    const input_lower = input.toLowerCase();
    
    // Try to match 3D dimensions first
    const match3D = input.match(patterns[0]);
    if (match3D) {
      dimensions.length = parseFloat(match3D[1]);
      dimensions.width = parseFloat(match3D[2]);
      dimensions.height = parseFloat(match3D[3]);
      return dimensions;
    }
    
    // Try to match 2D dimensions
    const match2D = input.match(patterns[1]);
    if (match2D) {
      dimensions.length = parseFloat(match2D[1]);
      dimensions.width = parseFloat(match2D[2]);
      return dimensions;
    }
    
    // Try individual dimension patterns
    const widthMatch = input_lower.match(patterns[2]);
    if (widthMatch) dimensions.width = parseFloat(widthMatch[1]);
    
    const heightMatch = input_lower.match(patterns[3]);
    if (heightMatch) dimensions.height = parseFloat(heightMatch[1]);
    
    const lengthMatch = input_lower.match(patterns[4]);
    if (lengthMatch) dimensions.length = parseFloat(lengthMatch[1]);
    
    const diameterMatch = input_lower.match(patterns[5]);
    if (diameterMatch) dimensions.diameter = parseFloat(diameterMatch[1]);
    
    return dimensions;
  }

  private extractMaterialPreferences(lowerInput: string): string[] {
    const materials: string[] = [];
    const materialKeywords = {
      'brick': ['brick', 'bricks'],
      'firebrick': ['firebrick', 'fire brick', 'refractory brick'],
      'concrete': ['concrete', 'cement'],
      'mortar': ['mortar', 'cement mortar'],
      'stone': ['stone', 'natural stone'],
      'clay': ['clay', 'clay brick']
    };

    for (const [material, keywords] of Object.entries(materialKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        materials.push(material);
      }
    }
    
    return materials;
  }

  private extractConstraints(lowerInput: string): string[] {
    const constraints: string[] = [];
    const constraintKeywords = {
      'budget': ['cheap', 'budget', 'affordable', 'low cost'],
      'time': ['quick', 'fast', 'urgent', 'asap'],
      'space': ['small space', 'limited space', 'compact'],
      'weather': ['outdoor', 'weatherproof', 'rain resistant'],
      'insulation': ['insulated', 'insulation', 'heat resistant']
    };

    for (const [constraint, keywords] of Object.entries(constraintKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        constraints.push(constraint);
      }
    }
    
    return constraints;
  }

  private extractUrgency(lowerInput: string): ParsedRequest['urgency'] {
    if (['urgent', 'asap', 'quickly', 'fast', 'rush'].some(word => lowerInput.includes(word))) {
      return 'high';
    }
    if (['soon', 'next week', 'this month'].some(phrase => lowerInput.includes(phrase))) {
      return 'medium';
    }
    return 'low';
  }

  private extractBudget(input: string): number | undefined {
    const budgetPatterns = [
      /€(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*€/,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*euro/i
    ];

    for (const pattern of budgetPatterns) {
      const match = input.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(',', ''));
      }
    }
    
    return undefined;
  }

  private extractExperience(lowerInput: string): ParsedRequest['experience'] {
    if (['beginner', 'first time', 'never built', 'new to'].some(phrase => lowerInput.includes(phrase))) {
      return 'beginner';
    }
    if (['expert', 'professional', 'experienced', 'many times'].some(phrase => lowerInput.includes(phrase))) {
      return 'expert';
    }
    if (['some experience', 'intermediate', 'few times'].some(phrase => lowerInput.includes(phrase))) {
      return 'intermediate';
    }
    return undefined;
  }

  private calculateParsingConfidence(original: string, lowerInput: string): number {
    let confidence = 0.0;
    
    // Base confidence from build type detection
    if (lowerInput.includes('pizza oven') || lowerInput.includes('oven')) confidence += 0.4;
    else if (['wall', 'foundation', 'fire pit', 'structure'].some(type => lowerInput.includes(type))) confidence += 0.3;
    else if (['build', 'construct', 'make'].some(verb => lowerInput.includes(verb))) confidence += 0.1;
    
    // Boost confidence for dimensions
    if (this.hasDimensions(this.extractDimensions(original))) confidence += 0.3;
    
    // Boost for material mentions
    if (this.extractMaterialPreferences(lowerInput).length > 0) confidence += 0.2;
    
    // Boost for detailed descriptions
    if (original.length > 50) confidence += 0.1;
    if (original.split(' ').length > 10) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private hasDimensions(dimensions: ParsedRequest['dimensions']): boolean {
    return !!(dimensions.length || dimensions.width || dimensions.height || dimensions.diameter);
  }

  private getDimensionSuggestions(buildType: ParsedRequest['buildType']): string[] {
    const suggestions = {
      'pizza_oven': ['1m x 1m x 0.5m', '1.2m x 1.2m x 0.6m', '80cm x 80cm x 40cm'],
      'wall': ['3m x 2m x 0.2m', '5m x 1.5m x 0.15m', '2m x 1m x 0.1m'],
      'garden_wall': ['2m x 1m x 0.2m', '4m x 1.2m x 0.15m', '1.5m x 0.8m x 0.1m'],
      'fire_pit': ['1m diameter x 0.3m high', '1.2m diameter x 0.4m high', '80cm diameter x 25cm high'],
      'foundation': ['3m x 3m x 0.3m', '4m x 2m x 0.4m', '2m x 2m x 0.25m'],
      'structure': ['2m x 2m x 2m', '3m x 2m x 2.5m', '1.5m x 1.5m x 2m']
    };
    
    return suggestions[buildType] || ['Please specify your dimensions'];
  }
}