/**
 * @typedef {Object} KBEntry
 * @property {string} id
 * @property {string} title
 * @property {string} lang
 * @property {string[]} tags
 * @property {string} body
 */

/**
 * @typedef {Object} FAQEntry
 * @property {string} id
 * @property {string} question
 * @property {string} answer
 * @property {string[]} tags
 * @property {string} category
 */

/**
 * @typedef {Object} EmbeddingEntry
 * @property {string} id
 * @property {number[]} vector
 * @property {Object} meta
 * @property {"kb" | "faq"} meta.refType
 * @property {string} meta.refId
 */

/**
 * Construit un prompt simple à partir du contexte (Stub).
 * @param {Object} params
 * @param {string} params.question
 * @param {string} params.language
 * @param {KBEntry[]} params.kbSnippets
 * @param {FAQEntry[]} params.faqSnippets
 * @returns {string}
 */
export function buildPromptFromContext({
  question,
  language,
  kbSnippets,
  faqSnippets,
}) {
  // Cette fonction sera connectée au module de prompting en Phase 3.
  // Pour l'instant, elle retourne une chaîne simple.
  return `[STUB] Prompt pour "${question}" (${language}) avec ${kbSnippets.length} KB et ${faqSnippets.length} FAQ.`;
}

/**
 * Sélectionne le contexte pertinent pour une question (Stub).
 * @param {string} question
 * @returns {Promise<{kbSnippets: KBEntry[], faqSnippets: FAQEntry[]}>}
 */
export async function selectRagContext(question) {
  // TODO: Phase 3 - Implémenter la recherche vectorielle (embedding + similarity search).
  // Pour l'instant, retourne des listes vides ou des documents fictifs.

  console.log(`[RAG Stub] Recherche de contexte pour : "${question}"`);

  return {
    kbSnippets: [],
    faqSnippets: [],
  };
}
