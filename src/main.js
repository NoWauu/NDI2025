/**
 * Application Principale - Chatbot Services Publics Mauritanie
 *
 * Point d'entrée de l'application qui orchestre tous les modules :
 * - Initialisation de la base de données (IndexedDB)
 * - Chargement de la FAQ
 * - Configuration de l'interface utilisateur
 * - Gestion du flux de conversation
 * - Fallback automatique IA → Rules
 *
 * @module main
 */

// Imports des modules
import { initDB, saveMessage, getMessages, getDBStats } from './storage/db-manager.js';
import { loadFAQ, findAnswer, getFAQStats } from './engine/rules-engine.js';
import { isReady, generateResponse, getStatus, initAI } from './engine/ai-adapter.js';
import * as UI from './ui/chat-ui.js';

/**
 * Configuration de l'application
 */
const CONFIG = {
  MAX_HISTORY_MESSAGES: 30,  // Nombre de messages à charger au démarrage
  AI_CONTEXT_MESSAGES: 10,   // Historique envoyé à l'IA
  ENABLE_AI: false,          // Phase 1 : IA désactivée, Phase 2 : true
  WELCOME_MESSAGE: true      // Afficher message de bienvenue
};

/**
 * Point d'entrée principal de l'application
 * Appelée automatiquement au chargement de la page
 */
async function init() {
  console.log('[App] Démarrage de l\'application...');

  try {
    // Étape 1 : Initialiser la base de données
    console.log('[App] Initialisation IndexedDB...');
    await initDB();

    // Étape 2 : Charger la FAQ
    console.log('[App] Chargement de la FAQ...');
    await loadFAQ();

    // Étape 3 : Initialiser l'interface utilisateur
    console.log('[App] Initialisation de l\'UI...');
    UI.initUI();
    UI.onSend(handleUserMessage);

    // Étape 4 : Charger l'historique de conversation
    console.log('[App] Chargement de l\'historique...');
    const history = await getMessages(CONFIG.MAX_HISTORY_MESSAGES);
    UI.loadHistory(history);

    // Étape 5 : Afficher message de bienvenue si nouveau
    if (CONFIG.WELCOME_MESSAGE && history.length === 0) {
      await showWelcomeMessage();
    }

    // Étape 6 : Initialiser l'IA (Phase 2)
    if (CONFIG.ENABLE_AI) {
      console.log('[App] Initialisation du modèle IA...');
      UI.updateStatusBadge('loading');

      try {
        await initAI({
          onProgress: (progress) => {
            console.log(`[App] Chargement modèle : ${progress}%`);
          }
        });
        updateAIStatus();
      } catch (error) {
        console.error('[App] Erreur chargement IA:', error);
        UI.showError('Le modèle IA n\'a pas pu être chargé. Mode hors ligne activé.');
      }
    } else {
      // Phase 1 : IA désactivée
      UI.updateStatusBadge('offline');
    }

    // Étape 7 : Afficher les statistiques
    await logStats();

    console.log('[App] Application prête !');
  } catch (error) {
    console.error('[App] Erreur fatale lors de l\'initialisation:', error);
    UI.showError(`Impossible de démarrer l'application : ${error.message}`);
  }
}

/**
 * Gère un message utilisateur
 * Orchestration complète : affichage → IA → fallback → sauvegarde
 *
 * @param {string} text - Message de l'utilisateur
 */
async function handleUserMessage(text) {
  console.log('[App] Nouveau message utilisateur:', text);

  try {
    // 1. Créer et afficher le message utilisateur
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
      source: 'manual'
    };

    UI.addMessage(userMsg);
    await saveMessage(userMsg);

    // 2. Afficher l'indicateur de saisie
    UI.showTypingIndicator();

    // 3. Tenter génération via IA (si disponible)
    let response = null;

    if (isReady()) {
      console.log('[App] Tentative génération via IA...');

      try {
        const history = await getMessages(CONFIG.AI_CONTEXT_MESSAGES);
        response = await generateResponse(text, history, {});

        if (response) {
          console.log('[App] Réponse IA générée (confiance:', response.confidence, ')');
        }
      } catch (error) {
        console.error('[App] Erreur génération IA:', error);
        // Fallback automatique vers rules
      }
    }

    // 4. Fallback vers rules-engine si IA pas dispo ou échec
    if (!response) {
      console.log('[App] Fallback vers rules-engine...');
      response = findAnswer(text);
    }

    // 5. Cacher l'indicateur de saisie
    UI.hideTypingIndicator();

    // 6. Afficher et sauvegarder la réponse
    const assistantMsg = {
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      source: response.source,
      metadata: response.metadata || {}
    };

    UI.addMessage(assistantMsg);
    await saveMessage(assistantMsg);

    console.log(`[App] Réponse envoyée (source: ${response.source})`);
  } catch (error) {
    console.error('[App] Erreur traitement message:', error);
    UI.hideTypingIndicator();
    UI.showError('Une erreur est survenue lors du traitement de votre message.');
  }
}

/**
 * Met à jour le badge de statut IA
 */
function updateAIStatus() {
  const status = getStatus();

  if (status.loading) {
    UI.updateStatusBadge('loading');
  } else if (status.ready) {
    UI.updateStatusBadge('online');
  } else {
    UI.updateStatusBadge('offline');
  }

  console.log('[App] Statut IA:', status);
}

/**
 * Affiche le message de bienvenue
 */
async function showWelcomeMessage() {
  const welcomeMsg = {
    role: 'system',
    content: `Bienvenue sur l'Assistant Services Publics de Mauritanie ! 🇲🇷

Je suis là pour vous aider à naviguer dans les démarches administratives et les services publics mauritaniens.

Vous pouvez me poser des questions sur :
• Documents administratifs (CNI, passeport, actes)
• Santé et vaccinations
• Éducation et inscriptions scolaires
• Emploi et formations professionnelles
• Permis de conduire et transports
• Logement et aides sociales
• Création d'entreprise

N'hésitez pas à me poser votre question !`,
    timestamp: Date.now(),
    source: 'manual'
  };

  UI.addMessage(welcomeMsg);
  await saveMessage(welcomeMsg);
}

/**
 * Affiche les statistiques de l'application dans la console
 */
async function logStats() {
  const dbStats = await getDBStats();
  const faqStats = getFAQStats();
  const uiStats = UI.getUIStats();

  console.log('=== STATISTIQUES APPLICATION ===');
  console.log('Base de données:', dbStats);
  console.log('FAQ:', faqStats);
  console.log('UI:', uiStats);
  console.log('================================');
}

/**
 * Gestion des erreurs globales
 */
window.addEventListener('error', (event) => {
  console.error('[App] Erreur globale:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[App] Promise rejetée:', event.reason);
});

/**
 * Gestion de la visibilité de la page (pour optimisations futures)
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('[App] Page cachée');
  } else {
    console.log('[App] Page visible');
    updateAIStatus(); // Rafraîchir le statut au retour
  }
});

// ============================================
// Démarrage de l'application
// ============================================

// Lancer l'init dès que le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM déjà chargé
  init();
}

// Exposer certaines fonctions globalement pour debug en console
if (import.meta.env?.MODE === 'development') {
  window.APP_DEBUG = {
    getDBStats,
    getFAQStats,
    getUIStats: UI.getUIStats,
    getAIStatus: getStatus,
    clearMessages: async () => {
      const { clearMessages } = await import('./storage/db-manager.js');
      await clearMessages();
      UI.clearChat();
      console.log('[Debug] Historique effacé');
    }
  };
}
