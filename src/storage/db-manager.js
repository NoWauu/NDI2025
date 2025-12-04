/**
 * Database Manager - Gestion du stockage local avec IndexedDB via Dexie.js
 *
 * Ce module gère la persistance locale des données :
 * - Messages de conversation
 * - Base de connaissance (FAQ, documents)
 * - Configuration utilisateur
 *
 * @module storage/db-manager
 */

import Dexie from 'dexie';

/**
 * Instance IndexedDB via Dexie
 * @type {Dexie}
 */
const db = new Dexie('ChatBotDB');

// Schéma de la base de données
db.version(1).stores({
  // Historique des messages (auto-increment id, indexé par timestamp et role)
  messages: '++id, timestamp, role',

  // Base de connaissance (FAQ, documents pour RAG Phase 3)
  knowledgeBase: 'id, category',

  // Configuration utilisateur (clé-valeur)
  config: 'key'
});

/**
 * Initialise la connexion à IndexedDB
 * @returns {Promise<void>}
 */
export async function initDB() {
  try {
    await db.open();
    console.log('[DB] IndexedDB initialisée avec succès');
  } catch (error) {
    console.error('[DB] Erreur initialisation IndexedDB:', error);
    throw new Error('Impossible d\'initialiser la base de données locale');
  }
}

/**
 * Sauvegarde un message dans l'historique
 *
 * @param {Object} message - Message à sauvegarder
 * @param {string} message.role - 'user' | 'assistant' | 'system'
 * @param {string} message.content - Contenu du message
 * @param {number} message.timestamp - Timestamp Unix (Date.now())
 * @param {string} [message.source] - 'rules' | 'ai' | 'manual'
 * @param {Object} [message.metadata] - Métadonnées additionnelles
 * @returns {Promise<number>} ID du message inséré
 */
export async function saveMessage(message) {
  try {
    const id = await db.messages.add({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || Date.now(),
      source: message.source || 'manual',
      metadata: message.metadata || {}
    });

    return id;
  } catch (error) {
    console.error('[DB] Erreur sauvegarde message:', error);
    throw error;
  }
}

/**
 * Récupère les N derniers messages de l'historique
 *
 * @param {number} [limit=50] - Nombre maximum de messages à récupérer
 * @returns {Promise<Array>} Liste des messages, triés par timestamp croissant
 */
export async function getMessages(limit = 50) {
  try {
    const messages = await db.messages
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();

    // Retourner dans l'ordre chronologique (plus ancien → plus récent)
    return messages.reverse();
  } catch (error) {
    console.error('[DB] Erreur récupération messages:', error);
    return [];
  }
}

/**
 * Supprime tous les messages de l'historique
 * @returns {Promise<void>}
 */
export async function clearMessages() {
  try {
    await db.messages.clear();
    console.log('[DB] Historique des messages effacé');
  } catch (error) {
    console.error('[DB] Erreur suppression messages:', error);
    throw error;
  }
}

/**
 * Sauvegarde une valeur de configuration
 *
 * @param {string} key - Clé de configuration
 * @param {any} value - Valeur à sauvegarder
 * @returns {Promise<void>}
 */
export async function saveConfig(key, value) {
  try {
    await db.config.put({ key, value });
  } catch (error) {
    console.error(`[DB] Erreur sauvegarde config ${key}:`, error);
    throw error;
  }
}

/**
 * Récupère une valeur de configuration
 *
 * @param {string} key - Clé de configuration
 * @returns {Promise<any|null>} Valeur ou null si inexistante
 */
export async function getConfig(key) {
  try {
    const config = await db.config.get(key);
    return config ? config.value : null;
  } catch (error) {
    console.error(`[DB] Erreur récupération config ${key}:`, error);
    return null;
  }
}

/**
 * Sauvegarde une entrée de la base de connaissance
 * (Utilisé en Phase 3 pour RAG)
 *
 * @param {Object} entry - Entrée KB
 * @param {string} entry.id - Identifiant unique
 * @param {string} entry.category - Catégorie (admin, santé, etc.)
 * @param {string} entry.content - Contenu textuel
 * @param {Array} [entry.embedding] - Vecteur d'embedding (Phase 3)
 * @returns {Promise<void>}
 */
export async function saveKBEntry(entry) {
  try {
    await db.knowledgeBase.put(entry);
  } catch (error) {
    console.error('[DB] Erreur sauvegarde KB:', error);
    throw error;
  }
}

/**
 * Récupère toutes les entrées de la base de connaissance
 * @returns {Promise<Array>}
 */
export async function getKBEntries() {
  try {
    return await db.knowledgeBase.toArray();
  } catch (error) {
    console.error('[DB] Erreur récupération KB:', error);
    return [];
  }
}

/**
 * Récupère les statistiques de la base de données
 * @returns {Promise<Object>}
 */
export async function getDBStats() {
  try {
    const messageCount = await db.messages.count();
    const kbCount = await db.knowledgeBase.count();
    const configCount = await db.config.count();

    return {
      messages: messageCount,
      knowledgeBase: kbCount,
      config: configCount
    };
  } catch (error) {
    console.error('[DB] Erreur récupération stats:', error);
    return { messages: 0, knowledgeBase: 0, config: 0 };
  }
}

// Export de l'instance DB pour usage avancé si besoin
export { db };
