const fs = require('fs');
const path = require('path');

/**
 * Valide si un objet KBEntry a tous les champs requis.
 * @param {Object} entry 
 * @returns {boolean}
 */
function validateKBEntry(entry) {
    const required = ['id', 'title', 'lang', 'tags', 'body'];
    return required.every(field => field in entry);
}

/**
 * Valide si un objet FAQEntry a tous les champs requis.
 * @param {Object} entry 
 * @returns {boolean}
 */
function validateFAQEntry(entry) {
    const required = ['id', 'question', 'answer', 'tags', 'category']; // answer generic for loaded file
    // Note: The user spec had answer_fr/answer_ar in one file in the prompt example, 
    // but then asked for separate files data/faq_fr_rag.json and data/faq_ar_rag.json.
    // I implemented separate files with 'answer' field. 
    // If the user meant a single structure with both languages, I should adapt.
    // Looking at the prompt: "Définir un format JSON pour la FAQ FR/AR... { answer_fr: ..., answer_ar: ... }"
    // BUT THEN: "Générer des fichiers data/faq_fr_rag.json, data/faq_ar_rag.json"
    // This implies split files. I will stick to 'answer' in split files or check if I should use specific keys.
    // Let's support 'answer' or 'answer_fr'/'answer_ar'.
    return required.every(field => field in entry) || 
           (entry.id && entry.question && (entry.answer_fr || entry.answer_ar) && entry.tags && entry.category);
}

function loadJSON(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error(`Error loading ${filePath}:`, e);
        return [];
    }
}

function loadKB(filePath) {
    const data = loadJSON(filePath);
    const valid = data.filter(validateKBEntry);
    if (valid.length < data.length) {
        console.warn(`Warning: ${data.length - valid.length} invalid entries in KB.`);
    }
    return valid;
}

function loadFAQ(filePath) {
    const data = loadJSON(filePath);
    const valid = data.filter(validateFAQEntry);
    if (valid.length < data.length) {
        console.warn(`Warning: ${data.length - valid.length} invalid entries in FAQ.`);
    }
    return valid;
}

module.exports = {
    loadKB,
    loadFAQ,
    validateKBEntry,
    validateFAQEntry
};
