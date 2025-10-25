/**
 * ScriptPropertiesRepository.js
 * Infrastructure adapter for Script Properties storage
 * 
 * This class implements the IConfigurationRepository interface and provides
 * a clean abstraction over Google Apps Script Properties,
 * following the Dependency Inversion Principle.
 */

/**
 * Script Properties repository implementing IConfigurationRepository
 * @class ScriptPropertiesRepository
 */
class ScriptPropertiesRepository {
  /**
   * Create a new ScriptPropertiesRepository instance
   * @param {Object} options - Configuration options
   * @param {string} options.prefix - Key prefix for properties
   * @param {Object} options.logger - Logger instance
   */
  constructor(options = {}) {
    this._prefix = options.prefix || '';
    this._logger = options.logger || this._createDefaultLogger();
    this._properties = PropertiesService.getScriptProperties();
  }

  /**
   * Create default logger for Google Apps Script
   * @private
   * @returns {Object} Logger object
   */
  _createDefaultLogger() {
    return {
      log: function(message, context = {}) {
        Logger.log(`[INFO] ${message}`);
      },
      error: function(message, error, context = {}) {
        Logger.log(`[ERROR] ${message}: ${error ? error.message : ''}`);
      },
      warn: function(message, context = {}) {
        Logger.log(`[WARNING] ${message}`);
      }
    };
  }

  /**
   * Get configuration
   * @returns {Promise<Configuration>} The configuration object
   */
  async getConfiguration() {
    try {
      const configData = this._loadConfigurationData();
      return this._createConfigurationFromData(configData);
    } catch (error) {
      this._logger.error('Failed to load configuration:', error);
      throw new Error('Configuration load failed');
    }
  }

  /**
   * Save configuration
   * @param {Configuration} configuration - The configuration to save
   * @returns {Promise<boolean>} Success status
   */
  async saveConfiguration(configuration) {
    try {
      const configData = configuration.toObject();
      this._saveConfigurationData(configData);
      this._logger.log('Configuration saved successfully');
      return true;
    } catch (error) {
      this._logger.error('Failed to save configuration:', error);
      throw new Error('Configuration save failed');
    }
  }

  /**
   * Validate configuration
   * @param {Configuration} configuration - The configuration to validate
   * @returns {Promise<ValidationResult>} Validation result
   */
  async validateConfiguration(configuration) {
    const errors = configuration.getValidationErrors();
    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      warnings: this._getConfigurationWarnings(configuration)
    };
  }

  /**
   * Get specific configuration value
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if key not found
   * @returns {Promise<*>} Configuration value
   */
  async getValue(key, defaultValue = null) {
    try {
      const fullKey = this._getFullKey(key);
      const value = this._properties.getProperty(fullKey);
      
      if (value === null) {
        return defaultValue;
      }
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      this._logger.error(`Failed to get value for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set specific configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Value to set
   * @returns {Promise<boolean>} Success status
   */
  async setValue(key, value) {
    try {
      const fullKey = this._getFullKey(key);
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      this._properties.setProperty(fullKey, stringValue);
      this._logger.log(`Configuration value set: ${key}`);
      return true;
    } catch (error) {
      this._logger.error(`Failed to set value for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete specific configuration value
   * @param {string} key - Configuration key
   * @returns {Promise<boolean>} Success status
   */
  async deleteValue(key) {
    try {
      const fullKey = this._getFullKey(key);
      this._properties.deleteProperty(fullKey);
      this._logger.log(`Configuration value deleted: ${key}`);
      return true;
    } catch (error) {
      this._logger.error(`Failed to delete value for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all configuration keys
   * @returns {Promise<string[]>} Array of configuration keys
   */
  async getAllKeys() {
    try {
      const allKeys = this._properties.getKeys();
      return allKeys.filter(key => key.startsWith(this._prefix));
    } catch (error) {
      this._logger.error('Failed to get all keys:', error);
      return [];
    }
  }

  /**
   * Clear all configuration
   * @returns {Promise<boolean>} Success status
   */
  async clearAll() {
    try {
      const keys = await this.getAllKeys();
      this._properties.deleteProperties(keys);
      this._logger.log('All configuration cleared');
      return true;
    } catch (error) {
      this._logger.error('Failed to clear all configuration:', error);
      return false;
    }
  }

  /**
   * Load configuration data from Script Properties
   * @private
   * @returns {Object} Configuration data
   */
  _loadConfigurationData() {
    const configData = {};
    const keys = this._properties.getKeys();
    
    // Map of property keys to configuration properties
    const keyMapping = {
      'folderIds': 'folderIds',
      'slackWebhookUrl': 'slackWebhookUrl',
      'minutesThreshold': 'minutesThreshold',
      'maxFilesToProcess': 'maxFilesToProcess',
      'sleepBetweenRequest': 'sleepBetweenRequest',
      'lookbackWindowMinutes': 'lookbackWindowMinutes',
      'timezone': 'timezone',
      'slackMessageTemplate': 'slackMessageTemplate',
      'slackAttachmentsTemplate': 'slackAttachmentsTemplate',
      'slackBlockTemplate': 'slackBlockTemplate',
      'startHour': 'startHour',
      'stopHour': 'stopHour',
      'maxRunsPerDay': 'maxRunsPerDay',
      'cron': 'cron',
      'weeklySummaryEnabled': 'weeklySummaryEnabled',
      'weeklySummaryChannel': 'weeklySummaryChannel',
      'weeklySummaryDay': 'weeklySummaryDay',
      'webhookPin': 'webhookPin',
      'adminEmails': 'adminEmails',
      'logSheetId': 'logSheetId',
      'manualMode': 'manualMode',
      'scanState': 'scanState'
    };

    for (const [scriptKey, configKey] of Object.entries(keyMapping)) {
      const value = this._properties.getProperty(scriptKey);
      if (value !== null) {
        try {
          // Special handling for folderIds - convert comma-separated string to array
          if (configKey === 'folderIds' && typeof value === 'string' && !value.startsWith('[')) {
            configData[configKey] = value.split(',').map(id => id.trim()).filter(id => id.length > 0);
          } else {
            configData[configKey] = JSON.parse(value);
          }
        } catch {
          configData[configKey] = value;
        }
      }
    }

    return configData;
  }

  /**
   * Save configuration data to Script Properties
   * @private
   * @param {Object} configData - Configuration data to save
   */
  _saveConfigurationData(configData) {
    const properties = {};
    
    // Map configuration properties to Script Properties keys
    const keyMapping = {
      'folderIds': 'folderIds',
      'slackWebhookUrl': 'slackWebhookUrl',
      'minutesThreshold': 'minutesThreshold',
      'maxFilesToProcess': 'maxFilesToProcess',
      'sleepBetweenRequest': 'sleepBetweenRequest',
      'lookbackWindowMinutes': 'lookbackWindowMinutes',
      'timezone': 'timezone',
      'slackMessageTemplate': 'slackMessageTemplate',
      'slackAttachmentsTemplate': 'slackAttachmentsTemplate',
      'slackBlockTemplate': 'slackBlockTemplate',
      'startHour': 'startHour',
      'stopHour': 'stopHour',
      'maxRunsPerDay': 'maxRunsPerDay',
      'cron': 'cron',
      'weeklySummaryEnabled': 'weeklySummaryEnabled',
      'weeklySummaryChannel': 'weeklySummaryChannel',
      'weeklySummaryDay': 'weeklySummaryDay',
      'webhookPin': 'webhookPin',
      'adminEmails': 'adminEmails',
      'logSheetId': 'logSheetId',
      'manualMode': 'manualMode',
      'scanState': 'scanState'
    };

    for (const [configKey, scriptKey] of Object.entries(keyMapping)) {
      if (configData.hasOwnProperty(configKey)) {
        const value = configData[configKey];
        properties[scriptKey] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    }

    this._properties.setProperties(properties);
  }

  /**
   * Create Configuration instance from data
   * @private
   * @param {Object} configData - Configuration data
   * @returns {Configuration} Configuration instance
   */
  _createConfigurationFromData(configData) {
    // Configuration class should be available globally in Google Apps Script
    return Configuration.fromObject(configData);
  }

  /**
   * Get configuration warnings
   * @private
   * @param {Configuration} configuration - Configuration to check
   * @returns {string[]} Array of warning messages
   */
  _getConfigurationWarnings(configuration) {
    const warnings = [];
    
    if (!configuration.slackWebhookUrl) {
      warnings.push('Slack webhook URL is not configured');
    }
    
    if (configuration.folderIds.length === 0) {
      warnings.push('No folders are configured for monitoring');
    }
    
    if (configuration.maxFilesToProcess > 800) {
      warnings.push('High file processing limit may cause timeout issues');
    }
    
    if (configuration.sleepBetweenRequest < 1000) {
      warnings.push('Low sleep time may cause rate limiting issues');
    }
    
    return warnings;
  }

  /**
   * Get full key with prefix
   * @private
   * @param {string} key - Base key
   * @returns {string} Full key with prefix
   */
  _getFullKey(key) {
    return this._prefix ? `${this._prefix}.${key}` : key;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScriptPropertiesRepository;
}
