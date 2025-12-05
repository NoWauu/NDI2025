# 🧪 Plan de Tests Backend Phase 1

**Date** : Décembre 2025  
**Projet** : Chatbot IA Services Publics Mauritanie

---

## 🎯 Objectif

Tester tous les modules backend implémentés en Phase 1 pour valider leur fonctionnement avant l'intégration avec le frontend.

---

## 📋 Checklist de Tests

### 1. Tests Data Loader (`ia/data_loader.js`)

#### Test 1.1 : Chargement KB
```bash
node -e "const {loadKB} = require('./ia/data_loader'); console.log(loadKB('./data/kb_services_mauritanie.json'));"
```

**Vérifications** :
- [ ] Fichier chargé sans erreur
- [ ] Toutes les entrées sont valides
- [ ] Structure correcte (id, title, lang, tags, body)

#### Test 1.2 : Chargement FAQ FR
```bash
node -e "const {loadFAQ} = require('./ia/data_loader'); console.log(loadFAQ('./data/faq_fr_rag.json'));"
```

**Vérifications** :
- [ ] Fichier chargé sans erreur
- [ ] Toutes les entrées sont valides
- [ ] Structure correcte (id, question, answer, tags, category)

#### Test 1.3 : Chargement FAQ AR
```bash
node -e "const {loadFAQ} = require('./ia/data_loader'); console.log(loadFAQ('./data/faq_ar_rag.json'));"
```

**Vérifications** :
- [ ] Fichier chargé sans erreur
- [ ] Toutes les entrées sont valides

#### Test 1.4 : Validation des entrées invalides
```bash
# Créer un fichier test avec entrées invalides
# Vérifier que les warnings sont affichés
```

**Vérifications** :
- [ ] Entrées invalides filtrées
- [ ] Warnings affichés dans la console

---

### 2. Tests Prompting (`ia/prompting.js`)

#### Test 2.1 : Prompt système FR
```bash
node -e "const {buildSystemPromptFR} = require('./ia/prompting'); console.log(buildSystemPromptFR());"
```

**Vérifications** :
- [ ] Prompt système français généré
- [ ] Contenu approprié pour assistant services publics

#### Test 2.2 : Prompt système AR
```bash
node -e "const {buildSystemPromptAR} = require('./ia/prompting'); console.log(buildSystemPromptAR());"
```

**Vérifications** :
- [ ] Prompt système arabe généré
- [ ] Contenu en arabe correct

#### Test 2.3 : Formatage contexte
```bash
node -e "const {formatContext} = require('./ia/prompting'); const kb = [{title: 'Test', body: 'Contenu'}]; const faq = [{question: 'Q?', answer: 'R'}]; console.log(formatContext(kb, faq));"
```

**Vérifications** :
- [ ] Contexte KB formaté correctement
- [ ] Contexte FAQ formaté correctement
- [ ] Sections bien séparées

#### Test 2.4 : Construction prompt complet FR
```bash
node -e "const {buildPrompt} = require('./ia/prompting'); const kb = [{title: 'CNI', body: 'Document identité'}]; const faq = [{question: 'Comment obtenir CNI?', answer: 'Aller au centre'}]; console.log(buildPrompt({question: 'Comment obtenir ma CNI?', language: 'fr', kbSnippets: kb, faqSnippets: faq}));"
```

**Vérifications** :
- [ ] Prompt complet généré
- [ ] System prompt inclus
- [ ] Contexte inclus
- [ ] Question incluse
- [ ] Instruction langue incluse

#### Test 2.5 : Construction prompt complet AR
```bash
# Même test avec language: 'ar'
```

**Vérifications** :
- [ ] Prompt arabe généré
- [ ] System prompt AR utilisé

---

### 3. Tests App.js (`app.js`)

#### Test 3.1 : buildIaRequestFromUserMessage FR
```bash
node -e "const {buildIaRequestFromUserMessage} = require('./app'); buildIaRequestFromUserMessage('Comment obtenir un passeport?', 'fr').then(r => console.log(JSON.stringify(r, null, 2)));"
```

**Vérifications** :
- [ ] Objet retourné avec `prompt` et `meta`
- [ ] Prompt construit correctement
- [ ] Meta contient `language: 'fr'`

#### Test 3.2 : buildIaRequestFromUserMessage AR
```bash
# Même test avec 'ar'
```

**Vérifications** :
- [ ] Prompt AR généré
- [ ] Meta contient `language: 'ar'`

#### Test 3.3 : Test avec script existant
```bash
node app.js
```

**Vérifications** :
- [ ] Script s'exécute sans erreur
- [ ] Prompt généré et affiché
- [ ] Format JSON valide

---

### 4. Tests Script de Test (`scripts/test_llm_local.js`)

#### Test 4.1 : Exécution complète
```bash
node scripts/test_llm_local.js
```

**Vérifications** :
- [ ] Script s'exécute sans erreur
- [ ] KB chargée
- [ ] FAQ chargée
- [ ] Prompt construit
- [ ] Réponse simulée affichée

---

## 🚀 Script de Test Automatisé

Créer un fichier `test-backend-phase1.js` qui exécute tous les tests ci-dessus.

---

## 📊 Résultats Attendus

### ✅ Succès

- Tous les modules se chargent sans erreur
- Les données sont validées correctement
- Les prompts sont construits correctement
- Les formats JSON sont valides

### ⚠️ Problèmes Potentiels

1. **Incompatibilité CommonJS/ES Modules** : Les tests peuvent échouer si `package.json` a `"type": "module"`
2. **Chemins de fichiers** : Vérifier que les chemins relatifs fonctionnent
3. **Encodage** : Vérifier l'encodage UTF-8 pour l'arabe

---

## 🔧 Corrections Nécessaires

### Avant les Tests

1. **Résoudre l'incompatibilité module system**
   - Option A : Renommer `.js` en `.cjs` pour le backend
   - Option B : Convertir en ES Modules
   - Option C : Créer un fichier de configuration

2. **Vérifier les dépendances**
   - Aucune dépendance npm requise actuellement (juste Node.js natif)

---

## 📝 Notes

- Les tests utilisent `require()` car le backend est en CommonJS
- Si conversion en ES Modules, adapter les commandes de test
- Les tests peuvent être exécutés individuellement ou via un script automatisé

---

**Prochaine étape** : Exécuter les tests et corriger les problèmes identifiés

