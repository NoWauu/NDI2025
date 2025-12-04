/**
 * Template système FR
 * @returns {string}
 */
export function buildSystemPromptFR() {
    return "Tu es un assistant pour les services publics mauritaniens. Tu réponds en français de façon claire et concise.";
}

/**
 * Template système AR
 * @returns {string}
 */
export function buildSystemPromptAR() {
    return "أنت مساعد للخدمات العامة الموريتانية. تجيب باللغة العربية بوضوح وإيجاز.";
}

/**
 * Formate le contexte pour le prompt.
 * @param {Array} kbSnippets
 * @param {Array} faqSnippets
 * @returns {string}
 */
export function formatContext(kbSnippets, faqSnippets) {
    let contextParts = [];

    if (kbSnippets && kbSnippets.length > 0) {
        contextParts.push("--- INFORMATION OFFICIELLE ---");
        kbSnippets.forEach(kb => {
            contextParts.push(`Titre: ${kb.title}\nContenu: ${kb.body}`);
        });
    }

    if (faqSnippets && faqSnippets.length > 0) {
        contextParts.push("--- QUESTIONS FRÉQUENTES ---");
        faqSnippets.forEach(faq => {
            contextParts.push(`Q: ${faq.question}\nR: ${faq.answer || faq.answer_fr || faq.answer_ar}`);
        });
    }

    // TODO: Ajouter une limite de longueur (token limit) en Phase 3.
    return contextParts.join("\n\n");
}

/**
 * Fonction centrale pour construire le prompt complet.
 * @param {Object} params
 * @param {string} params.question
 * @param {string} params.language 'fr' | 'ar'
 * @param {Array} params.kbSnippets
 * @param {Array} params.faqSnippets
 * @returns {string}
 */
export function buildPrompt({ question, language, kbSnippets, faqSnippets }) {
    const system = language === 'ar' ? buildSystemPromptAR() : buildSystemPromptFR();
    const context = formatContext(kbSnippets, faqSnippets);

    const contextSection = context ? `\n\nContexte:\n${context}` : "";

    return `${system}${contextSection}\n\nQuestion:\n${question}\n\nRéponds dans la langue ${language}.`;
}
