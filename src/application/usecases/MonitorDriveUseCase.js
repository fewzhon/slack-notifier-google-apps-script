/**
 * MonitorDriveUseCase.js
 * Application use case for monitoring Google Drive changes
 * 
 * This class implements the main monitoring logic following
 * the Single Responsibility Principle and Clean Architecture.
 */

/**
 * Use case for monitoring Google Drive changes
 * @class MonitorDriveUseCase
 */
class MonitorDriveUseCase {
  /**
   * Create a new MonitorDriveUseCase instance
   * @param {Object} dependencies - Required dependencies
   * @param {IFileRepository} dependencies.fileRepository - File repository interface
   * @param {INotificationService} dependencies.notificationService - Notification service interface
   * @param {IConfigurationRepository} dependencies.configRepository - Configuration repository interface
   * @param {ILoggingService} dependencies.loggingService - Logging service interface
   */
  constructor(dependencies) {
    this._validateDependencies(dependencies);
    
    this._fileRepository = dependencies.fileRepository;
    this._notificationService = dependencies.notificationService;
    this._configRepository = dependencies.configRepository;
    this._loggingService = dependencies.loggingService;
  }

  /**
   * Execute monitoring process
   * @param {Object} options - Execution options
   * @param {boolean} options.forceRun - Force run even if outside monitoring window
   * @param {string} options.userId - User ID triggering the run
   * @returns {Promise<MonitoringResult>} Monitoring execution result
   */
  async execute(options = {}) {
    const startTime = new Date();
    this._loggingService.logInfo('Starting drive monitoring process', { startTime });

    try {
      // Load configuration
      const configuration = await this._configRepository.getConfiguration();
      
      // Validate monitoring conditions
      const validationResult = await this._validateMonitoringConditions(configuration, options);
      if (!validationResult.canProceed) {
        return this._createResult(false, validationResult.reason, startTime);
      }

      // Execute monitoring
      const changes = await this._monitorFolders(configuration);
      
      // Send notifications for changes
      const notificationResults = await this._sendChangeNotifications(changes, configuration);
      
      // Update scan state
      await this._updateScanState(configuration, changes);
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      this._loggingService.logInfo('Drive monitoring completed successfully', {
        changesFound: changes.length,
        notificationsSent: notificationResults.filter(r => r.success).length,
        duration: duration
      });

      return this._createResult(true, 'Monitoring completed successfully', startTime, {
        changesFound: changes.length,
        notificationsSent: notificationResults.filter(r => r.success).length,
        duration: duration,
        changes: changes
      });

    } catch (error) {
      this._loggingService.logError('Drive monitoring failed', error, { startTime });
      
      // Send error notification if configured
      await this._sendErrorNotification(error, options.userId);
      
      return this._createResult(false, `Monitoring failed: ${error.message}`, startTime);
    }
  }

  /**
   * Validate monitoring conditions
   * @private
   * @param {Configuration} configuration - System configuration
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Validation result
   */
  async _validateMonitoringConditions(configuration, options) {
    // Check if monitoring is active (unless forced)
    if (!options.forceRun && !configuration.isMonitoringActive()) {
      return {
        canProceed: false,
        reason: 'Outside monitoring window'
      };
    }

    // Check if configuration is valid
    if (!configuration.isValidForMonitoring()) {
      return {
        canProceed: false,
        reason: 'Invalid configuration'
      };
    }

    // Check run limits
    const runCount = await this._getTodayRunCount(configuration);
    if (runCount >= configuration.maxRunsPerDay) {
      return {
        canProceed: false,
        reason: 'Daily run limit exceeded'
      };
    }

    return { canProceed: true };
  }

  /**
   * Monitor all configured folders
   * @private
   * @param {Configuration} configuration - System configuration
   * @returns {Promise<FileChange[]>} Array of detected changes
   */
  async _monitorFolders(configuration) {
    const allChanges = [];
    const scanState = configuration.scanState;
    const lastCheckTime = scanState.lastCheckTime ? new Date(scanState.lastCheckTime) : 
                         new Date(Date.now() - configuration.lookbackWindowMinutes * 60 * 1000);

    for (const folderId of configuration.folderIds) {
      try {
        this._loggingService.logInfo(`Monitoring folder: ${folderId}`);
        
        const folderChanges = await this._monitorFolder(folderId, lastCheckTime, configuration);
        allChanges.push(...folderChanges);
        
        // Add delay between folder checks
        if (configuration.folderIds.length > 1) {
          await this._sleep(configuration.sleepBetweenRequest);
        }
        
      } catch (error) {
        this._loggingService.logError(`Failed to monitor folder ${folderId}`, error);
      }
    }

    return allChanges;
  }

  /**
   * Monitor a single folder
   * @private
   * @param {string} folderId - Folder ID to monitor
   * @param {Date} lastCheckTime - Last check time
   * @param {Configuration} configuration - System configuration
   * @returns {Promise<FileChange[]>} Array of changes in this folder
   */
  async _monitorFolder(folderId, lastCheckTime, configuration) {
    const changes = [];
    
    try {
      // Get folder information
      const folder = await this._fileRepository.getFolderById(folderId);
      
      // Get files in folder
      const files = await this._fileRepository.getFilesInFolder(folderId, {
        modifiedSince: lastCheckTime,
        limit: configuration.maxFilesToProcess
      });

      // Process each file
      for (const file of files) {
        if (this._isFileRelevant(file, lastCheckTime, configuration)) {
          const change = this._createFileChange(file, folder, 'modified');
          changes.push(change);
        }
      }

      // Check for new files (this is a simplified approach)
      // In a real implementation, you'd need to track file IDs
      const newFiles = files.filter(file => 
        file.createdDate > lastCheckTime && file.lastModified > lastCheckTime
      );

      for (const file of newFiles) {
        const change = this._createFileChange(file, folder, 'created');
        changes.push(change);
      }

    } catch (error) {
      this._loggingService.logError(`Error monitoring folder ${folderId}`, error);
    }

    return changes;
  }

  /**
   * Check if file is relevant for monitoring
   * @private
   * @param {Object} file - File object
   * @param {Date} lastCheckTime - Last check time
   * @param {Configuration} configuration - System configuration
   * @returns {boolean} True if file is relevant
   */
  _isFileRelevant(file, lastCheckTime, configuration) {
    // Check if file was modified within threshold
    const timeDiff = (new Date() - file.lastModified) / (1000 * 60); // minutes
    return timeDiff <= configuration.minutesThreshold;
  }

  /**
   * Create FileChange object
   * @private
   * @param {Object} file - File object
   * @param {Object} folder - Folder object
   * @param {string} changeType - Type of change
   * @returns {FileChange} FileChange instance
   */
  _createFileChange(file, folder, changeType) {
    // FileChange class should be available globally in Google Apps Script
    
    return new FileChange({
      fileId: file.id,
      fileName: file.name,
      folderId: folder.id,
      folderName: folder.name,
      changeType: changeType,
      timestamp: file.lastModified,
      fileOwner: file.owner,
      fileSize: file.size,
      fileType: file.mimeType
    });
  }

  /**
   * Send notifications for detected changes
   * @private
   * @param {FileChange[]} changes - Array of changes
   * @param {Configuration} configuration - System configuration
   * @returns {Promise<Object[]>} Array of notification results
   */
  async _sendChangeNotifications(changes, configuration) {
    const results = [];
    
    for (const change of changes) {
      try {
        // Notification classes should be available globally
        const notification = new Notification({
          type: NOTIFICATION_TYPES.FILE_UPDATE,
          title: `File ${change.changeType}: ${change.fileName}`,
          message: this._buildChangeMessage(change),
          channel: configuration.slackWebhookUrl ? '#app_refinement_preproduction-prod' : '#dev_sandbox', // Production vs Test channel
          priority: NOTIFICATION_PRIORITIES.MEDIUM,
          data: {
            fileChange: change.toObject(),
            folderName: change.folderName,
            fileName: change.fileName,
            changeType: change.changeType,
            fileOwner: change.fileOwner,
            fileSize: change.getFormattedFileSize(),
            timeAgo: change.getTimeDifference()
          }
        });

        const success = await this._notificationService.sendNotification(notification);
        results.push({ success, change: change.fileName });
        
      } catch (error) {
        this._loggingService.logError(`Failed to send notification for change ${change.fileName}`, error);
        results.push({ success: false, change: change.fileName, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Build change message
   * @private
   * @param {FileChange} change - File change object
   * @returns {string} Formatted message
   */
  _buildChangeMessage(change) {
    return `File "${change.fileName}" was ${change.changeType} in folder "${change.folderName}". ` +
           `Owner: ${change.fileOwner}, Size: ${change.getFormattedFileSize()}, ` +
           `Time: ${change.getTimeDifference()}`;
  }

  /**
   * Update scan state
   * @private
   * @param {Configuration} configuration - System configuration
   * @param {FileChange[]} changes - Detected changes
   */
  async _updateScanState(configuration, changes) {
    const updatedConfig = configuration.update({
      scanState: {
        lastCheckTime: new Date().toISOString(),
        lastRunCount: await this._getTodayRunCount(configuration) + 1,
        lastChangesFound: changes.length
      }
    });

    await this._configRepository.saveConfiguration(updatedConfig);
  }

  /**
   * Get today's run count
   * @private
   * @param {Configuration} configuration - System configuration
   * @returns {Promise<number>} Number of runs today
   */
  async _getTodayRunCount(configuration) {
    const today = new Date().toISOString().split('T')[0];
    const runKey = `runsToday_${today}`;
    
    const runCount = await this._configRepository.getValue(runKey, 0);
    return parseInt(runCount) || 0;
  }

  /**
   * Send error notification
   * @private
   * @param {Error} error - Error object
   * @param {string} userId - User ID
   */
  async _sendErrorNotification(error, userId) {
    try {
      // Notification classes should be available globally
      
      const notification = new Notification({
        type: NOTIFICATION_TYPES.ERROR_ALERT,
        title: 'Drive Monitoring Error',
        message: `Monitoring process failed: ${error.message}`,
        channel: '#alerts',
        priority: NOTIFICATION_PRIORITIES.HIGH,
        data: {
          error: error.message,
          stack: error.stack,
          userId: userId,
          timestamp: new Date().toISOString()
        }
      });

      await this._notificationService.sendNotification(notification);
    } catch (notificationError) {
      this._loggingService.logError('Failed to send error notification', notificationError);
    }
  }

  /**
   * Create monitoring result
   * @private
   * @param {boolean} success - Success status
   * @param {string} message - Result message
   * @param {Date} startTime - Start time
   * @param {Object} data - Additional data
   * @returns {Object} Monitoring result
   */
  _createResult(success, message, startTime, data = {}) {
    return {
      success,
      message,
      startTime,
      endTime: new Date(),
      duration: new Date() - startTime,
      ...data
    };
  }

  /**
   * Validate dependencies
   * @private
   * @param {Object} dependencies - Dependencies to validate
   * @throws {Error} When dependencies are invalid
   */
  _validateDependencies(dependencies) {
    const required = ['fileRepository', 'notificationService', 'configRepository', 'loggingService'];
    
    for (const dep of required) {
      if (!dependencies[dep]) {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
  }

  /**
   * Sleep utility
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  async _sleep(ms) {
    Utilities.sleep(ms);
    return Promise.resolve();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MonitorDriveUseCase;
}
