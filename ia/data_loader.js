import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const required = ['id', 'question', 'answer', 'tags', 'category'];
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

export function loadKB(filePath) {
    const data = loadJSON(filePath);
    const valid = data.filter(validateKBEntry);
    if (valid.length < data.length) {
        console.warn(`Warning: ${data.length - valid.length} invalid entries in KB.`);
    }
    return valid;
}

export function loadFAQ(filePath) {
    const data = loadJSON(filePath);
    const valid = data.filter(validateFAQEntry);
    if (valid.length < data.length) {
        console.warn(`Warning: ${data.length - valid.length} invalid entries in FAQ.`);
    }
    return valid;
}

export { validateKBEntry, validateFAQEntry };
