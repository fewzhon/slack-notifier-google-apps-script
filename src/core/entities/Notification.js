/**
 * Notification.js
 * Domain entity representing a notification to be sent
 * 
 * This class encapsulates all data and behavior related to notifications,
 * following the Single Responsibility Principle.
 */

/**
 * Notification types
 */
const NOTIFICATION_TYPES = {
  FILE_UPDATE: 'file_update',
  DAILY_SUMMARY: 'daily_summary',
  WEEKLY_SUMMARY: 'weekly_summary',
  ERROR_ALERT: 'error_alert',
  SYSTEM_STATUS: 'system_status'
};

/**
 * Notification priorities
 */
const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Represents a notification to be sent
 * @class Notification
 */
class Notification {
  /**
   * Create a new Notification instance
   * @param {Object} params - Constructor parameters
   * @param {string} params.type - Notification type
   * @param {string} params.title - Notification title
   * @param {string} params.message - Notification message
   * @param {string} params.channel - Target Slack channel
   * @param {string} params.priority - Notification priority
   * @param {Object} params.data - Additional data for templating
   * @param {Date} params.timestamp - When notification was created
   * @param {string} params.userId - User who triggered the notification
   */
  constructor({
    type,
    title,
    message,
    channel,
    priority = NOTIFICATION_PRIORITIES.MEDIUM,
    data = {},
    timestamp = new Date(),
    userId = ''
  }) {
    this._validateInputs({ type, title, message, channel, priority });

    this._type = type;
    this._title = title;
    this._message = message;
    this._channel = channel;
    this._priority = priority;
    this._data = { ...data }; // Create copy to prevent external modification
    this._timestamp = timestamp;
    this._userId = userId;
    this._sent = false;
    this._sentAt = null;
    this._retryCount = 0;
    this._maxRetries = 3;
  }

  /**
   * Validate constructor inputs
   * @private
   * @param {Object} inputs - Input parameters
   * @throws {Error} When validation fails
   */
  _validateInputs(inputs) {
    const required = ['type', 'title', 'message', 'channel'];
    
    for (const field of required) {
      if (!inputs[field]) {
        throw new Error(`Notification: ${field} is required`);
      }
    }

    if (!Object.values(NOTIFICATION_TYPES).includes(inputs.type)) {
      throw new Error(`Notification: Invalid type '${inputs.type}'`);
    }

    if (!Object.values(NOTIFICATION_PRIORITIES).includes(inputs.priority)) {
      throw new Error(`Notification: Invalid priority '${inputs.priority}'`);
    }
  }

  // Getters following encapsulation principles
  get type() { return this._type; }
  get title() { return this._title; }
  get message() { return this._message; }
  get channel() { return this._channel; }
  get priority() { return this._priority; }
  get data() { return { ...this._data }; } // Return copy
  get timestamp() { return this._timestamp; }
  get userId() { return this._userId; }
  get sent() { return this._sent; }
  get sentAt() { return this._sentAt; }
  get retryCount() { return this._retryCount; }
  get maxRetries() { return this._maxRetries; }

  /**
   * Mark notification as sent
   * @param {Date} sentAt - When it was sent
   */
  markAsSent(sentAt = new Date()) {
    this._sent = true;
    this._sentAt = sentAt;
  }

  /**
   * Increment retry count
   */
  incrementRetryCount() {
    this._retryCount++;
  }

  /**
   * Check if notification can be retried
   * @returns {boolean} True if can retry
   */
  canRetry() {
    return !this._sent && this._retryCount < this._maxRetries;
  }

  /**
   * Check if notification is expired (older than 24 hours)
   * @returns {boolean} True if expired
   */
  isExpired() {
    const now = new Date();
    const diffHours = (now - this._timestamp) / (1000 * 60 * 60);
    return diffHours > 24;
  }

  /**
   * Add data to notification
   * @param {string} key - Data key
   * @param {*} value - Data value
   */
  addData(key, value) {
    this._data[key] = value;
  }

  /**
   * Get data value
   * @param {string} key - Data key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Data value or default
   */
  getData(key, defaultValue = null) {
    return this._data.hasOwnProperty(key) ? this._data[key] : defaultValue;
  }

  /**
   * Check if notification is high priority
   * @returns {boolean} True if high or critical priority
   */
  isHighPriority() {
    return this._priority === NOTIFICATION_PRIORITIES.HIGH || 
           this._priority === NOTIFICATION_PRIORITIES.CRITICAL;
  }

  /**
   * Get formatted timestamp
   * @returns {string} Formatted timestamp
   */
  getFormattedTimestamp() {
    return this._timestamp.toLocaleString();
  }

  /**
   * Convert to Slack payload format
   * @returns {Object} Slack-compatible payload
   */
  toSlackPayload() {
    // Use custom color for daily/weekly summaries
    let color = this._getPriorityColor();
    if (this._type === NOTIFICATION_TYPES.DAILY_SUMMARY || this._type === NOTIFICATION_TYPES.WEEKLY_SUMMARY) {
      color = 'a3d9ff'; // Light blue color as requested
    }
    
    return {
      channel: this._channel,
      username: 'GDrive Monitor',
      icon_emoji: ':file_folder:',
      text: this._title,
      attachments: [{
        color: color,
        fields: [{
          title: 'Message',
          value: this._message,
          short: false
        }],
        footer: 'GDrive to Slack Alert',
        ts: Math.floor(this._timestamp.getTime() / 1000)
      }]
    };
  }

  /**
   * Get color based on priority
   * @private
   * @returns {string} Color code
   */
  _getPriorityColor() {
    switch (this._priority) {
      case NOTIFICATION_PRIORITIES.CRITICAL: return 'danger';
      case NOTIFICATION_PRIORITIES.HIGH: return 'warning';
      case NOTIFICATION_PRIORITIES.MEDIUM: return 'good';
      case NOTIFICATION_PRIORITIES.LOW: return '#36a64f';
      default: return '#36a64f';
    }
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      type: this._type,
      title: this._title,
      message: this._message,
      channel: this._channel,
      priority: this._priority,
      data: { ...this._data },
      timestamp: this._timestamp.toISOString(),
      userId: this._userId,
      sent: this._sent,
      sentAt: this._sentAt ? this._sentAt.toISOString() : null,
      retryCount: this._retryCount,
      maxRetries: this._maxRetries
    };
  }

  /**
   * Create Notification from plain object
   * @param {Object} obj - Plain object
   * @returns {Notification} New Notification instance
   */
  static fromObject(obj) {
    const notification = new Notification({
      type: obj.type,
      title: obj.title,
      message: obj.message,
      channel: obj.channel,
      priority: obj.priority,
      data: obj.data,
      timestamp: new Date(obj.timestamp),
      userId: obj.userId
    });

    if (obj.sent) {
      notification._sent = obj.sent;
      notification._sentAt = obj.sentAt ? new Date(obj.sentAt) : null;
      notification._retryCount = obj.retryCount || 0;
    }

    return notification;
  }

  /**
   * Check equality with another Notification
   * @param {Notification} other - Other Notification to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof Notification)) return false;
    
    return this._type === other._type &&
           this._title === other._title &&
           this._message === other._message &&
           this._channel === other._channel &&
           this._timestamp.getTime() === other._timestamp.getTime();
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    return `Notification(${this._type}: ${this._title} -> ${this._channel})`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Notification,
    NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITIES
  };
}
