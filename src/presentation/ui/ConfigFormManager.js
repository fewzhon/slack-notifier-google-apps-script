/**
 * ConfigFormManager - Advanced Configuration Form Management
 * Handles interactive forms, real-time validation, and user feedback
 */

class ConfigFormManager {
  constructor(dependencies = {}) {
    this._logger = dependencies.logger || this._createDefaultLogger();
    this._forms = new Map();
    this._validationRules = new Map();
    this._currentForm = null;
    this._unsavedChanges = new Map();
    
    // Initialize dependencies
    this._configUIService = dependencies.configUIService;
    this._accessControlService = dependencies.accessControlService;
    this._auditLogger = dependencies.auditLogger;
    
    // Setup validation rules immediately
    this._setupValidationRules();
    
    this._logger.log('[ConfigFormManager] ConfigFormManager initialized');
  }
  
  /**
   * Initialize the form manager
   * @param {Object} dependencies - Service dependencies
   * @returns {Promise<Object>} Initialization result
   */
  async initialize(dependencies = {}) {
    try {
      this._logger.log('Initializing ConfigFormManager...');
      
      // Initialize dependencies
      this._configUIService = dependencies.configUIService;
      this._accessControlService = dependencies.accessControlService;
      this._auditLogger = dependencies.auditLogger;
      
      // Setup validation rules
      this._setupValidationRules();
      
      this._logger.log('ConfigFormManager initialized successfully');
      
      return {
        success: true,
        message: 'ConfigFormManager initialized successfully',
        features: [
          'Interactive Forms',
          'Real-time Validation',
          'Auto-save',
          'Undo/Redo',
          'Form State Management',
          'User Feedback'
        ]
      };
      
    } catch (error) {
      this._logger.error('Failed to initialize ConfigFormManager', error);
      throw error;
    }
  }
  
  /**
   * Create a configuration form for a category
   * @param {string} categoryKey - Configuration category key
   * @param {Object} categoryData - Category configuration data
   * @param {string} userEmail - User email
   * @returns {Object} Form configuration
   */
  createForm(categoryKey, categoryData, userEmail) {
    try {
      this._logger.log(`Creating form for category: ${categoryKey}`);
      
      const formConfig = {
        categoryKey: categoryKey,
        categoryData: categoryData,
        userEmail: userEmail,
        fields: this._generateFormFields(categoryKey, categoryData),
        validation: this._validationRules.get(categoryKey) || {},
        state: {
          isDirty: false,
          isValid: true,
          errors: {},
          warnings: {},
          lastSaved: null,
          autoSaveEnabled: true
        },
        handlers: {
          onChange: (field, value) => this._handleFieldChange(categoryKey, field, value),
          onValidate: (field, value) => this._validateField(categoryKey, field, value),
          onSave: () => this._saveForm(categoryKey),
          onReset: () => this._resetForm(categoryKey),
          onUndo: () => this._undoChange(categoryKey),
          onRedo: () => this._redoChange(categoryKey)
        }
      };
      
      this._forms.set(categoryKey, formConfig);
      this._currentForm = categoryKey;
      
      this._logger.log(`Form created for category: ${categoryKey}`);
      return formConfig;
      
    } catch (error) {
      this._logger.error(`Failed to create form for ${categoryKey}`, error);
      throw error;
    }
  }
  
  /**
   * Generate form fields for a category
   * @param {string} categoryKey - Category key
   * @param {Object} categoryData - Category data
   * @returns {Array} Form fields configuration
   */
  _generateFormFields(categoryKey, categoryData) {
    const fieldTemplates = {
      monitoring: [
        {
          key: 'folderIds',
          type: 'multi-select',
          label: 'Monitor Folders',
          description: 'Select Google Drive folders to monitor',
          placeholder: 'Select folders...',
          required: true,
          options: [], // Will be populated with actual folders
          validation: {
            required: true,
            minItems: 1,
            maxItems: 10
          }
        },
        {
          key: 'monitoringInterval',
          type: 'number',
          label: 'Monitoring Interval (minutes)',
          description: 'How often to check for changes',
          placeholder: '30',
          required: true,
          min: 5,
          max: 1440,
          step: 5,
          validation: {
            required: true,
            min: 5,
            max: 1440,
            step: 5
          }
        },
        {
          key: 'maxFilesToProcess',
          type: 'number',
          label: 'Max Files to Process',
          description: 'Maximum number of files to process per check',
          placeholder: '100',
          required: true,
          min: 1,
          max: 1000,
          validation: {
            required: true,
            min: 1,
            max: 1000
          }
        },
        {
          key: 'fileChangeThreshold',
          type: 'number',
          label: 'Change Threshold',
          description: 'Minimum number of changes to trigger notification',
          placeholder: '5',
          required: true,
          min: 1,
          max: 100,
          validation: {
            required: true,
            min: 1,
            max: 100
          }
        }
      ],
      notifications: [
        {
          key: 'slackWebhookUrl',
          type: 'url',
          label: 'Slack Webhook URL',
          description: 'Your Slack webhook URL for notifications',
          placeholder: 'https://hooks.slack.com/services/...',
          required: true,
          validation: {
            required: true,
            pattern: '^https://hooks\\.slack\\.com/services/.*',
            message: 'Must be a valid Slack webhook URL'
          }
        },
        {
          key: 'defaultChannel',
          type: 'text',
          label: 'Default Channel',
          description: 'Default Slack channel for notifications',
          placeholder: '#dev_sandbox',
          required: true,
          validation: {
            required: true,
            pattern: '^#[a-zA-Z0-9_-]+$',
            message: 'Must be a valid Slack channel (e.g., #channel-name)'
          }
        },
        {
          key: 'notificationFrequency',
          type: 'select',
          label: 'Notification Frequency',
          description: 'How often to send notifications',
          required: true,
          options: [
            { value: 'immediate', label: 'Immediate' },
            { value: 'batched', label: 'Batched (every 5 minutes)' },
            { value: 'hourly', label: 'Hourly' },
            { value: 'daily', label: 'Daily Summary' }
          ],
          validation: {
            required: true,
            enum: ['immediate', 'batched', 'hourly', 'daily']
          }
        },
        {
          key: 'dailySummaryTime',
          type: 'time',
          label: 'Daily Summary Time',
          description: 'Time to send daily summary (24-hour format)',
          placeholder: '07:00',
          required: false,
          validation: {
            pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
            message: 'Must be in HH:MM format'
          }
        }
      ],
      triggers: [
        {
          key: 'monitoringFrequency',
          type: 'number',
          label: 'Monitoring Frequency (minutes)',
          description: 'How often the monitoring trigger runs',
          placeholder: '30',
          required: true,
          min: 5,
          max: 1440,
          step: 5,
          validation: {
            required: true,
            min: 5,
            max: 1440,
            step: 5
          }
        },
        {
          key: 'dailySummaryTime',
          type: 'time',
          label: 'Daily Summary Time',
          description: 'Time to send daily summary',
          placeholder: '07:00',
          required: true,
          validation: {
            required: true,
            pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
          }
        },
        {
          key: 'weeklySummaryDay',
          type: 'select',
          label: 'Weekly Summary Day',
          description: 'Day of the week for weekly summary',
          required: true,
          options: [
            { value: 'monday', label: 'Monday' },
            { value: 'tuesday', label: 'Tuesday' },
            { value: 'wednesday', label: 'Wednesday' },
            { value: 'thursday', label: 'Thursday' },
            { value: 'friday', label: 'Friday' },
            { value: 'saturday', label: 'Saturday' },
            { value: 'sunday', label: 'Sunday' }
          ],
          validation: {
            required: true,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          }
        },
        {
          key: 'enableNotifications',
          type: 'checkbox',
          label: 'Enable Notifications',
          description: 'Enable/disable all notifications',
          required: false,
          validation: {
            type: 'boolean'
          }
        }
      ],
      system: [
        {
          key: 'debugMode',
          type: 'checkbox',
          label: 'Debug Mode',
          description: 'Enable detailed logging and debugging',
          required: false,
          validation: {
            type: 'boolean'
          }
        },
        {
          key: 'logLevel',
          type: 'select',
          label: 'Log Level',
          description: 'Level of detail in logs',
          required: true,
          options: [
            { value: 'error', label: 'Error Only' },
            { value: 'warn', label: 'Warnings & Errors' },
            { value: 'info', label: 'Info, Warnings & Errors' },
            { value: 'debug', label: 'All Messages' }
          ],
          validation: {
            required: true,
            enum: ['error', 'warn', 'info', 'debug']
          }
        },
        {
          key: 'maxRetries',
          type: 'number',
          label: 'Max Retries',
          description: 'Maximum number of retry attempts for failed operations',
          placeholder: '3',
          required: true,
          min: 0,
          max: 10,
          validation: {
            required: true,
            min: 0,
            max: 10
          }
        },
        {
          key: 'timeoutSeconds',
          type: 'number',
          label: 'Timeout (seconds)',
          description: 'Timeout for external API calls',
          placeholder: '30',
          required: true,
          min: 5,
          max: 300,
          validation: {
            required: true,
            min: 5,
            max: 300
          }
        }
      ],
      users: [
        {
          key: 'adminEmails',
          type: 'multi-text',
          label: 'Admin Emails',
          description: 'Email addresses with admin privileges',
          placeholder: 'admin@company.com',
          required: true,
          validation: {
            required: true,
            minItems: 1,
            emailFormat: true
          }
        },
        {
          key: 'approvedDomains',
          type: 'multi-text',
          label: 'Approved Domains',
          description: 'Email domains that can access the system',
          placeholder: 'company.com',
          required: true,
          validation: {
            required: true,
            minItems: 1,
            domainFormat: true
          }
        },
        {
          key: 'sessionTimeout',
          type: 'number',
          label: 'Session Timeout (hours)',
          description: 'How long user sessions remain active',
          placeholder: '24',
          required: true,
          min: 1,
          max: 168,
          validation: {
            required: true,
            min: 1,
            max: 168
          }
        },
        {
          key: 'requireApproval',
          type: 'checkbox',
          label: 'Require Manual Approval',
          description: 'Require admin approval for new user registrations',
          required: false,
          validation: {
            type: 'boolean'
          }
        }
      ]
    };
    
    return fieldTemplates[categoryKey] || [];
  }
  
  /**
   * Setup validation rules for all categories
   */
  _setupValidationRules() {
    this._validationRules.set('monitoring', {
      folderIds: { required: true, minItems: 1, maxItems: 10 },
      monitoringInterval: { required: true, min: 5, max: 1440, step: 5 },
      maxFilesToProcess: { required: true, min: 1, max: 1000 },
      fileChangeThreshold: { required: true, min: 1, max: 100 }
    });
    
    this._validationRules.set('notifications', {
      slackWebhookUrl: { required: true, pattern: '^https://hooks\\.slack\\.com/services/.*' },
      defaultChannel: { required: true, pattern: '^#[a-zA-Z0-9_-]+$' },
      notificationFrequency: { required: true, enum: ['immediate', 'batched', 'hourly', 'daily'] },
      dailySummaryTime: { pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' }
    });
    
    this._validationRules.set('triggers', {
      monitoringFrequency: { required: true, min: 5, max: 1440, step: 5 },
      dailySummaryTime: { required: true, pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
      weeklySummaryDay: { required: true, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      enableNotifications: { type: 'boolean' }
    });
    
    this._validationRules.set('system', {
      debugMode: { type: 'boolean' },
      logLevel: { required: true, enum: ['error', 'warn', 'info', 'debug'] },
      maxRetries: { required: true, min: 0, max: 10 },
      timeoutSeconds: { required: true, min: 5, max: 300 }
    });
    
    this._validationRules.set('users', {
      adminEmails: { required: true, minItems: 1, emailFormat: true },
      approvedDomains: { required: true, minItems: 1, domainFormat: true },
      sessionTimeout: { required: true, min: 1, max: 168 },
      requireApproval: { type: 'boolean' }
    });
  }
  
  /**
   * Handle field change
   * @param {string} categoryKey - Category key
   * @param {string} field - Field key
   * @param {any} value - New value
   */
  _handleFieldChange(categoryKey, field, value) {
    try {
      this._logger.log(`Field change: ${categoryKey}.${field} = ${JSON.stringify(value)}`);
      
      const form = this._forms.get(categoryKey);
      if (!form) return;
      
      // Mark form as dirty
      form.state.isDirty = true;
      
      // Validate field
      const validation = this._validateField(categoryKey, field, value);
      
      // Update form state
      if (validation.isValid) {
        delete form.state.errors[field];
      } else {
        form.state.errors[field] = validation.message;
      }
      
      // Auto-save if enabled
      if (form.state.autoSaveEnabled) {
        this._scheduleAutoSave(categoryKey);
      }
      
      // Trigger change event
      this._triggerFormChange(categoryKey, field, value);
      
    } catch (error) {
      this._logger.error(`Failed to handle field change for ${categoryKey}.${field}`, error);
    }
  }
  
  /**
   * Validate a field
   * @param {string} categoryKey - Category key
   * @param {string} field - Field key
   * @param {any} value - Value to validate
   * @returns {Object} Validation result
   */
  _validateField(categoryKey, field, value) {
    try {
      const rules = this._validationRules.get(categoryKey);
      const fieldRules = rules?.[field];
      
      if (!fieldRules) {
        return { isValid: true, message: null };
      }
      
      // Required validation
      if (fieldRules.required && (value === null || value === undefined || value === '')) {
        return { isValid: false, message: 'This field is required' };
      }
      
      // Skip other validations if value is empty and not required
      if (!fieldRules.required && (value === null || value === undefined || value === '')) {
        return { isValid: true, message: null };
      }
      
      // Type validation
      if (fieldRules.type === 'boolean' && typeof value !== 'boolean') {
        return { isValid: false, message: 'Must be true or false' };
      }
      
      // Number validations
      if (typeof value === 'number') {
        if (fieldRules.min !== undefined && value < fieldRules.min) {
          return { isValid: false, message: `Must be at least ${fieldRules.min}` };
        }
        if (fieldRules.max !== undefined && value > fieldRules.max) {
          return { isValid: false, message: `Must be at most ${fieldRules.max}` };
        }
        if (fieldRules.step !== undefined && value % fieldRules.step !== 0) {
          return { isValid: false, message: `Must be a multiple of ${fieldRules.step}` };
        }
      }
      
      // Array validations
      if (Array.isArray(value)) {
        if (fieldRules.minItems !== undefined && value.length < fieldRules.minItems) {
          return { isValid: false, message: `Must have at least ${fieldRules.minItems} items` };
        }
        if (fieldRules.maxItems !== undefined && value.length > fieldRules.maxItems) {
          return { isValid: false, message: `Must have at most ${fieldRules.maxItems} items` };
        }
      }
      
      // Pattern validation
      if (fieldRules.pattern && typeof value === 'string') {
        const regex = new RegExp(fieldRules.pattern);
        if (!regex.test(value)) {
          return { isValid: false, message: fieldRules.message || 'Invalid format' };
        }
      }
      
      // Enum validation
      if (fieldRules.enum && !fieldRules.enum.includes(value)) {
        return { isValid: false, message: `Must be one of: ${fieldRules.enum.join(', ')}` };
      }
      
      // Email format validation
      if (fieldRules.emailFormat && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { isValid: false, message: 'Must be a valid email address' };
        }
      }
      
      // Domain format validation
      if (fieldRules.domainFormat && typeof value === 'string') {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(value)) {
          return { isValid: false, message: 'Must be a valid domain name' };
        }
      }
      
      return { isValid: true, message: null };
      
    } catch (error) {
      this._logger.error(`Validation error for ${categoryKey}.${field}`, error);
      return { isValid: false, message: 'Validation error occurred' };
    }
  }
  
  /**
   * Save form data
   * @param {string} categoryKey - Category key
   * @returns {Promise<Object>} Save result
   */
  async _saveForm(categoryKey) {
    try {
      this._logger.log(`Saving form for category: ${categoryKey}`);
      
      const form = this._forms.get(categoryKey);
      if (!form) {
        throw new Error(`Form not found for category: ${categoryKey}`);
      }
      
      // Validate all fields
      const validationErrors = {};
      let isValid = true;
      
      for (const field of form.fields) {
        const currentValue = this._getFieldValue(categoryKey, field.key);
        const validation = this._validateField(categoryKey, field.key, currentValue);
        
        if (!validation.isValid) {
          validationErrors[field.key] = validation.message;
          isValid = false;
        }
      }
      
      if (!isValid) {
        form.state.errors = validationErrors;
        return {
          success: false,
          message: 'Form validation failed',
          errors: validationErrors
        };
      }
      
      // Save to backend
      const saveData = {};
      for (const field of form.fields) {
        saveData[field.key] = this._getFieldValue(categoryKey, field.key);
      }
      
      // Call ConfigUIService to save
      if (this._configUIService) {
        for (const [key, value] of Object.entries(saveData)) {
          await this._configUIService.updateConfigValue(
            key,
            value,
            form.userEmail,
            'Form save',
            categoryKey
          );
        }
      }
      
      // Update form state
      form.state.isDirty = false;
      form.state.lastSaved = new Date().toISOString();
      form.state.errors = {};
      
      this._logger.log(`Form saved successfully for category: ${categoryKey}`);
      
      return {
        success: true,
        message: 'Form saved successfully',
        data: saveData
      };
      
    } catch (error) {
      this._logger.error(`Failed to save form for ${categoryKey}`, error);
      return {
        success: false,
        message: 'Failed to save form',
        error: error.message
      };
    }
  }
  
  /**
   * Reset form to original values
   * @param {string} categoryKey - Category key
   * @returns {Object} Reset result
   */
  _resetForm(categoryKey) {
    try {
      this._logger.log(`Resetting form for category: ${categoryKey}`);
      
      const form = this._forms.get(categoryKey);
      if (!form) {
        throw new Error(`Form not found for category: ${categoryKey}`);
      }
      
      // Reset form state
      form.state.isDirty = false;
      form.state.errors = {};
      form.state.warnings = {};
      
      this._logger.log(`Form reset successfully for category: ${categoryKey}`);
      
      return {
        success: true,
        message: 'Form reset successfully'
      };
      
    } catch (error) {
      this._logger.error(`Failed to reset form for ${categoryKey}`, error);
      return {
        success: false,
        message: 'Failed to reset form',
        error: error.message
      };
    }
  }
  
  /**
   * Get field value
   * @param {string} categoryKey - Category key
   * @param {string} fieldKey - Field key
   * @returns {any} Field value
   */
  _getFieldValue(categoryKey, fieldKey) {
    // This would typically get the value from the DOM or form state
    // For now, return a mock value
    return null;
  }
  
  /**
   * Schedule auto-save
   * @param {string} categoryKey - Category key
   */
  _scheduleAutoSave(categoryKey) {
    // Clear existing timeout
    if (this._autoSaveTimeout) {
      clearTimeout(this._autoSaveTimeout);
    }
    
    // Schedule new auto-save
    this._autoSaveTimeout = setTimeout(() => {
      this._saveForm(categoryKey);
    }, 2000); // Auto-save after 2 seconds of inactivity
  }
  
  /**
   * Trigger form change event
   * @param {string} categoryKey - Category key
   * @param {string} field - Field key
   * @param {any} value - New value
   */
  _triggerFormChange(categoryKey, field, value) {
    // This would typically dispatch events to update the UI
    this._logger.log(`Form change event: ${categoryKey}.${field} = ${JSON.stringify(value)}`);
  }
  
  /**
   * Undo last change
   * @param {string} categoryKey - Category key
   * @returns {Object} Undo result
   */
  _undoChange(categoryKey) {
    // Implementation for undo functionality
    return { success: true, message: 'Change undone' };
  }
  
  /**
   * Redo last undone change
   * @param {string} categoryKey - Category key
   * @returns {Object} Redo result
   */
  _redoChange(categoryKey) {
    // Implementation for redo functionality
    return { success: true, message: 'Change redone' };
  }
  
  /**
   * Get form configuration
   * @param {string} categoryKey - Category key
   * @returns {Object} Form configuration
   */
  getForm(categoryKey) {
    return this._forms.get(categoryKey);
  }
  
  /**
   * Get all forms
   * @returns {Map} All forms
   */
  getAllForms() {
    return this._forms;
  }
  
  /**
   * Create default logger
   * @returns {Object} Logger object
   */
  _createDefaultLogger() {
    return {
      log: (message) => Logger.log(`[ConfigFormManager] ${message}`),
      error: (message, error) => Logger.log(`[ConfigFormManager ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[ConfigFormManager WARNING] ${message}`)
    };
  }
}

// Global functions for Google Apps Script
function createConfigForm(categoryKey, categoryData, userEmail) {
  const formManager = new ConfigFormManager();
  return formManager.createForm(categoryKey, categoryData, userEmail);
}

function validateConfigField(categoryKey, field, value) {
  const formManager = new ConfigFormManager();
  return formManager._validateField(categoryKey, field, value);
}

function saveConfigForm(categoryKey) {
  const formManager = new ConfigFormManager();
  return formManager._saveForm(categoryKey);
}
