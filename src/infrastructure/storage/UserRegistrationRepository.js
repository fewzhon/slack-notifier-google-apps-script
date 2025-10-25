/**
 * UserRegistrationRepository.js
 * Repository for user registration and management data
 * 
 * This repository manages user data using Google Spreadsheet as a temporary database,
 * providing CRUD operations for user registration, approval, and management.
 */

/**
 * User Registration Repository
 * @class UserRegistrationRepository
 */
class UserRegistrationRepository {
  /**
   * Create a new UserRegistrationRepository instance
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {string} options.spreadsheetId - Google Spreadsheet ID for user data
   */
  constructor(options = {}) {
    this._logger = options.logger || this._createDefaultLogger();
    this._spreadsheetId = options.spreadsheetId || this._getDefaultSpreadsheetId();
    this._sheetName = 'Users';
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
        Logger.log(`[UserRepository] ${message}`);
      },
      error: function(message, error, context = {}) {
        Logger.log(`[UserRepository ERROR] ${message}: ${error ? error.message : ''}`);
      },
      warn: function(message, context = {}) {
        Logger.log(`[UserRepository WARNING] ${message}`);
      }
    };
  }

  /**
   * Get default spreadsheet ID from Script Properties
   * @returns {string} Spreadsheet ID
   */
  _getDefaultSpreadsheetId() {
    const props = PropertiesService.getScriptProperties();
    return props.getProperty('userDatabaseSpreadsheetId') || '';
  }

  /**
   * Initialize repository and ensure spreadsheet exists
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this._logger.log('Initializing UserRegistrationRepository...');
      
      if (!this._spreadsheetId) {
        throw new Error('Spreadsheet ID is required');
      }
      
      // Open spreadsheet
      this._spreadsheet = SpreadsheetApp.openById(this._spreadsheetId);
      
      // Get or create sheet
      this._sheet = this._spreadsheet.getSheetByName(this._sheetName);
      if (!this._sheet) {
        this._sheet = this._createUserSheet();
      }
      
      this._logger.log('UserRegistrationRepository initialized successfully');
      
    } catch (error) {
      this._logger.error('UserRegistrationRepository initialization failed', error);
      throw error;
    }
  }

  /**
   * Create user sheet with headers
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} Created sheet
   */
  _createUserSheet() {
    const sheet = this._spreadsheet.insertSheet(this._sheetName);
    
    // Set up headers
    const headers = [
      'Email',
      'Name',
      'Organization',
      'Role',
      'Status',
      'Source',
      'CreatedAt',
      'LastLogin',
      'LoginCount',
      'ApprovedBy',
      'ApprovedAt',
      'RegistrationData',
      'Notes'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    
    // Set column widths
    sheet.setColumnWidth(1, 200);  // Email
    sheet.setColumnWidth(2, 150);  // Name
    sheet.setColumnWidth(3, 150);  // Organization
    sheet.setColumnWidth(4, 100);  // Role
    sheet.setColumnWidth(5, 100);  // Status
    sheet.setColumnWidth(6, 100);  // Source
    sheet.setColumnWidth(7, 120);  // CreatedAt
    sheet.setColumnWidth(8, 120);  // LastLogin
    sheet.setColumnWidth(9, 100);  // LoginCount
    sheet.setColumnWidth(10, 150); // ApprovedBy
    sheet.setColumnWidth(11, 120); // ApprovedAt
    sheet.setColumnWidth(12, 200); // RegistrationData
    sheet.setColumnWidth(13, 200); // Notes
    
    this._logger.log('Created user sheet with headers');
    
    return sheet;
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      await this._ensureInitialized();
      
      // Validate user data
      this._validateUserData(userData);
      
      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User already exists');
      }
      
      // Prepare user data for storage
      const userRecord = {
        email: userData.email,
        name: userData.name || '',
        organization: userData.organization || '',
        role: userData.role || 'user',
        status: userData.status || 'pending',
        source: userData.source || 'manual',
        createdAt: userData.createdAt || new Date(),
        lastLogin: userData.lastLogin || null,
        loginCount: userData.loginCount || 0,
        approvedBy: userData.approvedBy || null,
        approvedAt: userData.approvedAt || null,
        registrationData: JSON.stringify(userData.registrationData || {}),
        notes: userData.notes || ''
      };
      
      // Add to sheet
      const row = [
        userRecord.email,
        userRecord.name,
        userRecord.organization,
        userRecord.role,
        userRecord.status,
        userRecord.source,
        userRecord.createdAt,
        userRecord.lastLogin,
        userRecord.loginCount,
        userRecord.approvedBy,
        userRecord.approvedAt,
        userRecord.registrationData,
        userRecord.notes
      ];
      
      this._sheet.appendRow(row);
      
      this._logger.log(`Created user: ${userData.email}`);
      
      return userRecord;
      
    } catch (error) {
      this._logger.error('Failed to create user', error);
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User data or null
   */
  async getUserByEmail(email) {
    try {
      await this._ensureInitialized();
      
      if (!email) {
        return null;
      }
      
      const data = this._sheet.getDataRange().getValues();
      const headers = data[0];
      
      // Find user by email
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] === email) {
          return this._rowToUserObject(row, headers);
        }
      }
      
      return null;
      
    } catch (error) {
      this._logger.error('Failed to get user by email', error);
      return null;
    }
  }

  /**
   * Update user data
   * @param {string} email - User email
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(email, updateData) {
    try {
      await this._ensureInitialized();
      
      if (!email) {
        throw new Error('Email is required');
      }
      
      const data = this._sheet.getDataRange().getValues();
      const headers = data[0];
      
      // Find user row
      let userRowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === email) {
          userRowIndex = i;
          break;
        }
      }
      
      if (userRowIndex === -1) {
        throw new Error('User not found');
      }
      
      // Update user data
      const currentUser = this._rowToUserObject(data[userRowIndex], headers);
      const updatedUser = { ...currentUser, ...updateData };
      
      // Convert back to row format
      const updatedRow = this._userObjectToRow(updatedUser, headers);
      
      // Update sheet
      const range = this._sheet.getRange(userRowIndex + 1, 1, 1, headers.length);
      range.setValues([updatedRow]);
      
      this._logger.log(`Updated user: ${email}`);
      
      return updatedUser;
      
    } catch (error) {
      this._logger.error('Failed to update user', error);
      throw error;
    }
  }

  /**
   * Delete user by email
   * @param {string} email - User email
   * @returns {Promise<boolean>} True if user was deleted
   */
  async deleteUser(email) {
    try {
      await this._ensureInitialized();
      
      if (!email) {
        throw new Error('Email is required');
      }
      
      const data = this._sheet.getDataRange().getValues();
      
      // Find user row
      let userRowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === email) {
          userRowIndex = i;
          break;
        }
      }
      
      if (userRowIndex === -1) {
        throw new Error('User not found');
      }
      
      // Delete the row (add 1 because Google Sheets is 1-indexed)
      this._sheet.deleteRow(userRowIndex + 1);
      
      this._logger.log(`Deleted user: ${email}`);
      return true;
      
    } catch (error) {
      this._logger.error('Failed to delete user', error);
      throw error;
    }
  }

  /**
   * Get all users
   * @param {Object} options - Query options
   * @returns {Promise<Array<Object>>} List of users
   */
  async getAllUsers(options = {}) {
    try {
      await this._ensureInitialized();
      
      const data = this._sheet.getDataRange().getValues();
      const headers = data[0];
      const users = [];
      
      for (let i = 1; i < data.length; i++) {
        const user = this._rowToUserObject(data[i], headers);
        
        // Apply filters if specified
        if (options.status && user.status !== options.status) {
          continue;
        }
        
        if (options.role && user.role !== options.role) {
          continue;
        }
        
        users.push(user);
      }
      
      return users;
      
    } catch (error) {
      this._logger.error('Failed to get all users', error);
      return [];
    }
  }

  /**
   * Approve user registration
   * @param {string} email - User email
   * @param {string} approvedBy - Admin email who approved
   * @returns {Promise<Object>} Updated user
   */
  async approveUser(email, approvedBy) {
    try {
      const updateData = {
        status: 'active',
        approvedBy: approvedBy,
        approvedAt: new Date()
      };
      
      return await this.updateUser(email, updateData);
      
    } catch (error) {
      this._logger.error('Failed to approve user', error);
      throw error;
    }
  }

  /**
   * Suspend user account
   * @param {string} email - User email
   * @param {string} suspendedBy - Admin email who suspended
   * @param {string} reason - Suspension reason
   * @returns {Promise<Object>} Updated user
   */
  async suspendUser(email, suspendedBy, reason) {
    try {
      const updateData = {
        status: 'suspended',
        notes: `Suspended by ${suspendedBy}: ${reason}`
      };
      
      return await this.updateUser(email, updateData);
      
    } catch (error) {
      this._logger.error('Failed to suspend user', error);
      throw error;
    }
  }

  /**
   * Convert sheet row to user object
   * @param {Array} row - Sheet row data
   * @param {Array} headers - Column headers
   * @returns {Object} User object
   */
  _rowToUserObject(row, headers) {
    const user = {};
    
    headers.forEach((header, index) => {
      const value = row[index];
      const camelCaseKey = this._toCamelCase(header);
      
      switch (header) {
        case 'CreatedAt':
        case 'LastLogin':
        case 'ApprovedAt':
          user[camelCaseKey] = value ? new Date(value) : null;
          break;
        case 'LoginCount':
          user[camelCaseKey] = parseInt(value) || 0;
          break;
        case 'RegistrationData':
          try {
            user[camelCaseKey] = value ? JSON.parse(value) : {};
          } catch (e) {
            user[camelCaseKey] = {};
          }
          break;
        default:
          user[camelCaseKey] = value || '';
      }
    });
    
    return user;
  }
  
  _toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  /**
   * Convert user object to sheet row
   * @param {Object} user - User object
   * @param {Array} headers - Column headers
   * @returns {Array} Sheet row data
   */
  _userObjectToRow(user, headers) {
    return headers.map(header => {
      const value = user[header];
      
      switch (header) {
        case 'CreatedAt':
        case 'LastLogin':
        case 'ApprovedAt':
          return value ? value.toISOString() : '';
        case 'RegistrationData':
          return typeof value === 'object' ? JSON.stringify(value) : value;
        default:
          return value || '';
      }
    });
  }

  /**
   * Validate user data
   * @param {Object} userData - User data to validate
   * @returns {void}
   */
  _validateUserData(userData) {
    if (!userData.email || !userData.email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    
    if (!userData.name || userData.name.trim().length < 2) {
      throw new Error('Name is required and must be at least 2 characters');
    }
  }

  /**
   * Ensure repository is initialized
   * @returns {Promise<void>}
   */
  async _ensureInitialized() {
    if (!this._sheet) {
      await this.initialize();
    }
  }
}

/**
 * Global user management functions
 */

/**
 * Create user (global function)
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
async function createUser(userData) {
  try {
    const repository = new UserRegistrationRepository();
    await repository.initialize();
    
    return await repository.createUser(userData);
    
  } catch (error) {
    Logger.log(`User creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get user by email (global function)
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User data
 */
async function getUserByEmail(email) {
  try {
    const repository = new UserRegistrationRepository();
    await repository.initialize();
    
    return await repository.getUserByEmail(email);
    
  } catch (error) {
    Logger.log(`Get user failed: ${error.message}`);
    return null;
  }
}

/**
 * Get all pending users (global function)
 * @returns {Promise<Array<Object>>} Pending users
 */
async function getPendingUsers() {
  try {
    const repository = new UserRegistrationRepository();
    await repository.initialize();
    
    return await repository.getAllUsers({ status: 'pending' });
    
  } catch (error) {
    Logger.log(`Get pending users failed: ${error.message}`);
    return [];
  }
}
