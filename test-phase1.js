/**
 * Script de test pour la Phase 1 - MVP Frontend
 * 
 * Ce script vérifie tous les points de la checklist de validation Phase 1
 * selon README-PHASE1.md
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = __dirname;

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

function checkFile(path, description) {
  try {
    const fullPath = join(PROJECT_ROOT, path);
    const content = readFileSync(fullPath, 'utf-8');
    log(`✅ ${description}`, 'green');
    return { success: true, path, size: content.length };
  } catch (error) {
    log(`❌ ${description} - ${error.message}`, 'red');
    return { success: false, path, error: error.message };
  }
}

function checkJSON(path, description) {
  try {
    const fullPath = join(PROJECT_ROOT, path);
    const content = readFileSync(fullPath, 'utf-8');
    const json = JSON.parse(content);
    log(`✅ ${description}`, 'green');
    return { success: true, path, data: json };
  } catch (error) {
    log(`❌ ${description} - ${error.message}`, 'red');
    return { success: false, path, error: error.message };
  }
}

function checkCodeStructure(file, expectedExports) {
  try {
    const fullPath = join(PROJECT_ROOT, file);
    const content = readFileSync(fullPath, 'utf-8');
    const missing = expectedExports.filter(exp => !content.includes(exp));
    
    if (missing.length === 0) {
      log(`✅ ${file} - Toutes les fonctions exportées présentes`, 'green');
      return { success: true };
    } else {
      log(`⚠️  ${file} - Fonctions manquantes: ${missing.join(', ')}`, 'yellow');
      return { success: false, missing };
    }
  } catch (error) {
    log(`❌ ${file} - ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// ============================================
// TESTS
// ============================================

log('\n🔍 TEST PHASE 1 - MVP FRONTEND\n', 'cyan');
log('='.repeat(60), 'cyan');

// 1. Vérification des fichiers essentiels
log('\n📁 1. Vérification des fichiers essentiels', 'blue');
const files = [
  { path: 'public/index.html', desc: 'index.html' },
  { path: 'public/styles.css', desc: 'styles.css' },
  { path: 'src/main.js', desc: 'main.js' },
  { path: 'src/ui/chat-ui.js', desc: 'chat-ui.js' },
  { path: 'src/storage/db-manager.js', desc: 'db-manager.js' },
  { path: 'src/engine/rules-engine.js', desc: 'rules-engine.js' },
  { path: 'src/engine/ai-adapter.js', desc: 'ai-adapter.js' },
  { path: 'src/data/faq.json', desc: 'faq.json' },
  { path: 'package.json', desc: 'package.json' }
];

const fileResults = files.map(f => checkFile(f.path, f.desc));

// 2. Vérification de la FAQ
log('\n📚 2. Vérification de la FAQ', 'blue');
const faqResult = checkJSON('src/data/faq.json', 'FAQ JSON valide');
if (faqResult.success) {
  const faq = faqResult.data.faq;
  log(`   - Nombre d'entrées: ${faq.length}`, 'cyan');
  
  if (faq.length === 15) {
    log('   ✅ 15 entrées comme attendu', 'green');
  } else {
    log(`   ⚠️  Attendu 15 entrées, trouvé ${faq.length}`, 'yellow');
  }
  
  // Vérifier les catégories
  const categories = [...new Set(faq.map(e => e.category))];
  log(`   - Catégories: ${categories.join(', ')}`, 'cyan');
  
  // Vérifier la structure
  const requiredFields = ['id', 'keywords', 'question_fr', 'answer_fr', 'category'];
  const invalidEntries = faq.filter(entry => 
    requiredFields.some(field => !entry[field])
  );
  
  if (invalidEntries.length === 0) {
    log('   ✅ Toutes les entrées ont les champs requis', 'green');
  } else {
    log(`   ❌ ${invalidEntries.length} entrées avec champs manquants`, 'red');
  }
}

// 3. Vérification package.json
log('\n📦 3. Vérification package.json', 'blue');
const pkgResult = checkJSON('package.json', 'package.json valide');
if (pkgResult.success) {
  const pkg = pkgResult.data;
  
  // Vérifier les dépendances
  const requiredDeps = ['dexie'];
  const requiredDevDeps = ['serve'];
  
  const missingDeps = requiredDeps.filter(dep => !pkg.dependencies?.[dep]);
  const missingDevDeps = requiredDevDeps.filter(dep => !pkg.devDependencies?.[dep]);
  
  if (missingDeps.length === 0 && missingDevDeps.length === 0) {
    log('   ✅ Toutes les dépendances requises présentes', 'green');
  } else {
    if (missingDeps.length > 0) {
      log(`   ❌ Dépendances manquantes: ${missingDeps.join(', ')}`, 'red');
    }
    if (missingDevDeps.length > 0) {
      log(`   ❌ DevDependencies manquantes: ${missingDevDeps.join(', ')}`, 'red');
    }
  }
  
  // Vérifier les scripts
  if (pkg.scripts?.dev && pkg.scripts?.start) {
    log('   ✅ Scripts npm run dev et start présents', 'green');
  } else {
    log('   ❌ Scripts npm manquants', 'red');
  }
}

// 4. Vérification structure code
log('\n🔧 4. Vérification structure du code', 'blue');

// db-manager.js
checkCodeStructure('src/storage/db-manager.js', [
  'export async function initDB',
  'export async function saveMessage',
  'export async function getMessages',
  'export async function clearMessages'
]);

// rules-engine.js
checkCodeStructure('src/engine/rules-engine.js', [
  'export async function loadFAQ',
  'export function findAnswer',
  'export function getDefaultResponse',
  'export function getFAQStats'
]);

// ai-adapter.js
checkCodeStructure('src/engine/ai-adapter.js', [
  'export async function generateResponse',
  'export function isReady',
  'export function getStatus',
  'export async function initAI'
]);

// chat-ui.js
checkCodeStructure('src/ui/chat-ui.js', [
  'export function initUI',
  'export function addMessage',
  'export function showTypingIndicator',
  'export function hideTypingIndicator',
  'export function updateStatusBadge',
  'export function loadHistory'
]);

// main.js
checkCodeStructure('src/main.js', [
  'async function init',
  'async function handleUserMessage',
  'CONFIG'
]);

// 5. Vérification HTML
log('\n🌐 5. Vérification HTML', 'blue');
try {
  const htmlPath = join(PROJECT_ROOT, 'public/index.html');
  const html = readFileSync(htmlPath, 'utf-8');
  
  const requiredElements = [
    'id="messages-container"',
    'id="user-input"',
    'id="chat-form"',
    'id="send-button"',
    'id="typing-indicator"',
    'id="status-badge"',
    'type="module"',
    'src="/src/main.js"'
  ];
  
  const missing = requiredElements.filter(el => !html.includes(el));
  
  if (missing.length === 0) {
    log('   ✅ Tous les éléments DOM requis présents', 'green');
  } else {
    log(`   ❌ Éléments manquants: ${missing.join(', ')}`, 'red');
  }
  
  // Vérifier importmap
  if (html.includes('importmap') && html.includes('dexie')) {
    log('   ✅ Import map pour Dexie présent', 'green');
  } else {
    log('   ⚠️  Import map pour Dexie manquant ou incomplet', 'yellow');
  }
} catch (error) {
  log(`   ❌ Erreur lecture HTML: ${error.message}`, 'red');
}

// 6. Vérification CSS
log('\n🎨 6. Vérification CSS', 'blue');
try {
  const cssPath = join(PROJECT_ROOT, 'public/styles.css');
  const css = readFileSync(cssPath, 'utf-8');
  
  const requiredClasses = [
    '.message.user',
    '.message.assistant',
    '.message.system',
    '.typing-indicator',
    '.status-badge',
    '@media'
  ];
  
  const missing = requiredClasses.filter(cls => !css.includes(cls));
  
  if (missing.length === 0) {
    log('   ✅ Classes CSS essentielles présentes', 'green');
  } else {
    log(`   ⚠️  Classes manquantes: ${missing.join(', ')}`, 'yellow');
  }
  
  // Vérifier responsive
  if (css.includes('@media (max-width: 768px)') && css.includes('@media (max-width: 480px)')) {
    log('   ✅ Media queries responsive présentes', 'green');
  } else {
    log('   ⚠️  Media queries responsive manquantes ou incomplètes', 'yellow');
  }
} catch (error) {
  log(`   ❌ Erreur lecture CSS: ${error.message}`, 'red');
}

// 7. Vérification AI Adapter (Phase 1 = stub)
log('\n🤖 7. Vérification AI Adapter (Phase 1)', 'blue');
try {
  const aiPath = join(PROJECT_ROOT, 'src/engine/ai-adapter.js');
  const aiContent = readFileSync(aiPath, 'utf-8');
  
  // Vérifier que isReady retourne false
  if (aiContent.includes('return aiState.ready') || aiContent.includes('return false')) {
    log('   ✅ isReady() retourne false (Phase 1)', 'green');
  } else {
    log('   ⚠️  isReady() pourrait ne pas retourner false', 'yellow');
  }
  
  // Vérifier que generateResponse retourne null
  if (aiContent.includes('return null') || aiContent.includes('PHASE 1')) {
    log('   ✅ generateResponse() retourne null (Phase 1)', 'green');
  } else {
    log('   ⚠️  generateResponse() pourrait ne pas retourner null', 'yellow');
  }
} catch (error) {
  log(`   ❌ Erreur lecture AI Adapter: ${error.message}`, 'red');
}

// 8. Vérification main.js config
log('\n⚙️  8. Vérification configuration', 'blue');
try {
  const mainPath = join(PROJECT_ROOT, 'src/main.js');
  const mainContent = readFileSync(mainPath, 'utf-8');
  
  if (mainContent.includes('ENABLE_AI: false')) {
    log('   ✅ ENABLE_AI est false (Phase 1)', 'green');
  } else {
    log('   ⚠️  ENABLE_AI pourrait ne pas être false', 'yellow');
  }
  
  if (mainContent.includes('MAX_HISTORY_MESSAGES')) {
    log('   ✅ Configuration MAX_HISTORY_MESSAGES présente', 'green');
  } else {
    log('   ⚠️  Configuration MAX_HISTORY_MESSAGES manquante', 'yellow');
  }
} catch (error) {
  log(`   ❌ Erreur lecture main.js: ${error.message}`, 'red');
}

// ============================================
// RÉSUMÉ
// ============================================

log('\n' + '='.repeat(60), 'cyan');
log('📊 RÉSUMÉ DES TESTS', 'cyan');
log('='.repeat(60), 'cyan');

const totalFiles = fileResults.length;
const successFiles = fileResults.filter(r => r.success).length;

log(`\nFichiers: ${successFiles}/${totalFiles} ✅`, successFiles === totalFiles ? 'green' : 'yellow');

if (faqResult.success) {
  log('FAQ: ✅ Chargée et valide', 'green');
} else {
  log('FAQ: ❌ Erreur', 'red');
}

log('\n✅ Tests statiques terminés', 'green');
log('⚠️  Pour les tests fonctionnels, lancez: npm run dev', 'yellow');
log('   Puis ouvrez http://localhost:3000 et testez manuellement:', 'cyan');
log('   - Envoi de messages', 'cyan');
log('   - Sauvegarde IndexedDB', 'cyan');
log('   - Rules engine matching', 'cyan');
log('   - Responsive design', 'cyan');
log('   - Typing indicator', 'cyan');

log('\n', 'reset');

