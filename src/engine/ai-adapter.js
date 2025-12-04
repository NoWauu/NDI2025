/**
 * AI Adapter - Interface pour le moteur d'IA (LLM)
 *
 * PHASE 1 : Ce fichier contient uniquement des stubs (fonctions vides)
 * PHASE 2 : Téo implémentera la vraie logique avec Transformer.js + TinyLLaMA
 *
 * Ce module gère :
 * - Chargement du modèle LLM (TinyLLaMA 1.1B quantized)
 * - Génération de réponses via Transformer.js
 * - Gestion du statut du modèle (chargement, erreurs)
 *
 * @module engine/ai-adapter
 */

/**
 * État actuel du modèle IA
 * @type {Object}
 */
const aiState = {
  ready: false,
  loading: false,
  model: null,
  error: null
};

/**
 * Génère une réponse via le modèle d'IA
 *
 * PHASE 1 : Retourne null (pas implémenté)
 * PHASE 2 : Téo implémentera avec Transformer.js
 *
 * @param {string} userMessage - Message de l'utilisateur
 * @param {Array<Object>} conversationHistory - Historique des messages (max 10 derniers)
 * @param {Object} context - Contexte additionnel (documents RAG en Phase 3)
 * @returns {Promise<Object|null>} Réponse générée ou null si non disponible
 *
 * @example
 * const response = await generateResponse(
 *   "Comment obtenir une CNI ?",
 *   [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }],
 *   { documents: [...] }
 * );
 *
 * // Format de retour attendu (Phase 2) :
 * {
 *   content: "Pour obtenir votre CNI...",
 *   confidence: 0.85,
 *   source: 'ai',
 *   metadata: {
 *     model: 'TinyLLaMA-1.1B-Q4',
 *     tokensGenerated: 120,
 *     generationTime: 3500
 *   }
 * }
 */
export async function generateResponse(userMessage, conversationHistory, context) {
  // PHASE 1 : Stub - retourne null
  console.log('[AI] generateResponse appelé (stub Phase 1 - retourne null)');
  console.log('[AI] Message:', userMessage);
  console.log('[AI] History length:', conversationHistory?.length || 0);

  // Phase 2 : Téo implémentera ici :
  // 1. Construire le prompt avec historique + context
  // 2. Appeler Transformer.js pipeline
  // 3. Générer tokens avec TinyLLaMA
  // 4. Parser et retourner la réponse

  return null;
}

/**
 * Vérifie si le modèle IA est prêt à générer des réponses
 *
 * PHASE 1 : Retourne false
 * PHASE 2 : Retournera true une fois le modèle chargé
 *
 * @returns {boolean} True si le modèle est chargé et prêt
 */
export function isReady() {
  // PHASE 1 : Toujours false
  return aiState.ready;
}

/**
 * Obtient le statut détaillé du modèle IA
 *
 * @returns {Object} Statut avec ready, loading, model, error
 *
 * @example
 * const status = getStatus();
 * // Phase 1 : { ready: false, loading: false, model: null, error: null }
 * // Phase 2 (chargé) : { ready: true, loading: false, model: 'TinyLLaMA-1.1B', error: null }
 * // Phase 2 (en chargement) : { ready: false, loading: true, model: null, error: null }
 * // Phase 2 (erreur) : { ready: false, loading: false, model: null, error: 'Description erreur' }
 */
export function getStatus() {
  return {
    ready: aiState.ready,
    loading: aiState.loading,
    model: aiState.model,
    error: aiState.error
  };
}

/**
 * Initialise et charge le modèle IA
 *
 * PHASE 1 : Ne fait rien
 * PHASE 2 : Téo implémentera le chargement de TinyLLaMA via Transformer.js
 *
 * @param {Object} [config] - Configuration optionnelle du modèle
 * @param {string} [config.modelName='TinyLlama/TinyLlama-1.1B-Chat-v1.0'] - Nom du modèle HuggingFace
 * @param {string} [config.quantization='q4'] - Type de quantization (q4, q8, fp16)
 * @param {Function} [config.onProgress] - Callback de progression du téléchargement
 * @returns {Promise<void>}
 *
 * @example
 * await initAI({
 *   modelName: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
 *   quantization: 'q4',
 *   onProgress: (progress) => console.log(`Chargement: ${progress}%`)
 * });
 */
export async function initAI(config = {}) {
  console.log('[AI] initAI appelé (stub Phase 1 - ne fait rien)');
  console.log('[AI] Config:', config);

  // Phase 2 : Téo implémentera ici :
  // 1. Mettre aiState.loading = true
  // 2. Charger Transformer.js pipeline
  // 3. Télécharger + charger TinyLLaMA quantized
  // 4. Mettre aiState.ready = true, aiState.model = 'TinyLLaMA-1.1B'
  // 5. Gérer les erreurs dans aiState.error

  // Exemple structure Phase 2 :
  /*
  try {
    aiState.loading = true;
    aiState.error = null;

    // Import dynamique de Transformer.js
    const { pipeline } = await import('@xenova/transformers');

    // Charger le modèle
    const generator = await pipeline('text-generation', config.modelName, {
      quantized: true,
      progress_callback: config.onProgress
    });

    aiState.model = generator;
    aiState.ready = true;
    aiState.loading = false;

    console.log('[AI] Modèle chargé avec succès');
  } catch (error) {
    console.error('[AI] Erreur chargement modèle:', error);
    aiState.error = error.message;
    aiState.loading = false;
    aiState.ready = false;
  }
  */
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
