
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
