/**
 * TriggerManagerTestSuite.js
 * Test suite for the new TriggerManager and Application trigger integration
 */

/**
 * Test suite for TriggerManager
 * @class TriggerManagerTestSuite
 */
class TriggerManagerTestSuite {
  constructor() {
    this._testResults = [];
    this._application = null;
    this._triggerManager = null;
  }

  /**
   * Run all trigger management tests
   * @returns {Promise<Object>} Test results
   */
  async runAllTests() {
    Logger.log('🚀 Starting TriggerManager Test Suite...');
    
    try {
      // Initialize application
      await this._initializeApplication();
      
      // Run individual tests
      await this._testTriggerManagerInitialization();
      await this._testTriggerStatus();
      await this._testTriggerSetup();
      await this._testTriggerRemoval();
      await this._testApplicationIntegration();
      await this._testSummaryFunctions();
      
      // Generate summary
      const summary = this._generateTestSummary();
      
      Logger.log('✅ TriggerManager Test Suite completed');
      return summary;
      
    } catch (error) {
      Logger.log(`❌ TriggerManager Test Suite failed: ${error.message}`);
      return {
        success: false,
        message: `Test suite failed: ${error.message}`,
        error: error,
        results: this._testResults
      };
    }
  }

  /**
   * Initialize application for testing
   * @private
   */
  async _initializeApplication() {
    try {
      this._application = new Application();
      await this._application.initialize();
      
      this._triggerManager = new TriggerManager({
        application: this._application,
        logger: this._application._dependencies.logger
      });
      
      this._addTestResult('Application Initialization', true, 'Application and TriggerManager initialized successfully');
      
    } catch (error) {
      this._addTestResult('Application Initialization', false, `Failed to initialize: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test TriggerManager initialization
   * @private
   */
  async _testTriggerManagerInitialization() {
    try {
      // Test basic initialization
      const triggerManager = new TriggerManager({
        application: this._application,
        logger: this._application._dependencies.logger
      });
      
      // Verify trigger functions are defined
      const expectedFunctions = ['DAILY_SUMMARY', 'WEEKLY_SUMMARY', 'MONITOR_DRIVE'];
      const actualFunctions = Object.keys(triggerManager._triggerFunctions);
      
      const functionsMatch = expectedFunctions.every(func => actualFunctions.includes(func));
      
      if (functionsMatch) {
        this._addTestResult('TriggerManager Initialization', true, 'TriggerManager initialized with correct function mappings');
      } else {
        this._addTestResult('TriggerManager Initialization', false, 'TriggerManager function mappings do not match expected values');
      }
      
    } catch (error) {
      this._addTestResult('TriggerManager Initialization', false, `Initialization failed: ${error.message}`);
    }
  }

  /**
   * Test trigger status functionality
   * @private
   */
  async _testTriggerStatus() {
    try {
      const status = await this._triggerManager.getTriggerStatus();
      
      // Verify status structure
      const hasRequiredFields = status.hasOwnProperty('valid') && 
                                status.hasOwnProperty('currentTriggers') && 
                                status.hasOwnProperty('configuration');
      
      if (hasRequiredFields) {
        this._addTestResult('Trigger Status', true, `Trigger status retrieved successfully. Found ${status.currentTriggers.length} triggers`);
      } else {
        this._addTestResult('Trigger Status', false, 'Trigger status missing required fields');
      }
      
    } catch (error) {
      this._addTestResult('Trigger Status', false, `Failed to get trigger status: ${error.message}`);
    }
  }

  /**
   * Test trigger setup functionality
   * @private
   */
  async _testTriggerSetup() {
    try {
      // First remove any existing triggers
      await this._triggerManager.removeAllTriggers();
      
      // Test individual trigger setup
      const dailyResult = await this._triggerManager.setupDailySummaryTrigger();
      const weeklyResult = await this._triggerManager.setupWeeklySummaryTrigger();
      const monitorResult = await this._triggerManager.setupMonitorTrigger();
      
      const allSuccessful = dailyResult.success && weeklyResult.success && monitorResult.success;
      
      if (allSuccessful) {
        this._addTestResult('Trigger Setup', true, 'All triggers setup successfully');
      } else {
        const failures = [dailyResult, weeklyResult, monitorResult]
          .filter(result => !result.success)
          .map(result => result.message);
        this._addTestResult('Trigger Setup', false, `Some triggers failed to setup: ${failures.join(', ')}`);
      }
      
    } catch (error) {
      this._addTestResult('Trigger Setup', false, `Trigger setup failed: ${error.message}`);
    }
  }

  /**
   * Test trigger removal functionality
   * @private
   */
  async _testTriggerRemoval() {
    try {
      const removalResult = await this._triggerManager.removeAllTriggers();
      
      if (removalResult.success) {
        this._addTestResult('Trigger Removal', true, `Successfully removed ${removalResult.count} triggers`);
      } else {
        this._addTestResult('Trigger Removal', false, `Failed to remove triggers: ${removalResult.message}`);
      }
      
    } catch (error) {
      this._addTestResult('Trigger Removal', false, `Trigger removal failed: ${error.message}`);
    }
  }

  /**
   * Test Application integration
   * @private
   */
  async _testApplicationIntegration() {
    try {
      // Test Application trigger methods
      const setupResult = await this._application.setupAllTriggers();
      const statusResult = await this._application.getTriggerStatus();
      const removalResult = await this._application.removeAllTriggers();
      
      const allSuccessful = setupResult.success && statusResult.valid && removalResult.success;
      
      if (allSuccessful) {
        this._addTestResult('Application Integration', true, 'Application trigger methods working correctly');
      } else {
        this._addTestResult('Application Integration', false, 'Some Application trigger methods failed');
      }
      
    } catch (error) {
      this._addTestResult('Application Integration', false, `Application integration failed: ${error.message}`);
    }
  }

  /**
   * Test summary functions
   * @private
   */
  async _testSummaryFunctions() {
    try {
      // Test daily summary
      const dailyResult = await this._application.sendDailySummary();
      
      // Test weekly summary
      const weeklyResult = await this._application.sendWeeklySummary();
      
      const bothSuccessful = dailyResult.success && weeklyResult.success;
      
      if (bothSuccessful) {
        this._addTestResult('Summary Functions', true, 'Daily and weekly summaries sent successfully');
      } else {
        const failures = [];
        if (!dailyResult.success) failures.push('Daily summary');
        if (!weeklyResult.success) failures.push('Weekly summary');
        this._addTestResult('Summary Functions', false, `Failed to send: ${failures.join(', ')}`);
      }
      
    } catch (error) {
      this._addTestResult('Summary Functions', false, `Summary functions failed: ${error.message}`);
    }
  }

  /**
   * Add test result
   * @private
   * @param {string} testName - Name of the test
   * @param {boolean} success - Whether the test passed
   * @param {string} message - Test result message
   */
  _addTestResult(testName, success, message) {
    this._testResults.push({
      test: testName,
      success: success,
      message: message,
      timestamp: new Date()
    });
    
    const status = success ? '✅' : '❌';
    Logger.log(`${status} ${testName}: ${message}`);
  }

  /**
   * Generate test summary
   * @private
   * @returns {Object} Test summary
   */
  _generateTestSummary() {
    const totalTests = this._testResults.length;
    const passedTests = this._testResults.filter(result => result.success).length;
    const failedTests = totalTests - passedTests;
    
    const success = failedTests === 0;
    
    return {
      success: success,
      message: success ? 
        `All ${totalTests} trigger management tests passed!` : 
        `${failedTests} out of ${totalTests} tests failed`,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: `${Math.round((passedTests / totalTests) * 100)}%`
      },
      results: this._testResults
    };
  }
}

/**
 * Global test function for trigger management
 * @returns {Promise<Object>} Test results
 */
async function testTriggerManagement() {
  const testSuite = new TriggerManagerTestSuite();
  return await testSuite.runAllTests();
}

/**
 * Quick trigger status check
 * @returns {Promise<Object>} Trigger status
 */
async function checkTriggerStatus() {
  try {
    const app = new Application();
    await app.initialize();
    
    const status = await app.getTriggerStatus();
    
    Logger.log('📊 Trigger Status Report:');
    Logger.log(`Valid: ${status.valid}`);
    Logger.log(`Current Triggers: ${status.currentTriggers.length}`);
    Logger.log(`Errors: ${status.errors.length}`);
    Logger.log(`Warnings: ${status.warnings.length}`);
    
    if (status.errors.length > 0) {
      Logger.log('Errors:');
      status.errors.forEach(error => Logger.log(`  - ${error}`));
    }
    
    if (status.warnings.length > 0) {
      Logger.log('Warnings:');
      status.warnings.forEach(warning => Logger.log(`  - ${warning}`));
    }
    
    return status;
    
  } catch (error) {
    Logger.log(`❌ Failed to check trigger status: ${error.message}`);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Setup triggers using new system
 * @returns {Promise<Object>} Setup results
 */
async function setupTriggersNew() {
  try {
    Logger.log('🔧 Setting up triggers using new Clean Architecture system...');
    
    const app = new Application();
    await app.initialize();
    
    const result = await app.setupAllTriggers();
    
    if (result.success) {
      Logger.log('✅ All triggers setup successfully using new system');
    } else {
      Logger.log(`❌ Trigger setup failed: ${result.message}`);
    }
    
    return result;
    
  } catch (error) {
    Logger.log(`❌ Failed to setup triggers: ${error.message}`);
    return {
      success: false,
      message: `Setup failed: ${error.message}`,
      error: error
    };
  }
}
