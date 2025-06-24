
// Test utility for Planning Agent Templates
import { MockCatalogAgent } from '../services/MockCatalogAgent';
import { PlanningAgent } from '../services/PlanningAgent';

export function testPlanningAgent() {
  console.log('🧪 Testing Planning Agent...');
  
  const catalogAgent = new MockCatalogAgent();
  const planningAgent = new PlanningAgent();
  
  // Test 1: Create enhanced blueprint for garden wall
  try {
    const testRequest = {
      buildType: 'garden_wall' as const,
      dimensions: { length: 2, width: 0.2, height: 1 },
      materials: ['brick'],
      constraints: [],
      confidence: 0.8,
      experience: 'beginner' as const,
      urgency: 'low' as const,
      budget: undefined
    };
    
    planningAgent.createEnhancedBlueprint(testRequest).then(blueprint => {
      console.log('📊 Garden Wall Blueprint Created:', {
        id: blueprint.id,
        buildType: blueprint.buildType,
        phases: blueprint.phases.length,
        difficulty: blueprint.difficulty,
        totalCost: blueprint.totalCost,
        estimatedTime: blueprint.estimatedTime,
        materials: blueprint.materials.length,
        safetyGuidelines: blueprint.safetyGuidelines.length
      });
    }).catch(error => {
      console.error('❌ Garden Wall Blueprint Error:', error);
    });
  } catch (error) {
    console.error('❌ Test Setup Error:', error);
  }
  
  // Test 2: Create enhanced blueprint for pizza oven
  try {
    const ovenRequest = {
      buildType: 'pizza_oven' as const,
      dimensions: { length: 1.2, width: 1.2, height: 0.5 },
      materials: ['firebrick'],
      constraints: [],
      confidence: 0.9,
      experience: 'intermediate' as const,
      urgency: 'low' as const,
      budget: undefined
    };
    
    planningAgent.createEnhancedBlueprint(ovenRequest).then(blueprint => {
      console.log('🍕 Pizza Oven Blueprint Created:', {
        id: blueprint.id,
        buildType: blueprint.buildType,
        phases: blueprint.phases.length,
        difficulty: blueprint.difficulty,
        totalCost: blueprint.totalCost,
        estimatedTime: blueprint.estimatedTime,
        tools: blueprint.tools.length,
        permits: blueprint.permits.length
      });
    }).catch(error => {
      console.error('❌ Pizza Oven Blueprint Error:', error);
    });
  } catch (error) {
    console.error('❌ Oven Test Setup Error:', error);
  }
  
  console.log('✅ Planning Agent Tests Complete!');
}
