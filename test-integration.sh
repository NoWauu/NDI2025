#!/bin/bash

# Script de test d'intégration Frontend ↔ Backend
# Usage: ./test-integration.sh

echo "🧪 Test d'intégration Frontend ↔ Backend"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend status
echo "📡 Test 1: Backend status..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/status)

if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ Backend accessible${NC}"
else
    echo -e "${RED}❌ Backend inaccessible (code: $response)${NC}"
    echo -e "${YELLOW}ℹ️  Démarrez le backend avec: npm run backend${NC}"
    exit 1
fi

# Test 2: API chat en français
echo ""
echo "💬 Test 2: API chat (français)..."
response=$(curl -s -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Comment obtenir une carte d'\''identité ?", "language": "fr"}')

if echo "$response" | grep -q "content"; then
    echo -e "${GREEN}✅ API chat répond correctement${NC}"
    echo "   Extrait: $(echo "$response" | jq -r '.content' | head -c 80)..."
else
    echo -e "${RED}❌ API chat ne répond pas${NC}"
    echo "   Réponse: $response"
    exit 1
fi

# Test 3: API chat en arabe
echo ""
echo "💬 Test 3: API chat (arabe)..."
response=$(curl -s -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "كيف أحصل على بطاقة الهوية؟", "language": "ar"}')

if echo "$response" | grep -q "content"; then
    echo -e "${GREEN}✅ API chat répond en arabe${NC}"
else
    echo -e "${RED}❌ API chat (arabe) ne répond pas${NC}"
    exit 1
fi

# Test 4: Vérification des métadonnées
echo ""
echo "📊 Test 4: Métadonnées réponse..."
metadata=$(echo "$response" | jq -r '.metadata')

if echo "$metadata" | grep -q "language"; then
    echo -e "${GREEN}✅ Métadonnées présentes${NC}"
    echo "   Language: $(echo "$metadata" | jq -r '.language')"
    echo "   KB entries: $(echo "$metadata" | jq -r '.kbEntriesUsed')"
    echo "   FAQ entries: $(echo "$metadata" | jq -r '.faqEntriesUsed')"
else
    echo -e "${YELLOW}⚠️  Métadonnées manquantes${NC}"
fi

# Test 5: Backend stats
echo ""
echo "📈 Test 5: Statistiques backend..."
stats=$(curl -s http://localhost:4000/api/status | jq -r '.backend')

if [ -n "$stats" ]; then
    echo -e "${GREEN}✅ Statistiques disponibles${NC}"
    echo "   KB entries: $(echo "$stats" | jq -r '.kbEntries')"
    echo "   FAQ FR: $(echo "$stats" | jq -r '.faqFREntries')"
    echo "   FAQ AR: $(echo "$stats" | jq -r '.faqAREntries')"
else
    echo -e "${YELLOW}⚠️  Statistiques indisponibles${NC}"
fi

# Résumé
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Tous les tests passent !${NC}"
echo ""
echo "Le système est opérationnel :"
echo "  - Backend IA : http://localhost:4000"
echo "  - Frontend UI : http://localhost:3000 (à démarrer avec npm run dev)"
echo ""
echo "Prochaine étape : Tester l'interface web"
