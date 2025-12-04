# 🚀 Guide de Démarrage Rapide - Phase 1

## Lancer l'Application

```bash
# 1. Installer les dépendances (si pas encore fait)
npm install

# 2. Démarrer le serveur
npm run dev

# 3. Ouvrir dans le navigateur
# http://localhost:3000
```

## Tester les Fonctionnalités

### Test 1 : Message de bienvenue
- ✅ Ouvrir http://localhost:3000
- ✅ Vérifier que le message de bienvenue s'affiche
- ✅ Badge statut doit afficher "🔴 Hors ligne"

### Test 2 : Rules Engine - Questions FAQ
Essayez ces questions :

1. **CNI** : "Comment obtenir une carte d'identité ?"
2. **Passeport** : "Je veux faire mon passeport"
3. **Santé** : "Où faire vacciner mon enfant ?"
4. **École** : "Comment inscrire mon enfant à l'école ?"
5. **Emploi** : "Comment chercher un emploi ?"
6. **Permis** : "Comment obtenir un permis de conduire ?"

### Test 3 : Persistance IndexedDB
1. Envoyer quelques messages
2. Rafraîchir la page (F5)
3. ✅ Vérifier que l'historique est rechargé

### Test 4 : DevTools
Ouvrir Console DevTools (F12) :

```javascript
// Voir statistiques DB
await APP_DEBUG.getDBStats()

// Voir statistiques FAQ
APP_DEBUG.getFAQStats()

// Effacer historique
await APP_DEBUG.clearMessages()
```

### Test 5 : IndexedDB
Chrome DevTools > Application > IndexedDB > ChatBotDB
- ✅ Store "messages" contient les messages
- ✅ Store "knowledgeBase" existe
- ✅ Store "config" existe

### Test 6 : Responsive
1. ✅ Desktop : Interface large et aérée
2. ✅ Mobile (F12 > Device Toolbar) : Interface adaptée
3. ✅ Textarea auto-resize quand on tape

## Résolution de Problèmes

### Erreur "Cannot find module"
```bash
npm install
```

### FAQ ne charge pas
- Vérifier que le serveur tourne (`npm run dev`)
- Vérifier console pour erreurs CORS

### Messages ne sauvegardent pas
- Vérifier DevTools > Application > IndexedDB
- Essayer de vider le cache navigateur

## Questions Suggérées pour Démo

Pour le jury / présentation :

1. "Comment obtenir une carte d'identité ?" → Réponse admin
2. "Je veux créer mon entreprise" → Réponse entreprise  
3. "Permis de conduire" → Réponse transport
4. "Question random xyz" → Réponse par défaut avec suggestions

## Prêt pour Phase 2 !

Une fois ces tests validés, Téo peut commencer Phase 2 :
- Implémenter `ai-adapter.js`
- Intégrer Transformer.js + TinyLLaMA
- Changer `ENABLE_AI: true` dans `main.js`
