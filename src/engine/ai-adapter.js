/**
 * AI Adapter - Interface pour le moteur d'IA Local (Phase 2)
 *
 * Intégration de TinyLLaMA via Transformer.js pour génération locale
 * avec fallback backend intelligent.
 *
 * @module engine/ai-adapter
 */

/**
 * Configuration
 */
const CONFIG = {
  // URLs
  BACKEND_CHAT_URL: 'http://localhost:4000/api/chat',
  BACKEND_FALLBACK_URL: 'http://localhost:4000/ai/fallback',
  BACKEND_MODEL_INFO_URL: 'http://localhost:4000/ai/model-info',

  // Modèle
  MODEL_ID: 'Xenova/TinyLlama-1.1B-Chat-v1.0',

  // Timeouts
  MODEL_LOAD_TIMEOUT: 120000, // 2 minutes
  GENERATION_TIMEOUT: 15000,   // 15 secondes

  // Seuils
  MIN_CONFIDENCE: 0.5,

  // Paramètres génération
  GENERATION_PARAMS: {
    max_new_tokens: 150,
    temperature: 0.7,
    top_k: 50,
    top_p: 0.9,
    do_sample: true,
    repetition_penalty: 1.1
  }
};

/**
 * État de l'IA
 */
const aiState = {
  ready: false,
  loading: false,
  model: null,
  pipeline: null,
  error: null,
  loadProgress: 0,
  useLocalLLM: false, // Mode hybride : local ou backend
  stats: {
    totalGenerations: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    avgGenerationTime: 0,
    fallbackCount: 0
  }
};

/**
 * Détecte la langue d'un message
 */
function detectLanguage(message) {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(message) ? 'ar' : 'fr';
}

/**
 * Construit le prompt pour TinyLLaMA
 */
function buildPrompt(userMessage, language, conversationHistory = []) {
  const systemPrompts = {
    fr: "Tu es un assistant virtuel pour les services publics mauritaniens. Tu réponds de manière claire, concise et professionnelle en français. Si tu ne sais pas, dis-le honnêtement.",
    ar: "أنت مساعد افتراضي للخدمات العامة الموريتانية. تجيب بوضوح وإيجاز واحترافية باللغة العربية. إذا كنت لا تعرف، قل ذلك بصراحة."
  };

  const systemPrompt = systemPrompts[language] || systemPrompts.fr;

  // Format pour TinyLlama Chat
  let prompt = `<|system|>\n${systemPrompt}</s>\n`;

  // Ajouter l'historique (max 3 derniers échanges)
  const recentHistory = conversationHistory.slice(-6); // 3 paires user/assistant
  for (const msg of recentHistory) {
    if (msg.role === 'user') {
      prompt += `<|user|>\n${msg.content}</s>\n`;
    } else if (msg.role === 'assistant') {
      prompt += `<|assistant|>\n${msg.content}</s>\n`;
    }
  }

  // Ajouter le message actuel
  prompt += `<|user|>\n${userMessage}</s>\n<|assistant|>\n`;

  return prompt;
}

/**
 * Initialise le modèle LLM local
 */
export async function initAI(config = {}) {
  console.log('[AI Adapter] Initialisation du LLM local...');

  // Vérifier si on peut charger le modèle local
  if (!window.crossOriginIsolated) {
    console.warn('[AI Adapter] ATTENTION: crossOriginIsolated=false. Le LLM local ne fonctionnera peut-être pas optimalement.');
    console.warn('[AI Adapter] Utilisation du mode backend uniquement.');
    aiState.useLocalLLM = false;
    aiState.ready = true;
    aiState.model = 'backend-only';
    return;
  }

  try {
    aiState.loading = true;
    aiState.loadProgress = 0;
    aiState.error = null;

    console.log('[AI Adapter] Chargement de Transformer.js...');

    // Import dynamique de Transformer.js
    const { pipeline, env } = await import('@xenova/transformers');

    // Configuration
    env.allowLocalModels = false;
    env.allowRemoteModels = true;

    console.log(`[AI Adapter] Téléchargement du modèle ${CONFIG.MODEL_ID}...`);
    console.log('[AI Adapter] Cela peut prendre 1-2 minutes...');

    // Callback de progression
    const progressCallback = (progress) => {
      if (progress.status === 'progress') {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        aiState.loadProgress = percent;
        console.log(`[AI Adapter] Chargement: ${percent}%`);
      }
    };

    // Timeout pour le chargement
    const loadPromise = pipeline(
      'text-generation',
      CONFIG.MODEL_ID,
      {
        quantized: true,
        progress_callback: progressCallback
      }
    );

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout chargement modèle')), CONFIG.MODEL_LOAD_TIMEOUT)
    );

    aiState.pipeline = await Promise.race([loadPromise, timeoutPromise]);

    aiState.loading = false;
    aiState.ready = true;
    aiState.useLocalLLM = true;
    aiState.model = CONFIG.MODEL_ID;
    aiState.loadProgress = 100;

    console.log('[AI Adapter] ✅ Modèle LLM chargé avec succès !');
    console.log(`[AI Adapter] Mode: Local LLM (${CONFIG.MODEL_ID})`);

  } catch (error) {
    console.error('[AI Adapter] ❌ Erreur chargement modèle:', error);
    console.log('[AI Adapter] Fallback: Utilisation du backend uniquement');

    aiState.loading = false;
    aiState.ready = true;
    aiState.useLocalLLM = false;
    aiState.model = 'backend-only';
    aiState.error = error.message;
  }
}

/**
 * Génère une réponse avec le LLM local
 */
async function generateLocalLLM(prompt) {
  if (!aiState.pipeline) {
    throw new Error('Pipeline non initialisé');
  }

  const startTime = Date.now();

  console.log('[AI Adapter] Génération locale en cours...');

  try {
    // Timeout pour la génération
    const generatePromise = aiState.pipeline(prompt, {
      ...CONFIG.GENERATION_PARAMS,
      return_full_text: false
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout génération')), CONFIG.GENERATION_TIMEOUT)
    );

    const result = await Promise.race([generatePromise, timeoutPromise]);

    const generatedText = result[0].generated_text.trim();
    const generationTime = Date.now() - startTime;

    // Mise à jour stats
    aiState.stats.totalGenerations++;
    aiState.stats.successfulGenerations++;
    aiState.stats.avgGenerationTime =
      (aiState.stats.avgGenerationTime * (aiState.stats.totalGenerations - 1) + generationTime) /
      aiState.stats.totalGenerations;

    console.log(`[AI Adapter] ✅ Génération réussie (${generationTime}ms)`);

    return {
      content: generatedText,
      confidence: 0.8, // Confidence élevée pour génération locale réussie
      generationTime
    };

  } catch (error) {
    aiState.stats.totalGenerations++;
    aiState.stats.failedGenerations++;

    console.error('[AI Adapter] ❌ Erreur génération locale:', error);
    throw error;
  }
}

/**
 * Appelle le fallback backend
 */
async function callBackendFallback(userMessage, language, reason) {
  console.log(`[AI Adapter] Fallback backend (raison: ${reason})...`);

  aiState.stats.fallbackCount++;

  try {
    const response = await fetch(CONFIG.BACKEND_FALLBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        language,
        reason
      })
    });

    if (!response.ok) {
      throw new Error(`Backend fallback error: ${response.status}`);
    }

    const data = await response.json();

    console.log('[AI Adapter] ✅ Fallback backend réussi');

    return {
      content: data.content,
      confidence: data.confidence,
      source: 'fallback',
      metadata: {
        ...data.metadata,
        fallbackReason: reason
      }
    };

  } catch (error) {
    console.error('[AI Adapter] ❌ Erreur fallback backend:', error);
    throw error;
  }
}

/**
 * Génère une réponse (fonction principale)
 */
export async function generateResponse(userMessage, conversationHistory = [], context = {}) {
  console.log('[AI Adapter] Génération de réponse...');
  console.log('[AI Adapter] Message:', userMessage.substring(0, 50) + '...');

  const language = detectLanguage(userMessage);

  // Si le modèle local n'est pas disponible, utiliser directement le backend
  if (!aiState.useLocalLLM || !aiState.pipeline) {
    console.log('[AI Adapter] Mode backend uniquement');

    try {
      const response = await fetch(CONFIG.BACKEND_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          language,
          history: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      return {
        content: data.content,
        confidence: data.confidence ?? 0.5,
        source: 'backend',
        metadata: data.metadata ?? {}
      };

    } catch (error) {
      console.error('[AI Adapter] Erreur backend:', error);

      // Dernier fallback
      try {
        return await callBackendFallback(userMessage, language, 'backend_error');
      } catch (fallbackError) {
        // Retourner null pour fallback rules-engine frontend
        return null;
      }
    }
  }

  // Mode local LLM
  try {
    const prompt = buildPrompt(userMessage, language, conversationHistory);

    const result = await generateLocalLLM(prompt);

    // Vérifier la confiance
    if (result.confidence < CONFIG.MIN_CONFIDENCE) {
      console.log(`[AI Adapter] Confiance faible (${result.confidence}), fallback...`);
      return await callBackendFallback(userMessage, language, 'low_confidence');
    }

    return {
      content: result.content,
      confidence: result.confidence,
      source: 'local_llm',
      metadata: {
        language,
        model: CONFIG.MODEL_ID,
        generationTime: result.generationTime
      }
    };

  } catch (error) {
    console.error('[AI Adapter] Erreur génération:', error);

    // Déterminer la raison du fallback
    const reason = error.message.includes('Timeout') ? 'timeout' : 'error';

    // Tenter le fallback backend
    try {
      return await callBackendFallback(userMessage, language, reason);
    } catch (fallbackError) {
      console.error('[AI Adapter] Fallback échoué également');
      // Retourner null pour fallback rules-engine frontend
      return null;
    }
  }
}

/**
 * Vérifie si l'IA est prête
 */
export function isReady() {
  return aiState.ready;
}

/**
 * Obtient le statut de l'IA
 */
export function getStatus() {
  return {
    ready: aiState.ready,
    loading: aiState.loading,
    model: aiState.model,
    error: aiState.error,
    loadProgress: aiState.loadProgress,
    useLocalLLM: aiState.useLocalLLM,
    stats: { ...aiState.stats }
  };
}

/**
 * Obtient les statistiques
 */
export function getAIStats() {
  return {
    ...aiState.stats,
    modelSize: aiState.useLocalLLM ? '~500MB (Q4)' : 'N/A',
    mode: aiState.useLocalLLM ? 'Local LLM' : 'Backend Only'
  };
}

/**
 * Décharge le modèle
 */
export async function unloadAI() {
  console.log('[AI Adapter] Déchargement du modèle...');

  if (aiState.pipeline) {
    // Transformer.js n'a pas de méthode dispose explicite
    aiState.pipeline = null;
  }

  aiState.ready = false;
  aiState.loading = false;
  aiState.model = null;
  aiState.error = null;
  aiState.useLocalLLM = false;

  console.log('[AI Adapter] Modèle déchargé');
}
