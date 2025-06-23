// Simple test to verify Mock Catalog functionality
import { MockCatalogAgent } from '../services/MockCatalogAgent';

export function testMockCatalog() {
  console.log('🧪 Testing Mock Catalog System...');
  
  const catalog = new MockCatalogAgent();
  
  // Test 1: Basic catalog stats
  const stats = catalog.getCatalogStats();
  console.log('📊 Catalog Stats:', stats);
  
  // Test 2: Search by build type
  const pizzaOvenMaterials = catalog.searchByBuildType('pizza_oven');
  console.log('🍕 Pizza Oven Materials:', pizzaOvenMaterials.length);
  
  // Test 3: Calculate materials for a pizza oven
  try {
    const calculation = catalog.calculateMaterialNeeds('pizza_oven', {
      length: 1.2,
      width: 1.2,
      height: 0.5
    });
    console.log('💰 Pizza Oven Calculation:', {
      totalCost: calculation.totalCost,
      materialsCount: calculation.materials.length,
      deliveryTime: calculation.deliveryTime
    });
  } catch (error) {
    console.error('❌ Calculation Error:', error);
  }
  
  // Test 4: Calculate materials for a garden wall
  try {
    const wallCalculation = catalog.calculateMaterialNeeds('garden_wall', {
      length: 3,
      height: 1.5
    });
    console.log('🧱 Garden Wall Calculation:', {
      totalCost: wallCalculation.totalCost,
      materialsCount: wallCalculation.materials.length,
      deliveryTime: wallCalculation.deliveryTime
    });
  } catch (error) {
    console.error('❌ Wall Calculation Error:', error);
  }
  
  // Test 5: Get alternatives
  const alternatives = catalog.getAlternatives('brick-red-standard');
  console.log('🔄 Brick Alternatives:', alternatives.length);
  
  console.log('✅ Mock Catalog Tests Complete!');
}