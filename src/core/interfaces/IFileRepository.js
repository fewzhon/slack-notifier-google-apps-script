/**
 * IFileRepository.js
 * Interface for file repository operations
 * 
 * This interface defines the contract for file-related operations,
 * following the Dependency Inversion Principle.
 */

/**
 * Interface for file repository operations
 * @interface IFileRepository
 */
class IFileRepository {
  /**
   * Get file by ID
   * @param {string} fileId - The file ID
   * @returns {Promise<File>} The file object
   * @throws {Error} When file is not found or access is denied
   */
  async getFileById(fileId) {
    throw new Error('Method must be implemented by concrete class');
  }

  /**
   * Get files in folder
   * @param {string} folderId - The folder ID
   * @param {Object} options - Query options
   * @returns {Promise<File[]>} Array of file objects
   */
  async getFilesInFolder(folderId, options = {}) {
    throw new Error('Method must be implemented by concrete class');
  }

  /**
   * Get folders in folder
   * @param {string} folderId - The folder ID
   * @returns {Promise<Folder[]>} Array of folder objects
   */
  async getFoldersInFolder(folderId) {
    throw new Error('Method must be implemented by concrete class');
  }

  /**
   * Check if file was modified since timestamp
   * @param {string} fileId - The file ID
   * @param {Date} since - The timestamp to check against
   * @returns {Promise<boolean>} True if modified
   */
  async isFileModifiedSince(fileId, since) {
    throw new Error('Method must be implemented by concrete class');
  }
}

/**
 * Interface for notification service
 * @interface INotificationService
 */
class INotificationService {
  /**
   * Send notification
   * @param {Notification} notification - The notification to send
   * @returns {Promise<boolean>} Success status
   */
  async sendNotification(notification) {
    throw new Error('Method must be implemented by concrete class');
  }

  /**
   * Send batch notifications
   * @param {Notification[]} notifications - Array of notifications
   * @returns {Promise<boolean[]>} Array of success statuses
   */
  async sendBatchNotifications(notifications) {
    throw new Error('Method must be implemented by concrete class');
  }
}

/**
 * Interface for configuration repository
 * @interface IConfigurationRepository
 */
class IConfigurationRepository {
  /**
   * Get configuration
   * @returns {Promise<Configuration>} The configuration object
   */
  async getConfiguration() {
    throw new Error('Method must be implemented by concrete class');
  }

  /**
   * Save configuration
   * @param {Configuration} configuration - The configuration to save
   * @returns {Promise<boolean>} Success status
   */
  async saveConfiguration(configuration) {
    throw new Error('Method must be implemented by concrete class');
  }

  /**
   * Validate configuration
   * @param {Configuration} configuration - The configuration to validate
   * @returns {Promise<ValidationResult>} Validation result
   */
  async validateConfiguration(configuration) {
    throw new Error('Method must be implemented by concrete class');
  }
}

/**
 * Interface for logging service
 * @interface ILoggingService
 */
class ILoggingService {
  /**
   * Log information message
   * @param {string} message - The message to log
   * @param {Object} context - Additional context
   */
  logInfo(message, context = {}) {
    throw new Error('Method must be implemented by concrete class');
  }

  /**
   * Log error message
   * @param {string} message - The error message
   * @param {Error} error - The error object
   * @param {Object} context - Additional context
   */
  logError(message, error, context = {}) {
    throw new Error('Method must be implemented by concrete class');
  }

  /**
   * Log warning message
   * @param {string} message - The warning message
   * @param {Object} context - Additional context
   */
  logWarning(message, context = {}) {
    throw new Error('Method must be implemented by concrete class');
  }
}

// Export interfaces for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    IFileRepository,
    INotificationService,
    IConfigurationRepository,
    ILoggingService
  };
}
