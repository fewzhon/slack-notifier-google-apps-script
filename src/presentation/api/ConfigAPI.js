/**
 * ConfigAPI - Backend API for Configuration Management
 * Provides RESTful endpoints for configuration operations with RBAC integration
 */

class ConfigAPI {
  constructor(dependencies = {}) {
    this._logger = dependencies.logger || this._createDefaultLogger();
    this._configUIService = dependencies.configUIService;
    this._accessControlService = dependencies.accessControlService;
    this._authService = dependencies.authService;
    
    this._logger.log('[ConfigAPI] ConfigAPI initialized');
  }
  
  /**
   * Initialize the ConfigAPI
   * @param {Object} dependencies - Service dependencies
   * @returns {Promise<Object>} Initialization result
   */
  async initialize(dependencies = {}) {
    try {
      this._logger.log('Initializing ConfigAPI...');
      
      // Initialize dependencies if not provided
      if (!this._configUIService) {
        this._configUIService = dependencies.configUIService || new ConfigUIService({
          logger: this._logger,
          accessControlService: this._accessControlService,
          authService: this._authService
        });
      }
      
      await this._configUIService.initialize();
      
      this._logger.log('ConfigAPI initialized successfully');
      
      return {
        success: true,
        message: 'ConfigAPI initialized successfully'
      };
      
    } catch (error) {
      this._logger.error('Failed to initialize ConfigAPI', error);
      throw error;
    }
  }
  
  /**
   * Serve configuration pages
   * @param {Object} request - HTTP request object
   * @returns {HtmlOutput} HTML page
   */
  servePage(request) {
    try {
      const page = request.parameter.page || 'dashboard';
      
      this._logger.log(`[ConfigAPI] Serving page: ${page}`);
      
      switch (page) {
        case 'dashboard':
          return this._serveDashboard();
        case 'monitoring':
          return this._serveMonitoringConfig();
        case 'notifications':
          return this._serveNotificationConfig();
        case 'triggers':
          return this._serveTriggerConfig();
        case 'system':
          return this._serveSystemConfig();
        case 'users':
          return this._serveUserConfig();
        default:
          return this._serveDashboard();
      }
      
    } catch (error) {
      this._logger.error('Failed to serve page', error);
      return this._serveErrorPage(error.message);
    }
  }
  
  /**
   * Get dashboard data
   * @param {Object} request - HTTP request object
   * @returns {Object} Dashboard data
   */
  async getDashboardData(request) {
    try {
      const userEmail = request.parameter.userEmail;
      
      if (!userEmail) {
        throw new Error('User email is required');
      }
      
      this._logger.log(`[ConfigAPI] Getting dashboard data for ${userEmail}`);
      
      const result = await this._configUIService.getDashboardData(userEmail);
      
      return {
        success: result.success,
        data: result.success ? result : null,
        error: result.success ? null : result.message
      };
      
    } catch (error) {
      this._logger.error('Failed to get dashboard data', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get configuration value
   * @param {Object} request - HTTP request object
   * @returns {Object} Configuration value
   */
  async getConfigValue(request) {
    try {
      const userEmail = request.parameter.userEmail;
      const settingKey = request.parameter.setting;
      
      if (!userEmail || !settingKey) {
        throw new Error('User email and setting key are required');
      }
      
      this._logger.log(`[ConfigAPI] Getting config value ${settingKey} for ${userEmail}`);
      
      const result = await this._configUIService.getConfigValue(userEmail, settingKey);
      
      return {
        success: result.success,
        data: result.success ? result : null,
        error: result.success ? null : result.message
      };
      
    } catch (error) {
      this._logger.error('Failed to get config value', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update configuration value
   * @param {Object} request - HTTP request object
   * @returns {Object} Update result
   */
  async updateConfigValue(request) {
    try {
      const userEmail = request.parameter.userEmail;
      const settingKey = request.parameter.setting;
      const newValue = request.parameter.value;
      const reason = request.parameter.reason || '';
      
      if (!userEmail || !settingKey || newValue === undefined) {
        throw new Error('User email, setting key, and value are required');
      }
      
      this._logger.log(`[ConfigAPI] Updating config ${settingKey} for ${userEmail}`);
      
      // Parse JSON value if it's a string
      let parsedValue = newValue;
      if (typeof newValue === 'string') {
        try {
          parsedValue = JSON.parse(newValue);
        } catch (e) {
          // If parsing fails, use the string value
          parsedValue = newValue;
        }
      }
      
      const result = await this._configUIService.updateConfigValue(
        userEmail, 
        settingKey, 
        parsedValue, 
        reason
      );
      
      return {
        success: result.success,
        data: result.success ? result : null,
        error: result.success ? null : result.message
      };
      
    } catch (error) {
      this._logger.error('Failed to update config value', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get accessible categories
   * @param {Object} request - HTTP request object
   * @returns {Object} Accessible categories
   */
  async getAccessibleCategories(request) {
    try {
      const userEmail = request.parameter.userEmail;
      
      if (!userEmail) {
        throw new Error('User email is required');
      }
      
      this._logger.log(`[ConfigAPI] Getting accessible categories for ${userEmail}`);
      
      const result = await this._configUIService.getAccessibleCategories(userEmail);
      
      return {
        success: result.success,
        data: result.success ? result : null,
        error: result.success ? null : result.message
      };
      
    } catch (error) {
      this._logger.error('Failed to get accessible categories', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Reset configuration to defaults
   * @param {Object} request - HTTP request object
   * @returns {Object} Reset result
   */
  async resetToDefaults(request) {
    try {
      const userEmail = request.parameter.userEmail;
      const category = request.parameter.category || null;
      const reason = request.parameter.reason || '';
      
      if (!userEmail) {
        throw new Error('User email is required');
      }
      
      this._logger.log(`[ConfigAPI] Resetting config to defaults for ${userEmail}`);
      
      const result = await this._configUIService.resetToDefaults(userEmail, category, reason);
      
      return {
        success: result.success,
        data: result.success ? result : null,
        error: result.success ? null : result.message
      };
      
    } catch (error) {
      this._logger.error('Failed to reset configuration', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Test configuration
   * @param {Object} request - HTTP request object
   * @returns {Object} Test result
   */
  async testConfiguration(request) {
    try {
      const userEmail = request.parameter.userEmail;
      const settingKey = request.parameter.setting;
      
      if (!userEmail || !settingKey) {
        throw new Error('User email and setting key are required');
      }
      
      this._logger.log(`[ConfigAPI] Testing configuration ${settingKey} for ${userEmail}`);
      
      // Get current value
      const configResult = await this._configUIService.getConfigValue(userEmail, settingKey);
      if (!configResult.success) {
        throw new Error(configResult.message);
      }
      
      // Perform test based on setting type
      let testResult = { success: true, message: 'Test completed successfully' };
      
      switch (settingKey) {
        case 'slackWebhookUrl':
          testResult = await this._testSlackWebhook(configResult.value);
          break;
        case 'folderIds':
          testResult = await this._testFolderAccess(configResult.value);
          break;
        default:
          testResult = { success: true, message: 'No specific test available for this setting' };
      }
      
      return {
        success: testResult.success,
        data: testResult,
        error: testResult.success ? null : testResult.message
      };
      
    } catch (error) {
      this._logger.error('Failed to test configuration', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Serve dashboard page
   * @returns {HtmlOutput} Dashboard HTML
   */
  _serveDashboard() {
    const template = HtmlService.createTemplateFromFile('src/presentation/web/configDashboard.html');
    return template.evaluate()
      .setTitle('Configuration Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  /**
   * Serve monitoring configuration page
   * @returns {HtmlOutput} Monitoring config HTML
   */
  _serveMonitoringConfig() {
    const template = HtmlService.createTemplateFromFile('src/presentation/web/monitoringConfig.html');
    return template.evaluate()
      .setTitle('Monitoring Configuration')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  /**
   * Serve notification configuration page
   * @returns {HtmlOutput} Notification config HTML
   */
  _serveNotificationConfig() {
    const template = HtmlService.createTemplateFromFile('src/presentation/web/notificationConfig.html');
    return template.evaluate()
      .setTitle('Notification Configuration')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  /**
   * Serve trigger configuration page
   * @returns {HtmlOutput} Trigger config HTML
   */
  _serveTriggerConfig() {
    const template = HtmlService.createTemplateFromFile('src/presentation/web/triggerConfig.html');
    return template.evaluate()
      .setTitle('Trigger Configuration')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  /**
   * Serve system configuration page
   * @returns {HtmlOutput} System config HTML
   */
  _serveSystemConfig() {
    const template = HtmlService.createTemplateFromFile('src/presentation/web/systemConfig.html');
    return template.evaluate()
      .setTitle('System Configuration')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  /**
   * Serve user configuration page
   * @returns {HtmlOutput} User config HTML
   */
  _serveUserConfig() {
    const template = HtmlService.createTemplateFromFile('src/presentation/web/userConfig.html');
    return template.evaluate()
      .setTitle('User Configuration')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  /**
   * Serve error page
   * @param {string} errorMessage - Error message
   * @returns {HtmlOutput} Error HTML
   */
  _serveErrorPage(errorMessage) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Configuration Error</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>Configuration Error</h1>
        <div class="error">
          <p><strong>Error:</strong> ${errorMessage}</p>
          <p>Please contact your administrator or try again later.</p>
        </div>
      </body>
      </html>
    `;
    
    return HtmlService.createHtmlOutput(html)
      .setTitle('Configuration Error')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  /**
   * Test Slack webhook configuration
   * @param {string} webhookUrl - Webhook URL
   * @returns {Object} Test result
   */
  async _testSlackWebhook(webhookUrl) {
    try {
      if (!webhookUrl) {
        return { success: false, message: 'Webhook URL is not configured' };
      }
      
      // Create a test notification
      const testMessage = {
        text: '🔧 Configuration Test',
        attachments: [{
          color: 'good',
          fields: [{
            title: 'Test Status',
            value: 'Configuration test successful',
            short: true
          }, {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: true
          }]
        }]
      };
      
      const response = UrlFetchApp.fetch(webhookUrl, {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(testMessage)
      });
      
      if (response.getResponseCode() === 200) {
        return { success: true, message: 'Slack webhook test successful' };
      } else {
        return { success: false, message: `Slack webhook test failed: ${response.getResponseCode()}` };
      }
      
    } catch (error) {
      return { success: false, message: `Slack webhook test failed: ${error.message}` };
    }
  }
  
  /**
   * Test folder access configuration
   * @param {Array} folderIds - Array of folder IDs
   * @returns {Object} Test result
   */
  async _testFolderAccess(folderIds) {
    try {
      if (!Array.isArray(folderIds) || folderIds.length === 0) {
        return { success: false, message: 'No folders configured' };
      }
      
      let accessibleFolders = 0;
      let totalFolders = folderIds.length;
      
      for (const folderId of folderIds) {
        try {
          const folder = DriveApp.getFolderById(folderId);
          const folderName = folder.getName();
          accessibleFolders++;
        } catch (error) {
          // Folder not accessible
        }
      }
      
      if (accessibleFolders === totalFolders) {
        return { success: true, message: `All ${totalFolders} folders are accessible` };
      } else {
        return { 
          success: false, 
          message: `Only ${accessibleFolders} of ${totalFolders} folders are accessible` 
        };
      }
      
    } catch (error) {
      return { success: false, message: `Folder access test failed: ${error.message}` };
    }
  }
  
  /**
   * Create default logger
   * @returns {Object} Logger object
   */
  _createDefaultLogger() {
    return {
      log: (message) => Logger.log(`[ConfigAPI] ${message}`),
      error: (message, error) => Logger.log(`[ConfigAPI ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[ConfigAPI WARNING] ${message}`)
    };
  }
}
