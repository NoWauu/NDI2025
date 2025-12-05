/**
 * Serveur HTTP Backend IA - Phase 2
 *
 * Expose l'API HTTP complète :
 * - POST /api/chat : Génération de réponses IA
 * - POST /ai/fallback : Fallback intelligent
 * - POST /ai/logs : Logging IA
 * - GET /ai/status : Statut IA détaillé
 * - GET /ai/model-info : Informations modèle
 * - GET /api/status : Statut backend général
 */

import express from 'express';
import cors from 'cors';
import { generateIaResponse, initBackend, getBackendStatus } from './ia/app.js';
import { generateFallbackResponse, initFallbackEngine, getFallbackStats } from './ia/fallback-engine.js';
import { logAIRequest, logAIError, getRecentLogs, getLogStats, exportLogs } from './ia/ai-logger.js';
import { getModelInfo, getRecommendedVariant, validateGenerationParams } from './ia/model-config.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Rate limiting simple (en mémoire)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requêtes/minute

/**
 * Middleware de rate limiting
 */
function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }

    const clientData = rateLimitMap.get(ip);

    if (now > clientData.resetTime) {
        // Reset le compteur
        clientData.count = 1;
        clientData.resetTime = now + RATE_LIMIT_WINDOW;
        return next();
    }

    if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
            error: 'Trop de requêtes. Veuillez réessayer dans 1 minute.',
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
    }

    clientData.count++;
    next();
}

// Middleware
app.use(cors()); // Permet les requêtes cross-origin du frontend
app.use(express.json({ limit: '1mb' })); // Parse le JSON (avec limite de taille)

// Sanitization basique
app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        // Vérifier la taille des strings
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string' && req.body[key].length > 10000) {
                req.body[key] = req.body[key].substring(0, 10000);
            }
        });
    }
    next();
});

// Logs des requêtes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Rate limiting sur les endpoints IA
// Note: Express 5 ne supporte pas les wildcards, on applique le rate limiting directement dans chaque route

// ============================================
// ENDPOINTS PRINCIPAUX
// ============================================

/**
 * POST /api/chat
 * Génère une réponse IA à partir d'un message utilisateur
 */
app.post('/api/chat', rateLimiter, async (req, res) => {
    const startTime = Date.now();

    try {
        const { message, language = 'fr', history = [] } = req.body;

        // Validation
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Le champ "message" est requis et doit être une chaîne de caractères'
            });
        }

        if (!['fr', 'ar'].includes(language)) {
            return res.status(400).json({
                error: 'Le champ "language" doit être "fr" ou "ar"'
            });
        }

        console.log(`[API] Requête chat: "${message.substring(0, 50)}..." (${language})`);

        // Générer la réponse
        const response = await generateIaResponse({ message, language, history });

        // Log la requête
        const responseTime = Date.now() - startTime;
        logAIRequest({
            source: 'local_llm',
            message,
            language,
            confidence: response.confidence,
            responseTime,
            success: true
        });

        // Retourner la réponse
        res.json(response);
    } catch (error) {
        console.error('[API] Erreur lors du traitement:', error);

        const responseTime = Date.now() - startTime;
        logAIError(error, {
            source: 'api_chat',
            message: req.body.message
        });

        logAIRequest({
            source: 'local_llm',
            message: req.body.message,
            language: req.body.language,
            responseTime,
            success: false
        });

        res.status(500).json({
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
});

// ============================================
// NOUVEAUX ENDPOINTS PHASE 2
// ============================================

/**
 * POST /ai/fallback
 * Fallback intelligent quand le LLM local échoue
 */
app.post('/ai/fallback', rateLimiter, async (req, res) => {
    const startTime = Date.now();

    try {
        const { message, language = 'fr', reason = 'unknown' } = req.body;

        // Validation
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Le champ "message" est requis'
            });
        }

        console.log(`[AI Fallback] Requête fallback: "${message.substring(0, 50)}..." (raison: ${reason})`);

        // Générer réponse fallback
        const response = generateFallbackResponse(message, language, reason);

        // Log
        const responseTime = Date.now() - startTime;
        logAIRequest({
            source: 'fallback_backend',
            message,
            language,
            confidence: response.confidence,
            responseTime,
            success: true,
            reason
        });

        res.json(response);
    } catch (error) {
        console.error('[AI Fallback] Erreur:', error);

        logAIError(error, {
            source: 'fallback',
            message: req.body.message,
            reason: req.body.reason
        });

        res.status(500).json({
            error: 'Erreur fallback',
            details: error.message
        });
    }
});

/**
 * POST /ai/logs
 * Enregistre des logs côté client
 */
app.post('/ai/logs', rateLimiter, async (req, res) => {
    try {
        const { type = 'request', data } = req.body;

        if (!data) {
            return res.status(400).json({
                error: 'Le champ "data" est requis'
            });
        }

        // Log selon le type
        if (type === 'error') {
            logAIError(new Error(data.error || 'Unknown error'), {
                source: data.source || 'client',
                ...data.context
            });
        } else if (type === 'request') {
            logAIRequest({
                source: data.source || 'client',
                ...data
            });
        }

        res.json({ success: true, logged: true });
    } catch (error) {
        console.error('[AI Logs] Erreur:', error);
        res.status(500).json({
            error: 'Erreur lors du logging',
            details: error.message
        });
    }
});

/**
 * GET /ai/status
 * Statut détaillé de l'IA
 */
app.get('/ai/status', (req, res) => {
    try {
        const backendStatus = getBackendStatus();
        const fallbackStats = getFallbackStats();
        const logStats = getLogStats();

        res.json({
            status: 'ok',
            backend: backendStatus,
            fallback: fallbackStats,
            // Flatten log stats pour faciliter l'accès
            totalRequests: logStats.totalRequests || 0,
            successRate: logStats.successRate || 0,
            avgResponseTime: logStats.avgResponseTime || 0,
            lastHourRequests: logStats.lastHourRequests || 0,
            logs: logStats,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[AI Status] Erreur:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération du statut',
            details: error.message
        });
    }
});

/**
 * GET /ai/model-info
 * Informations sur le modèle IA
 */
app.get('/ai/model-info', (req, res) => {
    try {
        const modelInfo = getModelInfo();
        const recommendedVariant = getRecommendedVariant();

        res.json({
            ...modelInfo,
            recommended: recommendedVariant
        });
    } catch (error) {
        console.error('[Model Info] Erreur:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des infos modèle',
            details: error.message
        });
    }
});

/**
 * GET /ai/logs
 * Récupère les logs récents (protégé - à sécuriser en prod)
 */
app.get('/ai/logs', (req, res) => {
    try {
        const type = req.query.type || 'all';
        const limit = parseInt(req.query.limit) || 100;

        const logs = getRecentLogs(type, limit);

        res.json({
            ...logs,
            type,
            limit
        });
    } catch (error) {
        console.error('[AI Logs] Erreur:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des logs',
            details: error.message
        });
    }
});

/**
 * POST /ai/logs/export
 * Exporte les logs dans un fichier
 */
app.post('/ai/logs/export', (req, res) => {
    try {
        const filepath = exportLogs();

        res.json({
            success: true,
            file: filepath,
            message: 'Logs exportés avec succès'
        });
    } catch (error) {
        console.error('[AI Logs Export] Erreur:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'export des logs',
            details: error.message
        });
    }
});

// ============================================
// ENDPOINTS GÉNÉRAUX
// ============================================

/**
 * GET /api/status
 * Statut backend général (rétrocompatible Phase 1)
 */
app.get('/api/status', (req, res) => {
    const backendStatus = getBackendStatus();
    res.json({
        status: 'online',
        backend: backendStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /
 * Page d'accueil
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Backend IA Services Publics Mauritanie - Phase 2',
        version: '2.0.0',
        phase: 2,
        endpoints: {
            // Phase 1
            chat: 'POST /api/chat',
            status: 'GET /api/status',
            // Phase 2
            fallback: 'POST /ai/fallback',
            aiStatus: 'GET /ai/status',
            modelInfo: 'GET /ai/model-info',
            logs: 'POST /ai/logs',
            logsGet: 'GET /ai/logs',
            logsExport: 'POST /ai/logs/export'
        }
    });
});

/**
 * Gestion des erreurs 404
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        path: req.path,
        availableEndpoints: [
            'POST /api/chat',
            'POST /ai/fallback',
            'POST /ai/logs',
            'GET /ai/status',
            'GET /ai/model-info',
            'GET /api/status'
        ]
    });
});

/**
 * Démarrage du serveur
 */
async function startServer() {
    try {
        // Initialiser le backend
        console.log('[Server] Initialisation du backend...');
        await initBackend();

        // Initialiser le fallback engine
        console.log('[Server] Initialisation du fallback engine...');
        await initFallbackEngine();

        // Démarrer le serveur HTTP
        app.listen(PORT, () => {
            console.log('');
            console.log('===========================================');
            console.log(`✅ Backend IA Phase 2 ready on http://localhost:${PORT}`);
            console.log('===========================================');
            console.log('');
            console.log('Endpoints Phase 1:');
            console.log(`  - POST http://localhost:${PORT}/api/chat`);
            console.log(`  - GET  http://localhost:${PORT}/api/status`);
            console.log('');
            console.log('Endpoints Phase 2:');
            console.log(`  - POST http://localhost:${PORT}/ai/fallback`);
            console.log(`  - POST http://localhost:${PORT}/ai/logs`);
            console.log(`  - GET  http://localhost:${PORT}/ai/status`);
            console.log(`  - GET  http://localhost:${PORT}/ai/model-info`);
            console.log('');
            console.log('Sécurité:');
            console.log(`  - Rate limiting: ${MAX_REQUESTS_PER_WINDOW} req/min`);
            console.log(`  - CORS: enabled`);
            console.log(`  - Input sanitization: enabled`);
            console.log('');
        });
    } catch (error) {
        console.error('[Server] Erreur fatale lors du démarrage:', error);
        process.exit(1);
    }
}

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
    console.log('\n[Server] Arrêt du serveur...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[Server] Arrêt du serveur...');
    process.exit(0);
});

// Démarrer le serveur
startServer();
