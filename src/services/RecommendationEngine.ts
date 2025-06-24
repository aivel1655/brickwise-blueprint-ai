
import { EnhancedMaterial, MaterialCalculationItem, ParsedRequest } from '../types';
import { MockCatalogAgent } from './MockCatalogAgent';

interface RecommendationContext {
  buildType: string;
  budget?: number;
  prioritizeQuality?: boolean;
  prioritizeCost?: boolean;
  userExperience?: string;
}

interface MaterialRecommendation {
  original: EnhancedMaterial;
  alternatives: {
    material: EnhancedMaterial;
    reason: string;
    costDifference: number;
    qualityImprovement?: string;
    compatibilityScore: number;
  }[];
}

export class RecommendationEngine {
  private catalogAgent: MockCatalogAgent;

  constructor() {
    this.catalogAgent = new MockCatalogAgent();
  }

  // Main recommendation method
  getRecommendations(
    currentMaterials: MaterialCalculationItem[],
    context: RecommendationContext
  ): MaterialRecommendation[] {
    const recommendations: MaterialRecommendation[] = [];

    for (const item of currentMaterials) {
      const alternatives = this.findAlternatives(item.material, context);
      
      if (alternatives.length > 0) {
        recommendations.push({
          original: item.material,
          alternatives: alternatives.slice(0, 3) // Limit to top 3 alternatives
        });
      }
    }

    return recommendations;
  }

  // Find alternatives for a specific material
  private findAlternatives(
    material: EnhancedMaterial,
    context: RecommendationContext
  ) {
    // Get direct alternatives from catalog
    const directAlternatives = this.catalogAgent.getAlternatives(material.id);
    
    // Get category-based alternatives
    const categoryAlternatives = this.catalogAgent.searchByCategory(material.category)
      .filter(m => m.id !== material.id && m.compatibility.includes(context.buildType));

    // Combine and deduplicate
    const allAlternatives = this.deduplicateAlternatives([
      ...directAlternatives,
      ...categoryAlternatives
    ]);

    // Score and rank alternatives
    return allAlternatives
      .map(alt => this.scoreAlternative(material, alt, context))
      .filter(scored => scored.compatibilityScore > 0.5)
      .sort((a, b) => this.rankAlternatives(a, b, context));
  }

  // Score an alternative material
  private scoreAlternative(
    original: EnhancedMaterial,
    alternative: EnhancedMaterial,
    context: RecommendationContext
  ) {
    const costDifference = alternative.price - original.price;
    const compatibilityScore = this.calculateCompatibilityScore(alternative, context);
    
    let reason = '';
    let qualityImprovement = '';

    // Determine recommendation reason
    if (costDifference < 0) {
      reason = `Save €${Math.abs(costDifference).toFixed(2)} per unit`;
    } else if (costDifference > 0) {
      reason = `Premium option (+€${costDifference.toFixed(2)})`;
      qualityImprovement = this.getQualityImprovement(original, alternative);
    } else {
      reason = 'Same price, different specifications';
    }

    // Add specific benefits
    const benefits = this.getSpecificBenefits(original, alternative, context);
    if (benefits) {
      reason += ` - ${benefits}`;
    }

    return {
      material: alternative,
      reason,
      costDifference,
      qualityImprovement,
      compatibilityScore
    };
  }

  // Calculate how well an alternative fits the build context
  private calculateCompatibilityScore(
    material: EnhancedMaterial,
    context: RecommendationContext
  ): number {
    let score = 0;

    // Base compatibility with build type
    if (material.compatibility.includes(context.buildType)) {
      score += 0.8;
    }

    // Budget considerations
    if (context.budget && context.prioritizeCost) {
      score += material.price < (context.budget * 0.1) ? 0.2 : -0.1;
    }

    // Experience level considerations
    if (context.userExperience === 'beginner' && material.category === 'tool') {
      score += 0.1; // Prefer standard tools for beginners
    }

    // Quality considerations for specific build types
    if (['pizza_oven', 'fire_pit'].includes(context.buildType) && 
        material.specifications?.heatResistance) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  // Rank alternatives based on context priorities
  private rankAlternatives(
    a: any,
    b: any,
    context: RecommendationContext
  ): number {
    if (context.prioritizeCost) {
      return a.costDifference - b.costDifference; // Lower cost first
    }
    
    if (context.prioritizeQuality) {
      return b.compatibilityScore - a.compatibilityScore; // Higher quality first
    }

    // Default: balance cost and compatibility
    const aScore = a.compatibilityScore - (Math.abs(a.costDifference) * 0.01);
    const bScore = b.compatibilityScore - (Math.abs(b.costDifference) * 0.01);
    
    return bScore - aScore;
  }

  // Get quality improvement description
  private getQualityImprovement(
    original: EnhancedMaterial,
    alternative: EnhancedMaterial
  ): string {
    const improvements = [];

    // Compare specifications if available
    if (original.specifications && alternative.specifications) {
      if (alternative.specifications.strength && 
          original.specifications.strength &&
          alternative.specifications.strength > original.specifications.strength) {
        improvements.push('Higher strength');
      }

      if (alternative.specifications.heatResistance && 
          original.specifications.heatResistance &&
          alternative.specifications.heatResistance > original.specifications.heatResistance) {
        improvements.push('Better heat resistance');
      }

      if (alternative.specifications.waterResistance === 'High' && 
          original.specifications.waterResistance !== 'High') {
        improvements.push('Improved water resistance');
      }
    }

    // Check description for quality indicators
    if (alternative.description.toLowerCase().includes('premium')) {
      improvements.push('Premium quality');
    }

    return improvements.join(', ');
  }

  // Get specific benefits of the alternative
  private getSpecificBenefits(
    original: EnhancedMaterial,
    alternative: EnhancedMaterial,
    context: RecommendationContext
  ): string {
    const benefits = [];

    // Lead time benefits
    if (alternative.leadTime && original.leadTime) {
      const altDays = this.extractMaxDays(alternative.leadTime);
      const origDays = this.extractMaxDays(original.leadTime);
      
      if (altDays < origDays) {
        benefits.push('Faster delivery');
      }
    }

    // Supplier benefits
    if (alternative.supplier !== original.supplier) {
      benefits.push(`Available from ${alternative.supplier}`);
    }

    // Build-specific benefits
    if (context.buildType === 'garden_wall' && 
        alternative.id.includes('waterproof')) {
      benefits.push('Better for outdoor use');
    }

    if (['pizza_oven', 'fire_pit'].includes(context.buildType) && 
        alternative.id.includes('fire')) {
      benefits.push('Designed for high temperatures');
    }

    return benefits.join(', ');
  }

  // Helper method to extract days from lead time
  private extractMaxDays(leadTime: string): number {
    const match = leadTime.match(/(\d+)-?(\d+)?\s*days?/);
    if (match) {
      return parseInt(match[2] || match[1]);
    }
    return 1;
  }

  // Remove duplicate alternatives
  private deduplicateAlternatives(alternatives: EnhancedMaterial[]): EnhancedMaterial[] {
    const seen = new Set<string>();
    return alternatives.filter(alt => {
      if (seen.has(alt.id)) {
        return false;
      }
      seen.add(alt.id);
      return true;
    });
  }

  // Get cost optimization recommendations
  getCostOptimizations(
    materials: MaterialCalculationItem[],
    targetBudget: number
  ): {
    totalSavings: number;
    recommendations: string[];
    alternativeMaterials: MaterialRecommendation[];
  } {
    const context: RecommendationContext = {
      buildType: 'general',
      budget: targetBudget,
      prioritizeCost: true
    };

    const recommendations = this.getRecommendations(materials, context);
    
    let totalSavings = 0;
    const savingsRecommendations: string[] = [];

    for (const rec of recommendations) {
      const bestCostAlternative = rec.alternatives
        .filter(alt => alt.costDifference < 0)
        .sort((a, b) => a.costDifference - b.costDifference)[0];

      if (bestCostAlternative) {
        totalSavings += Math.abs(bestCostAlternative.costDifference);
        savingsRecommendations.push(
          `Switch ${rec.original.name} to ${bestCostAlternative.material.name} (${bestCostAlternative.reason})`
        );
      }
    }

    return {
      totalSavings,
      recommendations: savingsRecommendations,
      alternativeMaterials: recommendations
    };
  }
}
