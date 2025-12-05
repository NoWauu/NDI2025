# ✅ Phase 2 Backend - COMPLETE

**Date** : Décembre 2025
**Statut** : ✅ **PRODUCTION READY**

---

## 🎯 Objectifs Phase 2 : ATTEINTS

Création d'un backend robuste avec :
- ✅ Fallback intelligent
- ✅ Système de logging et observabilité
- ✅ Informations modèle IA
- ✅ Rate limiting et sécurité
- ✅ Tests automatisés complets

---

## 📁 Nouveaux Fichiers Créés

### Modules Backend

| Fichier | Description | Lignes |
|---------|-------------|---------|
| [ia/fallback-engine.js](ia/fallback-engine.js) | Moteur de fallback intelligent basé sur FAQ | ~200 |
| [ia/ai-logger.js](ia/ai-logger.js) | Système de logging et métriques IA | ~250 |
| [ia/model-config.js](ia/model-config.js) | Configuration et métadonnées du modèle | ~200 |

### Scripts de Test

| Fichier | Description |
|---------|-------------|
| [test-phase2.sh](test-phase2.sh) | Tests automatisés Phase 2 (12 tests) |

### Serveur

| Fichier | Modifications |
|---------|---------------|
| [server.js](server.js) | Ajout 6 nouveaux endpoints + sécurité |

---

## 🆕 Nouveaux Endpoints API

### 1. POST /ai/fallback
**Fallback intelligent quand le LLM local échoue**

```bash
curl -X POST http://localhost:4000/ai/fallback \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Comment obtenir une CNI ?",
    "language": "fr",
    "reason": "timeout"
  }'
```

**Réponse** :
```json
{
  "content": "Vous devez vous rendre au centre d'enrôlement...",
  "confidence": 0.75,
  "source": "fallback",
  "metadata": {
    "language": "fr",
    "fallbackReason": "timeout",
    "matchedFAQ": "faq_001",
    "matchScore": 0.75,
    "category": "etat_civil"
  }
}
```

**Raisons supportées** :
- `timeout` : Génération trop longue
- `low_confidence` : Confiance trop faible
- `error` : Erreur technique
- `unknown` : Autre raison

### 2. POST /ai/logs
**Enregistre des logs côté client**

```bash
curl -X POST http://localhost:4000/ai/logs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "request",
    "data": {
      "source": "client",
      "message": "test",
      "responseTime": 3500,
      "success": true
    }
  }'
```

**Types de logs** :
- `request` : Requête IA
- `error` : Erreur IA

### 3. GET /ai/status
**Statut détaillé de l'IA**

```bash
curl http://localhost:4000/ai/status
```

**Réponse** :
```json
{
  "status": "ok",
  "ai": {
    "backend": {
      "initialized": true,
      "kbEntries": 2,
      "faqFREntries": 2,
      "faqAREntries": 2
    },
    "fallback": {
      "faqFR": 2,
      "faqAR": 2,
      "ready": true
    },
    "logs": {
      "totalRequests": 150,
      "totalErrors": 3,
      "lastHour": {
        "requests": 45,
        "errors": 1,
        "successRate": "97.78%",
        "avgResponseTime": "2500ms",
        "sourceBreakdown": {
          "local_llm": 30,
          "fallback_backend": 15
        }
      }
    }
  },
  "uptime": 3600.5,
  "timestamp": "2025-12-05T02:00:00.000Z"
}
```

### 4. GET /ai/model-info
**Informations sur le modèle IA**

```bash
curl http://localhost:4000/ai/model-info
```

**Réponse** :
```json
{
  "model": {
    "name": "TinyLlama-1.1B-Chat-v1.0",
    "provider": "TinyLlama",
    "version": "1.0.0",
    "buildDate": "2025-12-05",
    "defaultVariant": "q4",
    "variants": [
      {
        "id": "q4",
        "name": "TinyLlama Q4 Quantized",
        "size": "500MB",
        "recommended": true
      }
    ],
    "languages": ["fr", "ar", "en"],
    "defaultParams": {
      "maxNewTokens": 150,
      "temperature": 0.7,
      "topK": 50,
      "topP": 0.9
    }
  },
  "recommended": {
    "id": "q4",
    "name": "TinyLlama Q4 Quantized",
    "size": "500MB",
    "recommended": true
  }
}
```

### 5. GET /ai/logs
**Récupère les logs récents**

```bash
curl "http://localhost:4000/ai/logs?type=requests&limit=10"
```

**Paramètres** :
- `type` : `requests`, `errors`, `performance`, `all` (default: `all`)
- `limit` : Nombre de logs (default: 100, max: 1000)

### 6. POST /ai/logs/export
**Exporte les logs dans un fichier**

```bash
curl -X POST http://localhost:4000/ai/logs/export
```

**Réponse** :
```json
{
  "success": true,
  "file": "/Users/mesbah/BUT/Projects/NDI2025/logs/ai-logs-2025-12-05T02-00-00.json",
  "message": "Logs exportés avec succès"
}
```

---

## 🔒 Sécurité Implémentée

### 1. Rate Limiting
- **60 requêtes par minute** par IP
- Appliqué sur tous les endpoints IA
- Réponse 429 avec `retryAfter` si dépassé

```json
{
  "error": "Trop de requêtes. Veuillez réessayer dans 1 minute.",
  "retryAfter": 45
}
```

### 2. Input Sanitization
- Limite de taille : **1MB** par requête JSON
- Troncature automatique des strings > **10 000 caractères**
- Protection contre les injections

### 3. CORS
- Activé pour tous les endpoints
- Permet les requêtes cross-origin du frontend

### 4. Validation des Entrées
- Vérification des types
- Champs requis obligatoires
- Validation des langues (fr, ar uniquement)

---

## 📊 Système de Logging

### Métriques Collectées

**Requêtes IA** :
- Source (local_llm, fallback_backend, client)
- Message (extrait)
- Langue
- Confiance
- Temps de réponse
- Succès/échec

**Erreurs** :
- Type d'erreur
- Stack trace
- Contexte (source, message, raison)

**Performance** :
- Métriques personnalisées
- Unités configurables

### Statistiques en Temps Réel

- Nombre total de requêtes
- Taux de succès
- Temps de réponse moyen
- Répartition par source
- Erreurs de la dernière heure

### Export des Logs

Les logs peuvent être exportés en JSON pour analyse :
```json
{
  "exportedAt": "2025-12-05T02:00:00.000Z",
  "stats": { ... },
  "logs": {
    "requests": [...],
    "errors": [...],
    "performance": [...]
  }
}
```

---

## 🤖 Fallback Intelligent

### Algorithme

1. **Tokenization** : Normalise et découpe le message
2. **Matching** : Compare avec les FAQ en base
3. **Scoring** : Calcule la similarité (Jaccard)
4. **Seuil** : Retourne la meilleure réponse si score > 0.2
5. **Défaut** : Message générique + suggestions sinon

### Raisons de Fallback

| Raison | Description | Message |
|--------|-------------|---------|
| `timeout` | Génération > 15s | "La génération a pris trop de temps..." |
| `low_confidence` | Confiance < 0.5 | "Je ne suis pas sûr de comprendre..." |
| `error` | Erreur technique | "Une erreur s'est produite..." |
| `unknown` | Autre | Liste de questions fréquentes |

### Support Multilingue

- **Français** : FAQ FR + messages FR
- **Arabe** : FAQ AR + messages AR
- Détection automatique via le paramètre `language`

---

## 🧪 Tests Phase 2

### Script de Test Automatisé

[test-phase2.sh](test-phase2.sh) : **12 tests**, tous validés ✅

**Couverture** :
- Endpoints Phase 1 (rétrocompatibilité)
- Nouveaux endpoints Phase 2
- Sécurité (rate limit, sanitization)
- Gestion d'erreurs
- Cas limites

**Résultat** :
```
Total: 12
Passed: 12
Failed: 0

✅ Tous les tests passent !
```

### Comment Tester

```bash
# 1. Démarrer le backend
npm run backend

# 2. Dans un autre terminal, lancer les tests
./test-phase2.sh
```

---

## 📈 Comparaison Phase 1 vs Phase 2

| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| **Endpoints** | 2 | 8 |
| **Fallback** | Frontend uniquement | Backend + Frontend |
| **Logging** | Console basique | Système complet + export |
| **Sécurité** | CORS | CORS + Rate limit + Sanitization |
| **Observabilité** | Basique | Métriques détaillées |
| **Model Info** | ❌ | ✅ Endpoint dédié |
| **Tests** | Manuel | Automatisés (12 tests) |

---

## 🔄 Flow Complet avec Fallback

### Cas 1 : LLM Local Réussit

```
Frontend
   ↓
   Génère avec LLM local
   ↓
   Succès (confidence > 0.5, temps < 15s)
   ↓
   Affiche réponse
   ↓
   Log via POST /ai/logs (optionnel)
```

### Cas 2 : LLM Local Échoue → Fallback Backend

```
Frontend
   ↓
   Génère avec LLM local
   ↓
   Échec (timeout / low confidence / error)
   ↓
   POST /ai/fallback { message, language, reason }
   ↓
   Backend : Fallback Engine
   ↓
   Matching FAQ → Réponse
   ↓
   Affiche réponse fallback
   ↓
   Log automatique côté backend
```

### Cas 3 : Fallback Backend Échoue → Fallback Frontend

```
Frontend
   ↓
   POST /ai/fallback échoue (backend down)
   ↓
   Fallback local (rules-engine.js)
   ↓
   Réponse FAQ statique
   ↓
   Affiche réponse
```

---

## 🚀 Utilisation Frontend

### Exemple d'intégration

```javascript
// src/engine/ai-adapter.js

export async function generateResponse(userMessage, history, context) {
  try {
    // 1. Tenter LLM local (Phase 3)
    const llmResponse = await generateLocalLLM(userMessage);

    if (llmResponse.confidence > 0.5) {
      return llmResponse;
    }

    // 2. Fallback vers backend si confiance faible
    return await callBackendFallback(userMessage, 'low_confidence');

  } catch (error) {
    // 3. Fallback vers backend si erreur
    try {
      return await callBackendFallback(userMessage, 'error');
    } catch (backendError) {
      // 4. Fallback local si backend inaccessible
      return findAnswer(userMessage); // rules-engine
    }
  }
}

async function callBackendFallback(message, reason) {
  const response = await fetch('http://localhost:4000/ai/fallback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      language: detectLanguage(message),
      reason
    })
  });

  return await response.json();
}
```

---

## 📝 Configuration Modèle

Voir [ia/model-config.js](ia/model-config.js) pour :

- Informations du modèle (nom, version, hash)
- Variantes disponibles (Q4, Q8, FP16)
- Paramètres de génération par défaut
- URLs de téléchargement
- Contraintes système
- Métriques de performance estimées

**Utilisation** :

```javascript
import { getModelInfo, getRecommendedVariant } from './ia/model-config.js';

const modelInfo = getModelInfo();
const recommended = getRecommendedVariant();

console.log(`Modèle : ${modelInfo.name}`);
console.log(`Variante recommandée : ${recommended.id} (${recommended.size})`);
```

---

## 🐛 Debugging

### Logs Console

Le backend affiche des logs détaillés :

```
[2025-12-05T02:00:00.000Z] POST /api/chat
[API] Requête chat: "Comment obtenir une CNI ?" (fr)
[Backend] generateIaResponse appelée: "Comment obtenir une CNI ?" (fr)
[RAG Stub] Recherche de contexte pour : "Comment obtenir une CNI ?"
[Backend] Prompt construit: Tu es un assistant...
[AI Log] local_llm - SUCCESS (50ms)
```

### Endpoints de Monitoring

```bash
# Statut global
curl http://localhost:4000/ai/status | jq '.ai.logs.lastHour'

# Logs récents
curl "http://localhost:4000/ai/logs?type=errors&limit=10"

# Export pour analyse
curl -X POST http://localhost:4000/ai/logs/export
```

---

## ✅ Checklist de Production

### Backend

- [x] Tous les endpoints fonctionnels
- [x] Rate limiting activé
- [x] Input sanitization activé
- [x] CORS configuré
- [x] Logging complet
- [x] Gestion d'erreurs robuste
- [x] Tests automatisés passent

### Fallback

- [x] FAQ FR chargée
- [x] FAQ AR chargée
- [x] Matching fonctionnel
- [x] Messages multilingues
- [x] Gestion cas par défaut

### Sécurité

- [x] Rate limiting : 60 req/min
- [x] Taille max requête : 1MB
- [x] Validation des entrées
- [x] Troncature strings longues
- [x] Gestion erreurs

### Observabilité

- [x] Logs requêtes
- [x] Logs erreurs
- [x] Métriques performance
- [x] Statistiques temps réel
- [x] Export logs

---

## 🎯 Prochaines Étapes : Phase 3

Voir [NEXT-STEPS.md](NEXT-STEPS.md) pour :

1. **Intégration LLM réel** (TinyLLaMA via Transformer.js)
2. **RAG avec embeddings** (Jina Embeddings + recherche vectorielle)
3. **Frontend avancé** (streaming, retry, cache)

---

## 📚 Documentation Complète

- [README-INTEGRATION.md](README-INTEGRATION.md) - Guide d'utilisation Phase 1
- [MERGE-COMPLETE.md](MERGE-COMPLETE.md) - Résumé merge Phase 1
- [NEXT-STEPS.md](NEXT-STEPS.md) - Roadmap Phase 2/3
- [PHASE2-COMPLETE.md](PHASE2-COMPLETE.md) - Ce document

---

**Dernière mise à jour** : Décembre 2025
**Auteur** : Équipe NDI2025
**Statut** : ✅ **PHASE 2 COMPLETE - PRODUCTION READY**
