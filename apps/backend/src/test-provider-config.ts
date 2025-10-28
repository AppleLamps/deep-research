/**
 * Test script to verify LLM provider configuration
 * Run with: tsx --env-file=../../.env.local src/test-provider-config.ts
 */

import { getModel, getProviderInfo, RECOMMENDED_MODELS } from './ai/providers';

console.log('\n🧪 Testing LLM Provider Configuration\n');
console.log('='.repeat(50));

try {
  // Test 1: Get provider info
  console.log('\n✅ Test 1: Provider Info');
  const info = getProviderInfo();
  console.log(`   Provider: ${info.provider}`);
  console.log(`   Model: ${info.model}`);
  console.log(`   Endpoint: ${info.baseURL || 'default'}`);

  // Test 2: Get model instance
  console.log('\n✅ Test 2: Model Instance');
  const model = getModel();
  console.log(`   Model ID: ${model.modelId}`);
  console.log(`   Provider: ${model.provider}`);

  // Test 3: Show recommended models
  console.log('\n✅ Test 3: Recommended Models');
  console.log(`   For ${info.provider}:`);
  const recommended =
    RECOMMENDED_MODELS[info.provider as keyof typeof RECOMMENDED_MODELS];
  if (recommended && recommended.length > 0) {
    recommended.forEach((m: string) => console.log(`     - ${m}`));
  } else {
    console.log('     (No presets for custom provider)');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests passed!\n');

  process.exit(0);
} catch (error) {
  console.error('\n❌ Configuration Error:');
  console.error(`   ${error instanceof Error ? error.message : String(error)}`);
  console.log('\n' + '='.repeat(50));
  console.log('❌ Tests failed!\n');

  process.exit(1);
}
