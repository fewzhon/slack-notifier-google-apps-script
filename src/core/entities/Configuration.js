/**
 * Configuration.js
 * Domain entity representing system configuration
 * 
 * This class encapsulates all configuration data and validation logic,
 * following the Single Responsibility Principle.
 */

/**
 * Represents system configuration
 * @class Configuration
 */
class Configuration {
  /**
   * Create a new Configuration instance
   * @param {Object} params - Constructor parameters
   */
  constructor(params = {}) {
    // Core monitoring settings
    this._folderIds = params.folderIds || [];
    this._minutesThreshold = params.minutesThreshold || 5;
    this._maxFilesToProcess = params.maxFilesToProcess || 500;
    this._sleepBetweenRequest = params.sleepBetweenRequest || 1500;
    this._lookbackWindowMinutes = params.lookbackWindowMinutes || 30;
    this._timezone = params.timezone || 'GMT';

    // Slack settings
    this._slackWebhookUrl = params.slackWebhookUrl || '';
    this._slackMessageTemplate = params.slackMessageTemplate || '';
    this._slackAttachmentsTemplate = params.slackAttachmentsTemplate || '';
    this._slackBlockTemplate = params.slackBlockTemplate || '';

    // Scheduling settings
    this._startHour = params.startHour || 19;
    this._stopHour = params.stopHour || 23;
    this._maxRunsPerDay = params.maxRunsPerDay || 8;
    this._triggerMode = params.triggerMode || 'time-driven'; // 'count-driven' or 'time-driven'
    this._cron = params.cron || '';

    // Summary settings
    this._dailySummaryEnabled = params.dailySummaryEnabled || false;
    this._weeklySummaryEnabled = params.weeklySummaryEnabled || true; // Default to weekly
    this._weeklySummaryChannel = params.weeklySummaryChannel || '#dev_uat';
    this._weeklySummaryDay = params.weeklySummaryDay || 1; // Monday

    // Security settings
    this._webhookPin = params.webhookPin || '6682';
    this._adminEmails = params.adminEmails || [];

    // System settings
    this._logSheetId = params.logSheetId || '';
    this._manualMode = params.manualMode || false;
    this._scanState = params.scanState || {};

    // Validation
    this._validateConfiguration();
  }

  // Getters following encapsulation principles
  get folderIds() { return [...this._folderIds]; }
  get minutesThreshold() { return this._minutesThreshold; }
  get maxFilesToProcess() { return this._maxFilesToProcess; }
  get sleepBetweenRequest() { return this._sleepBetweenRequest; }
  get lookbackWindowMinutes() { return this._lookbackWindowMinutes; }
  get timezone() { return this._timezone; }
  get slackWebhookUrl() { return this._slackWebhookUrl; }
  get slackMessageTemplate() { return this._slackMessageTemplate; }
  get slackAttachmentsTemplate() { return this._slackAttachmentsTemplate; }
  get slackBlockTemplate() { return this._slackBlockTemplate; }
  get startHour() { return this._startHour; }
  get stopHour() { return this._stopHour; }
  get maxRunsPerDay() { return this._maxRunsPerDay; }
  get triggerMode() { return this._triggerMode; }
  get cron() { return this._cron; }
  get dailySummaryEnabled() { return this._dailySummaryEnabled; }
  get weeklySummaryEnabled() { return this._weeklySummaryEnabled; }
  get weeklySummaryChannel() { return this._weeklySummaryChannel; }
  get weeklySummaryDay() { return this._weeklySummaryDay; }
  get webhookPin() { return this._webhookPin; }
  get adminEmails() { return [...this._adminEmails]; }
  get logSheetId() { return this._logSheetId; }
  get manualMode() { return this._manualMode; }
  get scanState() { return { ...this._scanState }; }

  /**
   * Validate configuration values
   * @private
   * @throws {Error} When validation fails
   */
  _validateConfiguration() {
    // Validate numeric ranges
    if (this._minutesThreshold < 1 || this._minutesThreshold > 1440) {
      throw new Error('minutesThreshold must be between 1 and 1440');
    }

    if (this._maxFilesToProcess < 1 || this._maxFilesToProcess > 1000) {
      throw new Error('maxFilesToProcess must be between 1 and 1000');
    }

    if (this._sleepBetweenRequest < 100 || this._sleepBetweenRequest > 60000) {
      throw new Error('sleepBetweenRequest must be between 100 and 60000');
    }

    if (this._startHour < 0 || this._startHour > 23) {
      throw new Error('startHour must be between 0 and 23');
    }

    if (this._stopHour < 0 || this._stopHour > 23) {
      throw new Error('stopHour must be between 0 and 23');
    }

    if (this._startHour >= this._stopHour) {
      throw new Error('startHour must be before stopHour');
    }

    if (this._maxRunsPerDay < 1 || this._maxRunsPerDay > 24) {
      throw new Error('maxRunsPerDay must be between 1 and 24');
    }

    if (this._weeklySummaryDay < 0 || this._weeklySummaryDay > 6) {
      throw new Error('weeklySummaryDay must be between 0 (Sunday) and 6 (Saturday)');
    }

    // Validate required fields
    if (!this._slackWebhookUrl) {
      throw new Error('slackWebhookUrl is required');
    }

    // Allow empty folder IDs for testing
    // if (this._folderIds.length === 0) {
    //   throw new Error('At least one folderId is required');
    // }

    // Validate folder IDs format (basic check) - Allow empty for testing
    for (const folderId of this._folderIds) {
      if (folderId && (typeof folderId !== 'string' || folderId.length < 10)) {
        throw new Error('Invalid folderId format');
      }
    }

    // Validate admin emails format (basic check)
    for (const email of this._adminEmails) {
      if (typeof email !== 'string' || !email.includes('@')) {
        throw new Error('Invalid admin email format');
      }
    }
  }

  /**
   * Add folder ID
   * @param {string} folderId - Folder ID to add
   */
  addFolderId(folderId) {
    if (!this._folderIds.includes(folderId)) {
      this._folderIds.push(folderId);
      this._validateConfiguration();
    }
  }

  /**
   * Remove folder ID
   * @param {string} folderId - Folder ID to remove
   */
  removeFolderId(folderId) {
    const index = this._folderIds.indexOf(folderId);
    if (index > -1) {
      this._folderIds.splice(index, 1);
      this._validateConfiguration();
    }
  }

  /**
   * Add admin email
   * @param {string} email - Admin email to add
   */
  addAdminEmail(email) {
    if (!this._adminEmails.includes(email)) {
      this._adminEmails.push(email);
      this._validateConfiguration();
    }
  }

  /**
   * Remove admin email
   * @param {string} email - Admin email to remove
   */
  removeAdminEmail(email) {
    const index = this._adminEmails.indexOf(email);
    if (index > -1) {
      this._adminEmails.splice(index, 1);
      this._validateConfiguration();
    }
  }

  /**
   * Check if user is admin
   * @param {string} email - User email to check
   * @returns {boolean} True if user is admin
   */
  isAdmin(email) {
    return this._adminEmails.includes(email);
  }

  /**
   * Check if monitoring is active (within time window)
   * @param {Date} currentTime - Current time (optional)
   * @returns {boolean} True if monitoring should be active
   */
  isMonitoringActive(currentTime = new Date()) {
    const currentHour = currentTime.getHours();
    return currentHour >= this._startHour && currentHour < this._stopHour;
  }

  /**
   * Get monitoring window description
   * @returns {string} Human-readable monitoring window
   */
  getMonitoringWindow() {
    return `${this._startHour}:00 - ${this._stopHour}:00`;
  }

  /**
   * Check if configuration is valid for monitoring
   * @returns {boolean} True if configuration is valid
   */
  isValidForMonitoring() {
    try {
      this._validateConfiguration();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get validation errors
   * @returns {string[]} Array of validation error messages
   */
  getValidationErrors() {
    const errors = [];
    
    try {
      this._validateConfiguration();
    } catch (error) {
      errors.push(error.message);
    }

    return errors;
  }

  /**
   * Update configuration with new values
   * @param {Object} updates - Configuration updates
   * @returns {Configuration} New configuration instance
   */
  update(updates) {
    return new Configuration({
      ...this.toObject(),
      ...updates
    });
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      folderIds: [...this._folderIds],
      minutesThreshold: this._minutesThreshold,
      maxFilesToProcess: this._maxFilesToProcess,
      sleepBetweenRequest: this._sleepBetweenRequest,
      lookbackWindowMinutes: this._lookbackWindowMinutes,
      timezone: this._timezone,
      slackWebhookUrl: this._slackWebhookUrl,
      slackMessageTemplate: this._slackMessageTemplate,
      slackAttachmentsTemplate: this._slackAttachmentsTemplate,
      slackBlockTemplate: this._slackBlockTemplate,
      startHour: this._startHour,
      stopHour: this._stopHour,
      maxRunsPerDay: this._maxRunsPerDay,
      cron: this._cron,
      dailySummaryEnabled: this._dailySummaryEnabled,
      weeklySummaryEnabled: this._weeklySummaryEnabled,
      weeklySummaryChannel: this._weeklySummaryChannel,
      weeklySummaryDay: this._weeklySummaryDay,
      webhookPin: this._webhookPin,
      adminEmails: [...this._adminEmails],
      logSheetId: this._logSheetId,
      manualMode: this._manualMode,
      scanState: { ...this._scanState }
    };
  }

  /**
   * Create Configuration from plain object
   * @param {Object} obj - Plain object
   * @returns {Configuration} New Configuration instance
   */
  static fromObject(obj) {
    return new Configuration(obj);
  }

  /**
   * Create default configuration
   * @returns {Configuration} Default configuration instance
   */
  static createDefault() {
    return new Configuration({
      folderIds: [],
      minutesThreshold: 5,
      maxFilesToProcess: 500,
      sleepBetweenRequest: 1500,
      lookbackWindowMinutes: 30,
      timezone: 'GMT',
      slackWebhookUrl: '',
      startHour: 19,
      stopHour: 23,
      maxRunsPerDay: 4,
      dailySummaryEnabled: false,
      weeklySummaryEnabled: true, // Default to weekly
      weeklySummaryChannel: '#dev_uat',
      weeklySummaryDay: 1,
      webhookPin: '6682',
      adminEmails: [],
      manualMode: false
    });
  }

  /**
   * Check equality with another Configuration
   * @param {Configuration} other - Other Configuration to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof Configuration)) return false;
    
    return JSON.stringify(this.toObject()) === JSON.stringify(other.toObject());
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    return `Configuration(folders: ${this._folderIds.length}, monitoring: ${this.getMonitoringWindow()})`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Configuration;
}
