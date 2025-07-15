import { Router, Request, Response } from 'express';
import { ConfigService } from '../services/configService';

export function configRouter(configService: ConfigService): Router {
  const router = Router();

  /**
   * GET /api/config
   * Get current configuration (masked for security)
   */
  router.get('/', (req: Request, res: Response) => {
    try {
      const config = configService.getMaskedConfig();
      const status = configService.getConfigStatus();

      res.json({
        success: true,
        config,
        status,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
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
  router.post('/', (req: Request, res: Response) => {
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

    } catch (error: any) {
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
  router.post('/api', (req: Request, res: Response) => {
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

    } catch (error: any) {
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
  router.get('/status', (req: Request, res: Response) => {
    try {
      const status = configService.getConfigStatus();

      res.json({
        success: true,
        ...status,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
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
  router.post('/reset', (req: Request, res: Response) => {
    try {
      configService.resetConfig();

      res.json({
        success: true,
        message: 'Configuration reset to defaults',
        config: configService.getMaskedConfig(),
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
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
