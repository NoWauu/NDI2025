/**
 * Rules Engine - Système de réponses basé sur des règles (FAQ matching)
 *
 * Ce module fournit un fallback simple basé sur le matching de mots-clés
 * quand l'IA n'est pas disponible (Phase 1) ou ne trouve pas de réponse.
 *
 * Algorithme : matching simple par mots-clés avec scoring
 *
 * @module engine/rules-engine
 */

/**
 * Cache en mémoire de la FAQ chargée
 * @type {Array|null}
 */
let faqData = null;

/**
 * Seuil minimum de confiance pour retourner une réponse
 * @type {number}
 */
const CONFIDENCE_THRESHOLD = 0.2;

/**
 * Charge la FAQ depuis le fichier JSON
 * @returns {Promise<void>}
 */
export async function loadFAQ() {
  try {
    const response = await fetch('/src/data/faq.json');

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    faqData = data.faq;

    // Normaliser les keywords pour le matching
    faqData.forEach(entry => {
      entry.normalizedKeywords = entry.keywords.map(kw =>
        normalizeText(kw)
      );
    });

    console.log(`[Rules] FAQ chargée avec ${faqData.length} entrées`);
  } catch (error) {
    console.error('[Rules] Erreur chargement FAQ:', error);
    faqData = [];
    throw new Error('Impossible de charger la base de connaissances');
  }
}

/**
 * Normalise un texte pour le matching (lowercase, trim, accents)
 * @param {string} text - Texte à normaliser
 * @returns {string} Texte normalisé
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Supprime les accents
}

/**
 * Tokenize un texte en mots
 * @param {string} text - Texte à tokenizer
 * @returns {Array<string>} Liste de tokens normalisés
 */
function tokenize(text) {
  const normalized = normalizeText(text);
  return normalized
    .split(/\s+/)
    .filter(token => token.length > 2); // Ignore mots < 3 lettres
}

/**
 * Calcule le score de matching entre un message utilisateur et une entrée FAQ
 *
 * @param {Array<string>} userTokens - Tokens du message utilisateur
 * @param {Object} faqEntry - Entrée FAQ
 * @returns {number} Score entre 0 et 1
 */
function calculateMatchScore(userTokens, faqEntry) {
  if (!faqEntry.normalizedKeywords || faqEntry.normalizedKeywords.length === 0) {
    return 0;
  }

  // Compte combien de keywords matchent
  let matchedKeywords = 0;

  for (const keyword of faqEntry.normalizedKeywords) {
    const keywordMatches = userTokens.some(token =>
      token.includes(keyword) || keyword.includes(token)
    );

    if (keywordMatches) {
      matchedKeywords++;
    }
  }

  // Score de base : ratio de keywords matchés
  let score = matchedKeywords / faqEntry.normalizedKeywords.length;

  // Bonus si la priorité est élevée
  const priorityBonus = (faqEntry.priority || 5) / 100;
  score += priorityBonus;

  // Normaliser entre 0 et 1
  return Math.min(score, 1);
}

/**
 * Trouve la meilleure réponse pour un message utilisateur
 *
 * @param {string} userMessage - Message de l'utilisateur
 * @returns {Object} Objet réponse avec contenu, confiance, source et métadonnées
 */
export function findAnswer(userMessage) {
  // Vérifier que la FAQ est chargée
  if (!faqData || faqData.length === 0) {
    console.warn('[Rules] FAQ non chargée, réponse par défaut');
    return getDefaultResponse();
  }

  // Tokenize le message utilisateur
  const userTokens = tokenize(userMessage);

  if (userTokens.length === 0) {
    return getDefaultResponse();
  }

  // Calculer les scores pour chaque entrée
  const scoredEntries = faqData.map(entry => ({
    entry,
    score: calculateMatchScore(userTokens, entry)
  }));

  // Trier par score décroissant
  scoredEntries.sort((a, b) => b.score - a.score);

  const bestMatch = scoredEntries[0];

  // Si le meilleur score est sous le seuil, réponse par défaut
  if (bestMatch.score < CONFIDENCE_THRESHOLD) {
    console.log(`[Rules] Aucun match suffisant (meilleur score: ${bestMatch.score.toFixed(2)})`);
    return getDefaultResponse();
  }

  // Retourner la meilleure réponse
  console.log(`[Rules] Match trouvé: ${bestMatch.entry.id} (score: ${bestMatch.score.toFixed(2)})`);

  return {
    content: bestMatch.entry.answer_fr,
    confidence: bestMatch.score,
    source: 'rules',
    metadata: {
      matchedEntry: bestMatch.entry.id,
      category: bestMatch.entry.category,
      question: bestMatch.entry.question_fr,
      language: 'fr'
    }
  };
}

/**
 * Retourne une réponse par défaut quand aucun match n'est trouvé
 * @returns {Object} Objet réponse par défaut
 */
export function getDefaultResponse() {
  const suggestions = [
    "Comment obtenir une carte d'identité ?",
    "Comment inscrire mon enfant à l'école ?",
    "Où faire vacciner mon enfant ?",
    "Comment chercher un emploi ?",
    "Comment obtenir un permis de conduire ?"
  ];

  const randomSuggestions = suggestions
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const content = `Je n'ai pas trouvé de réponse précise à votre question dans ma base de connaissances actuelle.

Voici quelques questions fréquentes que je peux vous aider à résoudre :

${randomSuggestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

N'hésitez pas à reformuler votre question ou à choisir l'un des sujets ci-dessus !`;

  return {
    content,
    confidence: 0,
    source: 'rules',
    metadata: {
      matchedEntry: null,
      category: 'default',
      language: 'fr'
    }
  };
}

/**
 * Obtient des statistiques sur la FAQ chargée
 * @returns {Object} Statistiques (nombre d'entrées, catégories)
 */
export function getFAQStats() {
  if (!faqData) {
    return { loaded: false, count: 0, categories: [] };
  }

  const categories = [...new Set(faqData.map(e => e.category))];

  return {
    loaded: true,
    count: faqData.length,
    categories: categories,
    categoryCounts: categories.reduce((acc, cat) => {
      acc[cat] = faqData.filter(e => e.category === cat).length;
      return acc;
    }, {})
  };
}

/**
 * Recherche des entrées FAQ par catégorie
 * @param {string} category - Catégorie à filtrer
 * @returns {Array} Liste des entrées de cette catégorie
 */
export function getEntriesByCategory(category) {
  if (!faqData) {
    return [];
  }

  return faqData.filter(entry => entry.category === category);
}
