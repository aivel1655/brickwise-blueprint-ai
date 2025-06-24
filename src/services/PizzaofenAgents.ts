import pizzaovenData from '../data/mock-pizzaoven.json';

// TypeScript Interfaces
export interface RequirementsInput {
  area_sqm: number;
  material_preference?: string;
  quality_option: 'schnell' | 'günstig' | 'premium';
}

export interface ComponentCalculation {
  name: string;
  amount: number;
  price_per_unit: number;
  total_price: number;
}

export interface CalculationResult {
  components: ComponentCalculation[];
  total_cost: number;
  quality_option: string;
}

export interface ImagePrompt {
  description: string;
  style: string;
  details: string[];
}

export interface ShoppingList {
  project: string;
  quality_option: string;
  components: ComponentCalculation[];
  total_cost: number;
  estimated_build_time: string;
  image_prompt: ImagePrompt;
}

/**
 * RequirementsAgent: Sammelt und validiert Benutzeranforderungen
 */
export class RequirementsAgent {
  validateRequirements(input: Partial<RequirementsInput>): RequirementsInput {
    // Standardwerte setzen falls nicht angegeben
    const area = input.area_sqm || 1.5; // Default 1.5 qm
    const quality = input.quality_option || 'günstig';
    
    // Validierung der Fläche
    if (area < pizzaovenData.requirements.min_area_sqm) {
      throw new Error(`Mindestfläche: ${pizzaovenData.requirements.min_area_sqm} qm`);
    }
    if (area > pizzaovenData.requirements.max_area_sqm) {
      throw new Error(`Maximale Fläche: ${pizzaovenData.requirements.max_area_sqm} qm`);
    }

    console.log('✅ RequirementsAgent: Anforderungen validiert', {
      area_sqm: area,
      quality_option: quality
    });

    return {
      area_sqm: area,
      material_preference: input.material_preference,
      quality_option: quality
    };
  }
}

/**
 * CalculationAgent: Berechnet Materialmengen und Kosten basierend auf Qualitätsoption
 */
export class CalculationAgent {
  calculateMaterials(requirements: RequirementsInput): CalculationResult {
    const { quality_option, area_sqm } = requirements;
    const components: ComponentCalculation[] = [];
    let total_cost = 0;

    // Skalierungsfaktor basierend auf der Fläche (1.5 qm als Basis)
    const scaleFactor = area_sqm / 1.5;

    pizzaovenData.components.forEach(component => {
      const option = component.options[quality_option];
      const scaledAmount = Math.ceil(option.amount * scaleFactor);
      const totalPrice = scaledAmount * option.price_per_unit;

      const calc: ComponentCalculation = {
        name: component.name,
        amount: scaledAmount,
        price_per_unit: option.price_per_unit,
        total_price: totalPrice
      };

      components.push(calc);
      total_cost += totalPrice;
    });

    console.log('💰 CalculationAgent: Materialien berechnet', {
      quality_option,
      area_sqm,
      total_cost,
      components_count: components.length
    });

    return {
      components,
      total_cost,
      quality_option
    };
  }
}

/**
 * ImageAgent: Erstellt Prompts für Bild-APIs basierend auf den Spezifikationen
 */
export class ImageAgent {
  generateImagePrompt(requirements: RequirementsInput, calculation: CalculationResult): ImagePrompt {
    const { quality_option, area_sqm } = requirements;
    
    // Qualitätsspezifische Beschreibungen
    const qualityDescriptions = {
      'schnell': 'moderner, effizienter Pizzaofen mit schlankem Design',
      'günstig': 'traditioneller, rustikaler Pizzaofen im Garten',
      'premium': 'luxuriöser, professioneller Pizzaofen mit eleganten Steinarbeiten'
    };

    const sizeDescription = area_sqm > 2.0 ? 'großer' : area_sqm > 1.5 ? 'mittelgroßer' : 'kompakter';

    const prompt: ImagePrompt = {
      description: `Ein ${sizeDescription} ${qualityDescriptions[quality_option]} aus Schamottsteinen`,
      style: quality_option === 'premium' ? 'photorealistic, professional architecture' : 
             quality_option === 'schnell' ? 'modern, clean design' : 'rustic, traditional style',
      details: [
        `Fläche: ${area_sqm} Quadratmeter`,
        `${calculation.components.find(c => c.name === 'Schamottsteine')?.amount} Schamottsteine`,
        `Qualitätsstufe: ${quality_option}`,
        'Gartenumgebung, natürliches Licht'
      ]
    };

    console.log('🖼️ ImageAgent: Bild-Prompt erstellt', {
      quality_option,
      description: prompt.description
    });

    return prompt;
  }

  // Simulierte Bild-URL (in Realität würde hier eine echte API aufgerufen)
  generateImageUrl(prompt: ImagePrompt): string {
    const baseUrl = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0';
    const params = '?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    
    console.log('🎨 ImageAgent: Bild-URL generiert', { url: baseUrl + params });
    
    return baseUrl + params;
  }
}

/**
 * SummaryAgent: Erstellt finale Einkaufsliste und Zusammenfassung
 */
export class SummaryAgent {
  generateShoppingList(
    requirements: RequirementsInput,
    calculation: CalculationResult,
    imagePrompt: ImagePrompt
  ): ShoppingList {
    // Geschätzte Bauzeit basierend auf Qualitätsoption
    const buildTimes = {
      'schnell': '2-3 Tage',
      'günstig': '3-5 Tage',
      'premium': '5-7 Tage'
    };

    const shoppingList: ShoppingList = {
      project: pizzaovenData.project,
      quality_option: calculation.quality_option,
      components: calculation.components,
      total_cost: calculation.total_cost,
      estimated_build_time: buildTimes[calculation.quality_option],
      image_prompt: imagePrompt
    };

    console.log('📋 SummaryAgent: Einkaufsliste erstellt', {
      total_cost: shoppingList.total_cost,
      components_count: shoppingList.components.length,
      estimated_time: shoppingList.estimated_build_time
    });

    return shoppingList;
  }
}

/**
 * Demo-Funktion: Führt alle Agenten nacheinander aus
 */
export function runDemo(input: Partial<RequirementsInput> = {}): ShoppingList {
  console.log('🚀 Starte Pizzaofen-Demo mit allen Agenten...\n');

  try {
    // 1. RequirementsAgent
    const requirementsAgent = new RequirementsAgent();
    const requirements = requirementsAgent.validateRequirements(input);

    // 2. CalculationAgent
    const calculationAgent = new CalculationAgent();
    const calculation = calculationAgent.calculateMaterials(requirements);

    // 3. ImageAgent
    const imageAgent = new ImageAgent();
    const imagePrompt = imageAgent.generateImagePrompt(requirements, calculation);
    const imageUrl = imageAgent.generateImageUrl(imagePrompt);

    // 4. SummaryAgent
    const summaryAgent = new SummaryAgent();
    const shoppingList = summaryAgent.generateShoppingList(requirements, calculation, imagePrompt);

    // Finale Ausgabe
    console.log('\n🎉 Demo abgeschlossen! Finale Ergebnisse:');
    console.log('📊 Einkaufsliste:', shoppingList);
    console.log('🖼️ Bild-URL:', imageUrl);

    return { ...shoppingList, image_url: imageUrl } as ShoppingList & { image_url: string };

  } catch (error) {
    console.error('❌ Fehler in der Demo:', error);
    throw error;
  }
}

// Export der Agenten für externe Verwendung
export const PizzaofenAgents = {
  RequirementsAgent,
  CalculationAgent,
  ImageAgent,
  SummaryAgent,
  runDemo
};
