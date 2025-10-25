/**
 * AuditLogger.js
 * Audit logging service for authentication and security events
 * 
 * This service logs all authentication-related activities, security events,
 * and user actions for compliance and security monitoring.
 */

/**
 * Audit Logger Service
 * @class AuditLogger
 */
class AuditLogger {
  /**
   * Create a new AuditLogger instance
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {string} options.spreadsheetId - Google Spreadsheet ID for audit logs
   */
  constructor(options = {}) {
    this._logger = options.logger || this._createDefaultLogger();
    this._spreadsheetId = options.spreadsheetId || this._getDefaultSpreadsheetId();
    this._sheetName = 'AuditLog';
    this._spreadsheet = null;
    this._sheet = null;
  }

  /**
   * Create default logger for Google Apps Script environment
   * @returns {Object} Logger instance
   */
  _createDefaultLogger() {
    return {
      log: function(message, context = {}) {
        Logger.log(`[AuditLogger] ${message}`);
      },
      error: function(message, error, context = {}) {
        Logger.log(`[AuditLogger ERROR] ${message}: ${error ? error.message : ''}`);
      },
      warn: function(message, context = {}) {
        Logger.log(`[AuditLogger WARNING] ${message}`);
      }
    };
  }

  /**
   * Get default spreadsheet ID from Script Properties
   * @returns {string} Spreadsheet ID
   */
  _getDefaultSpreadsheetId() {
    const props = PropertiesService.getScriptProperties();
    return props.getProperty('auditLogSpreadsheetId') || '';
  }

  /**
   * Initialize audit logger and ensure spreadsheet exists
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this._logger.log('Initializing AuditLogger...');
      
      if (!this._spreadsheetId) {
        throw new Error('Audit log spreadsheet ID is required');
      }
      
      // Open spreadsheet
      this._spreadsheet = SpreadsheetApp.openById(this._spreadsheetId);
      
      // Get or create sheet
      this._sheet = this._spreadsheet.getSheetByName(this._sheetName);
      if (!this._sheet) {
        this._sheet = this._createAuditSheet();
      }
      
      this._logger.log('AuditLogger initialized successfully');
      
    } catch (error) {
      this._logger.error('AuditLogger initialization failed', error);
      throw error;
    }
  }

  /**
   * Create audit sheet with headers
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} Created sheet
   */
  _createAuditSheet() {
    const sheet = this._spreadsheet.insertSheet(this._sheetName);
    
    // Set up headers
    const headers = [
      'Timestamp',
      'User',
      'Action',
      'Details',
      'IP Address',
      'User Agent',
      'Session ID',
      'Result',
      'Error Message'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    
    // Set column widths
    sheet.setColumnWidth(1, 150);  // Timestamp
    sheet.setColumnWidth(2, 200);  // User
    sheet.setColumnWidth(3, 150);  // Action
    sheet.setColumnWidth(4, 300);  // Details
    sheet.setColumnWidth(5, 150);  // IP Address
    sheet.setColumnWidth(6, 200);  // User Agent
    sheet.setColumnWidth(7, 200);  // Session ID
    sheet.setColumnWidth(8, 100);  // Result
    sheet.setColumnWidth(9, 200);  // Error Message
    
    this._logger.log('Created audit sheet with headers');
    
    return sheet;
  }

  /**
   * Log authentication success
   * @param {string} userEmail - User email
   * @param {string} method - Authentication method (SSO/manual)
   * @param {Object} context - Additional context
   * @returns {Promise<void>}
   */
  async logAuthenticationSuccess(userEmail, method, context = {}) {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: userEmail,
        action: 'authentication_success',
        details: JSON.stringify({
          method: method,
          ...context
        }),
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        sessionId: context.sessionId || '',
        result: 'success',
        errorMessage: ''
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log authentication success', error);
    }
  }

  /**
   * Log authentication failure
   * @param {string} userEmail - User email
   * @param {string} reason - Failure reason
   * @param {Object} context - Additional context
   * @returns {Promise<void>}
   */
  async logAuthenticationFailure(userEmail, reason, context = {}) {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: userEmail || 'unknown',
        action: 'authentication_failure',
        details: JSON.stringify({
          reason: reason,
          ...context
        }),
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        sessionId: context.sessionId || '',
        result: 'failure',
        errorMessage: reason
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log authentication failure', error);
    }
  }

  /**
   * Log user registration
   * @param {string} userEmail - User email
   * @param {Object} registrationData - Registration data
   * @param {Object} context - Additional context
   * @returns {Promise<void>}
   */
  async logUserRegistration(userEmail, registrationData, context = {}) {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: userEmail,
        action: 'user_registration',
        details: JSON.stringify({
          registrationData: registrationData,
          ...context
        }),
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        sessionId: context.sessionId || '',
        result: 'success',
        errorMessage: ''
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log user registration', error);
    }
  }

  /**
   * Log user logout
   * @param {string} userEmail - User email
   * @param {Object} context - Additional context
   * @returns {Promise<void>}
   */
  async logUserLogout(userEmail, context = {}) {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: userEmail,
        action: 'user_logout',
        details: JSON.stringify(context),
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        sessionId: context.sessionId || '',
        result: 'success',
        errorMessage: ''
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log user logout', error);
    }
  }

  /**
   * Log permission check
   * @param {string} userEmail - User email
   * @param {string} permission - Permission checked
   * @param {boolean} granted - Whether permission was granted
   * @param {Object} context - Additional context
   * @returns {Promise<void>}
   */
  async logPermissionCheck(userEmail, permission, granted, context = {}) {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: userEmail,
        action: 'permission_check',
        details: JSON.stringify({
          permission: permission,
          granted: granted,
          ...context
        }),
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        sessionId: context.sessionId || '',
        result: granted ? 'success' : 'denied',
        errorMessage: granted ? '' : 'Permission denied'
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log permission check', error);
    }
  }

  /**
   * Log configuration change
   * @param {string} userEmail - User email
   * @param {string} changeType - Type of change
   * @param {Object} changeData - Change data
   * @param {Object} context - Additional context
   * @returns {Promise<void>}
   */
  async logConfigurationChange(userEmail, changeType, changeData, context = {}) {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: userEmail,
        action: 'configuration_change',
        details: JSON.stringify({
          changeType: changeType,
          changeData: changeData,
          ...context
        }),
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        sessionId: context.sessionId || '',
        result: 'success',
        errorMessage: ''
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log configuration change', error);
    }
  }

  /**
   * Log security event
   * @param {string} eventType - Type of security event
   * @param {string} description - Event description
   * @param {Object} context - Additional context
   * @returns {Promise<void>}
   */
  async logSecurityEvent(eventType, description, context = {}) {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: context.userEmail || 'system',
        action: `security_event_${eventType}`,
        details: JSON.stringify({
          description: description,
          ...context
        }),
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        sessionId: context.sessionId || '',
        result: 'security_event',
        errorMessage: ''
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log security event', error);
    }
  }

  /**
   * Store audit log entry
   * @param {Object} logEntry - Log entry data
   * @returns {Promise<void>}
   */
  async _storeAuditLog(logEntry) {
    try {
      const row = [
        logEntry.timestamp.toISOString(),
        logEntry.user,
        logEntry.action,
        logEntry.details,
        logEntry.ipAddress,
        logEntry.userAgent,
        logEntry.sessionId,
        logEntry.result,
        logEntry.errorMessage
      ];
      
      this._sheet.appendRow(row);
      
      this._logger.log(`Audit log stored: ${logEntry.action} for ${logEntry.user}`);
      
    } catch (error) {
      this._logger.error('Failed to store audit log', error);
      throw error;
    }
  }

  /**
   * Get audit logs for user
   * @param {string} userEmail - User email
   * @param {Object} options - Query options
   * @returns {Promise<Array<Object>>} Audit logs
   */
  async getUserAuditLogs(userEmail, options = {}) {
    try {
      await this._ensureInitialized();
      
      const data = this._sheet.getDataRange().getValues();
      const headers = data[0];
      const logs = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[1] === userEmail) { // User column
          const log = this._rowToLogObject(row, headers);
          
          // Apply date filter if specified
          if (options.startDate && log.timestamp < options.startDate) {
            continue;
          }
          
          if (options.endDate && log.timestamp > options.endDate) {
            continue;
          }
          
          logs.push(log);
        }
      }
      
      // Sort by timestamp (newest first)
      logs.sort((a, b) => b.timestamp - a.timestamp);
      
      return logs;
      
    } catch (error) {
      this._logger.error('Failed to get user audit logs', error);
      return [];
    }
  }

  /**
   * Get audit logs by action type
   * @param {string} action - Action type
   * @param {Object} options - Query options
   * @returns {Promise<Array<Object>>} Audit logs
   */
  async getAuditLogsByAction(action, options = {}) {
    try {
      await this._ensureInitialized();
      
      const data = this._sheet.getDataRange().getValues();
      const headers = data[0];
      const logs = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[2] === action) { // Action column
          const log = this._rowToLogObject(row, headers);
          logs.push(log);
        }
      }
      
      // Sort by timestamp (newest first)
      logs.sort((a, b) => b.timestamp - a.timestamp);
      
      return logs;
      
    } catch (error) {
      this._logger.error('Failed to get audit logs by action', error);
      return [];
    }
  }

  /**
   * Convert sheet row to log object
   * @param {Array} row - Sheet row data
   * @param {Array} headers - Column headers
   * @returns {Object} Log object
   */
  _rowToLogObject(row, headers) {
    const log = {};
    
    headers.forEach((header, index) => {
      const value = row[index];
      
      switch (header) {
        case 'Timestamp':
          log[header] = new Date(value);
          break;
        case 'Details':
          try {
            log[header] = value ? JSON.parse(value) : {};
          } catch (e) {
            log[header] = {};
          }
          break;
        default:
          log[header] = value || '';
      }
    });
    
    return log;
  }

  /**
   * Ensure audit logger is initialized
   * @returns {Promise<void>}
   */
  async _ensureInitialized() {
    if (!this._sheet) {
      await this.initialize();
    }
  }
  
  /**
   * Log role assignment
   * @param {string} assignerEmail - Email of user making assignment
   * @param {string} targetEmail - Email of user receiving role
   * @param {string} previousRole - Previous role
   * @param {string} newRole - New role
   * @param {string} reason - Reason for assignment
   * @returns {Promise<void>}
   */
  async logRoleAssignment(assignerEmail, targetEmail, previousRole, newRole, reason = '') {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: assignerEmail,
        action: 'role_assignment',
        details: JSON.stringify({
          targetEmail: targetEmail,
          previousRole: previousRole,
          newRole: newRole,
          reason: reason
        }),
        ipAddress: 'N/A',
        userAgent: 'N/A',
        sessionId: 'N/A',
        result: 'success',
        errorMessage: ''
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log role assignment', error);
    }
  }
  
  /**
   * Log authorization attempt
   * @param {string} userEmail - User email
   * @param {string} resource - Resource being accessed
   * @param {boolean} authorized - Whether access was granted
   * @param {string} reason - Reason for authorization decision
   * @returns {Promise<void>}
   */
  async logAuthorizationAttempt(userEmail, resource, authorized, reason = '') {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: userEmail,
        action: 'authorization_attempt',
        details: JSON.stringify({
          resource: resource,
          authorized: authorized,
          reason: reason
        }),
        ipAddress: 'N/A',
        userAgent: 'N/A',
        sessionId: 'N/A',
        result: authorized ? 'success' : 'denied',
        errorMessage: authorized ? '' : reason
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log authorization attempt', error);
    }
  }
  
  /**
   * Log permission check
   * @param {string} userEmail - User email
   * @param {string} permission - Permission being checked
   * @param {boolean} granted - Whether permission was granted
   * @param {string} context - Additional context
   * @returns {Promise<void>}
   */
  async logPermissionCheck(userEmail, permission, granted, context = '') {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: userEmail,
        action: 'permission_check',
        details: JSON.stringify({
          permission: permission,
          granted: granted,
          context: context
        }),
        ipAddress: 'N/A',
        userAgent: 'N/A',
        sessionId: 'N/A',
        result: granted ? 'success' : 'denied',
        errorMessage: granted ? '' : 'Permission denied'
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log permission check', error);
    }
  }
  
  /**
   * Log user management action
   * @param {string} managerEmail - Email of user performing action
   * @param {string} targetEmail - Email of user being managed
   * @param {string} action - Action performed (suspend, activate, delete, etc.)
   * @param {string} reason - Reason for action
   * @returns {Promise<void>}
   */
  async logUserManagement(managerEmail, targetEmail, action, reason = '') {
    try {
      await this._ensureInitialized();
      
      const logEntry = {
        timestamp: new Date(),
        user: managerEmail,
        action: 'user_management',
        details: JSON.stringify({
          targetEmail: targetEmail,
          managementAction: action,
          reason: reason
        }),
        ipAddress: 'N/A',
        userAgent: 'N/A',
        sessionId: 'N/A',
        result: 'success',
        errorMessage: ''
      };
      
      await this._storeAuditLog(logEntry);
      
    } catch (error) {
      this._logger.error('Failed to log user management', error);
    }
  }
}

/**
 * Global audit logging functions
 */

/**
 * Log authentication success (global function)
 * @param {string} userEmail - User email
 * @param {string} method - Authentication method
 * @returns {Promise<void>}
 */
async function logAuthSuccess(userEmail, method) {
  try {
    const auditLogger = new AuditLogger();
    await auditLogger.initialize();
    
    await auditLogger.logAuthenticationSuccess(userEmail, method);
    
  } catch (error) {
    Logger.log(`Failed to log auth success: ${error.message}`);
  }
}

/**
 * Log authentication failure (global function)
 * @param {string} userEmail - User email
 * @param {string} reason - Failure reason
 * @returns {Promise<void>}
 */
async function logAuthFailure(userEmail, reason) {
  try {
    const auditLogger = new AuditLogger();
    await auditLogger.initialize();
    
    await auditLogger.logAuthenticationFailure(userEmail, reason);
    
  } catch (error) {
    Logger.log(`Failed to log auth failure: ${error.message}`);
  }
}

/**
 * Get user audit logs (global function)
 * @param {string} userEmail - User email
 * @returns {Promise<Array<Object>>} Audit logs
 */
async function getUserAuditLogs(userEmail) {
  try {
    const auditLogger = new AuditLogger();
    await auditLogger.initialize();
    
    return await auditLogger.getUserAuditLogs(userEmail);
    
  } catch (error) {
    Logger.log(`Failed to get user audit logs: ${error.message}`);
    return [];
  }
}
