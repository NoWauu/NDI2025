/**
 * Model Configuration - Gestion de la configuration du modèle IA
 *
 * Source of truth pour la version et les métadonnées du modèle
 */

/**
 * Configuration du modèle IA
 */
export const MODEL_CONFIG = {
    // Informations du modèle
    name: 'TinyLlama-1.1B-Chat-v1.0',
    provider: 'TinyLlama',
    version: '1.0.0',
    buildDate: '2025-12-05',

    // Hash de vérification (à implémenter en production)
    modelHash: null,

    // Taille et variantes
    size: {
        quantized: '500MB',
        full: '2.2GB'
    },

    variants: [
        {
            id: 'q4',
            name: 'TinyLlama Q4 Quantized',
            size: '500MB',
            recommended: true,
            description: 'Version quantifiée 4-bit, meilleur compromis taille/performance'
        },
        {
            id: 'q8',
            name: 'TinyLlama Q8 Quantized',
            size: '1GB',
            recommended: false,
            description: 'Version quantifiée 8-bit, meilleure qualité'
        },
        {
            id: 'fp16',
            name: 'TinyLlama FP16',
            size: '2.2GB',
            recommended: false,
            description: 'Version complète 16-bit, qualité maximale'
        }
    ],

    // Variante par défaut
    defaultVariant: 'q4',

    // Paramètres de génération par défaut
    defaultParams: {
        maxNewTokens: 150,
        temperature: 0.7,
        topK: 50,
        topP: 0.9,
        doSample: true,
        repetitionPenalty: 1.1
    },

    // URLs de téléchargement
    downloadUrls: {
        q4: 'https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0/resolve/main/ggml-model-q4_0.gguf',
        q8: 'https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0/resolve/main/ggml-model-q8_0.gguf',
        fp16: 'https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0'
    },

    // Contraintes système
    systemRequirements: {
        minRAM: '1GB',
        recommendedRAM: '2GB',
        minDisk: '600MB',
        browserSupport: ['Chrome 90+', 'Firefox 88+', 'Safari 14+', 'Edge 90+']
    },

    // Métriques de performance estimées
    performance: {
        estimatedLoadTime: '30-60s',
        estimatedResponseTime: '2-5s',
        tokensPerSecond: '~20-30'
    },

    // Statut
    status: {
        available: true,
        stable: true,
        experimental: false
    },

    // Support langues
    languages: ['fr', 'ar', 'en'],

    // Capacités
    capabilities: {
        chat: true,
        completion: true,
        contextWindow: 2048,
        maxOutputTokens: 512
    }
};

/**
 * Obtient la configuration complète du modèle
 */
export function getModelInfo() {
    return {
        ...MODEL_CONFIG,
        serverTimestamp: new Date().toISOString()
    };
}

/**
 * Obtient une variante spécifique
 */
export function getVariant(variantId) {
    return MODEL_CONFIG.variants.find(v => v.id === variantId);
}

/**
 * Obtient la variante recommandée
 */
export function getRecommendedVariant() {
    return MODEL_CONFIG.variants.find(v => v.recommended) || MODEL_CONFIG.variants[0];
}

/**
 * Valide les paramètres de génération
 */
export function validateGenerationParams(params) {
    const errors = [];

    if (params.maxNewTokens && (params.maxNewTokens < 1 || params.maxNewTokens > 512)) {
        errors.push('maxNewTokens doit être entre 1 et 512');
    }

    if (params.temperature && (params.temperature < 0 || params.temperature > 2)) {
        errors.push('temperature doit être entre 0 et 2');
    }

    if (params.topK && (params.topK < 1 || params.topK > 100)) {
        errors.push('topK doit être entre 1 et 100');
    }

    if (params.topP && (params.topP < 0 || params.topP > 1)) {
        errors.push('topP doit être entre 0 et 1');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Fusionne les paramètres utilisateur avec les paramètres par défaut
 */
export function mergeWithDefaults(userParams = {}) {
    return {
        ...MODEL_CONFIG.defaultParams,
        ...userParams
    };
}
