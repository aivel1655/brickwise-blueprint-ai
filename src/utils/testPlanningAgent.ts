// Test utility for Planning Agent Templates
import { MockCatalogAgent } from '../services/MockCatalogAgent';
import { PlanningAgent } from '../services/PlanningAgent';

export function testPlanningAgent() {
  console.log('🧪 Testing Planning Agent Templates...');
  
  const catalogAgent = new MockCatalogAgent();
  const planningAgent = new PlanningAgent(catalogAgent);
  
  // Test 1: Get available templates
  const templates = planningAgent.getAvailableTemplates();
  console.log('📋 Available Templates:', templates.map(t => `${t.name} (${t.difficulty})`));
  
  // Test 2: Difficulty assessment
  const assessments = [
    { buildType: 'wall', experience: 'beginner' },
    { buildType: 'pizza_oven', experience: 'beginner' },
    { buildType: 'pizza_oven', experience: 'expert' },
    { buildType: 'garden_wall', experience: 'beginner' }
  ];
  
  assessments.forEach(test => {
    const assessment = planningAgent.getDifficultyAssessment(test.buildType, test.experience);
    console.log(`🎯 ${test.buildType} for ${test.experience}:`, {
      suitable: assessment.suitable,
      timeEstimate: assessment.timeEstimate
    });
  });
  
  // Test 3: Create structured plan
  try {
    const testRequest = {
      buildType: 'garden_wall' as const,
      dimensions: { length: 2, height: 1 },
      materials: ['brick'],
      constraints: [],
      confidence: 0.8,
      experience: 'beginner' as const
    };
    
    const materials = catalogAgent.calculateMaterialNeeds(testRequest.buildType, testRequest.dimensions);
    const plan = planningAgent.createStructuredPlan(testRequest, materials);
    
    console.log('📊 Garden Wall Plan Created:', {
      templateId: plan.templateId,
      phases: plan.phases.length,
      steps: plan.detailedSteps.length,
      safetyGuidelines: plan.safetyGuidelines.length,
      totalCost: plan.totalCost,
      difficulty: plan.difficulty
    });
  } catch (error) {
    console.error('❌ Plan Creation Error:', error);
  }
  
  // Test 4: Pizza oven advanced plan
  try {
    const ovenRequest = {
      buildType: 'pizza_oven' as const,
      dimensions: { length: 1.2, width: 1.2, height: 0.5 },
      materials: ['firebrick'],
      constraints: [],
      confidence: 0.9,
      experience: 'intermediate' as const
    };
    
    const ovenMaterials = catalogAgent.calculateMaterialNeeds(ovenRequest.buildType, ovenRequest.dimensions);
    const ovenPlan = planningAgent.createStructuredPlan(ovenRequest, ovenMaterials);
    
    console.log('🍕 Pizza Oven Plan Created:', {
      templateId: ovenPlan.templateId,
      phases: ovenPlan.phases.length,
      steps: ovenPlan.detailedSteps.length,
      troubleshooting: ovenPlan.troubleshooting.length,
      totalCost: ovenPlan.totalCost,
      estimatedTime: ovenPlan.estimatedTime
    });
  } catch (error) {
    console.error('❌ Oven Plan Creation Error:', error);
  }
  
  console.log('✅ Planning Agent Tests Complete!');
}