# 🎯 Guide d'Intégration Frontend ↔ Backend

**Date** : Décembre 2025
**Statut** : ✅ Merge Phase 1 Complet

---

## 📊 Vue d'ensemble

L'intégration entre le frontend UI et le backend IA est maintenant **fonctionnelle**. Le système utilise une architecture client-serveur où :

- **Frontend** (port 3000) : Interface utilisateur + Rules Engine fallback
- **Backend** (port 4000) : API HTTP + Moteur IA + Base de connaissances

```
┌──────────────────┐         HTTP          ┌──────────────────┐
│                  │   POST /api/chat      │                  │
│   Frontend UI    │ ───────────────────>  │   Backend IA     │
│   (Port 3000)    │                       │   (Port 4000)    │
│                  │ <───────────────────  │                  │
│  + Rules Engine  │   JSON Response       │  + KB + FAQ      │
│    (Fallback)    │                       │  + Prompting     │
└──────────────────┘                       └──────────────────┘
```

---

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend IA

```bash
npm run backend
```

Le backend démarre sur **http://localhost:4000**

Vous devriez voir :
```
✅ Backend IA ready on http://localhost:4000

Endpoints disponibles:
  - POST http://localhost:4000/api/chat
  - GET  http://localhost:4000/api/status
```

### 2. Démarrer le Frontend

Dans un **nouveau terminal** :

```bash
npm run dev
```

Le frontend démarre sur **http://localhost:3000**

### 3. Tester l'application

Ouvrez votre navigateur sur **http://localhost:3000**

Le système est maintenant opérationnel avec :
- ✅ Backend IA actif
- ✅ Fallback Rules Engine
- ✅ Mode dégradé automatique

---

## 🔍 Architecture des Modules

### Backend (ES Modules)

```
ia/
├── app.js              # Orchestrateur principal + generateIaResponse()
├── data_loader.js      # Chargement KB + FAQ
├── prompting.js        # Construction des prompts FR/AR
├── rag.js              # Stub RAG (Phase 3)
├── rag_pipeline.js     # Stub RAG Pipeline (Phase 3)
└── llm.js              # Stub LLM (Phase 2)

server.js               # Serveur HTTP Express
```

### Frontend (ES Modules)

```
src/
├── main.js             # Point d'entrée (CONFIG.ENABLE_AI = true)
├── engine/
│   ├── ai-adapter.js   # Appels HTTP vers backend
│   └── rules-engine.js # Fallback basé sur mots-clés
├── storage/
│   └── db-manager.js   # IndexedDB
└── ui/
    └── chat-ui.js      # Interface chat
```

---

## 🔄 Flow de Conversation

### Cas 1 : Backend Actif

```
1. Utilisateur envoie "Comment obtenir une CNI ?"
   ↓
2. main.js → handleUserMessage()
   ↓
3. isReady() = true (backend accessible)
   ↓
4. ai-adapter.js → generateResponse()
   ↓
5. POST http://localhost:4000/api/chat
   {
     "message": "Comment obtenir une CNI ?",
     "language": "fr",
     "history": []
   }
   ↓
6. Backend → generateIaResponse()
   - Charge KB + FAQ
   - Construit prompt avec contexte
   - Retourne réponse formatée
   ↓
7. Frontend affiche la réponse (source: 'ai')
```

### Cas 2 : Backend Inactif (Mode Dégradé)

```
1. Utilisateur envoie "Comment obtenir une CNI ?"
   ↓
2. main.js → handleUserMessage()
   ↓
3. ai-adapter.js → generateResponse()
   ↓
4. fetch() échoue (backend down)
   ↓
5. Retourne null
   ↓
6. main.js → fallback vers rules-engine
   ↓
7. rules-engine.js → findAnswer()
   - Matching par mots-clés
   - Retourne FAQ statique
   ↓
8. Frontend affiche la réponse (source: 'rules')
```

---

## 🧪 Tests

### Test 1 : Backend seul

```bash
# Démarrer le backend
npm run backend

# Tester l'API
curl http://localhost:4000/api/status

curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Comment obtenir une carte d'\''identité ?", "language": "fr"}'
```

**Résultat attendu** : JSON avec `content`, `confidence`, `source`, `metadata`

### Test 2 : Frontend + Backend

```bash
# Terminal 1
npm run backend

# Terminal 2
npm run dev

# Navigateur : http://localhost:3000
# Poser une question dans le chat
```

**Résultat attendu** :
- Message utilisateur affiché
- Indicateur de saisie "L'assistant réfléchit..."
- Réponse IA affichée avec le prompt construit

### Test 3 : Mode dégradé

```bash
# 1. Arrêter le backend (Ctrl+C dans terminal 1)

# 2. Continuer à utiliser le frontend
# Poser une question dans le chat
```

**Résultat attendu** :
- Message utilisateur affiché
- Fallback automatique vers rules-engine
- Réponse FAQ statique affichée
- Pas de crash, système continue à fonctionner

---

## 📡 API Backend

### POST /api/chat

Génère une réponse IA à partir d'un message utilisateur.

**Requête** :
```json
{
  "message": "Comment obtenir une CNI ?",
  "language": "fr",
  "history": []
}
```

**Réponse** :
```json
{
  "content": "Tu es un assistant pour les services publics...",
  "confidence": 0.5,
  "source": "ai",
  "metadata": {
    "language": "fr",
    "kbEntriesUsed": 2,
    "faqEntriesUsed": 2,
    "ragEnabled": false
  }
}
```

### GET /api/status

Retourne le statut du backend.

**Réponse** :
```json
{
  "status": "ok",
  "backend": {
    "initialized": true,
    "kbEntries": 2,
    "faqFREntries": 2,
    "faqAREntries": 2
  },
  "uptime": 123.45,
  "timestamp": "2025-12-04T23:35:11.701Z"
}
```

---

## ⚙️ Configuration

### Frontend (src/main.js)

```javascript
const CONFIG = {
  MAX_HISTORY_MESSAGES: 30,
  AI_CONTEXT_MESSAGES: 10,
  ENABLE_AI: true,           // ← Activé pour utiliser le backend
  WELCOME_MESSAGE: true
};
```

### Backend (server.js)

```javascript
const PORT = process.env.PORT || 4000;  // Port du serveur
```

### AI Adapter (src/engine/ai-adapter.js)

```javascript
const API_URL = 'http://localhost:4000/api/chat';  // URL API backend
```

---

## 🔧 Modifications Effectuées

### Backend

✅ **Conversion CommonJS → ES Modules**
- `ia/*.cjs` → `ia/*.js`
- `require()` → `import`
- `module.exports` → `export`

✅ **Création server.js**
- Express + CORS
- POST /api/chat
- GET /api/status
- Gestion erreurs

✅ **Fonction generateIaResponse()**
- Chargement KB + FAQ
- Construction prompt
- Format réponse standardisé

### Frontend

✅ **ai-adapter.js réécrit**
- Appels HTTP fetch() vers backend
- Détection automatique langue (FR/AR)
- Gestion erreurs + fallback null

✅ **main.js modifié**
- `ENABLE_AI: true`
- Initialisation backend via initAI()

✅ **package.json**
- Ajout script `npm run backend`
- Dépendances : express, cors

---

## 📝 Phase 1 : Ce qui fonctionne

✅ Backend charge KB + FAQ depuis JSON
✅ Construction de prompts FR/AR avec contexte
✅ Serveur HTTP expose API /api/chat
✅ Frontend appelle backend via fetch()
✅ Fallback automatique vers rules-engine
✅ Mode dégradé (backend down) fonctionne
✅ Détection automatique langue FR/AR

---

## 🚧 Phase 2/3 : À faire

❌ **Phase 2 : Intégration LLM réel**
- Remplacer stub LLM par TinyLLaMA
- Générer vraies réponses (pas juste le prompt)
- Utiliser Transformer.js ou ONNX

❌ **Phase 3 : RAG avec embeddings**
- Vectorisation de la KB
- Recherche similarité cosine
- Top-K documents pertinents

---

## 🐛 Dépannage

### Erreur : "Backend non accessible"

**Cause** : Le backend n'est pas démarré

**Solution** :
```bash
npm run backend
```

### Erreur : "CORS policy"

**Cause** : Le frontend et le backend tournent sur des ports différents

**Solution** : Le CORS est déjà activé dans `server.js`, vérifier que les deux serveurs tournent

### Le frontend utilise toujours rules-engine

**Cause** : `CONFIG.ENABLE_AI` est à `false`

**Solution** : Vérifier dans `src/main.js` ligne 26 que `ENABLE_AI: true`

### Backend retourne juste le prompt

**C'est normal en Phase 1** ! Le backend retourne le prompt construit pour vérifier que le pipeline fonctionne. En Phase 2, on intégrera un vrai LLM qui générera des réponses.

---

## 📚 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| [server.js](server.js) | Serveur HTTP backend |
| [ia/app.js](ia/app.js) | Orchestrateur IA + generateIaResponse() |
| [src/engine/ai-adapter.js](src/engine/ai-adapter.js) | Client HTTP frontend |
| [src/main.js](src/main.js) | Point d'entrée app (CONFIG) |
| [data/kb_services_mauritanie.json](data/kb_services_mauritanie.json) | Base de connaissances |
| [data/faq_fr_rag.json](data/faq_fr_rag.json) | FAQ français |
| [data/faq_ar_rag.json](data/faq_ar_rag.json) | FAQ arabe |

---

## 🎉 Résumé

L'intégration Phase 1 est **complète et fonctionnelle** :

1. ✅ Backend en ES Modules
2. ✅ Serveur HTTP avec Express
3. ✅ API /api/chat fonctionnelle
4. ✅ Frontend connecté au backend
5. ✅ Fallback automatique
6. ✅ Mode dégradé testé
7. ✅ Détection langue FR/AR

**Prochaine étape** : Intégrer TinyLLaMA en Phase 2 pour générer de vraies réponses !

---

**Dernière mise à jour** : Décembre 2025
**Statut** : ✅ Production Ready (Phase 1)
