
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  status: 'planning' | 'reviewing' | 'approved' | 'building' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  specifications?: ProjectSpecs;
  blueprint?: Blueprint;
  buildPlan?: BuildPlan;
}

export interface ProjectSpecs {
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  brickType: string;
  foundationType: string;
  additionalRequirements: string[];
}

export interface Blueprint {
  id: string;
  phases: BuildPhase[];
  totalCost: number;
  estimatedTime: string;
  materials: Material[];
}

export interface BuildPhase {
  id: string;
  name: string;
  description: string;
  duration: string;
  order: number;
  materials: Material[];
  tools: string[];
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  sapSku?: string;
  alternatives?: Alternative[];
  inStock: boolean;
}

// Enhanced Material for Catalog
export interface EnhancedMaterial {
  id: string;
  name: string;
  category: 'brick' | 'mortar' | 'tool' | 'accessory' | 'foundation' | 'insulation';
  price: number;
  unit: string;
  specifications: {
    dimensions?: { length: number; width: number; height: number };
    weight?: number;
    coverage?: string;
    strength?: string;
    heatResistance?: string;
    waterResistance?: string;
  };
  compatibility: string[]; // Works with these build types
  alternatives: string[]; // Alternative material IDs
  inStock: boolean;
  description: string;
  supplier?: string;
  leadTime?: string;
}

// Material Calculation Result
export interface MaterialCalculation {
  materials: MaterialCalculationItem[];
  totalCost: number;
  deliveryTime: string;
  wasteFactorApplied: number;
  buildType: string;
  estimatedQuantities: {
    [materialId: string]: {
      baseQuantity: number;
      wasteQuantity: number;
      finalQuantity: number;
    };
  };
}

export interface MaterialCalculationItem {
  material: EnhancedMaterial;
  quantity: number;
  totalCost: number;
  wasteIncluded: boolean;
  notes?: string;
}

// Calculation Rules for Different Build Types
export interface CalculationRules {
  [buildType: string]: {
    bricksPerSqm?: number;
    mortarBagsPerSqm?: number;
    foundationConcretePerCubicM?: number;
    insulationPerSqm?: number;
    wasteFactor: number;
    toolsRequired: string[];
    additionalMaterials?: { [materialId: string]: number }; // Fixed quantities
  };
}

export interface Alternative {
  id: string;
  name: string;
  pricePerUnit: number;
  availability: string;
  sapSku: string;
}

export interface BuildPlan {
  id: string;
  steps: BuildStep[];
  safetyTips: string[];
  toolList: string[];
  wasteBuffer: number;
}

export interface BuildStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  duration: string;
  materials: Material[];
  tools: string[];
  tips: string[];
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  agent?: 'iteration' | 'planner' | 'builder' | 'joule';
  content: string;
  timestamp: Date;
  data?: any;
}

export interface AgentResponse {
  agent: string;
  message: string;
  data?: any;
  suggestions?: string[];
}

// Enhanced Input Agent Interfaces
export interface ParsedRequest {
  buildType: 'wall' | 'foundation' | 'structure' | 'pizza_oven' | 'garden_wall' | 'fire_pit' | 'unknown';
  dimensions: { 
    length?: number; 
    height?: number; 
    width?: number; 
    diameter?: number;
  };
  materials: string[];
  constraints: string[];
  confidence: number;
  urgency?: 'low' | 'medium' | 'high';
  budget?: number;
  experience?: 'beginner' | 'intermediate' | 'expert';
}

export interface Question {
  type: 'dimensions' | 'materials' | 'budget' | 'experience' | 'clarification';
  text: string;
  required: boolean;
  suggestions?: string[];
}

export interface ConversationState {
  phase: 'input' | 'clarification' | 'planning' | 'review' | 'complete';
  messages: ChatMessage[];
  currentPlan: BuildPlan | null;
  needsInput: boolean;
  parsedRequest?: ParsedRequest;
  pendingQuestions?: Question[];
}
