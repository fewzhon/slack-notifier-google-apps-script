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
      const selectedDayName = dayNames[config.weeklySummaryDay] || 'Monday';
      const schedule = `${selectedDayName}s at 7:00 AM`;
      
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
      
      // Get configuration
      const config = await this._application.getConfiguration();
      
      // Remove existing monitor triggers
      await this._removeTriggersByFunction(this._triggerFunctions.MONITOR_DRIVE);
      
      // Route to appropriate trigger setup based on mode
      if (config.triggerMode === 'count-driven') {
        return await this._setupCountDrivenTriggers(config);
      } else {
        return await this._setupTimeDrivenTriggers(config);
      }
      
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
   * Setup triggers in count-driven mode (number of runs specified)
   * Calculates end time automatically based on runs
   * @param {Configuration} config
   * @returns {Promise<Object>}
   */
  async _setupCountDrivenTriggers(config) {
    // Validate
    if (config.maxRunsPerDay < 2 || config.maxRunsPerDay > 8) {
      throw new Error('maxRunsPerDay must be between 2 and 8');
    }
    
    // Calculate end hour based on runs (each run is 30 min, so 8 runs = 4 hours)
    const hoursNeeded = config.maxRunsPerDay * 0.5;
    const calculatedStopHour = config.startHour + hoursNeeded;
    
    // Validate calculated end time doesn't exceed 24
    if (calculatedStopHour > 24) {
      throw new Error(`Calculated end time (${calculatedStopHour}:00) exceeds 24:00. Reduce runs or adjust start time.`);
    }
    
    this._logger.log(`Count-driven mode: ${config.maxRunsPerDay} runs starting at ${config.startHour}:00, ending at ${calculatedStopHour}:00`);
    
    // Create triggers every hour within the calculated window
    // Since Apps Script doesn't support :30 triggers, we create hourly triggers
    const createdTriggers = [];
    
    for (let hour = config.startHour; hour < Math.floor(calculatedStopHour); hour++) {
      const trigger = ScriptApp.newTrigger(this._triggerFunctions.MONITOR_DRIVE)
        .timeBased()
        .atHour(hour)
        .everyDays(1)
        .create();
      
      createdTriggers.push({
        hour: `${hour}:00`,
        triggerId: trigger.getUniqueId()
      });
      this._logger.log(`Created trigger for hour ${hour}:00`);
    }
    
    this._logger.log(`Created ${createdTriggers.length} monitor triggers for ${config.maxRunsPerDay} runs starting at ${config.startHour}:00`);
    
    return {
      success: true,
      message: `${config.maxRunsPerDay} runs configured starting at ${config.startHour}:00, ending at ${calculatedStopHour.toFixed(1)}:00`,
      function: this._triggerFunctions.MONITOR_DRIVE,
      schedule: `${config.maxRunsPerDay} runs, daily from ${config.startHour}:00`,
      mode: 'count-driven',
      triggersCreated: createdTriggers.length,
      triggers: createdTriggers,
      calculatedStopHour: Math.floor(calculatedStopHour * 10) / 10
    };
  }

  /**
   * Setup triggers in time-driven mode (time window specified)
   * Calculates and reports number of runs
   * @param {Configuration} config
   * @returns {Promise<Object>}
   */
  async _setupTimeDrivenTriggers(config) {
    // Validate monitoring window
    if (config.startHour >= config.stopHour) {
      throw new Error('Invalid monitoring window: startHour must be before stopHour');
    }
    
    // Validate minimum window (2 hours = 2 runs minimum)
    const windowHours = config.stopHour - config.startHour;
    if (windowHours < 2) {
      throw new Error('Minimum monitoring window is 2 hours (2 runs)');
    }
    
    // Calculate number of runs
    const calculatedRuns = config.stopHour - config.startHour;
    
    // Validate maximum runs (8 hours = 8 runs maximum)
    if (calculatedRuns > 8) {
      throw new Error(`Calculated ${calculatedRuns} runs exceeds maximum of 8. Reduce time window.`);
    }
    
    this._logger.log(`Time-driven mode: ${config.startHour}:00 - ${config.stopHour}:00 = ${calculatedRuns} runs`);
    
    // Create triggers for each hour in the monitoring window
    const createdTriggers = [];
    
    for (let hour = config.startHour; hour < config.stopHour; hour++) {
      const trigger = ScriptApp.newTrigger(this._triggerFunctions.MONITOR_DRIVE)
        .timeBased()
        .atHour(hour)
        .everyDays(1)
        .create();
      
      createdTriggers.push({
        hour: `${hour}:00`,
        triggerId: trigger.getUniqueId()
      });
      this._logger.log(`Created trigger for hour ${hour}:00`);
    }
    
    this._logger.log(`Created ${createdTriggers.length} monitor triggers for window ${config.startHour}:00 - ${config.stopHour}:00`);
    
    return {
      success: true,
      message: `Monitor triggers created for window ${config.startHour}:00 - ${config.stopHour}:00 (${calculatedRuns} runs)`,
      function: this._triggerFunctions.MONITOR_DRIVE,
      schedule: `Hourly, daily at ${config.startHour}:00 - ${config.stopHour}:00`,
      mode: 'time-driven',
      calculatedRuns: calculatedRuns,
      triggersCreated: createdTriggers.length,
      triggers: createdTriggers
    };
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
          monitoringSchedule: `${config.startHour}:00 - ${config.stopHour}:00 (${config.maxRunsPerDay} runs/day)`
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
 * Setup all triggers (standalone function)
 * This function creates its own Application instance
 * @returns {Promise<Object>} Setup results
 */
async function setupAllTriggers() {
  try {
    Logger.log('[setupAllTriggers] Starting trigger setup...');
    
    // Create Application instance and initialize
    const app = new Application();
    await app.initialize();
    
    // Use Application's setupAllTriggers method (which properly initializes TriggerManager)
    const result = await app.setupAllTriggers();
    
    Logger.log('[setupAllTriggers] Trigger setup complete');
    return result;
    
  } catch (error) {
    Logger.log(`[setupAllTriggers] Error: ${error.message}`);
    return {
      success: false,
      message: `Failed to setup triggers: ${error.message}`,
      error: error
    };
  }
}

/**
 * Remove all triggers (standalone function)
 * @returns {Promise<Object>} Removal results
 */
async function removeAllTriggers() {
  try {
    Logger.log('[removeAllTriggers] Removing all triggers...');
    
    // Create Application instance and initialize
    const app = new Application();
    await app.initialize();
    
    // Use Application's removeAllTriggers method
    const result = await app.removeAllTriggers();
    
    Logger.log('[removeAllTriggers] All triggers removed');
    return result;
    
  } catch (error) {
    Logger.log(`[removeAllTriggers] Error: ${error.message}`);
    return {
      success: false,
      message: `Failed to remove triggers: ${error.message}`,
      error: error
    };
  }
}

/**
 * Validate trigger configuration (standalone function)
 * @returns {Object} Validation results
 */
function validateTriggerConfiguration() {
  try {
    Logger.log('[validateTriggerConfiguration] Checking trigger status...');
    
    // Get all project triggers
    const triggers = ScriptApp.getProjectTriggers();
    const status = {
      totalTriggers: triggers.length,
      triggers: []
    };
    
    for (let i = 0; i < triggers.length; i++) {
      const trigger = triggers[i];
      status.triggers.push({
        functionName: trigger.getHandlerFunction(),
        eventType: trigger.getEventType().toString(),
        uniqueId: trigger.getUniqueId()
      });
    }
    
    Logger.log(`[validateTriggerConfiguration] Found ${status.totalTriggers} triggers`);
    return status;
    
  } catch (error) {
    Logger.log(`[validateTriggerConfiguration] Error: ${error.message}`);
    return {
      success: false,
      message: `Failed to validate configuration: ${error.message}`,
      error: error
    };
  }
}
