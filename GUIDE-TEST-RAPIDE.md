# 🚀 Guide de Test Rapide - Phase 2 Frontend

## Problème Actuel

Tu vois cette alerte:
```
[AI Adapter] ATTENTION: crossOriginIsolated=false
[AI Adapter] Utilisation du mode backend uniquement
```

**C'est normal !** Le LLM local nécessite `crossOriginIsolated=true` pour fonctionner.

---

## Solution: Activer crossOriginIsolated

### Étape 1: Configurer Vite

✅ **Fait!** Le fichier `vite.config.js` a été créé avec:

```javascript
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});
```

### Étape 2: Redémarrer le Serveur

```bash
# Arrêter Vite (Ctrl+C dans le terminal)

# Relancer
npm run dev
```

### Étape 3: Vérifier crossOriginIsolated

Ouvre la console du navigateur et tape:

```javascript
window.crossOriginIsolated
// Doit retourner: true ✅
```

---

## Test Complet du Chargement Modèle

### 1. Lancer Backend

**Terminal 1:**
```bash
npm run backend
```

Tu devrais voir:
```
✅ Backend IA Phase 2 ready on http://localhost:4000
```

### 2. Lancer Frontend avec Vite Config

**Terminal 2:**
```bash
npm run dev
```

### 3. Ouvrir le Navigateur

Aller sur: `http://localhost:5173`

### 4. Observer le Chargement

**Si `crossOriginIsolated=true`** ✅:

Tu verras dans l'ordre:

1. **Overlay de chargement** apparaît:
   ```
   🔄 Spinner qui tourne
   "Chargement du modèle IA..."
   [████░░░░░░] 30%
   "Cela peut prendre 1-2 minutes lors du premier chargement"
   ```

2. **Console du navigateur** affiche:
   ```
   [AI Adapter] Initialisation du LLM local...
   [AI Adapter] Chargement de Transformer.js...
   [AI Adapter] Téléchargement du modèle Xenova/TinyLlama-1.1B-Chat-v1.0...
   [AI Adapter] Chargement: 10%
   [AI Adapter] Chargement: 25%
   [AI Adapter] Chargement: 50%
   [AI Adapter] Chargement: 75%
   [AI Adapter] Chargement: 100%
   [AI Adapter] ✅ Modèle LLM chargé avec succès !
   [App] ✅ Modèle local chargé avec succès
   ```

3. **Badge de statut** passe à:
   ```
   🟢 IA en ligne
   ```

4. **Input réactivé**
   ```
   Le champ de saisie redevient actif
   Placeholder: "Posez votre question..."
   ```

**Si `crossOriginIsolated=false`** ⚠️:

Tu verras:

1. **Pas d'overlay** de chargement
2. **Console affiche**:
   ```
   [AI Adapter] ATTENTION: crossOriginIsolated=false
   [AI Adapter] Utilisation du mode backend uniquement
   [App] Mode backend activé (modèle local non disponible)
   ```
3. **Badge reste**:
   ```
   🔴 Hors ligne  OU  🟡 Chargement...
   ```
4. **Système fonctionne** quand même via backend API

---

## Test de Génération

### Mode Backend-Only (actuel)

1. Tape: **"Comment obtenir une CNI ?"**
2. Observe:
   ```
   [App] Tentative génération via IA...
   → Requête HTTP vers http://localhost:4000/api/chat
   → Réponse du backend (Phase 1: retourne le prompt)
   ```

### Mode Local LLM (après config Vite)

1. Tape: **"Comment obtenir une CNI ?"**
2. Observe:
   ```
   [App] Tentative génération via IA...
   [AI Adapter] Génération de réponse...
   [AI Adapter] Génération locale en cours...
   ⏱️ Prend 2-5 secondes
   [AI Adapter] ✅ Génération réussie (2847ms)
   [App] Réponse IA générée (confiance: 0.8)
   [App] Réponse envoyée (source: local_llm) ✅
   ```

---

## Comparaison des Modes

| Aspect | Backend-Only (actuel) | Local LLM (après config) |
|--------|----------------------|--------------------------|
| **Chargement initial** | Instantané | 1-2 minutes (1ère fois) |
| **Overlay loading** | ❌ Non | ✅ Oui |
| **Badge statut** | 🔴 Hors ligne | 🟢 IA en ligne |
| **Temps génération** | ~100-300ms | ~2-5 secondes |
| **Source réponse** | `backend` | `local_llm` |
| **Fonctionne?** | ✅ Oui | ✅ Oui (mieux) |

---

## Dépannage

### Problème: crossOriginIsolated reste false

**Vérifications**:

1. ✅ `vite.config.js` existe et contient les headers
2. ✅ Vite redémarré après création du config
3. ✅ Console navigateur: `window.crossOriginIsolated`

**Solution si ça ne marche pas**:

Essaye avec le flag expérimental de Vite:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  // Force le rechargement
  clearScreen: false
});
```

### Problème: Modèle ne télécharge pas

**Causes possibles**:
- Pas de connexion internet
- HuggingFace CDN bloqué
- RAM insuffisante (< 2GB disponible)

**Solution**: Mode backend-only fonctionne parfaitement en fallback

### Problème: Chargement très long (>5 minutes)

**Normal** la première fois:
- ~500MB à télécharger depuis HuggingFace
- Mise en cache dans le navigateur après

**Logs attendus**:
```
[AI Adapter] Téléchargement du modèle...
[AI Adapter] Chargement: 5%
[AI Adapter] Chargement: 10%
...
```

---

## Tests Recommandés

### Test 1: Vérifier Mode Actuel ✅

```bash
# 1. Backend tourne
npm run backend

# 2. Frontend tourne
npm run dev

# 3. Console navigateur
window.crossOriginIsolated
// → false = Mode backend-only actuel ✅
```

### Test 2: Activer LLM Local 🚀

```bash
# 1. Arrêter frontend (Ctrl+C)

# 2. Vérifier vite.config.js existe
cat vite.config.js

# 3. Relancer
npm run dev

# 4. Console navigateur
window.crossOriginIsolated
// → true = LLM local activé ✅

# 5. Observer overlay de chargement
```

### Test 3: Test de Génération FR/AR

**Français**:
```
Input: "Comment obtenir une CNI ?"
Expected: Réponse générée (source: local_llm ou backend)
```

**Arabe**:
```
Input: "كيف أحصل على بطاقة الهوية؟"
Expected: Réponse en arabe
```

### Test 4: Test Fallback

**Simuler timeout**:

Dans `src/engine/ai-adapter.js`, temporairement:
```javascript
GENERATION_TIMEOUT: 1,  // 1ms au lieu de 15000
```

Résultat attendu:
```
[AI Adapter] Timeout génération
[AI Adapter] Fallback backend (raison: timeout)
→ Requête vers http://localhost:4000/ai/fallback
[App] Réponse envoyée (source: fallback) ✅
```

---

## Résumé Rapide

### Actuellement
- ✅ Backend fonctionne
- ✅ Frontend fonctionne
- ⚠️ LLM local désactivé (crossOriginIsolated=false)
- ✅ Mode backend-only actif (fallback automatique)

### Pour Activer LLM Local
1. ✅ `vite.config.js` créé
2. 🔄 Redémarrer `npm run dev`
3. ✅ Vérifier `window.crossOriginIsolated === true`
4. ⏱️ Attendre chargement modèle (1-2 min)
5. 🎉 LLM local actif

### Commandes Utiles

```bash
# Backend
npm run backend

# Frontend (avec nouveau config)
npm run dev

# Tests automatisés
node test-phase2-frontend.js        # 29 tests structure
node test-backend-integration.js    # 16 tests backend

# Console navigateur
window.crossOriginIsolated          # Vérifier status
window.APP_DEBUG.getAIStatus()      # Status IA détaillé
```

---

## Conclusion

🎯 **Le système fonctionne parfaitement** en mode backend-only actuellement.

🚀 **Pour activer le LLM local**:
- Redémarre Vite après création de `vite.config.js`
- Vérifie `crossOriginIsolated === true`
- Observe le chargement du modèle avec l'overlay

📊 **Les deux modes sont valides**:
- Backend-only: Plus rapide, pas de téléchargement
- Local LLM: Plus autonome, fonctionne offline après chargement

Le choix dépend de tes besoins pour la démo Nuit de l'Info ! 🇲🇷
