"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRouter = configRouter;
const express_1 = require("express");
function configRouter(configService) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/config
     * Get current configuration (masked for security)
     */
    router.get('/', (req, res) => {
        try {
            const config = configService.getMaskedConfig();
            const status = configService.getConfigStatus();
            res.json({
                success: true,
                config,
                status,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Get config error:', error);
            res.status(500).json({
                error: 'Failed to get configuration',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    /**
     * POST /api/config
     * Update configuration
     */
    router.post('/', (req, res) => {
        try {
            const newConfig = req.body;
            // Validate required fields for basic config
            if (newConfig.apiUrl !== undefined || newConfig.apiToken !== undefined) {
                if (!newConfig.apiUrl || !newConfig.apiToken) {
                    return res.status(400).json({
                        error: 'Both apiUrl and apiToken are required when updating API configuration'
                    });
                }
            }
            configService.updateConfig(newConfig);
            res.json({
                success: true,
                message: 'Configuration updated successfully',
                config: configService.getMaskedConfig(),
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Update config error:', error);
            res.status(400).json({
                error: 'Failed to update configuration',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    /**
     * POST /api/config/api
     * Set API configuration (URL and token)
     */
    router.post('/api', (req, res) => {
        try {
            const { apiUrl, apiToken } = req.body;
            if (!apiUrl || !apiToken) {
                return res.status(400).json({
                    error: 'Both apiUrl and apiToken are required'
                });
            }
            configService.setApiConfig(apiUrl, apiToken);
            res.json({
                success: true,
                message: 'API configuration updated successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Set API config error:', error);
            res.status(400).json({
                error: 'Failed to set API configuration',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    /**
     * GET /api/config/status
     * Get configuration status
     */
    router.get('/status', (req, res) => {
        try {
            const status = configService.getConfigStatus();
            res.json({
                success: true,
                ...status,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Get config status error:', error);
            res.status(500).json({
                error: 'Failed to get configuration status',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    /**
     * POST /api/config/reset
     * Reset configuration to defaults
     */
    router.post('/reset', (req, res) => {
        try {
            configService.resetConfig();
            res.json({
                success: true,
                message: 'Configuration reset to defaults',
                config: configService.getMaskedConfig(),
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Reset config error:', error);
            res.status(500).json({
                error: 'Failed to reset configuration',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    return router;
}
//# sourceMappingURL=config.js.map