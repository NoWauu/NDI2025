/**
 * Chat UI Manager - Gestion de l'interface utilisateur du chat
 *
 * Ce module gère tous les aspects visuels et interactifs de l'interface chat :
 * - Affichage des messages
 * - Gestion de l'input utilisateur
 * - Indicateurs de chargement
 * - Scroll automatique
 * - Auto-resize textarea
 *
 * @module ui/chat-ui
 */

/**
 * Éléments DOM cachés pour performance
 * @type {Object}
 */
const elements = {
  messagesContainer: null,
  messagesWrapper: null,
  userInput: null,
  chatForm: null,
  sendButton: null,
  typingIndicator: null,
  statusBadge: null,
  statusIndicator: null,
  statusText: null
};

/**
 * Callback pour l'envoi de message (défini par main.js)
 * @type {Function|null}
 */
let onSendCallback = null;

/**
 * Initialise l'interface utilisateur
 * Sélectionne tous les éléments DOM et configure les event listeners
 */
export function initUI() {
  // Sélectionner les éléments DOM
  elements.messagesContainer = document.getElementById('messages-container');
  elements.messagesWrapper = document.getElementById('messages-wrapper');
  elements.userInput = document.getElementById('user-input');
  elements.chatForm = document.getElementById('chat-form');
  elements.sendButton = document.getElementById('send-button');
  elements.typingIndicator = document.getElementById('typing-indicator');
  elements.statusBadge = document.getElementById('status-badge');
  elements.statusIndicator = document.getElementById('status-indicator');
  elements.statusText = document.getElementById('status-text');

  // Vérifier que tous les éléments existent
  const missingElements = Object.entries(elements)
    .filter(([_, el]) => !el)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    console.error('[UI] Éléments DOM manquants:', missingElements);
    throw new Error('Éléments DOM manquants dans index.html');
  }

  // Setup event listeners
  setupEventListeners();

  console.log('[UI] Interface initialisée');
}

/**
 * Configure tous les event listeners
 */
function setupEventListeners() {
  // Submit du formulaire
  elements.chatForm.addEventListener('submit', handleFormSubmit);

  // Enter pour envoyer (Shift+Enter pour nouvelle ligne)
  elements.userInput.addEventListener('keydown', handleKeyDown);

  // Auto-resize du textarea
  elements.userInput.addEventListener('input', handleTextareaResize);
}

/**
 * Gère la soumission du formulaire
 * @param {Event} event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const text = elements.userInput.value.trim();

  if (!text) {
    return;
  }

  // Appeler le callback si défini
  if (onSendCallback) {
    onSendCallback(text);
  }

  // Nettoyer l'input
  elements.userInput.value = '';
  elements.userInput.style.height = 'auto';
  elements.userInput.focus();
}

/**
 * Gère les raccourcis clavier
 * @param {KeyboardEvent} event
 */
function handleKeyDown(event) {
  // Enter sans Shift : envoyer
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    elements.chatForm.dispatchEvent(new Event('submit'));
  }
}

/**
 * Auto-resize du textarea selon le contenu
 */
function handleTextareaResize() {
  elements.userInput.style.height = 'auto';
  elements.userInput.style.height = elements.userInput.scrollHeight + 'px';
}

/**
 * Enregistre le callback pour l'envoi de message
 * @param {Function} callback - Fonction appelée avec le texte du message
 */
export function onSend(callback) {
  onSendCallback = callback;
}

/**
 * Ajoute un message à l'interface
 *
 * @param {Object} message - Message à afficher
 * @param {string} message.role - 'user' | 'assistant' | 'system'
 * @param {string} message.content - Contenu du message
 * @param {number} [message.timestamp] - Timestamp Unix
 * @param {Object} [message.metadata] - Métadonnées additionnelles
 */
export function addMessage(message) {
  const messageEl = createMessageElement(message);
  elements.messagesContainer.appendChild(messageEl);
  scrollToBottom();
}

/**
 * Crée un élément DOM pour un message
 * @param {Object} message
 * @returns {HTMLElement}
 */
function createMessageElement(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${message.role}`;

  // Contenu du message
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = message.content;

  // Timestamp
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'message-timestamp';
  timestampDiv.textContent = formatTimestamp(message.timestamp);

  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(timestampDiv);

  return messageDiv;
}

/**
 * Formate un timestamp en format lisible
 * @param {number} timestamp - Timestamp Unix
 * @returns {string} Format "HH:MM"
 */
function formatTimestamp(timestamp) {
  if (!timestamp) {
    timestamp = Date.now();
  }

  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Scroll automatique vers le bas de la conversation
 */
function scrollToBottom() {
  // Utiliser requestAnimationFrame pour smooth scroll
  requestAnimationFrame(() => {
    elements.messagesWrapper.scrollTop = elements.messagesWrapper.scrollHeight;
  });
}

/**
 * Affiche l'indicateur de saisie (typing)
 */
export function showTypingIndicator() {
  if (elements.typingIndicator) {
    elements.typingIndicator.style.display = 'flex';
    scrollToBottom();
  }
}

/**
 * Cache l'indicateur de saisie
 */
export function hideTypingIndicator() {
  if (elements.typingIndicator) {
    elements.typingIndicator.style.display = 'none';
  }
}

/**
 * Met à jour le badge de statut IA
 * @param {string} status - 'online' | 'offline' | 'loading'
 */
export function updateStatusBadge(status) {
  const statusConfig = {
    online: {
      indicator: '🟢',
      text: 'IA en ligne',
      title: 'Le modèle IA est chargé et prêt'
    },
    offline: {
      indicator: '🔴',
      text: 'Hors ligne',
      title: 'Mode règles activé (IA non chargée)'
    },
    loading: {
      indicator: '🟡',
      text: 'Chargement...',
      title: 'Chargement du modèle IA en cours'
    }
  };

  const config = statusConfig[status] || statusConfig.offline;

  elements.statusIndicator.textContent = config.indicator;
  elements.statusText.textContent = config.text;
  elements.statusBadge.setAttribute('title', config.title);
}

/**
 * Charge et affiche l'historique des messages
 * @param {Array<Object>} messages - Liste des messages à afficher
 */
export function loadHistory(messages) {
  if (!messages || messages.length === 0) {
    return;
  }

  console.log(`[UI] Chargement de ${messages.length} messages de l'historique`);

  // Vider le container actuel
  elements.messagesContainer.innerHTML = '';

  // Ajouter chaque message
  messages.forEach(message => {
    const messageEl = createMessageElement(message);
    elements.messagesContainer.appendChild(messageEl);
  });

  // Scroll vers le bas
  scrollToBottom();
}

/**
 * Vide complètement l'interface chat
 */
export function clearChat() {
  elements.messagesContainer.innerHTML = '';
  elements.userInput.value = '';
  elements.userInput.style.height = 'auto';
}

/**
 * Désactive l'input utilisateur (pendant chargement par ex)
 * @param {boolean} disabled
 */
export function setInputDisabled(disabled) {
  elements.userInput.disabled = disabled;
  elements.sendButton.disabled = disabled;

  if (disabled) {
    elements.userInput.placeholder = 'Veuillez patienter...';
  } else {
    elements.userInput.placeholder = 'Posez votre question sur les services publics mauritaniens...';
  }
}

/**
 * Affiche un message d'erreur à l'utilisateur
 * @param {string} errorMessage - Message d'erreur
 */
export function showError(errorMessage) {
  const errorMsg = {
    role: 'system',
    content: `⚠️ Erreur : ${errorMessage}`,
    timestamp: Date.now()
  };

  addMessage(errorMsg);
}

/**
 * Obtient les statistiques UI (pour debug)
 * @returns {Object}
 */
export function getUIStats() {
  return {
    messageCount: elements.messagesContainer?.children.length || 0,
    inputLength: elements.userInput?.value.length || 0,
    scrollPosition: elements.messagesWrapper?.scrollTop || 0,
    scrollHeight: elements.messagesWrapper?.scrollHeight || 0
  };
}
