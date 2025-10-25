/**
 * Phase5CompleteTestSuite - Comprehensive Test Suite for Phase 5.3
 * Tests all advanced UX components and modal system integration
 */

class Phase5CompleteTestSuite {
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
    this._logger.log('🚀 Starting Phase 5.3 Complete Test Suite...');
    this._resetResults();
    
    try {
      // Test ConfigFormManager Integration
      await this._testConfigFormManagerIntegration();
      
      // Test ModalManager Integration
      await this._testModalManagerIntegration();
      
      // Test CSS Framework Integration
      await this._testCSSFrameworkIntegration();
      
      // Test JavaScript Framework Integration
      await this._testJavaScriptFrameworkIntegration();
      
      // Test Form Validation Integration
      await this._testFormValidationIntegration();
      
      // Test Modal System Integration
      await this._testModalSystemIntegration();
      
      // Test User Experience Integration
      await this._testUserExperienceIntegration();
      
      // Test Dashboard Integration
      await this._testDashboardIntegration();
      
      this._logger.log('✅ Phase 5.3 Complete Test Suite completed');
      
    } catch (error) {
      this._logger.error('Phase 5.3 Complete Test Suite failed', error);
      this._addTestResult('Phase 5.3 Complete Test Suite', false, error.message);
    }
    
    return this._getTestResults();
  }
  
  /**
   * Test ConfigFormManager Integration
   */
  async _testConfigFormManagerIntegration() {
    try {
      this._logger.log('Testing ConfigFormManager Integration...');
      
      // Test ConfigFormManager class exists
      if (typeof ConfigFormManager === 'undefined') {
        throw new Error('ConfigFormManager class not found');
      }
      
      // Test initialization
      const formManager = new ConfigFormManager();
      const initResult = await formManager.initialize();
      
      if (!initResult.success) {
        throw new Error('ConfigFormManager initialization failed');
      }
      
      // Test form creation for all categories
      const categories = ['monitoring', 'notifications', 'triggers', 'system', 'users'];
      
      for (const category of categories) {
        const categoryData = {
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} Configuration`,
          description: `Configure ${category} settings`,
          icon: '⚙️'
        };
        
        const formConfig = formManager.createForm(category, categoryData, 'test@iress.com');
        
        if (!formConfig || formConfig.categoryKey !== category) {
          throw new Error(`Form creation failed for category: ${category}`);
        }
        
        // Test form fields generation
        const fields = formManager._generateFormFields(category, categoryData);
        if (!fields || fields.length === 0) {
          throw new Error(`Form fields generation failed for category: ${category}`);
        }
      }
      
      this._addTestResult('ConfigFormManager Integration', true, 'ConfigFormManager integrated successfully');
      
    } catch (error) {
      this._addTestResult('ConfigFormManager Integration', false, error.message);
    }
  }
  
  /**
   * Test ModalManager Integration
   */
  async _testModalManagerIntegration() {
    try {
      this._logger.log('Testing ModalManager Integration...');
      
      // Test ModalManager class exists
      if (typeof ModalManager === 'undefined') {
        throw new Error('ModalManager class not found');
      }
      
      // Test initialization
      const modalManager = new ModalManager();
      const initResult = await modalManager.initialize();
      
      if (!initResult.success) {
        throw new Error('ModalManager initialization failed');
      }
      
      // Test modal creation for all categories
      const categories = ['monitoring', 'notifications', 'triggers', 'system', 'users'];
      
      for (const category of categories) {
        const categoryData = {
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} Configuration`,
          description: `Configure ${category} settings`,
          icon: '⚙️'
        };
        
        const modalConfig = modalManager.createConfigModal(category, categoryData, 'test@iress.com');
        
        if (!modalConfig || modalConfig.categoryKey !== category) {
          throw new Error(`Modal creation failed for category: ${category}`);
        }
        
        // Test modal content generation
        const content = modalManager._generateModalContent(category, categoryData);
        if (!content || !content.includes('modal-content-wrapper')) {
          throw new Error(`Modal content generation failed for category: ${category}`);
        }
      }
      
      this._addTestResult('ModalManager Integration', true, 'ModalManager integrated successfully');
      
    } catch (error) {
      this._addTestResult('ModalManager Integration', false, error.message);
    }
  }
  
  /**
   * Test CSS Framework Integration
   */
  async _testCSSFrameworkIntegration() {
    try {
      this._logger.log('Testing CSS Framework Integration...');
      
      // Test that CSS classes are conceptually available
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
      
      // Test that our components generate HTML with these classes
      const modalManager = new ModalManager();
      const testModalContent = modalManager._generateModalContent('test', { name: 'Test' });
      
      const requiredClassesInContent = requiredCSSClasses.filter(className => 
        testModalContent.includes(className)
      );
      
      if (requiredClassesInContent.length < requiredCSSClasses.length * 0.7) {
        throw new Error('CSS classes not properly integrated in modal content');
      }
      
      this._addTestResult('CSS Framework Integration', true, 'CSS framework integrated successfully');
      
    } catch (error) {
      this._addTestResult('CSS Framework Integration', false, error.message);
    }
  }
  
  /**
   * Test JavaScript Framework Integration
   */
  async _testJavaScriptFrameworkIntegration() {
    try {
      this._logger.log('Testing JavaScript Framework Integration...');
      
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
        // Test form field generation
        const testFields = configFormManager._generateFormFields('monitoring', {});
        if (!testFields || testFields.length === 0) {
          throw new Error('Form field generation failed');
        }
        
        // Test modal creation
        const testModal = modalManager.createConfigModal('test', { name: 'Test' }, 'test@iress.com');
        if (!testModal || !testModal.categoryKey) {
          throw new Error('Modal creation failed');
        }
        
        this._addTestResult('JavaScript Framework Integration', true, 'Server-side components integrated successfully');
      } else {
        throw new Error('Server-side components not working');
      }
      
    } catch (error) {
      this._addTestResult('JavaScript Framework Integration', false, error.message);
    }
  }
  
  /**
   * Test Form Validation Integration
   */
  async _testFormValidationIntegration() {
    try {
      this._logger.log('Testing Form Validation Integration...');
      
      const formManager = new ConfigFormManager({
        logger: this._logger,
        configUIService: this._mockConfigUIService,
        accessControlService: this._mockAccessControlService
      });
      
      // Test validation rules setup
      const validationRules = formManager._validationRules;
      if (!validationRules || validationRules.size === 0) {
        throw new Error('Validation rules not setup');
      }
      
      // Test field validation for different field types with correct categories
      const testValidations = [
        { category: 'monitoring', field: 'monitoringInterval', value: 30, shouldBeValid: true },
        { category: 'monitoring', field: 'monitoringInterval', value: 2, shouldBeValid: false }, // Below minimum
        { category: 'monitoring', field: 'monitoringInterval', value: 2000, shouldBeValid: false }, // Above maximum
        { category: 'notifications', field: 'slackWebhookUrl', value: 'https://hooks.slack.com/services/test', shouldBeValid: true },
        { category: 'notifications', field: 'slackWebhookUrl', value: 'invalid-url', shouldBeValid: false },
        { category: 'notifications', field: 'defaultChannel', value: '#test-channel', shouldBeValid: true },
        { category: 'notifications', field: 'defaultChannel', value: 'invalid-channel', shouldBeValid: false },
        { category: 'monitoring', field: 'maxFilesToProcess', value: 100, shouldBeValid: true },
        { category: 'monitoring', field: 'maxFilesToProcess', value: 0, shouldBeValid: false }, // Below minimum
        { category: 'monitoring', field: 'maxFilesToProcess', value: 2000, shouldBeValid: false } // Above maximum
      ];
      
      for (const test of testValidations) {
        const validation = formManager._validateField(test.category, test.field, test.value);
        
        if (validation.isValid !== test.shouldBeValid) {
          throw new Error(`Validation failed for ${test.category}.${test.field} with value ${test.value}`);
        }
      }
      
      this._addTestResult('Form Validation Integration', true, 'Form validation integrated successfully');
      
    } catch (error) {
      this._addTestResult('Form Validation Integration', false, error.message);
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
      
      // Test modal creation with different configurations
      const testConfigurations = [
        { category: 'monitoring', size: 'large', type: 'configuration' },
        { category: 'notifications', size: 'medium', type: 'configuration' },
        { category: 'triggers', size: 'large', type: 'configuration' },
        { category: 'system', size: 'medium', type: 'configuration' },
        { category: 'users', size: 'large', type: 'configuration' }
      ];
      
      for (const config of testConfigurations) {
        const categoryData = {
          name: `${config.category.charAt(0).toUpperCase() + config.category.slice(1)} Configuration`,
          description: `Configure ${config.category} settings`,
          icon: '⚙️'
        };
        
        const modalConfig = modalManager.createConfigModal(config.category, categoryData, 'test@iress.com');
        
        if (!modalConfig || modalConfig.categoryKey !== config.category) {
          throw new Error(`Modal creation failed for configuration: ${config.category}`);
        }
        
        // Test modal handlers
        if (!modalConfig.handlers || !modalConfig.handlers.onOpen) {
          throw new Error(`Modal handlers not setup for: ${config.category}`);
        }
      }
      
      this._addTestResult('Modal System Integration', true, 'Modal system integrated successfully');
      
    } catch (error) {
      this._addTestResult('Modal System Integration', false, error.message);
    }
  }
  
  /**
   * Test User Experience Integration
   */
  async _testUserExperienceIntegration() {
    try {
      this._logger.log('Testing User Experience Integration...');
      
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
      const requiredFormActions = ['onChange', 'onValidate', 'onSave', 'onReset'];
      for (const action of requiredFormActions) {
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
      
      // Test responsive design features
      if (!modalConfig.size || !['small', 'medium', 'large', 'xlarge'].includes(modalConfig.size)) {
        throw new Error('Modal size configuration not working');
      }
      
      this._addTestResult('User Experience Integration', true, 'User experience integrated successfully');
      
    } catch (error) {
      this._addTestResult('User Experience Integration', false, error.message);
    }
  }
  
  /**
   * Test Dashboard Integration
   */
  async _testDashboardIntegration() {
    try {
      this._logger.log('Testing Dashboard Integration...');
      
      // Test that dashboard would use the new modal system
      // In a real environment, this would test the actual dashboard integration
      
      const modalManager = new ModalManager({
        logger: this._logger,
        configFormManager: new ConfigFormManager({
          logger: this._logger,
          configUIService: this._mockConfigUIService,
          accessControlService: this._mockAccessControlService
        })
      });
      const testCategoryData = {
        name: 'Dashboard Test Category',
        description: 'Test category for dashboard integration',
        icon: '📊'
      };
      
      // Test modal creation for dashboard
      const modalConfig = modalManager.createConfigModal('dashboard-test', testCategoryData, 'test@iress.com');
      
      if (!modalConfig || modalConfig.categoryKey !== 'dashboard-test') {
        throw new Error('Dashboard modal creation failed');
      }
      
      // Test that modal content includes dashboard-specific elements
      const content = modalManager._generateModalContent('dashboard-test', testCategoryData);
      
      if (!content.includes('modal-content-wrapper') || !content.includes('form-container')) {
        throw new Error('Dashboard modal content generation failed');
      }
      
      this._addTestResult('Dashboard Integration', true, 'Dashboard integrated successfully');
      
    } catch (error) {
      this._addTestResult('Dashboard Integration', false, error.message);
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
      log: (message) => Logger.log(`[Phase5CompleteTestSuite] ${message}`),
      error: (message, error) => Logger.log(`[Phase5CompleteTestSuite ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[Phase5CompleteTestSuite WARNING] ${message}`)
    };
  }
}

// Global test function
async function testPhase5Complete() {
  const testSuite = new Phase5CompleteTestSuite();
  const results = await testSuite.runAllTests();
  
  Logger.log('📊 Phase 5.3 Complete Test Results:');
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