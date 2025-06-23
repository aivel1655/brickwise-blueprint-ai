import { EnhancedMaterial, MaterialCalculation, MaterialCalculationItem, CalculationRules, ParsedRequest } from '../types';
import mockCatalogData from '../data/mock-catalog.json';

export class MockCatalogAgent {
  private materials: EnhancedMaterial[];
  private calculationRules: CalculationRules;

  constructor() {
    this.materials = mockCatalogData.materials as EnhancedMaterial[];
    this.calculationRules = mockCatalogData.calculationRules as CalculationRules;
  }

  // Search materials by build type
  searchByBuildType(buildType: string): EnhancedMaterial[] {
    return this.materials.filter(material => 
      material.compatibility.includes(buildType) || 
      material.compatibility.includes('all')
    );
  }

  // Search materials by category
  searchByCategory(category: string): EnhancedMaterial[] {
    return this.materials.filter(material => material.category === category);
  }

  // Get specific material by ID
  getMaterialById(id: string): EnhancedMaterial | undefined {
    return this.materials.find(material => material.id === id);
  }

  // Calculate material needs for a specific build type and dimensions
  calculateMaterialNeeds(buildType: string, dimensions: ParsedRequest['dimensions']): MaterialCalculation {
    const rules = this.calculationRules[buildType];
    if (!rules) {
      throw new Error(`No calculation rules found for build type: ${buildType}`);
    }

    const compatibleMaterials = this.searchByBuildType(buildType);
    const calculations: MaterialCalculationItem[] = [];
    const estimatedQuantities: { [materialId: string]: any } = {};

    // Calculate surface area and volume based on dimensions
    const surfaceArea = this.calculateSurfaceArea(buildType, dimensions);
    const volume = this.calculateVolume(dimensions);

    console.log(`Calculating for ${buildType}:`, { surfaceArea, volume, dimensions });

    // Calculate primary materials (bricks, mortar, concrete)
    if (rules.bricksPerSqm && surfaceArea > 0) {
      const brickMaterial = this.selectPrimaryBrick(buildType);
      if (brickMaterial) {
        const baseQuantity = Math.ceil(rules.bricksPerSqm * surfaceArea);
        const wasteQuantity = Math.ceil(baseQuantity * (rules.wasteFactor - 1));
        const finalQuantity = baseQuantity + wasteQuantity;

        calculations.push({
          material: brickMaterial,
          quantity: finalQuantity,
          totalCost: finalQuantity * brickMaterial.price,
          wasteIncluded: true,
          notes: `${baseQuantity} base + ${wasteQuantity} waste allowance`
        });

        estimatedQuantities[brickMaterial.id] = { baseQuantity, wasteQuantity, finalQuantity };
      }
    }

    if (rules.mortarBagsPerSqm && surfaceArea > 0) {
      const mortarMaterial = this.selectPrimaryMortar(buildType);
      if (mortarMaterial) {
        const baseQuantity = Math.ceil(rules.mortarBagsPerSqm * surfaceArea);
        const wasteQuantity = Math.ceil(baseQuantity * (rules.wasteFactor - 1));
        const finalQuantity = baseQuantity + wasteQuantity;

        calculations.push({
          material: mortarMaterial,
          quantity: finalQuantity,
          totalCost: finalQuantity * mortarMaterial.price,
          wasteIncluded: true,
          notes: `${baseQuantity} base + ${wasteQuantity} waste allowance`
        });

        estimatedQuantities[mortarMaterial.id] = { baseQuantity, wasteQuantity, finalQuantity };
      }
    }

    if (rules.foundationConcretePerCubicM && volume > 0) {
      const concreteMaterial = this.selectPrimaryConcrete();
      if (concreteMaterial) {
        const baseQuantity = Math.ceil(rules.foundationConcretePerCubicM * volume);
        const wasteQuantity = Math.ceil(baseQuantity * (rules.wasteFactor - 1));
        const finalQuantity = baseQuantity + wasteQuantity;

        calculations.push({
          material: concreteMaterial,
          quantity: finalQuantity,
          totalCost: finalQuantity * concreteMaterial.price,
          wasteIncluded: true,
          notes: `${baseQuantity} base + ${wasteQuantity} waste allowance`
        });

        estimatedQuantities[concreteMaterial.id] = { baseQuantity, wasteQuantity, finalQuantity };
      }
    }

    // Add fixed additional materials
    if (rules.additionalMaterials) {
      for (const [materialId, quantity] of Object.entries(rules.additionalMaterials)) {
        const material = this.getMaterialById(materialId);
        if (material) {
          const finalQuantity = Math.ceil(quantity * rules.wasteFactor);
          calculations.push({
            material,
            quantity: finalQuantity,
            totalCost: finalQuantity * material.price,
            wasteIncluded: true,
            notes: 'Additional material requirement'
          });

          estimatedQuantities[materialId] = { 
            baseQuantity: quantity, 
            wasteQuantity: finalQuantity - quantity, 
            finalQuantity 
          };
        }
      }
    }

    // Add required tools (no waste factor for tools)
    if (rules.toolsRequired) {
      for (const toolId of rules.toolsRequired) {
        const tool = this.getMaterialById(toolId);
        if (tool) {
          calculations.push({
            material: tool,
            quantity: 1,
            totalCost: tool.price,
            wasteIncluded: false,
            notes: 'Essential tool for construction'
          });

          estimatedQuantities[toolId] = { baseQuantity: 1, wasteQuantity: 0, finalQuantity: 1 };
        }
      }
    }

    const totalCost = calculations.reduce((sum, calc) => sum + calc.totalCost, 0);
    const maxLeadTime = this.calculateMaxLeadTime(calculations);

    return {
      materials: calculations,
      totalCost,
      deliveryTime: maxLeadTime,
      wasteFactorApplied: rules.wasteFactor,
      buildType,
      estimatedQuantities
    };
  }

  // Get alternative materials for a specific material
  getAlternatives(materialId: string): EnhancedMaterial[] {
    const material = this.getMaterialById(materialId);
    if (!material) return [];

    return material.alternatives
      .map(altId => this.getMaterialById(altId))
      .filter(alt => alt !== undefined) as EnhancedMaterial[];
  }

  // Calculate surface area based on build type and dimensions
  private calculateSurfaceArea(buildType: string, dimensions: ParsedRequest['dimensions']): number {
    const { length = 0, width = 0, height = 0, diameter = 0 } = dimensions;

    switch (buildType) {
      case 'wall':
      case 'garden_wall':
        // Wall surface area: length × height (assuming single-sided)
        return length * height;
      
      case 'pizza_oven':
        // Pizza oven: dome surface area approximation
        if (diameter > 0) {
          return Math.PI * Math.pow(diameter / 2, 2) * 2; // Dome surface
        }
        return length * width * 1.5; // Rectangle with extra for dome
      
      case 'fire_pit':
        // Fire pit: circular wall area
        if (diameter > 0) {
          return Math.PI * diameter * height;
        }
        return (length + width) * 2 * height; // Rectangular pit
      
      case 'structure':
        // Structure: all walls
        return 2 * (length * height + width * height);
      
      default:
        return length * height || width * height || 0;
    }
  }

  // Calculate volume for foundation/concrete needs
  private calculateVolume(dimensions: ParsedRequest['dimensions']): number {
    const { length = 0, width = 0, height = 0, diameter = 0 } = dimensions;

    if (diameter > 0) {
      // Circular foundation
      const radius = diameter / 2;
      return Math.PI * Math.pow(radius, 2) * (height || 0.3); // Default 30cm depth
    }

    // Rectangular foundation
    const foundationDepth = height || 0.3; // Default 30cm depth for foundation
    return length * width * foundationDepth;
  }

  // Select primary brick based on build type
  private selectPrimaryBrick(buildType: string): EnhancedMaterial | undefined {
    const compatibleBricks = this.materials.filter(m => 
      m.category === 'brick' && m.compatibility.includes(buildType)
    );

    // Prefer fire bricks for high-temperature applications
    if (buildType === 'pizza_oven' || buildType === 'fire_pit') {
      return compatibleBricks.find(b => b.id.includes('firebrick')) || compatibleBricks[0];
    }

    // Standard bricks for other applications
    return compatibleBricks.find(b => b.id.includes('standard')) || compatibleBricks[0];
  }

  // Select primary mortar based on build type
  private selectPrimaryMortar(buildType: string): EnhancedMaterial | undefined {
    const compatibleMortars = this.materials.filter(m => 
      m.category === 'mortar' && m.compatibility.includes(buildType)
    );

    // Prefer refractory mortar for high-temperature applications
    if (buildType === 'pizza_oven' || buildType === 'fire_pit') {
      return compatibleMortars.find(m => m.id.includes('refractory')) || compatibleMortars[0];
    }

    // Waterproof mortar for outdoor applications
    if (buildType === 'garden_wall') {
      return compatibleMortars.find(m => m.id.includes('waterproof')) || compatibleMortars[0];
    }

    // Standard mortar for other applications
    return compatibleMortars.find(m => m.id.includes('standard')) || compatibleMortars[0];
  }

  // Select primary concrete
  private selectPrimaryConcrete(): EnhancedMaterial | undefined {
    return this.materials.find(m => m.category === 'foundation' && m.id.includes('concrete-standard'));
  }

  // Calculate maximum lead time
  private calculateMaxLeadTime(calculations: MaterialCalculationItem[]): string {
    const leadTimes = calculations
      .map(calc => calc.material.leadTime)
      .filter(time => time !== undefined) as string[];

    if (leadTimes.length === 0) return '1-2 days';

    // Find the maximum lead time (simple string comparison)
    const maxLeadTime = leadTimes.reduce((max, current) => {
      const maxDays = this.extractMaxDays(max);
      const currentDays = this.extractMaxDays(current);
      return currentDays > maxDays ? current : max;
    });

    return maxLeadTime;
  }

  // Extract maximum days from lead time string
  private extractMaxDays(leadTime: string): number {
    const match = leadTime.match(/(\d+)-?(\d+)?\s*days?/);
    if (match) {
      return parseInt(match[2] || match[1]);
    }
    return 1;
  }

  // Get catalog statistics
  getCatalogStats(): { totalMaterials: number; categories: string[]; buildTypes: string[] } {
    const categories = [...new Set(this.materials.map(m => m.category))];
    const buildTypes = [...new Set(this.materials.flatMap(m => m.compatibility))];

    return {
      totalMaterials: this.materials.length,
      categories,
      buildTypes
    };
  }

  // Search materials by name or description
  searchMaterials(query: string): EnhancedMaterial[] {
    const lowerQuery = query.toLowerCase();
    return this.materials.filter(material =>
      material.name.toLowerCase().includes(lowerQuery) ||
      material.description.toLowerCase().includes(lowerQuery) ||
      material.category.toLowerCase().includes(lowerQuery)
    );
  }
}