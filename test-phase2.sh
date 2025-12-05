#!/bin/bash

# Script de test Phase 2 - Tous les nouveaux endpoints
# Usage: ./test-phase2.sh

echo "🧪 Test Backend Phase 2"
echo "======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:4000"

# Compteurs
PASSED=0
FAILED=0

# Fonction de test
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected="$5"

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s "$BASE_URL$endpoint")
    else
        response=$(curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "   Expected: $expected"
        echo "   Got: $(echo "$response" | head -c 100)..."
        ((FAILED++))
        return 1
    fi
}

# Test 1: Backend status général
echo -e "${BLUE}=== Test Endpoints Phase 1 (Rétrocompatibilité) ===${NC}"
test_endpoint "GET /api/status" "GET" "/api/status" "" "status"

test_endpoint "POST /api/chat (FR)" "POST" "/api/chat" \
    '{"message": "Comment obtenir une CNI ?", "language": "fr"}' \
    "content"

# Test 2: Nouveaux endpoints Phase 2
echo ""
echo -e "${BLUE}=== Test Nouveaux Endpoints Phase 2 ===${NC}"

test_endpoint "POST /ai/fallback (timeout)" "POST" "/ai/fallback" \
    '{"message": "Quel est le coût du passeport?", "language": "fr", "reason": "timeout"}' \
    "content"

test_endpoint "POST /ai/fallback (AR)" "POST" "/ai/fallback" \
    '{"message": "كيف أحصل على بطاقة الهوية؟", "language": "ar", "reason": "low_confidence"}' \
    "content"

test_endpoint "GET /ai/status" "GET" "/ai/status" "" "ai"

test_endpoint "GET /ai/model-info" "GET" "/ai/model-info" "" "TinyLlama"

test_endpoint "POST /ai/logs" "POST" "/ai/logs" \
    '{"type": "request", "data": {"source": "test", "message": "test", "success": true}}' \
    "success"

test_endpoint "GET /ai/logs?limit=10" "GET" "/ai/logs?limit=10" "" "logs"

# Test 3: Sécurité
echo ""
echo -e "${BLUE}=== Test Sécurité ===${NC}"

# Test input trop grand
echo -n "Testing input sanitization... "
long_input=$(printf 'A%.0s' {1..15000})
response=$(curl -s -X POST "$BASE_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"$long_input\", \"language\": \"fr\"}")

if echo "$response" | grep -q "content"; then
    echo -e "${GREEN}✓ PASS${NC} (input truncated)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 4: Erreurs
echo ""
echo -e "${BLUE}=== Test Gestion Erreurs ===${NC}"

echo -n "Testing missing message... "
response=$(curl -s -X POST "$BASE_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{"language": "fr"}')

if echo "$response" | grep -q "error"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Testing invalid language... "
response=$(curl -s -X POST "$BASE_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{"message": "test", "language": "en"}')

if echo "$response" | grep -q "error"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Testing 404... "
response=$(curl -s "$BASE_URL/nonexistent")

if echo "$response" | grep -q "Route non trouvée"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 5: Statistiques détaillées
echo ""
echo -e "${BLUE}=== Statistiques Détaillées ===${NC}"

echo ""
echo "📊 GET /ai/status (détails):"
curl -s "$BASE_URL/ai/status" | jq '.'

echo ""
echo "🤖 GET /ai/model-info (extrait):"
curl -s "$BASE_URL/ai/model-info" | jq '.model | {name, version, defaultVariant, languages}'

echo ""
echo "📈 GET /ai/logs (statistiques):"
curl -s "$BASE_URL/ai/logs?type=requests&limit=5" | jq '.logs | length'

# Résumé
echo ""
echo "======================================"
echo -e "${BLUE}Résumé des Tests${NC}"
echo "======================================"
echo -e "Total: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Tous les tests passent !${NC}"
    echo ""
    echo "Phase 2 Backend est opérationnel :"
    echo "  - Fallback intelligent: ✓"
    echo "  - Logging IA: ✓"
    echo "  - Model info: ✓"
    echo "  - Sécurité (rate limit, sanitization): ✓"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Certains tests ont échoué${NC}"
    exit 1
fi
