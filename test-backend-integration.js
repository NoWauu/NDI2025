/**
 * Test d'Intégration Backend - Phase 2
 * Tests automatisés de tous les endpoints
 */

import { spawn } from 'child_process';
import http from 'http';

const BASE_URL = 'http://localhost:4000';
let backendProcess = null;
let passed = 0;
let failed = 0;

console.log('════════════════════════════════════════════════════════════');
console.log('   TESTS D\'INTÉGRATION BACKEND - PHASE 2                   ');
console.log('════════════════════════════════════════════════════════════\n');

/**
 * Démarre le backend
 */
async function startBackend() {
  console.log('🚀 Démarrage du backend...');

  backendProcess = spawn('node', ['server.js'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Attendre que le backend démarre
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Vérifier qu'il répond
  for (let i = 0; i < 10; i++) {
    try {
      await fetch(`${BASE_URL}/api/status`);
      console.log('✅ Backend démarré et prêt\n');
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Backend n\'a pas démarré après 10 tentatives');
}

/**
 * Arrête le backend
 */
function stopBackend() {
  if (backendProcess) {
    console.log('\n🧹 Arrêt du backend...');
    backendProcess.kill();
  }
}

/**
 * Effectue une requête HTTP
 */
async function request(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.text();

  return {
    status: response.status,
    headers: response.headers,
    body: data ? JSON.parse(data) : null
  };
}

/**
 * Teste un endpoint
 */
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Erreur: ${error.message}\n`);
    failed++;
  }
}

/**
 * Assertion
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Tests
 */
async function runTests() {
  console.log('📋 CHECKPOINT 1: Endpoints Backend Phase 1\n');

  await test('POST /api/chat - Requête valide', async () => {
    const response = await request('POST', '/api/chat', {
      message: 'Bonjour',
      language: 'fr',
      history: []
    });
    assert(response.status === 200, `Status ${response.status} au lieu de 200`);
    assert(response.body.content, 'Pas de content dans la réponse');
  });

  await test('GET /api/status - Statut backend', async () => {
    const response = await request('GET', '/api/status');
    assert(response.status === 200, `Status ${response.status} au lieu de 200`);
    assert(response.body.status === 'online', 'Status pas online');
  });

  console.log('\n📋 CHECKPOINT 2: Endpoints Backend Phase 2\n');

  await test('POST /ai/fallback - Fallback intelligent', async () => {
    const response = await request('POST', '/ai/fallback', {
      message: 'Comment obtenir une CNI?',
      language: 'fr',
      reason: 'timeout'
    });
    assert(response.status === 200, `Status ${response.status} au lieu de 200`);
    assert(response.body.content, 'Pas de content dans fallback');
    assert(response.body.source === 'fallback', 'Source incorrecte');
  });

  await test('GET /ai/status - Statut IA', async () => {
    const response = await request('GET', '/ai/status');
    assert(response.status === 200, `Status ${response.status} au lieu de 200`);
    assert(typeof response.body.totalRequests === 'number', 'totalRequests manquant');
  });

  await test('GET /ai/model-info - Info modèle', async () => {
    const response = await request('GET', '/ai/model-info');
    assert(response.status === 200, `Status ${response.status} au lieu de 200`);
    assert(response.body.name, 'Nom du modèle manquant');
    assert(response.body.version, 'Version manquante');
  });

  await test('GET /ai/logs - Logs IA', async () => {
    const response = await request('GET', '/ai/logs');
    assert(response.status === 200, `Status ${response.status} au lieu de 200`);
    assert(response.body.requests !== undefined, 'Logs requests manquants');
  });

  await test('POST /ai/logs - Ajouter log', async () => {
    const response = await request('POST', '/ai/logs', {
      type: 'request',
      data: { source: 'test', message: 'test' }
    });
    assert(response.status === 200, `Status ${response.status} au lieu de 200`);
  });

  console.log('\n📋 CHECKPOINT 3: Validation des données\n');

  await test('POST /api/chat - Message vide (devrait échouer)', async () => {
    const response = await request('POST', '/api/chat', {
      message: '',
      language: 'fr'
    });
    assert(response.status === 400, `Status ${response.status} au lieu de 400`);
  });

  await test('POST /api/chat - Langue invalide (devrait échouer)', async () => {
    const response = await request('POST', '/api/chat', {
      message: 'Test',
      language: 'invalid'
    });
    assert(response.status === 400, `Status ${response.status} au lieu de 400 (validation stricte)`);
  });

  console.log('\n📋 CHECKPOINT 4: Fallback Intelligent\n');

  await test('Fallback - Matching FAQ français', async () => {
    const response = await request('POST', '/ai/fallback', {
      message: 'comment obtenir carte identité',
      language: 'fr',
      reason: 'low_confidence'
    });
    assert(response.status === 200, `Status ${response.status}`);
    assert(response.body.content, 'Pas de contenu');
    assert(typeof response.body.confidence === 'number', 'Pas de score de confiance');
  });

  await test('Fallback - Support arabe', async () => {
    const response = await request('POST', '/ai/fallback', {
      message: 'كيف أحصل على بطاقة الهوية',
      language: 'ar',
      reason: 'timeout'
    });
    assert(response.status === 200, `Status ${response.status}`);
    assert(response.body.content, 'Pas de contenu arabe');
  });

  console.log('\n📋 CHECKPOINT 5: Logging et Observabilité\n');

  await test('Logs - Requêtes enregistrées', async () => {
    // Faire une requête
    await request('POST', '/api/chat', {
      message: 'Test logging',
      language: 'fr'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await request('GET', '/ai/logs');
    assert(response.body.requests.length > 0, 'Aucun log enregistré');
  });

  await test('Statistiques - Métriques disponibles', async () => {
    const response = await request('GET', '/ai/status');
    assert(typeof response.body.totalRequests === 'number', 'totalRequests manquant');
    assert(typeof response.body.successRate === 'number', 'successRate manquant');
  });

  console.log('\n📋 CHECKPOINT 6: Performance\n');

  await test('Temps de réponse < 1s', async () => {
    const start = Date.now();
    await request('POST', '/api/chat', {
      message: 'Bonjour',
      language: 'fr'
    });
    const elapsed = Date.now() - start;
    assert(elapsed < 1000, `Réponse trop lente: ${elapsed}ms`);
  });

  console.log('\n📋 CHECKPOINT 7: Sécurité\n');

  await test('Injection - XSS/SQL sans crash', async () => {
    const response = await request('POST', '/api/chat', {
      message: '<script>alert(1)</script> OR 1=1',
      language: 'fr'
    });
    assert(response.status === 200, 'Injection cause une erreur');
  });

  await test('Message long - Gestion correcte', async () => {
    const longMessage = 'a'.repeat(15000);
    const response = await request('POST', '/api/chat', {
      message: longMessage,
      language: 'fr'
    });
    // Devrait soit refuser (400) soit accepter (200)
    assert(
      response.status === 400 || response.status === 200,
      `Status inattendu: ${response.status}`
    );
  });
}

/**
 * Main
 */
async function main() {
  try {
    await startBackend();
    await runTests();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    failed++;
  } finally {
    stopBackend();

    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`Résultats: ${passed}/${passed + failed} tests passés`);

    if (failed === 0) {
      console.log('🎉 TOUS LES TESTS BACKEND SONT PASSÉS !');
      console.log('\n✅ CHECKPOINT 1: Endpoints Phase 1 - OK');
      console.log('✅ CHECKPOINT 2: Endpoints Phase 2 - OK');
      console.log('✅ CHECKPOINT 3: Validation données - OK');
      console.log('✅ CHECKPOINT 4: Fallback intelligent - OK');
      console.log('✅ CHECKPOINT 5: Logging - OK');
      console.log('✅ CHECKPOINT 6: Performance - OK');
      console.log('✅ CHECKPOINT 7: Sécurité - OK');
    } else {
      console.log(`⚠️  ${failed} test(s) échoué(s)`);
    }

    console.log('════════════════════════════════════════════════════════════\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

main();
