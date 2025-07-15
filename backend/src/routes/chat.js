"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = chatRouter;
const express_1 = require("express");
function chatRouter(llmService) {
    const router = (0, express_1.Router)();
    /**
     * POST /api/chat/completion
     * Send a completion request to the LLM
     */
    router.post('/completion', async (req, res) => {
        try {
            const request = req.body;
            // Validate request
            const validation = llmService.validateRequest(request);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Invalid request',
                    details: validation.errors
                });
            }
            // Send to LLM
            const response = await llmService.sendChatCompletion(request);
            res.json({
                success: true,
                data: response,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Chat completion error:', error);
            res.status(500).json({
                error: 'Failed to get completion',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    /**
     * POST /api/chat/simple
     * Send a simple text completion request
     */
    router.post('/simple', async (req, res) => {
        try {
            const { prompt, maxTokens } = req.body;
            if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
                return res.status(400).json({
                    error: 'Prompt is required and must be a non-empty string'
                });
            }
            const response = await llmService.sendCompletion(prompt, maxTokens);
            res.json({
                success: true,
                response,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Simple completion error:', error);
            res.status(500).json({
                error: 'Failed to get completion',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
    /**
     * POST /api/chat/test
     * Test the LLM connection
     */
    router.post('/test', async (req, res) => {
        try {
            const result = await llmService.testConnection();
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message,
                    responseTime: result.responseTime,
                    timestamp: new Date().toISOString()
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: result.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            console.error('Connection test error:', error);
            res.status(500).json({
                success: false,
                message: `Connection test failed: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }
    });
    return router;
}
//# sourceMappingURL=chat.js.map