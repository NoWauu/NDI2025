# 📘 Phase 1 - MVP Frontend Documentation

**Projet** : Chatbot IA Services Publics Mauritanie
**Événement** : Nuit de l'Info 2025
**Phase** : 1 - MVP Frontend avec Rules Engine
**Date** : Décembre 2025

---

## 🎯 Objectifs Phase 1

✅ Interface chat fonctionnelle et responsive
✅ Stockage local des conversations (IndexedDB)
✅ Système de réponses basé sur règles (FAQ matching)
✅ Architecture prête pour intégration IA (Phase 2)

---

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+ et npm
- Navigateur moderne (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# 1. Cloner le dépôt (ou extraire l'archive)
cd NDI2025

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev

# L'application sera accessible sur http://localhost:3000
```

### Commandes disponibles

```bash
npm run dev      # Démarre le serveur local (port 3000)
npm start        # Alias de npm run dev
```

---

## 📁 Architecture du Projet

```
NDI2025/
├── public/
│   ├── index.html          # Interface principale
│   └── styles.css          # Styles responsive
├── src/
│   ├── ui/
│   │   └── chat-ui.js      # Gestion interface utilisateur
│   ├── storage/
│   │   └── db-manager.js   # Gestion IndexedDB (Dexie.js)
│   ├── engine/
│   │   ├── rules-engine.js # Matching FAQ (fallback)
│   │   └── ai-adapter.js   # Interface IA (stub Phase 1)
│   ├── data/
│   │   └── faq.json        # Base de connaissance (15 entrées)
│   └── main.js             # Point d'entrée application
├── package.json
├── README-PHASE1.md        # Ce fichier
└── docs/                   # Documentation projet
```

---

## 🔧 Stack Technique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| **Frontend** | Vanilla JS + ES Modules | Pas de build, rapidité développement |
| **Stockage** | IndexedDB + Dexie.js | Persistance locale offline-first |
| **Styles** | CSS3 natif | Responsive, pas de dépendances |
| **Serveur dev** | `serve` | Simple et rapide |

**Pas de framework** : Volontairement simple pour respecter la contrainte des 12h.

---

## 🧩 Modules et Fonctionnalités

### 1️⃣ Database Manager (`src/storage/db-manager.js`)

**Rôle** : Gestion du stockage local avec IndexedDB via Dexie.js

**Stores** :
- `messages` : Historique des conversations
- `knowledgeBase` : FAQ et documents (utilisé en Phase 3 pour RAG)
- `config` : Préférences utilisateur

**Fonctions principales** :
```javascript
initDB()                    // Initialise IndexedDB
saveMessage(message)        // Sauvegarde un message
getMessages(limit)          // Récupère les N derniers messages
clearMessages()             // Vide l'historique
saveConfig(key, value)      // Sauvegarde une préférence
getConfig(key)              // Récupère une préférence
```

**Format Message Standard** :
```javascript
{
  id: number,              // Auto-généré par Dexie
  role: 'user' | 'assistant' | 'system',
  content: string,
  timestamp: number,       // Date.now()
  source: 'rules' | 'ai' | 'manual',
  metadata: {
    confidence: number,    // 0-1
    language: 'fr',
    matchedEntry: string   // ID FAQ si source='rules'
  }
}
```

---

### 2️⃣ Rules Engine (`src/engine/rules-engine.js`)

**Rôle** : Système de matching simple par mots-clés (fallback quand IA indisponible)

**Algorithme** :
1. Normalisation du texte utilisateur (lowercase, accents, tokenization)
2. Calcul score de matching pour chaque entrée FAQ
3. Retour de la meilleure correspondance si score > seuil (0.2)
4. Sinon, réponse par défaut avec suggestions

**Fonctions principales** :
```javascript
loadFAQ()                   // Charge faq.json
findAnswer(userMessage)     // Trouve la meilleure réponse
getDefaultResponse()        // Réponse générique + suggestions
getFAQStats()               // Statistiques FAQ
```

**Exemple de matching** :
```javascript
User: "comment obtenir carte identité"
→ Match avec FAQ id="admin-01" (keywords: carte, identité, cni)
→ Score: 0.75
→ Réponse: "Pour obtenir une CNI en Mauritanie..."
```

---

### 3️⃣ AI Adapter (`src/engine/ai-adapter.js`)

**Rôle** : Interface pour le moteur d'IA (LLM)

**Phase 1** : Stub complet (retourne `null`)
**Phase 2** : Téo implémentera avec Transformer.js + TinyLLaMA

**Fonctions** :
```javascript
generateResponse(userMessage, history, context)  // → null en Phase 1
isReady()                                        // → false en Phase 1
getStatus()                                      // → { ready: false, ... }
initAI(config)                                   // → no-op en Phase 1
```

**Interface attendue Phase 2** :
```javascript
// Téo implémentera ce format de retour
{
  content: string,          // Réponse générée par LLM
  confidence: number,       // 0-1
  source: 'ai',
  metadata: {
    model: 'TinyLLaMA-1.1B-Q4',
    tokensGenerated: number,
    generationTime: number  // ms
  }
}
```

---

### 4️⃣ Chat UI (`src/ui/chat-ui.js`)

**Rôle** : Gestion complète de l'interface utilisateur

**Fonctions principales** :
```javascript
initUI()                    // Initialise l'UI + event listeners
addMessage(message)         // Affiche un message
showTypingIndicator()       // Affiche "L'assistant réfléchit..."
hideTypingIndicator()       // Cache l'indicateur
updateStatusBadge(status)   // 🔴 Hors ligne / 🟢 En ligne
loadHistory(messages)       // Charge l'historique au démarrage
onSend(callback)            // Enregistre le callback d'envoi
```

**Features UI** :
- ✅ Auto-resize du textarea
- ✅ Scroll automatique vers dernier message
- ✅ Enter pour envoyer (Shift+Enter = nouvelle ligne)
- ✅ Typing indicator animé
- ✅ Messages visuellement distincts (user/assistant/system)
- ✅ Timestamps formatés (HH:MM)
- ✅ Responsive mobile/tablet/desktop

---

### 5️⃣ Main Application (`src/main.js`)

**Rôle** : Point d'entrée et orchestration de tous les modules

**Flow d'initialisation** :
```
1. Init IndexedDB
2. Load FAQ
3. Init UI + event listeners
4. Load historique (30 derniers messages)
5. Afficher message bienvenue (si nouveau)
6. Init IA (Phase 2) ou afficher statut offline
```

**Flow traitement message utilisateur** :
```
User Input
    ↓
Afficher message user
    ↓
Sauvegarder en IndexedDB
    ↓
Show typing indicator
    ↓
Tenter génération IA (si isReady() === true)
    ↓
Fallback vers Rules Engine si IA null
    ↓
Hide typing indicator
    ↓
Afficher + sauvegarder réponse assistant
```

---

## 📊 Base de Connaissance (FAQ)

**Fichier** : `src/data/faq.json`
**Entrées** : 15 questions-réponses en français

**Catégories couvertes** :

| Catégorie | Nombre d'entrées | Exemples |
|-----------|------------------|----------|
| **Administration** | 3 | CNI, Passeport, Acte de naissance |
| **Santé** | 2 | Accès hôpitaux, Vaccinations |
| **Éducation** | 2 | Inscriptions scolaires, Bourses |
| **Emploi** | 2 | Recherche emploi, Formations |
| **Transport** | 2 | Permis de conduire, Transports publics |
| **Logement** | 1 | Logements sociaux |
| **Juridique** | 1 | Porter plainte, Accès justice |
| **Social** | 1 | Aides sociales |
| **Entreprise** | 1 | Créer une entreprise |

**Format d'une entrée** :
```json
{
  "id": "admin-01",
  "keywords": ["carte", "identité", "cni", "documents"],
  "question_fr": "Comment obtenir une carte d'identité nationale ?",
  "answer_fr": "Pour obtenir votre CNI en Mauritanie...",
  "category": "administration",
  "priority": 10
}
```

---

## 🧪 Tests Manuels

### Checklist Validation Phase 1

**Fonctionnel** :
- [ ] Interface chat affiche les messages correctement
- [ ] Textarea s'auto-resize avec le contenu
- [ ] Bouton envoi + Enter déclenchent l'envoi
- [ ] Messages sauvegardés dans IndexedDB (vérifier DevTools > Application)
- [ ] Historique rechargé au refresh de la page
- [ ] FAQ chargée (15 entrées)
- [ ] Rules engine trouve des réponses pertinentes
- [ ] Réponse par défaut si aucun match
- [ ] AI Adapter retourne `null` (Phase 1)
- [ ] Fallback automatique vers rules
- [ ] Typing indicator s'affiche/disparaît
- [ ] Badge statut affiche "Hors ligne"

**UI/UX** :
- [ ] Design responsive (mobile, tablet, desktop)
- [ ] Scroll automatique vers dernier message
- [ ] Pas d'erreur dans la console
- [ ] Timestamps visibles et formatés
- [ ] Messages user/assistant visuellement distincts

**Code** :
- [ ] ES Modules fonctionnent sans bundler
- [ ] Dexie.js initialisé correctement
- [ ] Aucune dépendance manquante
- [ ] Code commenté (JSDoc)

---

## 🔍 Debugging

### Console DevTools

Ouvrir la console et vérifier :
```javascript
// Statistiques DB
await APP_DEBUG.getDBStats()

// Statistiques FAQ
APP_DEBUG.getFAQStats()

// Statut IA
APP_DEBUG.getAIStatus()

// Effacer l'historique
await APP_DEBUG.clearMessages()
```

### IndexedDB

Chrome DevTools > Application > IndexedDB > ChatBotDB
- Vérifier que les messages s'enregistrent
- Consulter le store `messages`

---

## 🚦 Prêt pour Phase 2 (Intégration IA par Téo)

### Interfaces Exposées

#### 1. Format Message Standard
Voir section Database Manager ci-dessus.

#### 2. AI Adapter à Implémenter

**Téo doit remplacer les stubs dans** `src/engine/ai-adapter.js` :

```javascript
// À implémenter par Téo
export async function generateResponse(userMessage, history, context) {
  // 1. Construire prompt avec historique
  // 2. Appeler Transformer.js avec TinyLLaMA
  // 3. Générer réponse
  // 4. Retourner format standard :
  return {
    content: "...",
    confidence: 0.85,
    source: 'ai',
    metadata: { model: 'TinyLLaMA-1.1B-Q4', ... }
  };
}

export function isReady() {
  return true; // Une fois modèle chargé
}
```

#### 3. Activation de l'IA

Dans `src/main.js`, changer :
```javascript
const CONFIG = {
  ENABLE_AI: true  // Passer à true en Phase 2
};
```

#### 4. Historique Accessible

```javascript
import { getMessages } from './storage/db-manager.js';

const history = await getMessages(10); // 10 derniers messages
// Téo peut utiliser cet historique pour le contexte LLM
```

---

## ⚠️ Problèmes Connus

### CORS
Si le fichier `faq.json` ne se charge pas :
- Utiliser `npx serve public` (pas `file://`)
- Vérifier headers serveur

### ES Modules
- Nécessite un serveur HTTP
- Ne fonctionne pas en local (`file://`)

### Performance
- Limiter historique à 30-50 messages max
- Éviter de charger trop de messages au démarrage

---

## 📈 Métriques Phase 1

**Temps de développement** : ~5h30
**Fichiers créés** : 10
**Lignes de code** : ~1500
**FAQ entrées** : 15
**Dépendances npm** : 2 (dexie, serve)

---

## 🎓 Notes Techniques pour le Jury

### Choix d'Architecture

**Vanilla JS au lieu d'un framework** :
- Contrainte de temps (12h)
- Pas de setup complexe
- Code transparent et lisible
- Facilite l'évaluation

**IndexedDB pour le stockage** :
- Offline-first natif
- Pas besoin de backend
- Persistance locale fiable

**Rules Engine simple** :
- Fallback robuste
- Pas de dépendance externe
- Facile à maintenir

### Points d'Excellence

✅ Architecture modulaire claire
✅ Séparation des préoccupations (UI / Storage / Engine)
✅ Code documenté (JSDoc)
✅ Interface prête pour extension (Phase 2)
✅ Responsive mobile-first
✅ Accessibilité (ARIA labels)

---

## 🔗 Ressources

**Documentation** :
- [Dexie.js](https://dexie.org/) - Wrapper IndexedDB
- [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

**Pour Phase 2** :
- [Transformer.js](https://huggingface.co/docs/transformers.js)
- [TinyLLaMA](https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0)

---

## 👥 Auteurs

**Phase 1 (Frontend)** : Votre équipe
**Phase 2 (IA Engine)** : Téo

**Événement** : Nuit de l'Info 2025
**Défi** : Assistant IA Services Publics Mauritanie

---

## 📝 Changelog

### Phase 1.0.0 (Actuel)
- ✅ Interface chat responsive
- ✅ Stockage IndexedDB
- ✅ Rules engine avec FAQ 15 entrées
- ✅ Architecture prête pour IA
- ✅ Documentation complète

### Phase 2.0.0 (À venir - Téo)
- ⏳ Intégration Transformer.js
- ⏳ Chargement TinyLLaMA
- ⏳ Génération IA en temps réel
- ⏳ Support bilingue FR/AR

---

**Dernière mise à jour** : Décembre 2025
**Statut** : ✅ Phase 1 Complete - Prêt pour Phase 2
