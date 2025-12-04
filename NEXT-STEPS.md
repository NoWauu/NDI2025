# 🚀 Prochaines Étapes - Phase 2 & 3

**Statut Phase 1** : ✅ Complete
**À faire** : Phase 2 (LLM) + Phase 3 (RAG)

---

## 📋 Roadmap

```
✅ Phase 1 : Merge Frontend/Backend      [DONE]
   ├─ Backend ES Modules
   ├─ Serveur HTTP
   ├─ API /api/chat
   └─ Frontend connecté

⬜ Phase 2 : Intégration LLM Réel        [TODO]
   ├─ Installer Transformer.js
   ├─ Charger TinyLLaMA
   ├─ Générer vraies réponses
   └─ Optimiser temps de réponse

⬜ Phase 3 : RAG avec Embeddings         [TODO]
   ├─ Jina Embeddings
   ├─ Vectorisation KB
   ├─ Recherche similarité
   └─ Top-K documents
```

---

## 🎯 Phase 2 : Intégration LLM Réel

### Objectif

Remplacer le stub qui retourne le prompt par un **vrai LLM** qui génère des réponses.

### Étapes Détaillées

#### 1️⃣ Installer les dépendances

```bash
npm install @xenova/transformers
```

#### 2️⃣ Modifier `ia/llm.js`

```javascript
import { pipeline } from '@xenova/transformers';

let llmPipeline = null;

/**
 * Initialise le modèle LLM
 */
export async function initLLM() {
  console.log('[LLM] Chargement de TinyLLaMA...');

  llmPipeline = await pipeline(
    'text-generation',
    'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
    {
      quantized: true,
      revision: 'main'
    }
  );

  console.log('[LLM] TinyLLaMA chargé');
}

/**
 * Génère une réponse à partir d'un prompt
 */
export async function generateLLMResponse(prompt) {
  if (!llmPipeline) {
    throw new Error('LLM not initialized');
  }

  const result = await llmPipeline(prompt, {
    max_new_tokens: 150,
    temperature: 0.7,
    top_k: 50,
    top_p: 0.9,
    do_sample: true,
    return_full_text: false
  });

  return result[0].generated_text.trim();
}
```

#### 3️⃣ Modifier `ia/app.js`

```javascript
import { generateLLMResponse, initLLM } from './llm.js';

export async function initBackend() {
  // ... code existant ...

  // Charger le LLM
  await initLLM();

  isInitialized = true;
}

export async function generateIaResponse({ message, language, history }) {
  // ... code existant jusqu'à buildPrompt ...

  // NOUVEAU : Générer vraie réponse au lieu de retourner le prompt
  const llmResponse = await generateLLMResponse(prompt);

  return {
    content: llmResponse,  // ← Réponse générée, pas le prompt
    confidence: 0.75,
    source: 'ai',
    metadata: {
      language,
      model: 'TinyLLaMA-1.1B',
      kbEntriesUsed: kbSnippets.length,
      faqEntriesUsed: faqSnippets.length,
      ragEnabled: false
    }
  };
}
```

#### 4️⃣ Tester

```bash
# Redémarrer le backend
npm run backend

# Tester
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Comment obtenir une CNI ?", "language": "fr"}'
```

**Résultat attendu** : Une vraie réponse en français, pas le prompt

### ⚠️ Points d'Attention Phase 2

1. **Temps de chargement** : Le modèle TinyLLaMA (~500MB) peut prendre 30-60 secondes à charger au démarrage
   - Solution : Ajouter un indicateur de chargement

2. **Temps de génération** : ~2-5 secondes par réponse
   - Solution : Streaming si possible, sinon timeout à 15s

3. **Mémoire** : TinyLLaMA nécessite ~2GB RAM
   - Solution : Monitorer avec `process.memoryUsage()`

4. **Qualité des réponses** : TinyLLaMA peut halluciner
   - Solution : Affiner le prompt, ajouter des instructions claires

---

## 🔍 Phase 3 : RAG avec Embeddings

### Objectif

Améliorer la qualité des réponses en **sélectionnant les documents les plus pertinents** via recherche vectorielle.

### Étapes Détaillées

#### 1️⃣ Installer les dépendances

```bash
npm install @xenova/transformers  # (déjà fait en Phase 2)
```

#### 2️⃣ Créer `ia/embeddings.js`

```javascript
import { pipeline } from '@xenova/transformers';

let embeddingPipeline = null;

export async function initEmbeddings() {
  console.log('[Embeddings] Chargement Jina...');

  embeddingPipeline = await pipeline(
    'feature-extraction',
    'Xenova/jina-embeddings-v2-small-en',
    { quantized: true }
  );

  console.log('[Embeddings] Jina chargé');
}

export async function getEmbedding(text) {
  const result = await embeddingPipeline(text, {
    pooling: 'mean',
    normalize: true
  });

  return Array.from(result.data);
}

export function cosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
```

#### 3️⃣ Modifier `ia/rag.js`

```javascript
import { getEmbedding, cosineSimilarity } from './embeddings.js';

// Cache des embeddings
let kbEmbeddings = [];
let faqEmbeddings = [];

export async function indexDocuments(kbData, faqData) {
  console.log('[RAG] Indexation des documents...');

  // Vectoriser KB
  for (const kb of kbData) {
    const text = `${kb.title} ${kb.body}`;
    const embedding = await getEmbedding(text);
    kbEmbeddings.push({ id: kb.id, embedding, doc: kb });
  }

  // Vectoriser FAQ
  for (const faq of faqData) {
    const text = `${faq.question} ${faq.answer}`;
    const embedding = await getEmbedding(text);
    faqEmbeddings.push({ id: faq.id, embedding, doc: faq });
  }

  console.log(`[RAG] ${kbEmbeddings.length} KB + ${faqEmbeddings.length} FAQ indexés`);
}

export async function selectRagContext(question, topK = 3) {
  console.log(`[RAG] Recherche pour : "${question}"`);

  // Vectoriser la question
  const queryEmbedding = await getEmbedding(question);

  // Calculer similarités KB
  const kbScores = kbEmbeddings.map(entry => ({
    doc: entry.doc,
    score: cosineSimilarity(queryEmbedding, entry.embedding)
  }));

  // Calculer similarités FAQ
  const faqScores = faqEmbeddings.map(entry => ({
    doc: entry.doc,
    score: cosineSimilarity(queryEmbedding, entry.embedding)
  }));

  // Trier et prendre top-K
  kbScores.sort((a, b) => b.score - a.score);
  faqScores.sort((a, b) => b.score - a.score);

  return {
    kbSnippets: kbScores.slice(0, topK).map(s => s.doc),
    faqSnippets: faqScores.slice(0, topK).map(s => s.doc)
  };
}
```

#### 4️⃣ Modifier `ia/app.js`

```javascript
import { indexDocuments } from './rag.js';

export async function initBackend() {
  // ... charger KB + FAQ ...

  // NOUVEAU : Indexer pour RAG
  await indexDocuments(kbData, [...faqDataFR, ...faqDataAR]);

  isInitialized = true;
}

export async function generateIaResponse({ message, language, history }) {
  // REMPLACER le code qui prenait juste les 2 premiers
  // const kbSnippets = kbData.filter(...).slice(0, 2);
  // const faqSnippets = (...).slice(0, 2);

  // PAR recherche RAG
  const ragContext = await selectRagContext(message, 3);
  const kbSnippets = ragContext.kbSnippets.filter(kb => kb.lang === language);
  const faqSnippets = ragContext.faqSnippets;

  // ... reste du code inchangé ...
}
```

#### 5️⃣ Tester

```bash
# Redémarrer le backend (indexation au démarrage)
npm run backend

# Tester avec une question
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "passeport biométrique", "language": "fr"}'
```

**Résultat attendu** : Le contexte devrait contenir les documents sur le passeport, pas la CNI

---

## 📊 Comparaison Phase 1 vs Phase 2 vs Phase 3

| Aspect | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|
| **Réponse** | Prompt construit | Texte généré LLM | Texte généré + contexte pertinent |
| **Contexte** | 2 premiers docs | 2 premiers docs | Top-3 documents similaires |
| **Temps** | ~50ms | ~2-5s | ~3-7s |
| **Qualité** | N/A | Moyenne | Haute |
| **Pertinence** | Faible | Faible | Haute |

---

## 🧪 Tests à Faire

### Phase 2

- [ ] Chargement modèle TinyLLaMA
- [ ] Génération de réponse simple
- [ ] Génération avec historique
- [ ] Timeout si génération trop longue
- [ ] Qualité des réponses FR/AR
- [ ] Mémoire utilisée
- [ ] Temps de réponse moyen

### Phase 3

- [ ] Indexation KB + FAQ
- [ ] Recherche similarité
- [ ] Top-K documents corrects
- [ ] Pertinence contexte vs question
- [ ] Performance avec grande KB (100+ docs)
- [ ] Cache embeddings

---

## 🎯 Priorités

### Must Have (Nuit de l'Info)

1. ✅ Phase 1 : Merge frontend/backend
2. ⬜ Phase 2 : LLM génère vraies réponses
3. ⬜ Interface web fonctionnelle
4. ⬜ Mode offline (fallback rules)

### Nice to Have

1. ⬜ Phase 3 : RAG avec embeddings
2. ⬜ Service Worker PWA
3. ⬜ Support complet arabe
4. ⬜ Optimisations performance

---

## ⏱️ Estimation Temps

| Phase | Tâche | Temps Estimé |
|-------|-------|--------------|
| 2 | Installer + Configurer Transformer.js | 30 min |
| 2 | Intégrer TinyLLaMA | 1h |
| 2 | Tests + Debugging | 1h |
| 2 | **Total Phase 2** | **2h30** |
| 3 | Embeddings Jina | 1h |
| 3 | RAG recherche vectorielle | 1h30 |
| 3 | Tests + Optimisation | 30 min |
| 3 | **Total Phase 3** | **3h** |

**Total estimé Phase 2 + 3** : ~5h30

---

## 📚 Ressources

### Documentation

- [Transformer.js Docs](https://huggingface.co/docs/transformers.js)
- [TinyLLaMA Model](https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0)
- [Jina Embeddings](https://huggingface.co/jinaai/jina-embeddings-v2-small-en)

### Alternatives LLM

Si TinyLLaMA trop lourd :
- Qwen2.5-0.5B (~300MB, plus rapide)
- Phi-2 (~1.5GB, meilleure qualité)

### Alternatives Embeddings

Si Jina trop lourd :
- all-MiniLM-L6-v2 (~23MB, plus rapide)
- BGE-small-en (~33MB, bon compromis)

---

## ✅ Checklist Avant Production

### Phase 2

- [ ] LLM charge sans erreur
- [ ] Génération < 10 secondes
- [ ] Pas de hallucinations graves
- [ ] Mémoire < 3GB
- [ ] Logs clairs
- [ ] Gestion timeout
- [ ] Fallback si erreur LLM

### Phase 3

- [ ] Indexation au démarrage
- [ ] Top-K pertinents
- [ ] Temps indexation acceptable
- [ ] Cache embeddings
- [ ] Pas de fuites mémoire

---

**Dernière mise à jour** : Décembre 2025
**Prochaine action** : Implémenter Phase 2 (LLM)
