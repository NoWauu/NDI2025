/**
 * Fallback Engine - Système de réponses de secours
 *
 * Utilisé quand le LLM local échoue ou n'est pas disponible.
 * Basé sur des règles simples et des heuristiques.
 */

import { loadFAQ } from './data_loader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache FAQ
let faqCache = { fr: [], ar: [] };

/**
 * Initialise le fallback engine
 */
export async function initFallbackEngine() {
    console.log('[Fallback] Initialisation...');

    // Charger FAQ FR et AR
    const faqFRPath = path.join(__dirname, '..', 'data', 'faq_fr_rag.json');
    const faqARPath = path.join(__dirname, '..', 'data', 'faq_ar_rag.json');

    faqCache.fr = loadFAQ(faqFRPath);
    faqCache.ar = loadFAQ(faqARPath);

    console.log(`[Fallback] ${faqCache.fr.length} FAQ FR + ${faqCache.ar.length} FAQ AR chargées`);
}

/**
 * Normalise un texte (lowercase, trim, sans accents)
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Tokenize un texte
 */
function tokenize(text) {
    const normalized = normalizeText(text);
    return normalized
        .split(/\s+/)
        .filter(token => token.length > 2);
}

/**
 * Calcule la similarité entre deux ensembles de tokens
 */
function calculateSimilarity(userTokens, faqTokens) {
    let matches = 0;

    for (const userToken of userTokens) {
        for (const faqToken of faqTokens) {
            if (userToken.includes(faqToken) || faqToken.includes(userToken)) {
                matches++;
                break;
            }
        }
    }

    return matches / Math.max(userTokens.length, faqTokens.length);
}

/**
 * Trouve la meilleure réponse FAQ pour un message
 *
 * @param {string} message - Message utilisateur
 * @param {string} language - Langue ('fr' ou 'ar')
 * @param {string} reason - Raison du fallback
 * @returns {Object} Réponse formatée
 */
export function generateFallbackResponse(message, language = 'fr', reason = 'unknown') {
    console.log(`[Fallback] Génération réponse (langue: ${language}, raison: ${reason})`);

    const faqs = faqCache[language] || faqCache.fr;

    if (faqs.length === 0) {
        return getDefaultFallbackResponse(language, reason);
    }

    // Tokenize le message
    const userTokens = tokenize(message);

    if (userTokens.length === 0) {
        return getDefaultFallbackResponse(language, reason);
    }

    // Calculer similarité avec chaque FAQ
    const scored = faqs.map(faq => {
        const questionTokens = tokenize(faq.question);
        const score = calculateSimilarity(userTokens, questionTokens);
        return { faq, score };
    });

    // Trier par score
    scored.sort((a, b) => b.score - a.score);

    const bestMatch = scored[0];
    const threshold = 0.2;

    if (bestMatch.score < threshold) {
        console.log(`[Fallback] Aucun match (score: ${bestMatch.score.toFixed(2)})`);
        return getDefaultFallbackResponse(language, reason);
    }

    console.log(`[Fallback] Match trouvé: ${bestMatch.faq.id} (score: ${bestMatch.score.toFixed(2)})`);

    return {
        content: bestMatch.faq.answer || bestMatch.faq.answer_fr || bestMatch.faq.answer_ar,
        confidence: bestMatch.score,
        source: 'fallback',
        metadata: {
            language,
            fallbackReason: reason,
            matchedFAQ: bestMatch.faq.id,
            matchScore: bestMatch.score,
            category: bestMatch.faq.category
        }
    };
}

/**
 * Réponse par défaut quand aucun match n'est trouvé
 */
function getDefaultFallbackResponse(language, reason) {
    const messages = {
        fr: {
            timeout: "Désolé, la génération de la réponse a pris trop de temps. Pouvez-vous reformuler votre question ?",
            low_confidence: "Je ne suis pas sûr de comprendre votre question. Pouvez-vous la reformuler différemment ?",
            error: "Une erreur s'est produite. Veuillez réessayer.",
            unknown: "Je n'ai pas pu trouver de réponse précise à votre question. Voici quelques questions fréquentes :\n\n" +
                     "• Comment obtenir une carte d'identité ?\n" +
                     "• Quel est le coût du passeport ?\n" +
                     "• Comment s'inscrire à l'école ?"
        },
        ar: {
            timeout: "عذرًا، استغرق إنشاء الإجابة وقتًا طويلاً. هل يمكنك إعادة صياغة سؤالك؟",
            low_confidence: "لست متأكدًا من فهم سؤالك. هل يمكنك إعادة صياغته بشكل مختلف؟",
            error: "حدث خطأ. يرجى المحاولة مرة أخرى.",
            unknown: "لم أتمكن من العثور على إجابة دقيقة لسؤالك. فيما يلي بعض الأسئلة الشائعة:\n\n" +
                     "• كيف أحصل على بطاقة الهوية؟\n" +
                     "• ما هي تكلفة جواز السفر؟\n" +
                     "• كيف أسجل في المدرسة؟"
        }
    };

    const lang = messages[language] || messages.fr;
    const content = lang[reason] || lang.unknown;

    return {
        content,
        confidence: 0,
        source: 'fallback',
        metadata: {
            language,
            fallbackReason: reason,
            matchedFAQ: null,
            isDefault: true
        }
    };
}

/**
 * Statistiques du fallback engine
 */
export function getFallbackStats() {
    return {
        faqFR: faqCache.fr.length,
        faqAR: faqCache.ar.length,
        ready: faqCache.fr.length > 0 || faqCache.ar.length > 0
    };
}
