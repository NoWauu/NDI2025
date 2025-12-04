const { buildPrompt } = require('../ia/prompting');
const { loadKB, loadFAQ } = require('../ia/data_loader');
const path = require('path');

// Stub pour le LLM local
async function runLocalLLM(prompt) {
    // TODO: remplacer par appel réel au modèle TinyLLaMA ou autre en Phase 2
    console.log("--- Simulation LLM ---");
    console.log("Prompt reçu:", prompt);
    console.log("----------------------");
    return "Ceci est une réponse simulée par le script de test.";
}

async function testWithKB() {
    const kbPath = path.join(__dirname, '../data/kb_services_mauritanie.json');
    const faqPath = path.join(__dirname, '../data/faq_fr_rag.json');

    const kbData = loadKB(kbPath);
    const faqData = loadFAQ(faqPath);

    // Simulation d'une question utilisateur
    const question = "Quels documents pour la CNI ?";
    const language = "fr";

    // Simulation de récupération de contexte (normalement via RAG)
    // Ici on prend juste le premier élément pour tester le formatage
    const kbSnippets = kbData.slice(0, 1);
    const faqSnippets = faqData.slice(0, 1);

    const prompt = buildPrompt({ question, language, kbSnippets, faqSnippets });
    
    const response = await runLocalLLM(prompt);
    console.log("\nRéponse finale simulée :\n", response);
}

testWithKB();
