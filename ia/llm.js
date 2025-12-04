/**
 * Module LLM - Stub pour Phase 2
 *
 * Ce module sera implémenté en Phase 2 pour intégrer TinyLLaMA ou autre LLM local.
 * Pour l'instant, il retourne une réponse simulée.
 */

/**
 * Génère une réponse à partir d'un prompt (Stub)
 * @param {string} prompt - Le prompt complet
 * @returns {Promise<string>} La réponse générée
 */
export async function generateLLMResponse(prompt) {
    console.log('[LLM Stub] Génération simulée pour prompt:', prompt.substring(0, 100) + '...');

    // Phase 2: Ici on intégrera TinyLLaMA via Transformer.js ou ONNX
    return '[IA Stub] Ceci est une réponse simulée. Le LLM sera intégré en Phase 2.';
}
