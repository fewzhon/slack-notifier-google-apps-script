/**
 * ModalManager - Advanced Modal System
 * Handles configuration modals, form dialogs, and user interactions
 */

class ModalManager {
  constructor(dependencies = {}) {
    this._logger = dependencies.logger || this._createDefaultLogger();
    this._modals = new Map();
    this._activeModal = null;
    this._modalStack = [];
    this._backdrop = null;
    
    // Initialize dependencies
    this._configFormManager = dependencies.configFormManager;
    this._accessControlService = dependencies.accessControlService;
    
    this._logger.log('[ModalManager] ModalManager initialized');
  }
  
  /**
   * Initialize the modal manager
   * @param {Object} dependencies - Service dependencies
   * @returns {Promise<Object>} Initialization result
   */
  async initialize(dependencies = {}) {
    try {
      this._logger.log('Initializing ModalManager...');
      
      // Initialize dependencies
      this._configFormManager = dependencies.configFormManager;
      this._accessControlService = dependencies.accessControlService;
      
      // Setup modal templates
      this._setupModalTemplates();
      
      this._logger.log('ModalManager initialized successfully');
      
      return {
        success: true,
        message: 'ModalManager initialized successfully',
        features: [
          'Configuration Modals',
          'Form Dialogs',
          'Confirmation Dialogs',
          'Multi-step Wizards',
          'Modal Stack Management',
          'Keyboard Navigation',
          'Accessibility Support'
        ]
      };
      
    } catch (error) {
      this._logger.error('Failed to initialize ModalManager', error);
      throw error;
    }
  }
  
  /**
   * Create a configuration modal
   * @param {string} categoryKey - Configuration category key
   * @param {Object} categoryData - Category data
   * @param {string} userEmail - User email
   * @returns {Object} Modal configuration
   */
  createConfigModal(categoryKey, categoryData, userEmail) {
    try {
      this._logger.log(`Creating configuration modal for: ${categoryKey}`);
      
      const modalConfig = {
        id: `config-modal-${categoryKey}`,
        type: 'configuration',
        categoryKey: categoryKey,
        categoryData: categoryData,
        userEmail: userEmail,
        title: categoryData.name || categoryKey,
        subtitle: categoryData.description || '',
        icon: categoryData.icon || '⚙️',
        size: 'large',
        closable: true,
        backdrop: true,
        keyboard: true,
        focus: true,
        animation: 'slideInDown',
        content: this._generateModalContent(categoryKey, categoryData),
        actions: this._generateModalActions(categoryKey),
        state: {
          isOpen: false,
          isDirty: false,
          isValid: true,
          errors: {},
          step: 1,
          totalSteps: 1
        },
        handlers: {
          onOpen: () => this._handleModalOpen(categoryKey),
          onClose: () => this._handleModalClose(categoryKey),
          onSave: () => this._handleModalSave(categoryKey),
          onCancel: () => this._handleModalCancel(categoryKey),
          onReset: () => this._handleModalReset(categoryKey),
          onNext: () => this._handleModalNext(categoryKey),
          onPrevious: () => this._handleModalPrevious(categoryKey)
        }
      };
      
      this._modals.set(categoryKey, modalConfig);
      
      this._logger.log(`Configuration modal created for: ${categoryKey}`);
      return modalConfig;
      
    } catch (error) {
      this._logger.error(`Failed to create modal for ${categoryKey}`, error);
      throw error;
    }
  }
  
  /**
   * Generate modal content
   * @param {string} categoryKey - Category key
   * @param {Object} categoryData - Category data
   * @returns {string} HTML content
   */
  _generateModalContent(categoryKey, categoryData) {
    this._logger.log(`_generateModalContent called with categoryKey: ${categoryKey}`);
    const formFields = this._getFormFields(categoryKey);
    this._logger.log(`_generateModalContent got formFields: ${JSON.stringify(formFields)}`);
    
    return `
      <div class="modal-content-wrapper">
        <div class="modal-header">
          <div class="modal-icon">${categoryData.icon || '⚙️'}</div>
          <div class="modal-title-section">
            <h2 class="modal-title">${categoryData.name || categoryKey}</h2>
            <p class="modal-subtitle">${categoryData.description || ''}</p>
          </div>
        </div>
        
        <div class="modal-body">
          <div class="form-container">
            ${this._generateFormHTML(formFields, categoryKey)}
          </div>
          
          <div class="form-status">
            <div class="status-indicators">
              <span class="status-item" id="dirty-status-${categoryKey}">
                <span class="status-icon">●</span>
                <span class="status-text">No changes</span>
              </span>
              <span class="status-item" id="valid-status-${categoryKey}">
                <span class="status-icon">✓</span>
                <span class="status-text">Valid</span>
              </span>
              <span class="status-item" id="save-status-${categoryKey}">
                <span class="status-icon">💾</span>
                <span class="status-text">Auto-save enabled</span>
              </span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="footer-left">
            <button type="button" class="btn btn-secondary" data-action="reset">
              <span class="btn-icon">🔄</span>
              Reset
            </button>
            <button type="button" class="btn btn-secondary" data-action="preview">
              <span class="btn-icon">👁️</span>
              Preview
            </button>
          </div>
          
          <div class="footer-right">
            <button type="button" class="btn btn-secondary" data-action="cancel">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" data-action="save" disabled>
              <span class="btn-icon">💾</span>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Generate form HTML
   * @param {Array} formFields - Form fields configuration
   * @param {string} categoryKey - Category key
   * @returns {string} Form HTML
   */
  _generateFormHTML(formFields, categoryKey) {
    // Debug logging
    this._logger.log(`_generateFormHTML called with categoryKey: ${categoryKey}, formFields: ${JSON.stringify(formFields)}`);
    this._logger.log(`_generateFormHTML formFields type: ${typeof formFields}`);
    this._logger.log(`_generateFormHTML formFields isArray: ${Array.isArray(formFields)}`);
    this._logger.log(`_generateFormHTML formFields === undefined: ${formFields === undefined}`);
    this._logger.log(`_generateFormHTML formFields === null: ${formFields === null}`);
    
    if (!formFields || !Array.isArray(formFields)) {
      this._logger.error(`Invalid formFields for category ${categoryKey}: ${JSON.stringify(formFields)}`);
      return '<div class="form-error">No form fields available for this category.</div>';
    }
    
    this._logger.log(`About to call formFields.map() for ${categoryKey}`);
    this._logger.log(`formFields.length: ${formFields.length}`);
    this._logger.log(`formFields[0]: ${JSON.stringify(formFields[0])}`);
    
    return formFields.map(field => {
      this._logger.log(`Processing field: ${JSON.stringify(field)}`);
      const fieldId = `${categoryKey}-${field.key}`;
      const fieldHTML = this._generateFieldHTML(field, fieldId, categoryKey);
      
      return `
        <div class="form-field" data-field="${field.key}">
          <div class="field-header">
            <label for="${fieldId}" class="field-label">
              ${field.label}
              ${field.required ? '<span class="required">*</span>' : ''}
            </label>
            ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
          </div>
          
          <div class="field-input">
            ${fieldHTML}
          </div>
          
          <div class="field-feedback">
            <div class="field-error" id="error-${fieldId}" style="display: none;"></div>
            <div class="field-warning" id="warning-${fieldId}" style="display: none;"></div>
            <div class="field-help" id="help-${fieldId}" style="display: none;"></div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  /**
   * Generate field HTML based on type
   * @param {Object} field - Field configuration
   * @param {string} fieldId - Field ID
   * @param {string} categoryKey - Category key
   * @returns {string} Field HTML
   */
  _generateFieldHTML(field, fieldId, categoryKey) {
    const baseAttributes = `
      id="${fieldId}"
      name="${field.key}"
      data-category="${categoryKey}"
      data-field="${field.key}"
      ${field.required ? 'required' : ''}
      ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
    `;
    
    switch (field.type) {
      case 'text':
        return `<input type="text" ${baseAttributes} class="form-input" />`;
        
      case 'number':
        return `
          <input type="number" ${baseAttributes} 
                 class="form-input" 
                 min="${field.min || ''}" 
                 max="${field.max || ''}" 
                 step="${field.step || ''}" />
        `;
        
      case 'email':
        return `<input type="email" ${baseAttributes} class="form-input" />`;
        
      case 'url':
        return `<input type="url" ${baseAttributes} class="form-input" />`;
        
      case 'time':
        return `<input type="time" ${baseAttributes} class="form-input" />`;
        
      case 'checkbox':
        return `
          <label class="checkbox-label">
            <input type="checkbox" ${baseAttributes} class="form-checkbox" />
            <span class="checkbox-text">${field.label}</span>
          </label>
        `;
        
      case 'select':
        if (!field.options || !Array.isArray(field.options)) {
          return `<select ${baseAttributes} class="form-select" disabled>
            <option>No options available</option>
          </select>`;
        }
        const options = field.options.map(option => 
          `<option value="${option.value}">${option.label}</option>`
        ).join('');
        return `
          <select ${baseAttributes} class="form-select">
            <option value="">Select an option...</option>
            ${options}
          </select>
        `;
        
      case 'multi-select':
        if (!field.options || !Array.isArray(field.options)) {
          return `<select ${baseAttributes} class="form-select" multiple disabled>
            <option>No options available</option>
          </select>`;
        }
        const multiOptions = field.options.map(option => 
          `<option value="${option.value}">${option.label}</option>`
        ).join('');
        return `
          <select ${baseAttributes} class="form-select" multiple>
            ${multiOptions}
          </select>
        `;
        
      case 'multi-text':
        return `
          <div class="multi-text-container">
            <div class="multi-text-inputs" id="inputs-${fieldId}">
              <input type="text" ${baseAttributes} class="form-input multi-text-item" />
            </div>
            <button type="button" class="btn btn-sm btn-secondary" data-action="add-item">
              <span class="btn-icon">+</span>
              Add Item
            </button>
          </div>
        `;
        
      case 'textarea':
        return `<textarea ${baseAttributes} class="form-textarea" rows="3"></textarea>`;
        
      default:
        return `<input type="text" ${baseAttributes} class="form-input" />`;
    }
  }
  
  /**
   * Generate modal actions
   * @param {string} categoryKey - Category key
   * @returns {Array} Action configuration
   */
  _generateModalActions(categoryKey) {
    return [
      {
        key: 'save',
        label: 'Save Changes',
        type: 'primary',
        icon: '💾',
        enabled: true,
        handler: () => this._handleModalSave(categoryKey)
      },
      {
        key: 'cancel',
        label: 'Cancel',
        type: 'secondary',
        enabled: true,
        handler: () => this._handleModalCancel(categoryKey)
      },
      {
        key: 'reset',
        label: 'Reset',
        type: 'secondary',
        icon: '🔄',
        enabled: true,
        handler: () => this._handleModalReset(categoryKey)
      },
      {
        key: 'preview',
        label: 'Preview',
        type: 'secondary',
        icon: '👁️',
        enabled: true,
        handler: () => this._handleModalPreview(categoryKey)
      }
    ];
  }
  
  /**
   * Get form fields for category
   * @param {string} categoryKey - Category key
   * @returns {Array} Form fields
   */
  _getFormFields(categoryKey) {
    // Debug logging
    this._logger.log(`_getFormFields called with categoryKey: ${categoryKey}`);
    
    // This would typically get fields from ConfigFormManager
    // For now, return mock fields
    const mockFields = {
      monitoring: [
        { 
          key: 'folderIds', 
          type: 'multi-select', 
          label: 'Monitor Folders', 
          required: true,
          options: [
            { value: 'folder1', label: 'Folder 1' },
            { value: 'folder2', label: 'Folder 2' },
            { value: 'folder3', label: 'Folder 3' }
          ]
        },
        { key: 'monitoringInterval', type: 'number', label: 'Monitoring Interval (minutes)', required: true },
        { key: 'maxFilesToProcess', type: 'number', label: 'Max Files to Process', required: true },
        { key: 'fileChangeThreshold', type: 'number', label: 'Change Threshold', required: true }
      ],
      notifications: [
        { key: 'slackWebhookUrl', type: 'url', label: 'Slack Webhook URL', required: true },
        { key: 'defaultChannel', type: 'text', label: 'Default Channel', required: true },
        { 
          key: 'notificationFrequency', 
          type: 'select', 
          label: 'Notification Frequency', 
          required: true,
          options: [
            { value: 'immediate', label: 'Immediate' },
            { value: 'hourly', label: 'Hourly' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' }
          ]
        },
        { key: 'dailySummaryTime', type: 'time', label: 'Daily Summary Time', required: false }
      ],
      triggers: [
        { key: 'monitoringFrequency', type: 'number', label: 'Monitoring Frequency (minutes)', required: true },
        { key: 'dailySummaryTime', type: 'time', label: 'Daily Summary Time', required: true },
        { 
          key: 'weeklySummaryDay', 
          type: 'select', 
          label: 'Weekly Summary Day', 
          required: true,
          options: [
            { value: 'monday', label: 'Monday' },
            { value: 'tuesday', label: 'Tuesday' },
            { value: 'wednesday', label: 'Wednesday' },
            { value: 'thursday', label: 'Thursday' },
            { value: 'friday', label: 'Friday' },
            { value: 'saturday', label: 'Saturday' },
            { value: 'sunday', label: 'Sunday' }
          ]
        },
        { key: 'enableNotifications', type: 'checkbox', label: 'Enable Notifications', required: false }
      ],
      system: [
        { key: 'debugMode', type: 'checkbox', label: 'Debug Mode', required: false },
        { 
          key: 'logLevel', 
          type: 'select', 
          label: 'Log Level', 
          required: true,
          options: [
            { value: 'debug', label: 'Debug' },
            { value: 'info', label: 'Info' },
            { value: 'warn', label: 'Warning' },
            { value: 'error', label: 'Error' }
          ]
        },
        { key: 'maxRetries', type: 'number', label: 'Max Retries', required: true },
        { key: 'timeoutSeconds', type: 'number', label: 'Timeout (seconds)', required: true }
      ],
      users: [
        { key: 'adminEmails', type: 'multi-text', label: 'Admin Emails', required: true },
        { key: 'approvedDomains', type: 'multi-text', label: 'Approved Domains', required: true },
        { key: 'sessionTimeout', type: 'number', label: 'Session Timeout (hours)', required: true },
        { key: 'requireApproval', type: 'checkbox', label: 'Require Manual Approval', required: false }
      ],
      test: [
        { key: 'testField1', type: 'text', label: 'Test Field 1', required: true },
        { key: 'testField2', type: 'number', label: 'Test Field 2', required: false }
      ],
      'dashboard-test': [
        { key: 'dashboardField1', type: 'text', label: 'Dashboard Field 1', required: true },
        { key: 'dashboardField2', type: 'number', label: 'Dashboard Field 2', required: false }
      ]
    };
    
    const result = mockFields[categoryKey] || [];
    this._logger.log(`_getFormFields returning for ${categoryKey}: ${JSON.stringify(result)}`);
    this._logger.log(`_getFormFields result type: ${typeof result}`);
    this._logger.log(`_getFormFields result isArray: ${Array.isArray(result)}`);
    this._logger.log(`_getFormFields result length: ${result?.length}`);
    return result;
  }
  
  /**
   * Setup modal templates
   */
  _setupModalTemplates() {
    // Setup common modal templates
    this._templates = {
      configuration: {
        className: 'modal-configuration',
        animation: 'slideInDown',
        size: 'large'
      },
      confirmation: {
        className: 'modal-confirmation',
        animation: 'fadeIn',
        size: 'small'
      },
      wizard: {
        className: 'modal-wizard',
        animation: 'slideInRight',
        size: 'large'
      }
    };
  }
  
  /**
   * Handle modal open
   * @param {string} categoryKey - Category key
   */
  _handleModalOpen(categoryKey) {
    this._logger.log(`Opening modal for category: ${categoryKey}`);
    
    const modal = this._modals.get(categoryKey);
    if (modal) {
      modal.state.isOpen = true;
      this._activeModal = categoryKey;
      this._modalStack.push(categoryKey);
    }
  }
  
  /**
   * Handle modal close
   * @param {string} categoryKey - Category key
   */
  _handleModalClose(categoryKey) {
    this._logger.log(`Closing modal for category: ${categoryKey}`);
    
    const modal = this._modals.get(categoryKey);
    if (modal) {
      modal.state.isOpen = false;
      
      // Remove from stack
      const index = this._modalStack.indexOf(categoryKey);
      if (index > -1) {
        this._modalStack.splice(index, 1);
      }
      
      // Set new active modal
      this._activeModal = this._modalStack[this._modalStack.length - 1] || null;
    }
  }
  
  /**
   * Handle modal save
   * @param {string} categoryKey - Category key
   * @returns {Promise<Object>} Save result
   */
  async _handleModalSave(categoryKey) {
    try {
      this._logger.log(`Saving modal for category: ${categoryKey}`);
      
      const modal = this._modals.get(categoryKey);
      if (!modal) {
        throw new Error(`Modal not found for category: ${categoryKey}`);
      }
      
      // Validate form
      const validationResult = await this._validateModalForm(categoryKey);
      
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Form validation failed',
          errors: validationResult.errors
        };
      }
      
      // Save data
      const saveResult = await this._saveModalData(categoryKey);
      
      if (saveResult.success) {
        modal.state.isDirty = false;
        modal.state.lastSaved = new Date().toISOString();
      }
      
      return saveResult;
      
    } catch (error) {
      this._logger.error(`Failed to save modal for ${categoryKey}`, error);
      return {
        success: false,
        message: 'Failed to save modal',
        error: error.message
      };
    }
  }
  
  /**
   * Handle modal cancel
   * @param {string} categoryKey - Category key
   */
  _handleModalCancel(categoryKey) {
    this._logger.log(`Cancelling modal for category: ${categoryKey}`);
    
    const modal = this._modals.get(categoryKey);
    if (modal && modal.state.isDirty) {
      // Show confirmation dialog
      this._showConfirmationDialog(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to cancel?',
        () => this._handleModalClose(categoryKey),
        () => {} // Do nothing
      );
    } else {
      this._handleModalClose(categoryKey);
    }
  }
  
  /**
   * Handle modal reset
   * @param {string} categoryKey - Category key
   */
  _handleModalReset(categoryKey) {
    this._logger.log(`Resetting modal for category: ${categoryKey}`);
    
    const modal = this._modals.get(categoryKey);
    if (modal) {
      modal.state.isDirty = false;
      modal.state.errors = {};
      // Reset form fields to original values
    }
  }
  
  /**
   * Handle modal preview
   * @param {string} categoryKey - Category key
   */
  _handleModalPreview(categoryKey) {
    this._logger.log(`Previewing modal for category: ${categoryKey}`);
    
    // Show preview of configuration changes
    this._showPreviewDialog(categoryKey);
  }
  
  /**
   * Validate modal form
   * @param {string} categoryKey - Category key
   * @returns {Promise<Object>} Validation result
   */
  async _validateModalForm(categoryKey) {
    // Implementation for form validation
    return { isValid: true, errors: {} };
  }
  
  /**
   * Save modal data
   * @param {string} categoryKey - Category key
   * @returns {Promise<Object>} Save result
   */
  async _saveModalData(categoryKey) {
    // Implementation for saving data
    return { success: true, message: 'Data saved successfully' };
  }
  
  /**
   * Show confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {Function} onConfirm - Confirm callback
   * @param {Function} onCancel - Cancel callback
   */
  _showConfirmationDialog(title, message, onConfirm, onCancel) {
    // Implementation for confirmation dialog
    this._logger.log(`Showing confirmation dialog: ${title}`);
  }
  
  /**
   * Show preview dialog
   * @param {string} categoryKey - Category key
   */
  _showPreviewDialog(categoryKey) {
    // Implementation for preview dialog
    this._logger.log(`Showing preview dialog for: ${categoryKey}`);
  }
  
  /**
   * Get modal configuration
   * @param {string} categoryKey - Category key
   * @returns {Object} Modal configuration
   */
  getModal(categoryKey) {
    return this._modals.get(categoryKey);
  }
  
  /**
   * Get all modals
   * @returns {Map} All modals
   */
  getAllModals() {
    return this._modals;
  }
  
  /**
   * Create default logger
   * @returns {Object} Logger object
   */
  _createDefaultLogger() {
    return {
      log: (message) => Logger.log(`[ModalManager] ${message}`),
      error: (message, error) => Logger.log(`[ModalManager ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[ModalManager WARNING] ${message}`)
    };
  }
}

// Global functions for Google Apps Script
function createConfigModal(categoryKey, categoryData, userEmail) {
  const modalManager = new ModalManager();
  return modalManager.createConfigModal(categoryKey, categoryData, userEmail);
}

function openConfigModal(categoryKey) {
  const modalManager = new ModalManager();
  return modalManager._handleModalOpen(categoryKey);
}

function closeConfigModal(categoryKey) {
  const modalManager = new ModalManager();
  return modalManager._handleModalClose(categoryKey);
}
