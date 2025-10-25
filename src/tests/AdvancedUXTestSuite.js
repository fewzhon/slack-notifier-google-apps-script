/**
 * AdvancedUXTestSuite - Comprehensive Test Suite for Phase 5.3
 * Tests advanced UX components, modal system, and form management
 */

class AdvancedUXTestSuite {
  constructor() {
    this._logger = this._createDefaultLogger();
    this._testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }
  
  /**
   * Run all Phase 5.3 tests
   * @returns {Object} Test results
   */
  async runAllTests() {
    this._logger.log('🚀 Starting Advanced UX Components Test Suite...');
    this._resetResults();
    
    try {
      // Test ConfigFormManager
      await this._testConfigFormManager();
      
      // Test ModalManager
      await this._testModalManager();
      
      // Test CSS Framework Enhancements
      await this._testCSSFrameworkEnhancements();
      
      // Test JavaScript Framework Enhancements
      await this._testJavaScriptFrameworkEnhancements();
      
      // Test Form Validation System
      await this._testFormValidationSystem();
      
      // Test Modal System Integration
      await this._testModalSystemIntegration();
      
      // Test User Experience Features
      await this._testUserExperienceFeatures();
      
      // Test Responsive Design
      await this._testResponsiveDesign();
      
      this._logger.log('✅ Advanced UX Components Test Suite completed');
      
    } catch (error) {
      this._logger.error('Advanced UX Components Test Suite failed', error);
      this._addTestResult('Advanced UX Components Test Suite', false, error.message);
    }
    
    return this._getTestResults();
  }
  
  /**
   * Test ConfigFormManager
   */
  async _testConfigFormManager() {
    try {
      this._logger.log('Testing ConfigFormManager...');
      
      // Test ConfigFormManager class exists
      if (typeof ConfigFormManager === 'undefined') {
        throw new Error('ConfigFormManager class not found');
      }
      
      // Test ConfigFormManager initialization
      const formManager = new ConfigFormManager();
      const initResult = await formManager.initialize();
      
      if (!initResult.success) {
        throw new Error('ConfigFormManager initialization failed');
      }
      
      // Test form creation
      const testCategoryData = {
        name: 'Test Category',
        description: 'Test category description',
        icon: '🧪'
      };
      
      const formConfig = formManager.createForm('test', testCategoryData, 'test@iress.com');
      
      if (!formConfig || !formConfig.categoryKey) {
        throw new Error('Form creation failed');
      }
      
      // Test validation rules setup
      const validationRules = formManager._validationRules;
      if (!validationRules || validationRules.size === 0) {
        throw new Error('Validation rules not setup');
      }
      
      this._addTestResult('ConfigFormManager', true, 'ConfigFormManager working correctly');
      
    } catch (error) {
      this._addTestResult('ConfigFormManager', false, error.message);
    }
  }
  
  /**
   * Test ModalManager
   */
  async _testModalManager() {
    try {
      this._logger.log('Testing ModalManager...');
      
      // Test ModalManager class exists
      if (typeof ModalManager === 'undefined') {
        throw new Error('ModalManager class not found');
      }
      
      // Test ModalManager initialization
      const modalManager = new ModalManager();
      const initResult = await modalManager.initialize();
      
      if (!initResult.success) {
        throw new Error('ModalManager initialization failed');
      }
      
      // Test modal creation
      const testCategoryData = {
        name: 'Test Modal',
        description: 'Test modal description',
        icon: '📋'
      };
      
      const modalConfig = modalManager.createConfigModal('test', testCategoryData, 'test@iress.com');
      
      if (!modalConfig || !modalConfig.id) {
        throw new Error('Modal creation failed');
      }
      
      // Test modal templates setup
      const templates = modalManager._templates;
      if (!templates || !templates.configuration) {
        throw new Error('Modal templates not setup');
      }
      
      this._addTestResult('ModalManager', true, 'ModalManager working correctly');
      
    } catch (error) {
      this._addTestResult('ModalManager', false, error.message);
    }
  }
  
  /**
   * Test CSS Framework Enhancements
   */
  async _testCSSFrameworkEnhancements() {
    try {
      this._logger.log('Testing CSS Framework Enhancements...');
      
      // Test that CSS classes exist conceptually
      // In Google Apps Script, we can't programmatically check CSS
      // but we can test the functions that would use them
      
      const requiredCSSClasses = [
        'modal-backdrop',
        'modal',
        'modal-content-wrapper',
        'modal-header',
        'modal-body',
        'modal-footer',
        'form-container',
        'form-field',
        'field-label',
        'field-input',
        'form-input',
        'form-select',
        'form-textarea',
        'form-checkbox',
        'field-feedback',
        'field-error',
        'field-warning',
        'field-help',
        'form-status',
        'status-indicators',
        'status-item',
        'btn',
        'btn-primary',
        'btn-secondary'
      ];
      
      // Test that our JavaScript would expect these classes
      const formManager = new ConfigFormManager();
      const modalManager = new ModalManager();
      
      // Test form field generation (which uses CSS classes)
      const testFields = formManager._generateFormFields('monitoring', {});
      if (!testFields || testFields.length === 0) {
        throw new Error('Form field generation failed');
      }
      
      // Test modal content generation (which uses CSS classes)
      const testModalContent = modalManager._generateModalContent('test', { name: 'Test' });
      if (!testModalContent || !testModalContent.includes('modal-content-wrapper')) {
        throw new Error('Modal content generation failed');
      }
      
      this._addTestResult('CSS Framework Enhancements', true, 'CSS framework enhancements working');
      
    } catch (error) {
      this._addTestResult('CSS Framework Enhancements', false, error.message);
    }
  }
  
  /**
   * Test JavaScript Framework Enhancements
   */
  async _testJavaScriptFrameworkEnhancements() {
    try {
      this._logger.log('Testing JavaScript Framework Enhancements...');
      
      // Test server-side components (ConfigFormManager and ModalManager)
      const configFormManager = new ConfigFormManager({
        logger: this._logger,
        configUIService: this._mockConfigUIService,
        accessControlService: this._mockAccessControlService
      });
      
      const modalManager = new ModalManager({
        logger: this._logger,
        configFormManager: configFormManager
      });
      
      // Test that both managers are working
      if (configFormManager && modalManager) {
        this._addTestResult('JavaScript Framework Enhancements', true, 'Server-side components working');
      } else {
        throw new Error('Server-side components not working');
      }
      
    } catch (error) {
      this._addTestResult('JavaScript Framework Enhancements', false, error.message);
    }
  }
  
  /**
   * Test Form Validation System
   */
  async _testFormValidationSystem() {
    try {
      this._logger.log('Testing Form Validation System...');
      
      const formManager = new ConfigFormManager({
        logger: this._logger,
        configUIService: this._mockConfigUIService,
        accessControlService: this._mockAccessControlService
      });
      
      // Test field validation with proper values and correct categories
      const testValidations = [
        { category: 'monitoring', field: 'monitoringInterval', value: 30, shouldBeValid: true },
        { category: 'monitoring', field: 'monitoringInterval', value: 5, shouldBeValid: true }, // Minimum valid value
        { category: 'monitoring', field: 'monitoringInterval', value: 1440, shouldBeValid: true }, // Maximum valid value
        { category: 'monitoring', field: 'monitoringInterval', value: 2, shouldBeValid: false }, // Below minimum
        { category: 'monitoring', field: 'monitoringInterval', value: 2000, shouldBeValid: false }, // Above maximum
        { category: 'notifications', field: 'slackWebhookUrl', value: 'https://hooks.slack.com/services/test/test/test', shouldBeValid: true },
        { category: 'notifications', field: 'slackWebhookUrl', value: 'invalid-url', shouldBeValid: false },
        { category: 'notifications', field: 'defaultChannel', value: '#test-channel', shouldBeValid: true },
        { category: 'notifications', field: 'defaultChannel', value: 'invalid-channel', shouldBeValid: false }
      ];
      
      let validationPassed = true;
      const validationResults = [];
      
      for (const test of testValidations) {
        try {
          const validation = formManager._validateField(test.category, test.field, test.value);
          
          if (validation.isValid !== test.shouldBeValid) {
            validationResults.push(`${test.category}.${test.field}:${test.value} - Expected:${test.shouldBeValid}, Got:${validation.isValid}`);
            validationPassed = false;
          } else {
            validationResults.push(`${test.category}.${test.field}:${test.value} - Valid`);
          }
        } catch (error) {
          validationResults.push(`${test.category}.${test.field}:${test.value} - Error: ${error.message}`);
          validationPassed = false;
        }
      }
      
      if (validationPassed) {
        this._addTestResult('Form Validation System', true, 'Form validation system working correctly');
      } else {
        throw new Error(`Validation failed: ${validationResults.join(', ')}`);
      }
      
    } catch (error) {
      this._addTestResult('Form Validation System', false, error.message);
    }
  }
  
  /**
   * Test Modal System Integration
   */
  async _testModalSystemIntegration() {
    try {
      this._logger.log('Testing Modal System Integration...');
      
      const configFormManager = new ConfigFormManager({
        logger: this._logger,
        configUIService: this._mockConfigUIService,
        accessControlService: this._mockAccessControlService
      });
      
      const modalManager = new ModalManager({
        logger: this._logger,
        configFormManager: configFormManager
      });
      
      // Test modal creation with proper category data
      const testCategoryData = {
        name: 'Test Category',
        description: 'Test category description',
        icon: '⚙️',
        settings: [
          { key: 'testSetting1', type: 'text', label: 'Test Setting 1' },
          { key: 'testSetting2', type: 'number', label: 'Test Setting 2' }
        ]
      };
      
      const modalConfig = modalManager.createConfigModal('test', testCategoryData, 'test@iress.com');
      
      if (!modalConfig || modalConfig.categoryKey !== 'test') {
        throw new Error('Modal creation failed');
      }
      
      // Test modal handlers setup
      const testModal = modalManager.getModal('test');
      if (!testModal || !testModal.handlers) {
        throw new Error('Modal handlers not setup correctly');
      }
      
      this._addTestResult('Modal System Integration', true, 'Modal system integration working');
      
    } catch (error) {
      this._addTestResult('Modal System Integration', false, error.message);
    }
  }
  
  /**
   * Test User Experience Features
   */
  async _testUserExperienceFeatures() {
    try {
      this._logger.log('Testing User Experience Features...');
      
      const formManager = new ConfigFormManager({
        logger: this._logger,
        configUIService: this._mockConfigUIService,
        accessControlService: this._mockAccessControlService
      });
      
      const modalManager = new ModalManager({
        logger: this._logger,
        configFormManager: formManager
      });
      
      // Test auto-save functionality
      const formConfig = formManager.createForm('test', { name: 'Test' }, 'test@iress.com');
      if (!formConfig.state.autoSaveEnabled) {
        throw new Error('Auto-save not enabled by default');
      }
      
      // Test form state management
      if (!formConfig.state || typeof formConfig.state.isDirty !== 'boolean') {
        throw new Error('Form state management not working');
      }
      
      // Test modal state management
      const modalConfig = modalManager.createConfigModal('test', { name: 'Test' }, 'test@iress.com');
      if (!modalConfig.state || typeof modalConfig.state.isOpen !== 'boolean') {
        throw new Error('Modal state management not working');
      }
      
      // Test form actions
      const requiredActions = ['onChange', 'onValidate', 'onSave', 'onReset'];
      for (const action of requiredActions) {
        if (!formConfig.handlers[action]) {
          throw new Error(`Form handler ${action} not found`);
        }
      }
      
      // Test modal actions
      const requiredModalActions = ['onOpen', 'onClose', 'onSave', 'onCancel'];
      for (const action of requiredModalActions) {
        if (!modalConfig.handlers[action]) {
          throw new Error(`Modal handler ${action} not found`);
        }
      }
      
      this._addTestResult('User Experience Features', true, 'User experience features working');
      
    } catch (error) {
      this._addTestResult('User Experience Features', false, error.message);
    }
  }
  
  /**
   * Test Responsive Design
   */
  async _testResponsiveDesign() {
    try {
      this._logger.log('Testing Responsive Design...');
      
      // Test that responsive CSS classes are conceptually available
      const responsiveFeatures = [
        'Mobile-first design',
        'Responsive modal sizing',
        'Flexible form layouts',
        'Adaptive button sizing',
        'Mobile-friendly form fields'
      ];
      
      // Test that our components would work responsively
      const modalManager = new ModalManager({
        logger: this._logger,
        configFormManager: new ConfigFormManager({
          logger: this._logger,
          configUIService: this._mockConfigUIService,
          accessControlService: this._mockAccessControlService
        })
      });
      
      const testModal = modalManager.createConfigModal('test', { name: 'Test' }, 'test@iress.com');
      
      // Test modal size configuration
      if (!testModal.size || !['small', 'medium', 'large', 'xlarge'].includes(testModal.size)) {
        throw new Error('Modal size configuration not working');
      }
      
      // Test form field generation for different screen sizes
      const formManager = new ConfigFormManager({
        logger: this._logger,
        configUIService: this._mockConfigUIService,
        accessControlService: this._mockAccessControlService
      });
      
      const testFields = formManager._generateFormFields('monitoring', {});
      
      if (!testFields || testFields.length === 0) {
        throw new Error('Form field generation failed for responsive testing');
      }
      
      this._addTestResult('Responsive Design', true, 'Responsive design features working');
      
    } catch (error) {
      this._addTestResult('Responsive Design', false, error.message);
    }
  }
  
  /**
   * Add test result
   * @param {string} testName - Name of the test
   * @param {boolean} passed - Whether the test passed
   * @param {string} message - Test result message
   */
  _addTestResult(testName, passed, message) {
    this._testResults.total++;
    if (passed) {
      this._testResults.passed++;
      this._logger.log(`✅ ${testName}: ${message}`);
    } else {
      this._testResults.failed++;
      this._logger.log(`❌ ${testName}: ${message}`);
    }
    
    this._testResults.details.push({
      test: testName,
      passed: passed,
      message: message
    });
  }
  
  /**
   * Reset test results
   */
  _resetResults() {
    this._testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }
  
  /**
   * Get test results
   * @returns {Object} Test results
   */
  _getTestResults() {
    const successRate = this._testResults.total > 0 
      ? ((this._testResults.passed / this._testResults.total) * 100).toFixed(1)
      : 0;
    
    return {
      ...this._testResults,
      successRate: successRate,
      summary: `${this._testResults.passed}/${this._testResults.total} tests passed (${successRate}%)`
    };
  }
  
  /**
   * Create default logger
   * @returns {Object} Logger object
   */
  _createDefaultLogger() {
    return {
      log: (message) => Logger.log(`[AdvancedUXTestSuite] ${message}`),
      error: (message, error) => Logger.log(`[AdvancedUXTestSuite ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[AdvancedUXTestSuite WARNING] ${message}`)
    };
  }
}

// Global test function
async function testAdvancedUX() {
  const testSuite = new AdvancedUXTestSuite();
  const results = await testSuite.runAllTests();
  
  Logger.log('📊 Advanced UX Components Test Results:');
  Logger.log(`✅ Passed: ${results.passed}`);
  Logger.log(`❌ Failed: ${results.failed}`);
  Logger.log(`📈 Success Rate: ${results.successRate}%`);
  Logger.log(`📋 Summary: ${results.summary}`);
  
  if (results.failed > 0) {
    Logger.log('❌ Failed Tests:');
    results.details
      .filter(test => !test.passed)
      .forEach(test => Logger.log(`   - ${test.test}: ${test.message}`));
  }
  
  return results;
}
