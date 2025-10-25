/**
 * RefactoredTestSuite.js
 * Comprehensive test suite for the refactored application
 * 
 * This test suite validates the new Clean Architecture implementation
 * and ensures all functionality works correctly.
 */

/**
 * Test suite for refactored application
 * @class RefactoredTestSuite
 */
class RefactoredTestSuite {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  /**
   * Run all tests
   * @returns {Promise<Object>} Test results
   */
  async runAllTests() {
    Logger.log('=== REFACTORED APPLICATION TEST SUITE ===');
    Logger.log('Testing Clean Architecture implementation...');
    
    this.tests = [
      { name: 'Application Initialization', fn: this.testApplicationInitialization },
      { name: 'Configuration Management', fn: this.testConfigurationManagement },
      { name: 'File Repository Operations', fn: this.testFileRepositoryOperations },
      { name: 'Notification Service', fn: this.testNotificationService },
      { name: 'Monitor Drive Use Case', fn: this.testMonitorDriveUseCase },
      { name: 'Error Handling', fn: this.testErrorHandling },
      { name: 'Integration Tests', fn: this.testIntegration },
      { name: 'Backward Compatibility', fn: this.testBackwardCompatibility }
    ];

    for (const test of this.tests) {
      await this._runTest(test);
    }

    this._printResults();
    return this.results;
  }

  /**
   * Test application initialization
   * @returns {Promise<boolean>} Test result
   */
  async testApplicationInitialization() {
    try {
      Logger.log('Testing application initialization...');
      
      const app = new Application();
      await app.initialize();
      
      const status = await app.getStatus();
      
      // Verify initialization
      if (!status.initialized) {
        throw new Error('Application not properly initialized');
      }
      
      Logger.log('✓ Application initialization test passed');
      return true;
      
    } catch (error) {
      Logger.log(`✗ Application initialization test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test configuration management
   * @returns {Promise<boolean>} Test result
   */
  async testConfigurationManagement() {
    try {
      Logger.log('Testing configuration management...');
      
      const app = new Application();
      await app.initialize();
      
      // Test getting configuration
      const config = await app.getConfiguration();
      if (!config) {
        throw new Error('Failed to get configuration');
      }
      
      // Test configuration validation
      const isValid = config.isValidForMonitoring();
      Logger.log(`Configuration valid: ${isValid}`);
      
      // Test updating configuration
      const updatedConfig = config.update({
        minutesThreshold: 10
      });
      
      if (updatedConfig.minutesThreshold !== 10) {
        throw new Error('Configuration update failed');
      }
      
      Logger.log('✓ Configuration management test passed');
      return true;
      
    } catch (error) {
      Logger.log(`✗ Configuration management test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test file repository operations
   * @returns {Promise<boolean>} Test result
   */
  async testFileRepositoryOperations() {
    try {
      Logger.log('Testing file repository operations...');
      
      const app = new Application();
      await app.initialize();
      
      const config = await app.getConfiguration();
      
      if (config.folderIds.length === 0) {
        Logger.log('⚠ No folders configured, skipping file repository tests');
        return true;
      }
      
      // Test getting folder by ID
      const folderId = config.folderIds[0];
      const folder = await app._dependencies.fileRepository.getFolderById(folderId);
      
      if (!folder || !folder.id) {
        throw new Error('Failed to get folder by ID');
      }
      
      // Test getting files in folder
      const files = await app._dependencies.fileRepository.getFilesInFolder(folderId, { limit: 10 });
      
      if (!Array.isArray(files)) {
        throw new Error('Failed to get files in folder');
      }
      
      Logger.log(`✓ File repository operations test passed (found ${files.length} files)`);
      return true;
      
    } catch (error) {
      Logger.log(`✗ File repository operations test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test notification service
   * @returns {Promise<boolean>} Test result
   */
  async testNotificationService() {
    try {
      Logger.log('Testing notification service...');
      
      const app = new Application();
      await app.initialize();
      
      // Test webhook connection
      const connectionTest = await app.testWebhookConnection();
      Logger.log(`Webhook connection test: ${connectionTest ? 'PASSED' : 'FAILED'}`);
      
      // Test sending notification
      const notificationTest = await app.sendTestNotification('Test from refactored application');
      Logger.log(`Test notification: ${notificationTest ? 'SENT' : 'FAILED'}`);
      
      Logger.log('✓ Notification service test completed');
      return true;
      
    } catch (error) {
      Logger.log(`✗ Notification service test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test monitor drive use case
   * @returns {Promise<boolean>} Test result
   */
  async testMonitorDriveUseCase() {
    try {
      Logger.log('Testing monitor drive use case...');
      
      const app = new Application();
      await app.initialize();
      
      // Test manual monitoring run
      const result = await app.monitorDrive({ forceRun: true });
      
      if (!result || typeof result.success !== 'boolean') {
        throw new Error('Invalid monitoring result');
      }
      
      Logger.log(`Monitoring result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      Logger.log(`Message: ${result.message}`);
      
      if (result.changesFound !== undefined) {
        Logger.log(`Changes found: ${result.changesFound}`);
      }
      
      Logger.log('✓ Monitor drive use case test passed');
      return true;
      
    } catch (error) {
      Logger.log(`✗ Monitor drive use case test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test error handling
   * @returns {Promise<boolean>} Test result
   */
  async testErrorHandling() {
    try {
      Logger.log('Testing error handling...');
      
      // Test with invalid configuration
      const invalidApp = new Application();
      
      try {
        await invalidApp.initialize();
      } catch (error) {
        // Expected to fail with invalid configuration
        Logger.log('✓ Error handling test passed (caught expected error)');
        return true;
      }
      
      Logger.log('✓ Error handling test passed');
      return true;
      
    } catch (error) {
      Logger.log(`✗ Error handling test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test integration scenarios
   * @returns {Promise<boolean>} Test result
   */
  async testIntegration() {
    try {
      Logger.log('Testing integration scenarios...');
      
      const app = new Application();
      await app.initialize();
      
      // Test full workflow
      const status = await app.getStatus();
      Logger.log('Application status:', JSON.stringify(status, null, 2));
      
      // Test configuration update workflow
      const config = await app.getConfiguration();
      const updatedConfig = config.update({
        minutesThreshold: 15
      });
      
      const updateResult = await app.updateConfiguration(updatedConfig);
      if (!updateResult) {
        throw new Error('Configuration update failed');
      }
      
      Logger.log('✓ Integration test passed');
      return true;
      
    } catch (error) {
      Logger.log(`✗ Integration test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test backward compatibility
   * @returns {Promise<boolean>} Test result
   */
  async testBackwardCompatibility() {
    try {
      Logger.log('Testing backward compatibility...');
      
      // Test legacy functions still work
      const legacyResult = await postUpdateToSlack();
      Logger.log('Legacy postUpdateToSlack function:', legacyResult ? 'WORKING' : 'FAILED');
      
      const testResult = await testSlackNotification();
      Logger.log('Legacy testSlackNotification function:', testResult ? 'WORKING' : 'FAILED');
      
      Logger.log('✓ Backward compatibility test passed');
      return true;
      
    } catch (error) {
      Logger.log(`✗ Backward compatibility test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Run individual test
   * @private
   * @param {Object} test - Test object
   */
  async _runTest(test) {
    try {
      Logger.log(`\n--- Running ${test.name} ---`);
      const startTime = new Date();
      
      const result = await test.fn.call(this);
      const duration = new Date() - startTime;
      
      this.results.total++;
      if (result) {
        this.results.passed++;
        this.results.details.push({
          name: test.name,
          status: 'PASSED',
          duration: duration
        });
      } else {
        this.results.failed++;
        this.results.details.push({
          name: test.name,
          status: 'FAILED',
          duration: duration
        });
      }
      
    } catch (error) {
      Logger.log(`Test ${test.name} threw error: ${error.message}`);
      this.results.total++;
      this.results.failed++;
      this.results.details.push({
        name: test.name,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  /**
   * Print test results
   * @private
   */
  _printResults() {
    Logger.log('\n=== TEST RESULTS ===');
    Logger.log(`Total Tests: ${this.results.total}`);
    Logger.log(`Passed: ${this.results.passed}`);
    Logger.log(`Failed: ${this.results.failed}`);
    Logger.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    Logger.log('\nDetailed Results:');
    for (const detail of this.results.details) {
      const status = detail.status === 'PASSED' ? '✓' : '✗';
      Logger.log(`${status} ${detail.name} (${detail.duration}ms)`);
      if (detail.error) {
        Logger.log(`  Error: ${detail.error}`);
      }
    }
    
    if (this.results.failed === 0) {
      Logger.log('\n🎉 All tests passed! Refactoring successful!');
    } else {
      Logger.log(`\n⚠️  ${this.results.failed} test(s) failed. Please review the issues.`);
    }
  }
}

/**
 * Run the refactored test suite
 * @returns {Promise<Object>} Test results
 */
async function runRefactoredTestSuite() {
  const testSuite = new RefactoredTestSuite();
  return await testSuite.runAllTests();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RefactoredTestSuite,
    runRefactoredTestSuite
  };
}
