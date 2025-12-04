/**
 * AI Adapter - Interface pour le moteur d'IA (Backend API)
 *
 * Ce module communique avec le backend IA via HTTP.
 * En Phase 1, le backend retourne le prompt construit.
 * En Phase 2, le backend intégrera un vrai LLM.
 *
 * @module engine/ai-adapter
 */

/**
 * URL de l'API backend
 */
const API_URL = 'http://localhost:4000/api/chat';

/**
 * État actuel du backend IA
 * @type {Object}
 */
const aiState = {
  ready: false,
  loading: false,
  model: 'backend-api',
  error: null,
  lastRequestSuccess: false
};

/**
 * Génère une réponse via le backend IA
 *
 * @param {string} userMessage - Message de l'utilisateur
 * @param {Array<Object>} conversationHistory - Historique des messages (max 10 derniers)
 * @param {Object} context - Contexte additionnel (documents RAG en Phase 3)
 * @returns {Promise<Object|null>} Réponse générée ou null si erreur
 *
 * @example
 * const response = await generateResponse(
 *   "Comment obtenir une CNI ?",
 *   [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }],
 *   { documents: [...] }
 * );
 *
 * // Format de retour :
 * {
 *   content: "Pour obtenir votre CNI...",
 *   confidence: 0.85,
 *   source: 'ai',
 *   metadata: { ... }
 * }
 */
export async function generateResponse(userMessage, conversationHistory, context) {
  console.log('[AI Adapter] generateResponse appelé');
  console.log('[AI Adapter] Message:', userMessage);
  console.log('[AI Adapter] History length:', conversationHistory?.length || 0);

  try {
    // Détection de la langue (simple heuristique pour Phase 1)
    const language = detectLanguage(userMessage);

    // Appel à l'API backend
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        language: language,
        history: conversationHistory || []
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Marquer le backend comme prêt si l'appel réussit
    aiState.ready = true;
    aiState.lastRequestSuccess = true;
    aiState.error = null;

    console.log('[AI Adapter] Réponse reçue du backend');

    // Retourner au format attendu par le frontend
    return {
      content: data.content,
      confidence: data.confidence ?? 0.5,
      source: 'ai',
      metadata: data.metadata ?? {}
    };
  } catch (error) {
    console.error('[AI Adapter] Erreur lors de l\'appel API:', error);
    aiState.lastRequestSuccess = false;
    aiState.error = error.message;
    aiState.ready = false;

    // Retourner null pour fallback vers rules-engine
    return null;
  }
}

/**
 * Détecte la langue d'un message (heuristique simple)
 * @param {string} message
 * @returns {string} 'fr' ou 'ar'
 */
function detectLanguage(message) {
  // Détection simple : si contient des caractères arabes, c'est de l'arabe
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(message) ? 'ar' : 'fr';
}

/**
 * Vérifie si le backend IA est prêt à générer des réponses
 *
 * @returns {boolean} True si le backend est accessible
 */
export function isReady() {
  return aiState.ready;
}

/**
 * Obtient le statut détaillé du backend IA
 *
 * @returns {Object} Statut avec ready, loading, model, error
 */
export function getStatus() {
  return {
    ready: aiState.ready,
    loading: aiState.loading,
    model: aiState.model,
    error: aiState.error,
    lastRequestSuccess: aiState.lastRequestSuccess
  };
}

/**
 * Initialise la connexion au backend IA
 *
 * @param {Object} [config] - Configuration optionnelle
 * @returns {Promise<void>}
 */
export async function initAI(config = {}) {
  console.log('[AI Adapter] Initialisation de la connexion au backend...');

  try {
    aiState.loading = true;
    aiState.error = null;

    // Ping du backend pour vérifier qu'il est accessible
    const response = await fetch('http://localhost:4000/api/status', {
      method: 'GET'
    });

    if (response.ok) {
      aiState.ready = true;
      aiState.loading = false;
      console.log('[AI Adapter] Backend accessible');
    } else {
      throw new Error('Backend non accessible');
    }
  } catch (error) {
    console.error('[AI Adapter] Erreur connexion backend:', error);
    aiState.error = error.message;
    aiState.loading = false;
    aiState.ready = false;
  }
}

/**
 * Décharge le modèle de la mémoire
 *
 * PHASE 1 : Ne fait rien
 * PHASE 2 : Libère la mémoire GPU/CPU du modèle
 *
 * @returns {Promise<void>}
 */
export async function unloadAI() {
  console.log('[AI] unloadAI appelé (stub Phase 1)');

  // Phase 2 : Téo implémentera :
  // 1. Libérer les ressources du modèle
  // 2. Reset aiState
  /*
  if (aiState.model) {
    await aiState.model.dispose();
  }

  aiState.ready = false;
  aiState.loading = false;
  aiState.model = null;
  aiState.error = null;
  */
}

/**
 * Obtient des statistiques sur la génération IA
 *
 * PHASE 1 : Retourne des valeurs nulles
 * PHASE 2 : Retournera les vraies stats
 *
 * @returns {Object} Statistiques (tokens générés, temps moyen, etc.)
 */
export function getAIStats() {
  // Phase 1
  return {
    totalGenerations: 0,
    totalTokensGenerated: 0,
    averageGenerationTime: 0,
    modelSize: null
  };

  // Phase 2 : Téo trackera les stats réelles
}

// ============================================
// DOCUMENTATION POUR TÉO - PHASE 2
// ============================================

/**
 * NOTES POUR L'IMPLÉMENTATION PHASE 2 (Téo) :
 *
 * 1. DÉPENDANCES À INSTALLER :
 *    npm install @xenova/transformers
 *
 * 2. MODÈLE RECOMMANDÉ :
 *    - TinyLlama/TinyLlama-1.1B-Chat-v1.0 (quantized Q4)
 *    - Taille : ~300-500 MB
 *    - Alternative : Qwen/Qwen2.5-0.5B si TinyLlama trop gros
 *
 * 3. PROMPT TEMPLATE SUGGÉRÉ :
 *    ```
 *    <|system|>
 *    Tu es un assistant virtuel pour les services publics mauritaniens.
 *    Réponds de manière claire, concise et professionnelle en français.
 *    Si tu ne sais pas, dis-le honnêtement.
 *    </s>
 *    <|user|>
 *    ${userMessage}
 *    </s>
 *    <|assistant|>
 *    ```
 *
 * 4. PARAMÈTRES DE GÉNÉRATION SUGGÉRÉS :
 *    {
 *      max_new_tokens: 150,
 *      temperature: 0.7,
 *      top_k: 50,
 *      top_p: 0.9,
 *      do_sample: true
 *    }
 *
 * 5. GESTION ERREURS :
 *    - Timeout après 15 secondes
 *    - Fallback vers rules-engine si échec
 *    - Logger toutes les erreurs
 *
 * 6. OPTIMISATIONS :
 *    - Cache les embeddings si possible
 *    - Limiter historique à 10 derniers messages max
 *    - Tronquer contexte si trop long (> 1024 tokens)
 *
 * 7. TESTS À FAIRE :
 *    - Chargement du modèle
 *    - Génération simple
 *    - Génération avec historique
 *    - Gestion timeout
 *    - Gestion erreurs réseau
 */
