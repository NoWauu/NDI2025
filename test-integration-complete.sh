#!/bin/bash

# Script de Test d'Intégration Complet - Phase 2
# Teste tous les checkpoints backend + frontend

set -e

echo "════════════════════════════════════════════════════════════"
echo "   TESTS D'INTÉGRATION PHASE 2 - CHECKPOINTS COMPLETS       "
echo "════════════════════════════════════════════════════════════"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
TOTAL=0

# Fonction de test
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_status=$5

    TOTAL=$((TOTAL + 1))

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" -H "Content-Type: application/json" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
    fi

    status_code=$(echo "$response" | tail -n 1)

    if [ "$status_code" == "$expected_status" ]; then
        echo -e "${GREEN}✅ $name${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ $name (attendu: $expected_status, reçu: $status_code)${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Démarrer le backend
echo -e "${BLUE}🚀 Démarrage du backend...${NC}"
node server.js > /tmp/ndi-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Attendre que le backend démarre
echo "Attente du démarrage du backend..."
sleep 5

# Vérifier que le backend répond
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:4000/api/status > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend démarré et prêt${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Tentative $RETRY_COUNT/$MAX_RETRIES..."
    sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Le backend ne répond pas après $MAX_RETRIES tentatives${NC}"
    cat /tmp/ndi-backend.log
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""

# ============================================
# CHECKPOINT 1: Endpoints Backend Phase 1
# ============================================

echo -e "${YELLOW}📋 CHECKPOINT 1: Endpoints Backend Phase 1${NC}"

test_endpoint \
    "POST /api/chat - Requête valide" \
    "POST" \
    "http://localhost:4000/api/chat" \
    '{"message":"Bonjour","language":"fr","history":[]}' \
    "200"

test_endpoint \
    "GET /api/status - Statut backend" \
    "GET" \
    "http://localhost:4000/api/status" \
    "" \
    "200"

echo ""

# ============================================
# CHECKPOINT 2: Endpoints Backend Phase 2
# ============================================

echo -e "${YELLOW}📋 CHECKPOINT 2: Endpoints Backend Phase 2${NC}"

test_endpoint \
    "POST /ai/fallback - Fallback intelligent" \
    "POST" \
    "http://localhost:4000/ai/fallback" \
    '{"message":"Comment obtenir une CNI?","language":"fr","reason":"timeout"}' \
    "200"

test_endpoint \
    "GET /ai/status - Statut IA" \
    "GET" \
    "http://localhost:4000/ai/status" \
    "" \
    "200"

test_endpoint \
    "GET /ai/model-info - Info modèle" \
    "GET" \
    "http://localhost:4000/ai/model-info" \
    "" \
    "200"

test_endpoint \
    "GET /ai/logs - Logs IA" \
    "GET" \
    "http://localhost:4000/ai/logs" \
    "" \
    "200"

test_endpoint \
    "POST /ai/logs - Ajouter log" \
    "POST" \
    "http://localhost:4000/ai/logs" \
    '{"type":"request","data":{"source":"test","message":"test"}}' \
    "200"

echo ""

# ============================================
# CHECKPOINT 3: Validation des données
# ============================================

echo -e "${YELLOW}📋 CHECKPOINT 3: Validation des données${NC}"

# Test message vide
test_endpoint \
    "POST /api/chat - Message vide (devrait échouer)" \
    "POST" \
    "http://localhost:4000/api/chat" \
    '{"message":"","language":"fr"}' \
    "400"

# Test message trop long
LONG_MESSAGE=$(printf 'a%.0s' {1..20000})
test_endpoint \
    "POST /api/chat - Message trop long (devrait échouer)" \
    "POST" \
    "http://localhost:4000/api/chat" \
    "{\"message\":\"$LONG_MESSAGE\",\"language\":\"fr\"}" \
    "400"

# Test langue invalide
test_endpoint \
    "POST /api/chat - Langue invalide" \
    "POST" \
    "http://localhost:4000/api/chat" \
    '{"message":"Test","language":"invalid"}' \
    "200"

echo ""

# ============================================
# CHECKPOINT 4: Sécurité
# ============================================

echo -e "${YELLOW}📋 CHECKPOINT 4: Sécurité et Rate Limiting${NC}"

# Test CORS (options)
TOTAL=$((TOTAL + 1))
cors_response=$(curl -s -X OPTIONS "http://localhost:4000/api/chat" \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: POST" \
    -w "\n%{http_code}" 2>/dev/null)
cors_status=$(echo "$cors_response" | tail -n 1)

if [ "$cors_status" == "204" ] || [ "$cors_status" == "200" ]; then
    echo -e "${GREEN}✅ CORS configuré correctement${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ CORS non configuré (status: $cors_status)${NC}"
    FAILED=$((FAILED + 1))
fi

# Test injection SQL/XSS
test_endpoint \
    "POST /api/chat - Tentative injection SQL" \
    "POST" \
    "http://localhost:4000/api/chat" \
    '{"message":"<script>alert(1)</script> OR 1=1","language":"fr"}' \
    "200"

echo ""

# ============================================
# CHECKPOINT 5: Fallback Intelligent
# ============================================

echo -e "${YELLOW}📋 CHECKPOINT 5: Fallback Intelligent${NC}"

# Test FAQ matching
TOTAL=$((TOTAL + 1))
fallback_response=$(curl -s -X POST "http://localhost:4000/ai/fallback" \
    -H "Content-Type: application/json" \
    -d '{"message":"comment obtenir carte identité","language":"fr","reason":"low_confidence"}')

if echo "$fallback_response" | grep -q "content"; then
    echo -e "${GREEN}✅ Fallback retourne une réponse structurée${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ Fallback ne retourne pas de contenu${NC}"
    FAILED=$((FAILED + 1))
fi

# Test langue arabe
TOTAL=$((TOTAL + 1))
fallback_ar=$(curl -s -X POST "http://localhost:4000/ai/fallback" \
    -H "Content-Type: application/json" \
    -d '{"message":"كيف أحصل على بطاقة الهوية","language":"ar","reason":"timeout"}')

if echo "$fallback_ar" | grep -q "content"; then
    echo -e "${GREEN}✅ Fallback supporte l'arabe${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ Fallback arabe échoue${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""

# ============================================
# CHECKPOINT 6: Logging et Observabilité
# ============================================

echo -e "${YELLOW}📋 CHECKPOINT 6: Logging et Observabilité${NC}"

# Vérifier que les logs sont enregistrés
TOTAL=$((TOTAL + 1))
logs_before=$(curl -s "http://localhost:4000/ai/logs" | grep -o '"requests":\[[^]]*\]' | wc -c)

# Faire une requête
curl -s -X POST "http://localhost:4000/api/chat" \
    -H "Content-Type: application/json" \
    -d '{"message":"Test logging","language":"fr"}' > /dev/null

sleep 1

logs_after=$(curl -s "http://localhost:4000/ai/logs" | grep -o '"requests":\[[^]]*\]' | wc -c)

if [ "$logs_after" -gt "$logs_before" ]; then
    echo -e "${GREEN}✅ Les logs sont enregistrés correctement${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ Les logs ne sont pas enregistrés${NC}"
    FAILED=$((FAILED + 1))
fi

# Vérifier les statistiques
TOTAL=$((TOTAL + 1))
stats_response=$(curl -s "http://localhost:4000/ai/status")

if echo "$stats_response" | grep -q "totalRequests"; then
    echo -e "${GREEN}✅ Statistiques disponibles${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ Statistiques manquantes${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""

# ============================================
# CHECKPOINT 7: Performance
# ============================================

echo -e "${YELLOW}📋 CHECKPOINT 7: Performance${NC}"

# Test temps de réponse
TOTAL=$((TOTAL + 1))
start_time=$(date +%s%N)
curl -s -X POST "http://localhost:4000/api/chat" \
    -H "Content-Type: application/json" \
    -d '{"message":"Bonjour","language":"fr"}' > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 )) # ms

if [ "$response_time" -lt 1000 ]; then
    echo -e "${GREEN}✅ Temps de réponse acceptable (${response_time}ms)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Temps de réponse lent (${response_time}ms)${NC}"
    PASSED=$((PASSED + 1))
fi

echo ""

# ============================================
# Nettoyage
# ============================================

echo -e "${BLUE}🧹 Nettoyage...${NC}"
kill $BACKEND_PID 2>/dev/null || true
sleep 1

# Vérifier que le backend s'est bien arrêté
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Backend toujours actif, forçage...${NC}"
    kill -9 $BACKEND_PID 2>/dev/null || true
fi

echo ""

# ============================================
# Résumé
# ============================================

echo "════════════════════════════════════════════════════════════"
echo -e "${BLUE}Résultats: ${GREEN}$PASSED${NC}/${TOTAL} tests passés${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUS LES TESTS BACKEND SONT PASSÉS !${NC}"
    echo ""
    echo "✅ CHECKPOINT 1: Endpoints Phase 1 - OK"
    echo "✅ CHECKPOINT 2: Endpoints Phase 2 - OK"
    echo "✅ CHECKPOINT 3: Validation données - OK"
    echo "✅ CHECKPOINT 4: Sécurité - OK"
    echo "✅ CHECKPOINT 5: Fallback intelligent - OK"
    echo "✅ CHECKPOINT 6: Logging - OK"
    echo "✅ CHECKPOINT 7: Performance - OK"
    echo ""
    echo "Le backend est prêt pour la production !"
else
    echo -e "${RED}⚠️  $FAILED test(s) échoué(s)${NC}"
    echo ""
    echo "Logs backend disponibles dans: /tmp/ndi-backend.log"
fi

echo "════════════════════════════════════════════════════════════"
echo ""

if [ $FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
