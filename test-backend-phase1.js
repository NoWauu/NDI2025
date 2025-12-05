/**
 * Script de test automatisé pour le Backend Phase 1
 * 
 * Ce script teste tous les modules backend implémentés
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          log(`✅ ${name}`, 'green');
          return true;
        })
        .catch((error) => {
          log(`❌ ${name} - ${error.message}`, 'red');
          return false;
        });
    } else {
      log(`✅ ${name}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ ${name} - ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n🧪 TESTS BACKEND PHASE 1\n', 'cyan');
  log('='.repeat(60), 'cyan');

  const results = [];

  // Test 1: Data Loader
  log('\n📚 1. Tests Data Loader', 'blue');
  
  const { loadKB, loadFAQ } = require('./ia/data_loader.cjs');
  
  results.push(await test('Chargement KB', () => {
    const kb = loadKB('./data/kb_services_mauritanie.json');
    if (!Array.isArray(kb)) throw new Error('KB doit être un tableau');
    if (kb.length === 0) throw new Error('KB est vide');
    log(`   - ${kb.length} entrées chargées`, 'cyan');
    return true;
  }));

  results.push(await test('Chargement FAQ FR', () => {
    const faq = loadFAQ('./data/faq_fr_rag.json');
    if (!Array.isArray(faq)) throw new Error('FAQ doit être un tableau');
    if (faq.length === 0) throw new Error('FAQ est vide');
    log(`   - ${faq.length} entrées chargées`, 'cyan');
    return true;
  }));

  results.push(await test('Chargement FAQ AR', () => {
    const faq = loadFAQ('./data/faq_ar_rag.json');
    if (!Array.isArray(faq)) throw new Error('FAQ AR doit être un tableau');
    log(`   - ${faq.length} entrées chargées`, 'cyan');
    return true;
  }));

  // Test 2: Prompting
  log('\n💬 2. Tests Prompting', 'blue');
  
  const { buildSystemPromptFR, buildSystemPromptAR, buildPrompt, formatContext } = require('./ia/prompting.cjs');
  
  results.push(await test('Prompt système FR', () => {
    const prompt = buildSystemPromptFR();
    if (!prompt || typeof prompt !== 'string') throw new Error('Prompt doit être une chaîne');
    if (prompt.length === 0) throw new Error('Prompt est vide');
    return true;
  }));

  results.push(await test('Prompt système AR', () => {
    const prompt = buildSystemPromptAR();
    if (!prompt || typeof prompt !== 'string') throw new Error('Prompt AR doit être une chaîne');
    if (prompt.length === 0) throw new Error('Prompt AR est vide');
    return true;
  }));

  results.push(await test('Formatage contexte', () => {
    const kb = [{ title: 'Test KB', body: 'Contenu test' }];
    const faq = [{ question: 'Question?', answer: 'Réponse' }];
    const context = formatContext(kb, faq);
    if (!context.includes('Test KB')) throw new Error('Contexte KB manquant');
    if (!context.includes('Question?')) throw new Error('Contexte FAQ manquant');
    return true;
  }));

  results.push(await test('Construction prompt complet FR', () => {
    const kb = [{ title: 'CNI', body: 'Document identité' }];
    const faq = [{ question: 'Comment obtenir CNI?', answer: 'Aller au centre' }];
    const prompt = buildPrompt({
      question: 'Comment obtenir ma CNI?',
      language: 'fr',
      kbSnippets: kb,
      faqSnippets: faq
    });
    if (!prompt.includes('CNI')) throw new Error('Prompt ne contient pas le contexte');
    if (!prompt.includes('Comment obtenir ma CNI?')) throw new Error('Question manquante');
    return true;
  }));

  results.push(await test('Construction prompt complet AR', () => {
    const prompt = buildPrompt({
      question: 'كيف أحصل على بطاقة الهوية؟',
      language: 'ar',
      kbSnippets: [],
      faqSnippets: []
    });
    if (!prompt.includes('ar')) throw new Error('Langue AR non détectée');
    return true;
  }));

  // Test 3: App.js
  log('\n🚀 3. Tests App.js', 'blue');
  
  const { buildIaRequestFromUserMessage } = require('./app.cjs');
  
  results.push(await test('buildIaRequestFromUserMessage FR', async () => {
    const request = await buildIaRequestFromUserMessage('Comment obtenir un passeport?', 'fr');
    if (!request.prompt) throw new Error('Prompt manquant');
    if (request.meta.language !== 'fr') throw new Error('Langue incorrecte');
    return true;
  }));

  results.push(await test('buildIaRequestFromUserMessage AR', async () => {
    const request = await buildIaRequestFromUserMessage('كيف أحصل على جواز السفر؟', 'ar');
    if (!request.prompt) throw new Error('Prompt manquant');
    if (request.meta.language !== 'ar') throw new Error('Langue incorrecte');
    return true;
  }));

  // Test 4: RAG (stub)
  log('\n🔍 4. Tests RAG (Stub)', 'blue');
  
  const { selectRagContext } = require('./ia/rag.cjs');
  
  results.push(await test('selectRagContext (stub)', async () => {
    const context = await selectRagContext('Test question');
    if (!context.kbSnippets || !Array.isArray(context.kbSnippets)) throw new Error('kbSnippets invalide');
    if (!context.faqSnippets || !Array.isArray(context.faqSnippets)) throw new Error('faqSnippets invalide');
    log('   - Stub fonctionne (retourne tableaux vides)', 'cyan');
    return true;
  }));

  // Résumé
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RÉSUMÉ DES TESTS', 'cyan');
  log('='.repeat(60), 'cyan');

  const success = results.filter(r => r === true).length;
  const total = results.length;

  log(`\nTests réussis: ${success}/${total}`, success === total ? 'green' : 'yellow');

  if (success === total) {
    log('\n✅ Tous les tests passent !', 'green');
  } else {
    log('\n⚠️  Certains tests ont échoué', 'yellow');
  }

  log('\n', 'reset');
}

// Exécuter les tests
runTests().catch(error => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

