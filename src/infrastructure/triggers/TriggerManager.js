/**
 * TriggerManager.js
 * Modern trigger management service integrated with Clean Architecture
 * 
 * This service manages all Google Apps Script triggers and integrates
 * with the Application class for proper dependency injection.
 */

/**
 * Trigger Manager Service
 * @class TriggerManager
 */
class TriggerManager {
  /**
   * Create a new TriggerManager instance
   * @param {Object} options - Configuration options
   * @param {Object} options.application - Application instance for dependency injection
   * @param {Object} options.logger - Logger instance
   */
  constructor(options = {}) {
    this._application = options.application;
    this._logger = options.logger || this._createDefaultLogger();
    this._triggerFunctions = {
      DAILY_SUMMARY: 'sendDailySummary',
      WEEKLY_SUMMARY: 'sendWeeklySummary', 
      MONITOR_DRIVE: 'monitorDriveChanges'
    };
  }

  /**
   * Create default logger for Google Apps Script environment
   * @returns {Object} Logger instance
   */
  _createDefaultLogger() {
    return {
      log: function(message, context = {}) {
        Logger.log(`[TriggerManager] ${message}`);
      },
      error: function(message, error, context = {}) {
        Logger.log(`[TriggerManager ERROR] ${message}: ${error ? error.message : ''}`);
      },
      warn: function(message, context = {}) {
        Logger.log(`[TriggerManager WARNING] ${message}`);
      }
    };
  }

  /**
   * Setup all triggers based on current configuration
   * @returns {Promise<Object>} Setup results
   */
  async setupAllTriggers() {
    try {
      await this._ensureApplicationInitialized();
      
      this._logger.log('Setting up all triggers based on current configuration...');
      
      const results = {
        dailySummary: await this.setupDailySummaryTrigger(),
        weeklySummary: await this.setupWeeklySummaryTrigger(),
        monitorDrive: await this.setupMonitorTrigger(),
        success: true,
        message: 'All triggers setup complete'
      };
      
      this._logger.log('All triggers setup complete');
      return results;
      
    } catch (error) {
      this._logger.error('Failed to setup triggers', error);
      return {
        success: false,
        message: `Failed to setup triggers: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Setup daily summary trigger
   * @returns {Promise<Object>} Setup result
   */
  async setupDailySummaryTrigger() {
    try {
      // Remove existing daily summary triggers
      await this._removeTriggersByFunction(this._triggerFunctions.DAILY_SUMMARY);
      
      // Create new trigger for 7:00 AM daily
      ScriptApp.newTrigger(this._triggerFunctions.DAILY_SUMMARY)
        .timeBased()
        .atHour(7)
        .everyDays(1)
        .create();
      
      this._logger.log('Daily summary trigger set for 7:00 AM');
      
      return {
        success: true,
        message: 'Daily summary trigger created for 7:00 AM',
        function: this._triggerFunctions.DAILY_SUMMARY,
        schedule: 'Daily at 7:00 AM'
      };
      
    } catch (error) {
      this._logger.error('Failed to setup daily summary trigger', error);
      return {
        success: false,
        message: `Failed to setup daily summary trigger: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Setup weekly summary trigger based on configuration
   * @returns {Promise<Object>} Setup result
   */
  async setupWeeklySummaryTrigger() {
    try {
      await this._ensureApplicationInitialized();
      
      // Get configuration to check if weekly summary is enabled
      const config = await this._application.getConfiguration();
      
      // Remove existing weekly summary triggers
      await this._removeTriggersByFunction(this._triggerFunctions.WEEKLY_SUMMARY);
      
      // Only setup trigger if weekly summary is enabled
      if (!config.weeklySummaryEnabled) {
        this._logger.log('Weekly summary is disabled. Skipping trigger setup.');
        return {
          success: true,
          message: 'Weekly summary is disabled - no trigger created',
          function: this._triggerFunctions.WEEKLY_SUMMARY,
          schedule: 'Disabled'
        };
      }
      
      // Validate weekly summary configuration
      if (!config.weeklySummaryChannel || config.weeklySummaryChannel.trim() === '') {
        throw new Error('Weekly summary is enabled but no channel is configured');
      }
      
      if (config.weeklySummaryDay < 0 || config.weeklySummaryDay > 6) {
        throw new Error('Invalid weekly summary day. Must be 0-6.');
      }
      
      // Map day number to ScriptApp.WeekDay
      const weekDayMap = {
        0: ScriptApp.WeekDay.SUNDAY,
        1: ScriptApp.WeekDay.MONDAY,
        2: ScriptApp.WeekDay.TUESDAY,
        3: ScriptApp.WeekDay.WEDNESDAY,
        4: ScriptApp.WeekDay.THURSDAY,
        5: ScriptApp.WeekDay.FRIDAY,
        6: ScriptApp.WeekDay.SATURDAY
      };
      
      const selectedDay = weekDayMap[config.weeklySummaryDay] || ScriptApp.WeekDay.MONDAY;
      
      // Create weekly summary trigger
      ScriptApp.newTrigger(this._triggerFunctions.WEEKLY_SUMMARY)
        .timeBased()
        .atHour(7)
        .everyWeeks(1)
        .onWeekDay(selectedDay)
        .create();
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const schedule = `${dayNames[config.weeklySummaryDay]}s at 7:00 AM`;
      
      this._logger.log(`Weekly summary trigger set for ${schedule}`);
      
      return {
        success: true,
        message: `Weekly summary trigger created for ${schedule}`,
        function: this._triggerFunctions.WEEKLY_SUMMARY,
        schedule: schedule,
        channel: config.weeklySummaryChannel
      };
      
    } catch (error) {
      this._logger.error('Failed to setup weekly summary trigger', error);
      return {
        success: false,
        message: `Failed to setup weekly summary trigger: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Setup monitor drive trigger based on configuration
   * @returns {Promise<Object>} Setup result
   */
  async setupMonitorTrigger() {
    try {
      await this._ensureApplicationInitialized();
      
      // Get configuration for monitoring frequency
      const config = await this._application.getConfiguration();
      
      // Remove existing monitor triggers
      await this._removeTriggersByFunction(this._triggerFunctions.MONITOR_DRIVE);
      
      // Determine monitoring frequency from configuration
      // Default to 30 minutes if not specified
      const frequencyMinutes = config.monitorFrequencyMinutes || 30;
      
      // Validate frequency (minimum 5 minutes, maximum 60 minutes)
      const validatedFrequency = Math.max(5, Math.min(60, frequencyMinutes));
      
      // Create monitor trigger
      ScriptApp.newTrigger(this._triggerFunctions.MONITOR_DRIVE)
        .timeBased()
        .everyMinutes(validatedFrequency)
        .create();
      
      this._logger.log(`Monitor trigger set up to run every ${validatedFrequency} minutes`);
      
      return {
        success: true,
        message: `Monitor trigger created to run every ${validatedFrequency} minutes`,
        function: this._triggerFunctions.MONITOR_DRIVE,
        schedule: `Every ${validatedFrequency} minutes`,
        frequency: validatedFrequency
      };
      
    } catch (error) {
      this._logger.error('Failed to setup monitor trigger', error);
      return {
        success: false,
        message: `Failed to setup monitor trigger: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Remove all application triggers
   * @returns {Promise<Object>} Removal results
   */
  async removeAllTriggers() {
    try {
      const triggers = ScriptApp.getProjectTriggers();
      const removedTriggers = [];
      
      for (let i = 0; i < triggers.length; i++) {
        const trigger = triggers[i];
        const handlerFunction = trigger.getHandlerFunction();
        
        // Only remove our application triggers
        if (Object.values(this._triggerFunctions).includes(handlerFunction)) {
          ScriptApp.deleteTrigger(trigger);
          removedTriggers.push({
            function: handlerFunction,
            type: trigger.getEventType().toString(),
            id: trigger.getUniqueId()
          });
          this._logger.log(`Removed trigger for: ${handlerFunction}`);
        }
      }
      
      this._logger.log(`Removed ${removedTriggers.length} triggers`);
      
      return {
        success: true,
        message: `Removed ${removedTriggers.length} triggers`,
        removedTriggers: removedTriggers,
        count: removedTriggers.length
      };
      
    } catch (error) {
      this._logger.error('Failed to remove triggers', error);
      return {
        success: false,
        message: `Failed to remove triggers: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get current trigger status and validation
   * @returns {Promise<Object>} Trigger status and validation results
   */
  async getTriggerStatus() {
    try {
      await this._ensureApplicationInitialized();
      
      const config = await this._application.getConfiguration();
      const triggers = ScriptApp.getProjectTriggers();
      
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        currentTriggers: [],
        recommendations: [],
        configuration: {
          weeklySummaryEnabled: config.weeklySummaryEnabled,
          weeklySummaryDay: config.weeklySummaryDay,
          weeklySummaryChannel: config.weeklySummaryChannel,
          monitorFrequencyMinutes: config.monitorFrequencyMinutes || 30
        }
      };
      
      // Check current triggers
      for (let i = 0; i < triggers.length; i++) {
        const trigger = triggers[i];
        const handlerFunction = trigger.getHandlerFunction();
        
        if (Object.values(this._triggerFunctions).includes(handlerFunction)) {
          result.currentTriggers.push({
            function: handlerFunction,
            type: trigger.getEventType().toString(),
            id: trigger.getUniqueId(),
            created: trigger.getUniqueId()
          });
        }
      }
      
      // Validate weekly summary configuration
      if (config.weeklySummaryEnabled) {
        if (!config.weeklySummaryChannel || config.weeklySummaryChannel.trim() === '') {
          result.errors.push('Weekly summary is enabled but no channel is configured.');
          result.valid = false;
        }
        
        if (config.weeklySummaryDay < 0 || config.weeklySummaryDay > 6) {
          result.errors.push('Invalid weekly summary day. Must be 0-6.');
          result.valid = false;
        }
        
        // Check if weekly summary trigger exists
        const hasWeeklyTrigger = result.currentTriggers.some(t => 
          t.function === this._triggerFunctions.WEEKLY_SUMMARY
        );
        
        if (!hasWeeklyTrigger) {
          result.warnings.push('Weekly summary is enabled but no trigger is set up.');
          result.recommendations.push('Run setupWeeklySummaryTrigger() to create the weekly summary trigger.');
        }
      } else {
        // Check if weekly trigger exists when disabled
        const hasWeeklyTrigger = result.currentTriggers.some(t => 
          t.function === this._triggerFunctions.WEEKLY_SUMMARY
        );
        
        if (hasWeeklyTrigger) {
          result.warnings.push('Weekly summary is disabled but trigger still exists.');
          result.recommendations.push('Run removeAllTriggers() then setupAllTriggers() to clean up.');
        }
      }
      
      // Check for missing essential triggers
      const hasDailyTrigger = result.currentTriggers.some(t => 
        t.function === this._triggerFunctions.DAILY_SUMMARY
      );
      const hasMonitorTrigger = result.currentTriggers.some(t => 
        t.function === this._triggerFunctions.MONITOR_DRIVE
      );
      
      if (!hasDailyTrigger) {
        result.warnings.push('Daily summary trigger is missing.');
        result.recommendations.push('Run setupDailySummaryTrigger() to create the daily summary trigger.');
      }
      
      if (!hasMonitorTrigger) {
        result.warnings.push('Monitor trigger is missing.');
        result.recommendations.push('Run setupMonitorTrigger() to create the monitoring trigger.');
      }
      
      return result;
      
    } catch (error) {
      this._logger.error('Failed to get trigger status', error);
      return {
        valid: false,
        errors: [`Failed to get trigger status: ${error.message}`],
        warnings: [],
        currentTriggers: [],
        recommendations: [],
        error: error
      };
    }
  }

  /**
   * Remove triggers by function name
   * @param {string} functionName - Name of the function to remove triggers for
   * @returns {Promise<void>}
   */
  async _removeTriggersByFunction(functionName) {
    const triggers = ScriptApp.getProjectTriggers();
    
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === functionName) {
        ScriptApp.deleteTrigger(triggers[i]);
        this._logger.log(`Removed existing trigger for: ${functionName}`);
      }
    }
  }

  /**
   * Ensure application is initialized
   * @returns {Promise<void>}
   */
  async _ensureApplicationInitialized() {
    if (!this._application) {
      throw new Error('Application instance not provided');
    }
    
    if (!this._application._initialized) {
      await this._application.initialize();
    }
  }
}

/**
 * Global trigger handler functions that integrate with Clean Architecture
 * These functions are called by Google Apps Script triggers
 */

/**
 * Send daily summary to Slack
 * This function is called by the daily summary trigger
 */
function sendDailySummary() {
  try {
    Logger.log('Daily summary trigger executed');
    
    // Initialize application and send daily summary
    const app = new Application();
    app.initialize().then(() => {
      return app.sendDailySummary();
    }).then(result => {
      Logger.log('Daily summary sent successfully');
    }).catch(error => {
      Logger.log(`Daily summary failed: ${error.message}`);
    });
    
  } catch (error) {
    Logger.log(`Daily summary trigger error: ${error.message}`);
  }
}

/**
 * Send weekly summary to Slack
 * This function is called by the weekly summary trigger
 */
function sendWeeklySummary() {
  try {
    Logger.log('Weekly summary trigger executed');
    
    // Initialize application and send weekly summary
    const app = new Application();
    app.initialize().then(() => {
      return app.sendWeeklySummary();
    }).then(result => {
      Logger.log('Weekly summary sent successfully');
    }).catch(error => {
      Logger.log(`Weekly summary failed: ${error.message}`);
    });
    
  } catch (error) {
    Logger.log(`Weekly summary trigger error: ${error.message}`);
  }
}

/**
 * Monitor drive changes
 * This function is called by the monitor trigger
 */
function monitorDriveChanges() {
  try {
    Logger.log('Monitor drive trigger executed');
    
    // Initialize application and monitor drive changes
    const app = new Application();
    app.initialize().then(() => {
      return app.executeDriveMonitoring();
    }).then(result => {
      Logger.log('Drive monitoring completed successfully');
    }).catch(error => {
      Logger.log(`Drive monitoring failed: ${error.message}`);
    });
    
  } catch (error) {
    Logger.log(`Monitor drive trigger error: ${error.message}`);
  }
}

/**
 * Legacy compatibility functions
 * These maintain backward compatibility with existing trigger setup
 */

/**
 * Setup all triggers (legacy compatibility)
 * @deprecated Use TriggerManager.setupAllTriggers() instead
 */
function setupAllTriggers() {
  Logger.log('Using legacy setupAllTriggers - consider migrating to TriggerManager');
  
  const triggerManager = new TriggerManager();
  return triggerManager.setupAllTriggers();
}

/**
 * Remove all triggers (legacy compatibility)
 * @deprecated Use TriggerManager.removeAllTriggers() instead
 */
function removeAllTriggers() {
  Logger.log('Using legacy removeAllTriggers - consider migrating to TriggerManager');
  
  const triggerManager = new TriggerManager();
  return triggerManager.removeAllTriggers();
}

/**
 * Validate trigger configuration (legacy compatibility)
 * @deprecated Use TriggerManager.getTriggerStatus() instead
 */
function validateTriggerConfiguration() {
  Logger.log('Using legacy validateTriggerConfiguration - consider migrating to TriggerManager');
  
  const triggerManager = new TriggerManager();
  return triggerManager.getTriggerStatus();
}
