const { buildPrompt } = require('./ia/prompting');
// const { selectRagContext } = require('./ia/rag_pipeline'); // Sera utilisé en Phase 3

/**
 * Orchestration côté frontend (ou backend Node léger) pour préparer la requête IA.
 * @param {string} userText 
 * @param {string} language 'fr' | 'ar'
 */
async function buildIaRequestFromUserMessage(userText, language) {
    // Phase 3: compléter kbSnippets et faqSnippets avec le RAG via selectRagContext(userText)
    const kbSnippets = []; // TODO: viendra du RAG plus tard
    const faqSnippets = []; // TODO: idem

    const prompt = buildPrompt({ question: userText, language, kbSnippets, faqSnippets });
    
    // Phase 2: appeler ici le LLM local si c'est un backend, ou retourner le prompt pour le client
    return { prompt, meta: { language } };
}

// Exemple d'utilisation (simulation d'un message utilisateur)
async function main() {
    const userMessage = "Comment faire un passeport ?";
    const lang = "fr";

    console.log(`Utilisateur: "${userMessage}"`);
    const request = await buildIaRequestFromUserMessage(userMessage, lang);
    
    console.log("Requête IA générée :", JSON.stringify(request, null, 2));
    // Ici on pourrait envoyer 'request' au worker IA ou au modèle chargé
}

if (require.main === module) {
    main();
}

module.exports = {
    buildIaRequestFromUserMessage
};
