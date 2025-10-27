/**
 * Application.js
 * Main application entry point
 * 
 * This class orchestrates the entire application following
 * Clean Architecture principles and Dependency Injection.
 */

/**
 * Main application class
 * @class Application
 */
class Application {
  /**
   * Create a new Application instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this._options = options;
    this._dependencies = null;
    this._initialized = false;
  }

  /**
   * Initialize the application with all dependencies
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) {
      return;
    }

    try {
      // Initialize dependencies
      this._dependencies = await this._createDependencies();
      
      // Validate all dependencies
      this._validateDependencies();
      
      this._initialized = true;
      Logger.log('Application initialized successfully');
      
    } catch (error) {
      Logger.log('Application initialization failed: ' + error.message);
      throw error;
    }
  }

  /**
   * Execute drive monitoring
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Monitoring result
   */
  async monitorDrive(options = {}) {
    await this._ensureInitialized();
    
    // Create monitor use case with sheets adapter for logging
    const monitorUseCase = new MonitorDriveUseCase({
      ...this._dependencies,
      sheetsAdapter: this._dependencies.sheetsAdapter
    });
    return await monitorUseCase.execute(options);
  }

  /**
   * Send test notification
   * @param {string} message - Test message
   * @param {string} channel - Target channel
   * @returns {Promise<boolean>} Success status
   */
  async sendTestNotification(message = 'Test notification from GDrive Monitor', channel = '#dev_sandbox') {
    await this._ensureInitialized();
    
    // Notification and NOTIFICATION_TYPES should be available globally
    
    const notification = new Notification({
      type: NOTIFICATION_TYPES.SYSTEM_STATUS,
      title: 'Test Notification',
      message: message,
      channel: channel,
      priority: NOTIFICATION_PRIORITIES.LOW
    });

    return await this._dependencies.notificationService.sendNotification(notification);
  }

  /**
   * Get current configuration
   * @returns {Promise<Configuration>} Current configuration
   */
  async getConfiguration() {
    await this._ensureInitialized();
    return await this._dependencies.configRepository.getConfiguration();
  }

  /**
   * Update configuration
   * @param {Configuration} configuration - New configuration
   * @returns {Promise<boolean>} Success status
   */
  async updateConfiguration(configuration) {
    await this._ensureInitialized();
    
    // Validate configuration
    const validationResult = await this._dependencies.configRepository.validateConfiguration(configuration);
    if (!validationResult.isValid) {
      throw new Error(`Configuration validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    return await this._dependencies.configRepository.saveConfiguration(configuration);
  }

  /**
   * Test webhook connection
   * @returns {Promise<boolean>} Connection status
   */
  async testWebhookConnection() {
    await this._ensureInitialized();
    return await this._dependencies.notificationService.testConnection();
  }

  /**
   * Get application status
   * @returns {Promise<Object>} Application status
   */
  async getStatus() {
    await this._ensureInitialized();
    
    const configuration = await this.getConfiguration();
    const isMonitoringActive = configuration.isMonitoringActive();
    const isValid = configuration.isValidForMonitoring();
    
    return {
      initialized: this._initialized,
      monitoringActive: isMonitoringActive,
      configurationValid: isValid,
      monitoringWindow: configuration.getMonitoringWindow(),
      foldersConfigured: configuration.folderIds.length,
      webhookConfigured: !!configuration.slackWebhookUrl,
      lastCheck: configuration.scanState.lastCheckTime || 'Never'
    };
  }

  /**
   * Execute drive monitoring (alias for monitorDrive)
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Monitoring result
   */
  async executeDriveMonitoring(options = {}) {
    return await this.monitorDrive(options);
  }

  /**
   * Send daily summary to Slack using Block Kit format
   * @returns {Promise<Object>} Summary result
   */
  async sendDailySummary() {
    await this._ensureInitialized();
    
    try {
      const config = await this.getConfiguration();
      
      // Create sheet adapter for aggregation
      const sheetsAdapter = new GoogleSheetsAdapter({
        logSheetId: config.logSheetId,
        logger: this._dependencies.logger
      });
      
      // Create Block Kit formatter
      const blockKitFormatter = new BlockKitFormatter({
        logger: this._dependencies.logger
      });
      
      // Get log sheet URL
      const sheetUrl = sheetsAdapter.getLogSheetUrl();
      
      // Calculate yesterday's date
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const dateStr = yesterday.toISOString().slice(0, 10); // YYYY-MM-DD
      
      // Aggregate daily changes
      const summary = sheetsAdapter.aggregateDailyChangesFromSheet(dateStr);
      
      // Format using Block Kit
      const blocks = blockKitFormatter.formatDailySummaryBlocks(summary, sheetUrl, dateStr);
      
      // Send using SlackWebhookClient
      const targetChannel = config.weeklySummaryChannel || '#dev_sandbox';
      await this._dependencies.notificationService.sendBlockMessage(blocks, targetChannel);
      
      // Store in Script Properties for Latest Summary panel
      const props = PropertiesService.getScriptProperties();
      props.setProperty('lastDailySummary', JSON.stringify({
        timestamp: new Date().toISOString(),
        date: dateStr,
        summary: summary
      }));
      
      Logger.log('Daily summary sent successfully');
      return {
        success: true,
        message: 'Daily summary sent successfully',
        total: summary.total
      };
      
    } catch (error) {
      Logger.log(`Daily summary failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send weekly summary to Slack using Block Kit format
   * @returns {Promise<Object>} Summary result
   */
  async sendWeeklySummary() {
    await this._ensureInitialized();
    
    try {
      const config = await this.getConfiguration();
      
      // Check if weekly summary is enabled
      if (!config.weeklySummaryEnabled) {
        Logger.log('Weekly summary is disabled');
        return {
          success: true,
          message: 'Weekly summary is disabled',
          skipped: true
        };
      }
      
      // Create sheet adapter for aggregation
      const sheetsAdapter = new GoogleSheetsAdapter({
        logSheetId: config.logSheetId,
        logger: this._dependencies.logger
      });
      
      // Create Block Kit formatter
      const blockKitFormatter = new BlockKitFormatter({
        logger: this._dependencies.logger
      });
      
      // Get log sheet URL
      const sheetUrl = sheetsAdapter.getLogSheetUrl();
      
      // Calculate previous Monday-Sunday range
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
      const lastSunday = new Date(today.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
      const lastMonday = new Date(lastSunday.getTime() - 6 * 24 * 60 * 60 * 1000);
      
      const startDateStr = lastMonday.toISOString().slice(0, 10);
      const endDateStr = lastSunday.toISOString().slice(0, 10);
      
      Logger.log(`Weekly summary for period: ${startDateStr} to ${endDateStr}`);
      
      // Aggregate weekly changes
      const summary = sheetsAdapter.aggregateWeeklyChangesFromSheet(startDateStr, endDateStr);
      
      // Format using Block Kit
      const blocks = blockKitFormatter.formatWeeklySummaryBlocks(summary, sheetUrl, { start: startDateStr, end: endDateStr });
      
      // Send using SlackWebhookClient
      const targetChannel = config.weeklySummaryChannel || '#dev_sandbox';
      await this._dependencies.notificationService.sendBlockMessage(blocks, targetChannel);
      
      // Store in Script Properties for Latest Summary panel
      const props = PropertiesService.getScriptProperties();
      props.setProperty('lastWeeklySummary', JSON.stringify({
        timestamp: new Date().toISOString(),
        weekRange: `${startDateStr} to ${endDateStr}`,
        summary: summary
      }));
      
      Logger.log(`Weekly summary sent to ${targetChannel}. Total changes: ${summary.total}`);
      return {
        success: true,
        message: 'Weekly summary sent successfully',
        total: summary.total
      };
      
    } catch (error) {
      Logger.log(`Weekly summary failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup all triggers using TriggerManager
   * @returns {Promise<Object>} Setup results
   */
  async setupAllTriggers() {
    await this._ensureInitialized();
    
    const triggerManager = new TriggerManager({
      application: this,
      logger: this._dependencies.logger
    });
    
    return await triggerManager.setupAllTriggers();
  }

  /**
   * Remove all triggers using TriggerManager
   * @returns {Promise<Object>} Removal results
   */
  async removeAllTriggers() {
    await this._ensureInitialized();
    
    const triggerManager = new TriggerManager({
      application: this,
      logger: this._dependencies.logger
    });
    
    return await triggerManager.removeAllTriggers();
  }

  /**
   * Get trigger status using TriggerManager
   * @returns {Promise<Object>} Trigger status
   */
  async getTriggerStatus() {
    await this._ensureInitialized();
    
    const triggerManager = new TriggerManager({
      application: this,
      logger: this._dependencies.logger
    });
    
    return await triggerManager.getTriggerStatus();
  }

  /**
   * Build daily summary message
   * @param {Configuration} config - Configuration instance
   * @returns {string} Formatted message
   */
  _buildDailySummaryMessage(config) {
    const date = new Date().toLocaleDateString();
    const folders = config.folderIds.length;
    
    return `📊 **Daily Drive Activity Summary - ${date}**\n\n` +
           `• **Monitored Folders**: ${folders}\n` +
           `• **Monitoring Schedule**: ${config.startHour}:00 - ${config.stopHour}:00 (${config.maxRunsPerDay} runs/day)\n` +
           `• **Status**: System running normally\n` +
           `• **Last Check**: ${new Date().toLocaleTimeString()}\n\n` +
           `_This is an automated daily summary from the GDrive Monitor system._`;
  }

  /**
   * Build weekly summary message
   * @param {Configuration} config - Configuration instance
   * @returns {string} Formatted message
   */
  _buildWeeklySummaryMessage(config) {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    const folders = config.folderIds.length;
    
    return `📈 **Weekly Drive Activity Summary**\n\n` +
           `• **Week**: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}\n` +
           `• **Monitored Folders**: ${folders}\n` +
           `• **Monitoring Schedule**: ${config.startHour}:00 - ${config.stopHour}:00 (${config.maxRunsPerDay} runs/day)\n` +
           `• **Status**: System running normally\n` +
           `• **Weekly Summary Day**: ${this._getDayName(config.weeklySummaryDay)}\n\n` +
           `_This is an automated weekly summary from the GDrive Monitor system._`;
  }

  /**
   * Get day name from day number
   * @param {number} dayNumber - Day number (0-6)
   * @returns {string} Day name
   */
  _getDayName(dayNumber) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[dayNumber] || 'Monday';
  }

  /**
   * Create all application dependencies
   * @private
   * @returns {Promise<Object>} Dependencies object
   */
  async _createDependencies() {
    // Create logger
    const logger = new ConsoleLogger();
    
    // Create repositories
    const configRepository = new ScriptPropertiesRepository({ logger });
    const fileRepository = new GoogleDriveAdapter({ logger });
    
    // Create services
    const configuration = await configRepository.getConfiguration();
    const notificationService = new SlackWebhookClient({
      webhookUrl: configuration.slackWebhookUrl,
      logger: logger
    });
    
    // Get system log sheet ID from Script Properties
    const scriptProps = PropertiesService.getScriptProperties();
    const systemLogSheetId = scriptProps.getProperty('systemLogSheetId');
    
    const loggingService = new GoogleSheetsLogger({
      sheetId: configuration.logSheetId,
      systemLogSheetId: systemLogSheetId,
      logger: logger
    });

    // Create sheets adapter for logging file changes to Artefact Change Log
    const sheetsAdapter = new GoogleSheetsAdapter({
      logSheetId: configuration.logSheetId,
      logger: logger
    });

    return {
      fileRepository,
      notificationService,
      configRepository,
      loggingService,
      sheetsAdapter
    };
  }

  /**
   * Validate all dependencies
   * @private
   * @throws {Error} When dependencies are invalid
   */
  _validateDependencies() {
    const required = ['fileRepository', 'notificationService', 'configRepository', 'loggingService'];
    
    for (const dep of required) {
      if (!this._dependencies[dep]) {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
  }

  /**
   * Ensure application is initialized
   * @private
   * @throws {Error} When not initialized
   */
  async _ensureInitialized() {
    if (!this._initialized) {
      await this.initialize();
    }
  }
}

/**
 * Console logger implementation
 * @class ConsoleLogger
 */
class ConsoleLogger {
  logInfo(message, context = {}) {
    Logger.log(`[INFO] ${message}`);
  }

  logError(message, error, context = {}) {
    Logger.log(`[ERROR] ${message}: ${error ? error.message : ''}`);
  }

  logWarning(message, context = {}) {
    Logger.log(`[WARNING] ${message}`);
  }

  // Add compatibility methods for repositories
  log(message, context = {}) {
    Logger.log(`[INFO] ${message}`);
  }

  error(message, error, context = {}) {
    Logger.log(`[ERROR] ${message}: ${error ? error.message : ''}`);
  }

  warn(message, context = {}) {
    Logger.log(`[WARNING] ${message}`);
  }
}

/**
 * Google Sheets logger implementation
 * @class GoogleSheetsLogger
 */
class GoogleSheetsLogger {
  constructor(options = {}) {
    this._sheetId = options.sheetId;
    this._systemLogSheetId = options.systemLogSheetId; // Separate sheet for system logs
    this._logger = options.logger || new ConsoleLogger();
  }

  logInfo(message, context = {}) {
    this._logger.logInfo(message, context);
    this._writeToSheet('INFO', message, context);
  }

  logError(message, error, context = {}) {
    this._logger.logError(message, error, context);
    this._writeToSheet('ERROR', message, { ...context, error: error.message });
  }

  logWarning(message, context = {}) {
    this._logger.logWarning(message, context);
    this._writeToSheet('WARNING', message, context);
  }

  _writeToSheet(level, message, context) {
    // Use system log spreadsheet ID if available, otherwise use main sheet ID
    const targetSheetId = this._systemLogSheetId || this._sheetId;
    
    if (!targetSheetId) return;
    
    try {
      const ss = SpreadsheetApp.openById(targetSheetId);
      
      // Use "System Logs" sheet
      let sheet = ss.getSheetByName('System Logs');
      
      // Create sheet if it doesn't exist
      if (!sheet) {
        sheet = ss.insertSheet('System Logs');
        // Set up headers for system logs
        sheet.appendRow(['Timestamp', 'Level', 'Message', 'Context']);
      }
      
      const row = [
        new Date().toISOString(),
        level,
        message,
        JSON.stringify(context)
      ];
      sheet.appendRow(row);
    } catch (error) {
      this._logger.logError('Failed to write to sheet', error);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Application;
}
