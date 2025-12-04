/**
 * Application Backend IA - Point d'entrée principal
 *
 * Ce module orchestre le pipeline complet :
 * 1. Chargement des données (KB + FAQ)
 * 2. Construction du prompt avec contexte
 * 3. Génération de la réponse (stub pour Phase 1)
 */

import { loadKB, loadFAQ } from './data_loader.js';
import { buildPrompt } from './prompting.js';
import { selectRagContext } from './rag.js';
import { generateLLMResponse } from './llm.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Données chargées en mémoire
let kbData = [];
let faqDataFR = [];
let faqDataAR = [];
let isInitialized = false;

/**
 * Initialise le backend : charge toutes les données
 */
export async function initBackend() {
    if (isInitialized) {
        console.log('[Backend] Déjà initialisé');
        return;
    }

    console.log('[Backend] Initialisation...');

    try {
        // Charger la base de connaissance
        const kbPath = path.join(__dirname, '..', 'data', 'kb_services_mauritanie.json');
        kbData = loadKB(kbPath);
        console.log(`[Backend] KB chargée: ${kbData.length} entrées`);

        // Charger FAQ FR
        const faqFRPath = path.join(__dirname, '..', 'data', 'faq_fr_rag.json');
        faqDataFR = loadFAQ(faqFRPath);
        console.log(`[Backend] FAQ FR chargée: ${faqDataFR.length} entrées`);

        // Charger FAQ AR
        const faqARPath = path.join(__dirname, '..', 'data', 'faq_ar_rag.json');
        faqDataAR = loadFAQ(faqARPath);
        console.log(`[Backend] FAQ AR chargée: ${faqDataAR.length} entrées`);

        isInitialized = true;
        console.log('[Backend] Initialisation terminée');
    } catch (error) {
        console.error('[Backend] Erreur lors de l\'initialisation:', error);
        throw error;
    }
}

/**
 * Fonction principale exposée au serveur HTTP
 *
 * @param {Object} params
 * @param {string} params.message - Message de l'utilisateur
 * @param {string} params.language - Langue ('fr' ou 'ar')
 * @param {Array} [params.history] - Historique de conversation (optionnel pour Phase 1)
 * @returns {Promise<Object>} Réponse formatée
 */
export async function generateIaResponse({ message, language = 'fr', history = [] }) {
    console.log(`[Backend] generateIaResponse appelée: "${message}" (${language})`);

    // Vérifier l'initialisation
    if (!isInitialized) {
        await initBackend();
    }

    try {
        // 1. Sélectionner le contexte RAG (Phase 3 - pour l'instant retourne vide)
        const ragContext = await selectRagContext(message);

        // 2. Ajouter quelques entrées de KB et FAQ pour avoir du contexte (Phase 1)
        // En Phase 3, ceci sera remplacé par la vraie recherche vectorielle
        const kbSnippets = kbData.filter(kb => kb.lang === language).slice(0, 2);
        const faqSnippets = (language === 'ar' ? faqDataAR : faqDataFR).slice(0, 2);

        // 3. Construire le prompt complet
        const prompt = buildPrompt({
            question: message,
            language,
            kbSnippets: [...ragContext.kbSnippets, ...kbSnippets],
            faqSnippets: [...ragContext.faqSnippets, ...faqSnippets]
        });

        console.log('[Backend] Prompt construit:', prompt.substring(0, 150) + '...');

        // 4. Générer la réponse via LLM (Phase 2 - pour l'instant stub)
        // const llmResponse = await generateLLMResponse(prompt);

        // Phase 1: Retourner juste le prompt comme contenu pour tester le pipeline
        const content = prompt;

        // 5. Retourner la réponse au format attendu par le frontend
        return {
            content: content,
            confidence: 0.5,
            source: 'ai',
            metadata: {
                language,
                kbEntriesUsed: kbSnippets.length,
                faqEntriesUsed: faqSnippets.length,
                ragEnabled: false // Phase 3
            }
        };
    } catch (error) {
        console.error('[Backend] Erreur lors de la génération:', error);
        throw error;
    }
}

/**
 * Obtient le statut du backend
 */
export function getBackendStatus() {
    return {
        initialized: isInitialized,
        kbEntries: kbData.length,
        faqFREntries: faqDataFR.length,
        faqAREntries: faqDataAR.length
    };
}
