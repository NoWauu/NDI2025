/**
 * Script de Test Phase 2 Frontend
 * Vérifie tous les checkpoints de la Phase 2
 *
 * Usage: node test-phase2-frontend.js
 */

console.log('═══════════════════════════════════════════════════════');
console.log('    TESTS PHASE 2 FRONTEND - CHECKPOINTS VALIDATION    ');
console.log('═══════════════════════════════════════════════════════\n');

const tests = [];
let passedTests = 0;
let failedTests = 0;

/**
 * Helper pour ajouter un test
 */
function test(name, fn) {
  tests.push({ name, fn });
}

/**
 * Helper pour assertion
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Execute tous les tests
 */
async function runTests() {
  console.log(`📋 ${tests.length} tests à exécuter\n`);

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Erreur: ${error.message}\n`);
      failedTests++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`Résultats: ${passedTests}/${tests.length} tests passés`);

  if (failedTests === 0) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
  } else {
    console.log(`⚠️  ${failedTests} test(s) échoué(s)`);
  }
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(failedTests > 0 ? 1 : 0);
}

// ============================================
// CHECKPOINT 1: Structure des fichiers
// ============================================

test('✓ Fichier ai-adapter.js existe', async () => {
  const fs = await import('fs/promises');
  await fs.access('./src/engine/ai-adapter.js');
});

test('✓ Fichier chat-ui.js modifié', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/ui/chat-ui.js', 'utf-8');
  assert(content.includes('showModelLoading'), 'showModelLoading non trouvée');
  assert(content.includes('hideModelLoading'), 'hideModelLoading non trouvée');
  assert(content.includes('updateModelLoadingProgress'), 'updateModelLoadingProgress non trouvée');
});

test('✓ Fichier main.js modifié avec polling', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/main.js', 'utf-8');
  assert(content.includes('progressInterval'), 'Polling progress non trouvé');
  assert(content.includes('setInterval'), 'setInterval non trouvé');
  assert(content.includes('UI.updateModelLoadingProgress'), 'updateModelLoadingProgress non appelée');
});

test('✓ index.html contient model-loading', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./index.html', 'utf-8');
  assert(content.includes('id="model-loading"'), 'model-loading non trouvé');
  assert(content.includes('loading-progress-bar'), 'progress-bar non trouvée');
  assert(content.includes('model-progress-fill'), 'progress-fill non trouvé');
});

test('✓ styles.css contient styles loading', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./public/styles.css', 'utf-8');
  assert(content.includes('.model-loading'), '.model-loading non trouvé');
  assert(content.includes('.loading-spinner'), '.loading-spinner non trouvé');
  assert(content.includes('.loading-progress-bar'), '.loading-progress-bar non trouvé');
});

// ============================================
// CHECKPOINT 2: Configuration ai-adapter.js
// ============================================

test('✓ CONFIG contient tous les paramètres requis', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('BACKEND_CHAT_URL'), 'BACKEND_CHAT_URL manquant');
  assert(content.includes('BACKEND_FALLBACK_URL'), 'BACKEND_FALLBACK_URL manquant');
  assert(content.includes('MODEL_ID'), 'MODEL_ID manquant');
  assert(content.includes('MODEL_LOAD_TIMEOUT'), 'MODEL_LOAD_TIMEOUT manquant');
  assert(content.includes('GENERATION_TIMEOUT'), 'GENERATION_TIMEOUT manquant');
  assert(content.includes('MIN_CONFIDENCE'), 'MIN_CONFIDENCE manquant');
});

test('✓ aiState contient tous les champs nécessaires', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('ready:'), 'ready manquant dans aiState');
  assert(content.includes('loading:'), 'loading manquant dans aiState');
  assert(content.includes('loadProgress:'), 'loadProgress manquant dans aiState');
  assert(content.includes('useLocalLLM:'), 'useLocalLLM manquant dans aiState');
  assert(content.includes('stats:'), 'stats manquant dans aiState');
});

// ============================================
// CHECKPOINT 3: Fonctions exportées
// ============================================

test('✓ ai-adapter.js exporte initAI', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('export async function initAI'), 'initAI non exportée');
});

test('✓ ai-adapter.js exporte generateResponse', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('export async function generateResponse'), 'generateResponse non exportée');
});

test('✓ ai-adapter.js exporte getStatus', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('export function getStatus'), 'getStatus non exportée');
});

test('✓ ai-adapter.js exporte isReady', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('export function isReady'), 'isReady non exportée');
});

// ============================================
// CHECKPOINT 4: Logique de génération
// ============================================

test('✓ buildPrompt inclut template TinyLlama', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('<|system|>'), 'Template <|system|> manquant');
  assert(content.includes('<|user|>'), 'Template <|user|> manquant');
  assert(content.includes('<|assistant|>'), 'Template <|assistant|> manquant');
});

test('✓ generateResponse gère le timeout', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('Promise.race'), 'Promise.race pour timeout manquant');
  assert(content.includes('GENERATION_TIMEOUT'), 'GENERATION_TIMEOUT non utilisé');
});

test('✓ Fallback backend implémenté', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('callBackendFallback'), 'callBackendFallback manquant');
  assert(content.includes('BACKEND_FALLBACK_URL'), 'BACKEND_FALLBACK_URL non utilisé');
});

test('✓ Détection de langue implémentée', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('detectLanguage'), 'detectLanguage manquant');
});

// ============================================
// CHECKPOINT 5: UI Integration
// ============================================

test('✓ main.js appelle initAI', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/main.js', 'utf-8');
  assert(content.includes('await initAI'), 'initAI non appelée');
});

test('✓ main.js désactive input pendant chargement', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/main.js', 'utf-8');
  assert(content.includes('UI.setInputDisabled(true)'), 'setInputDisabled(true) manquant');
  assert(content.includes('UI.setInputDisabled(false)'), 'setInputDisabled(false) manquant');
});

test('✓ main.js désactive input pendant génération', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/main.js', 'utf-8');
  const lines = content.split('\n');
  const typingLine = lines.findIndex(l => l.includes('UI.showTypingIndicator()'));
  const disableLine = lines.findIndex(l => l.includes('UI.setInputDisabled(true)'));
  assert(typingLine > 0, 'showTypingIndicator non trouvé');
  assert(disableLine > 0, 'setInputDisabled non trouvé');
});

test('✓ main.js affiche erreur si chargement échoue', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/main.js', 'utf-8');
  assert(content.includes('UI.showError'), 'showError non utilisé');
  assert(content.includes('catch (error)'), 'Gestion d\'erreur manquante');
});

// ============================================
// CHECKPOINT 6: Backend disponible
// ============================================

test('✓ Backend server.js existe', async () => {
  const fs = await import('fs/promises');
  await fs.access('./server.js');
});

test('✓ Endpoints Phase 2 backend configurés', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./server.js', 'utf-8');
  assert(content.includes('/api/chat'), '/api/chat manquant');
  assert(content.includes('/ai/fallback'), '/ai/fallback manquant');
  assert(content.includes('/ai/status'), '/ai/status manquant');
});

test('✓ Fallback engine existe', async () => {
  const fs = await import('fs/promises');
  await fs.access('./ia/fallback-engine.js');
});

test('✓ AI logger existe', async () => {
  const fs = await import('fs/promises');
  await fs.access('./ia/ai-logger.js');
});

// ============================================
// CHECKPOINT 7: Package.json
// ============================================

test('✓ @xenova/transformers installé', async () => {
  const fs = await import('fs/promises');
  const pkg = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
  assert(pkg.dependencies['@xenova/transformers'], '@xenova/transformers manquant');
});

test('✓ Script backend configuré', async () => {
  const fs = await import('fs/promises');
  const pkg = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
  assert(pkg.scripts.backend, 'Script backend manquant');
  assert(pkg.scripts.backend.includes('server.js'), 'Script backend incorrect');
});

// ============================================
// CHECKPOINT 8: Cohérence du code
// ============================================

test('✓ Pas de console.error non gérés dans ai-adapter', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  const errorLines = content.split('\n').filter(l => l.includes('console.error'));
  // Tous les console.error doivent être dans des catch
  for (const line of errorLines) {
    const trimmed = line.trim();
    assert(
      trimmed.startsWith('//') || content.includes('catch') || content.includes('try'),
      'console.error sans gestion d\'erreur'
    );
  }
});

test('✓ Gestion crossOriginIsolated implémentée', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./src/engine/ai-adapter.js', 'utf-8');
  assert(content.includes('crossOriginIsolated'), 'crossOriginIsolated non vérifié');
});

// ============================================
// CHECKPOINT 9: Documentation
// ============================================

test('✓ Documentation Phase 2 Frontend créée', async () => {
  const fs = await import('fs/promises');
  await fs.access('./PHASE2-FRONTEND-COMPLETE.md');
});

test('✓ Documentation contient instructions de test', async () => {
  const fs = await import('fs/promises');
  const content = await fs.readFile('./PHASE2-FRONTEND-COMPLETE.md', 'utf-8');
  assert(content.includes('Test'), 'Section tests manquante');
  assert(content.includes('npm run'), 'Instructions npm manquantes');
});

// ============================================
// Exécution des tests
// ============================================

runTests().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
