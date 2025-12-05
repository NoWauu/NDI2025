/**
 * AI Logger - Système de logging pour l'IA
 *
 * Collecte les métriques, erreurs et événements liés à l'IA
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier des logs
const LOG_DIR = path.join(__dirname, '..', 'logs');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Cache des logs en mémoire
const logsCache = {
    requests: [],
    errors: [],
    performance: []
};

// Limites de cache
const MAX_CACHE_SIZE = 1000;

/**
 * Log une requête IA
 */
export function logAIRequest(data) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'request',
        source: data.source || 'unknown',
        message: data.message?.substring(0, 100), // Limiter la taille
        language: data.language,
        confidence: data.confidence,
        responseTime: data.responseTime,
        success: data.success !== false
    };

    // Ajouter au cache
    logsCache.requests.push(logEntry);

    // Limiter la taille du cache
    if (logsCache.requests.length > MAX_CACHE_SIZE) {
        logsCache.requests.shift();
    }

    // Log console
    console.log(`[AI Log] ${logEntry.source} - ${logEntry.success ? 'SUCCESS' : 'FAILED'} (${logEntry.responseTime}ms)`);
}

/**
 * Log une erreur IA
 */
export function logAIError(error, context = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'error',
        error: error.message || String(error),
        stack: error.stack,
        context: {
            source: context.source || 'unknown',
            reason: context.reason || 'unknown',
            message: context.message?.substring(0, 100)
        }
    };

    // Ajouter au cache
    logsCache.errors.push(logEntry);

    // Limiter la taille du cache
    if (logsCache.errors.length > MAX_CACHE_SIZE) {
        logsCache.errors.shift();
    }

    // Log console
    console.error(`[AI Error] ${logEntry.context.source} - ${logEntry.error}`);
}

/**
 * Log des métriques de performance
 */
export function logPerformance(data) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'performance',
        metric: data.metric,
        value: data.value,
        unit: data.unit || 'ms',
        source: data.source || 'unknown'
    };

    // Ajouter au cache
    logsCache.performance.push(logEntry);

    // Limiter la taille du cache
    if (logsCache.performance.length > MAX_CACHE_SIZE) {
        logsCache.performance.shift();
    }
}

/**
 * Récupère les logs récents
 */
export function getRecentLogs(type = 'all', limit = 100) {
    if (type === 'all') {
        return {
            requests: logsCache.requests.slice(-limit),
            errors: logsCache.errors.slice(-limit),
            performance: logsCache.performance.slice(-limit)
        };
    }

    return logsCache[type]?.slice(-limit) || [];
}

/**
 * Statistiques des logs
 */
export function getLogStats() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // Filtrer les logs de la dernière heure
    const recentRequests = logsCache.requests.filter(
        log => new Date(log.timestamp).getTime() > oneHourAgo
    );

    const recentErrors = logsCache.errors.filter(
        log => new Date(log.timestamp).getTime() > oneHourAgo
    );

    // Calculer statistiques
    const successCount = recentRequests.filter(r => r.success).length;
    const failureCount = recentRequests.filter(r => !r.success).length;

    const avgResponseTime = recentRequests.length > 0
        ? recentRequests.reduce((sum, r) => sum + (r.responseTime || 0), 0) / recentRequests.length
        : 0;

    // Compter par source
    const sourceBreakdown = {};
    recentRequests.forEach(r => {
        sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1;
    });

    return {
        totalRequests: logsCache.requests.length,
        totalErrors: logsCache.errors.length,
        totalPerformanceLogs: logsCache.performance.length,
        lastHour: {
            requests: recentRequests.length,
            errors: recentErrors.length,
            successCount,
            failureCount,
            successRate: recentRequests.length > 0
                ? (successCount / recentRequests.length * 100).toFixed(2) + '%'
                : 'N/A',
            avgResponseTime: Math.round(avgResponseTime) + 'ms',
            sourceBreakdown
        }
    };
}

/**
 * Exporte les logs dans un fichier
 */
export function exportLogs(filename = null) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const file = filename || `ai-logs-${timestamp}.json`;
    const filepath = path.join(LOG_DIR, file);

    const data = {
        exportedAt: new Date().toISOString(),
        stats: getLogStats(),
        logs: logsCache
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    console.log(`[AI Logger] Logs exportés vers ${filepath}`);

    return filepath;
}

/**
 * Nettoie les vieux logs
 */
export function cleanOldLogs(maxAge = 86400000) { // 24h par défaut
    const now = Date.now();

    Object.keys(logsCache).forEach(type => {
        const originalLength = logsCache[type].length;
        logsCache[type] = logsCache[type].filter(
            log => now - new Date(log.timestamp).getTime() < maxAge
        );
        const removed = originalLength - logsCache[type].length;
        if (removed > 0) {
            console.log(`[AI Logger] ${removed} logs ${type} nettoyés`);
        }
    });
}
