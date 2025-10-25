/**
 * SlackWebhookClient.js
 * Infrastructure adapter for Slack webhook operations
 * 
 * This class implements the INotificationService interface and provides
 * a clean abstraction over Slack webhook API,
 * following the Dependency Inversion Principle.
 */

/**
 * Slack webhook client implementing INotificationService
 * @class SlackWebhookClient
 */
class SlackWebhookClient {
  /**
   * Create a new SlackWebhookClient instance
   * @param {Object} options - Configuration options
   * @param {string} options.webhookUrl - Slack webhook URL
   * @param {number} options.timeout - Request timeout in ms
   * @param {number} options.maxRetries - Maximum retry attempts
   * @param {number} options.retryDelay - Delay between retries in ms
   */
  constructor(options = {}) {
    this._webhookUrl = options.webhookUrl || '';
    this._timeout = options.timeout || 30000;
    this._maxRetries = options.maxRetries || 3;
    this._retryDelay = options.retryDelay || 1000;
    this._logger = options.logger || this._createDefaultLogger();
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
   * Send notification
   * @param {Notification} notification - The notification to send
   * @returns {Promise<boolean>} Success status
   */
  async sendNotification(notification) {
    if (!this._webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const payload = this._buildPayload(notification);
    return this._sendPayload(payload);
  }

  /**
   * Send batch notifications
   * @param {Notification[]} notifications - Array of notifications
   * @returns {Promise<boolean[]>} Array of success statuses
   */
  async sendBatchNotifications(notifications) {
    const results = [];
    
    for (const notification of notifications) {
      try {
        const success = await this.sendNotification(notification);
        results.push(success);
        
        // Add delay between notifications to respect rate limits
        if (notifications.length > 1) {
          await this._sleep(500);
        }
      } catch (error) {
        this._logger.error(`Failed to send notification: ${notification.title}`, error);
        results.push(false);
      }
    }
    
    return results;
  }

  /**
   * Send simple text message
   * @param {string} message - Message text
   * @param {string} channel - Target channel
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success status
   */
  async sendTextMessage(message, channel, options = {}) {
    const payload = {
      channel: channel,
      text: message,
      username: options.username || 'GDrive Monitor',
      icon_emoji: options.icon_emoji || ':file_folder:'
    };

    return this._sendPayload(payload);
  }

  /**
   * Send rich message with attachments
   * @param {string} text - Main message text
   * @param {Object[]} attachments - Array of attachment objects
   * @param {string} channel - Target channel
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success status
   */
  async sendRichMessage(text, attachments, channel, options = {}) {
    const payload = {
      channel: channel,
      text: text,
      username: options.username || 'GDrive Monitor',
      icon_emoji: options.icon_emoji || ':file_folder:',
      attachments: attachments
    };

    return this._sendPayload(payload);
  }

  /**
   * Send Block Kit message
   * @param {Object[]} blocks - Array of Block Kit blocks
   * @param {string} channel - Target channel
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success status
   */
  async sendBlockMessage(blocks, channel, options = {}) {
    const payload = {
      channel: channel,
      blocks: blocks,
      username: options.username || 'GDrive Monitor',
      icon_emoji: options.icon_emoji || ':file_folder:'
    };

    return this._sendPayload(payload);
  }

  /**
   * Test webhook connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      const testPayload = {
        text: 'Test message from GDrive to Slack Alert',
        username: 'GDrive Monitor',
        icon_emoji: ':white_check_mark:'
      };

      return await this._sendPayload(testPayload);
    } catch (error) {
      this._logger.error('Webhook connection test failed:', error);
      return false;
    }
  }

  /**
   * Build payload from notification
   * @private
   * @param {Notification} notification - The notification
   * @returns {Object} Slack payload
   */
  _buildPayload(notification) {
    // Use notification's built-in Slack payload if available
    if (typeof notification.toSlackPayload === 'function') {
      return notification.toSlackPayload();
    }

    // Fallback to basic payload
    return {
      channel: notification.channel,
      text: notification.title,
      username: 'GDrive Monitor',
      icon_emoji: ':file_folder:',
      attachments: [{
        color: this._getPriorityColor(notification.priority),
        fields: [{
          title: 'Message',
          value: notification.message,
          short: false
        }],
        footer: 'GDrive to Slack Alert',
        ts: Math.floor(notification.timestamp.getTime() / 1000)
      }]
    };
  }

  /**
   * Get color based on priority
   * @private
   * @param {string} priority - Notification priority
   * @returns {string} Color code
   */
  _getPriorityColor(priority) {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'good';
      case 'low': return '#36a64f';
      default: return '#36a64f';
    }
  }

  /**
   * Send payload to Slack webhook
   * @private
   * @param {Object} payload - Payload to send
   * @returns {Promise<boolean>} Success status
   */
  async _sendPayload(payload) {
    return this._executeWithRetry(async () => {
      try {
        const response = UrlFetchApp.fetch(this._webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });

        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();

        if (responseCode === 200) {
          this._logger.log(`Slack notification sent successfully: ${payload.text}`);
          return true;
        } else {
          this._logger.error(`Slack webhook error: ${responseCode} - ${responseText}`);
          throw new Error(`HTTP ${responseCode}: ${responseText}`);
        }
      } catch (error) {
        this._logger.error('Failed to send Slack notification:', error);
        throw error;
      }
    });
  }

  /**
   * Execute operation with retry logic
   * @private
   * @param {Function} operation - Operation to execute
   * @returns {Promise<*>} Operation result
   */
  async _executeWithRetry(operation) {
    let lastError;
    
    for (let attempt = 1; attempt <= this._maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < this._maxRetries) {
          this._logger.warn(`Slack request failed (attempt ${attempt}/${this._maxRetries}), retrying...`);
          await this._sleep(this._retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
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

  /**
   * Set webhook URL
   * @param {string} webhookUrl - New webhook URL
   */
  setWebhookUrl(webhookUrl) {
    this._webhookUrl = webhookUrl;
  }

  /**
   * Get webhook URL (masked for security)
   * @returns {string} Masked webhook URL
   */
  getWebhookUrl() {
    if (!this._webhookUrl) return '';
    
    const url = new URL(this._webhookUrl);
    return `${url.protocol}//${url.hostname}/...${url.pathname.slice(-10)}`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SlackWebhookClient;
}
