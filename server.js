/**
 * Serveur HTTP Backend IA
 *
 * Expose l'API HTTP pour le frontend :
 * - POST /api/chat : Génération de réponses IA
 * - GET /api/status : Statut du backend
 */

import express from 'express';
import cors from 'cors';
import { generateIaResponse, initBackend, getBackendStatus } from './ia/app.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Permet les requêtes cross-origin du frontend
app.use(express.json()); // Parse le JSON dans les requêtes

// Logs des requêtes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

/**
 * POST /api/chat
 * Génère une réponse IA à partir d'un message utilisateur
 *
 * Body attendu:
 * {
 *   "message": "Comment obtenir une CNI ?",
 *   "language": "fr",
 *   "history": [] // optionnel
 * }
 */
app.post('/api/chat', async (req, res) => {
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

        console.log(`[API] Requête chat: "${message}" (${language})`);

        // Générer la réponse
        const response = await generateIaResponse({ message, language, history });

        // Retourner la réponse
        res.json(response);
    } catch (error) {
        console.error('[API] Erreur lors du traitement:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
});

/**
 * GET /api/status
 * Retourne le statut du backend
 */
app.get('/api/status', (req, res) => {
    const status = getBackendStatus();
    res.json({
        status: 'ok',
        backend: status,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /
 * Page d'accueil simple
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Backend IA Services Publics Mauritanie',
        version: '1.0.0',
        endpoints: {
            chat: 'POST /api/chat',
            status: 'GET /api/status'
        }
    });
});

/**
 * Gestion des erreurs 404
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        path: req.path
    });
});

/**
 * Démarrage du serveur
 */
async function startServer() {
    try {
        // Initialiser le backend (charger les données)
        console.log('[Server] Initialisation du backend...');
        await initBackend();

        // Démarrer le serveur HTTP
        app.listen(PORT, () => {
            console.log('');
            console.log('===========================================');
            console.log(`✅ Backend IA ready on http://localhost:${PORT}`);
            console.log('===========================================');
            console.log('');
            console.log('Endpoints disponibles:');
            console.log(`  - POST http://localhost:${PORT}/api/chat`);
            console.log(`  - GET  http://localhost:${PORT}/api/status`);
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
