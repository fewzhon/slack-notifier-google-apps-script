/**
 * DashboardAPITestSuite - Comprehensive Test Suite for DashboardAPI
 * Tests all dashboard API endpoints and data integration
 */

class DashboardAPITestSuite {
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
   * Run all dashboard API tests
   * @returns {Object} Test results
   */
  async runAllTests() {
    this._logger.log('🚀 Starting DashboardAPI Test Suite...');
    this._resetResults();
    
    try {
      // Test DashboardAPI initialization
      await this._testDashboardAPIInitialization();
      
      // Test user info endpoint
      await this._testGetUserInfo();
      
      // Test system status endpoint
      await this._testGetSystemStatus();
      
      // Test configuration categories endpoint
      await this._testGetConfigurationCategories();
      
      // Test recent activity endpoint
      await this._testGetRecentActivity();
      
      // Test authentication endpoint
      await this._testAuthenticateUser();
      
      // Test logout endpoint
      await this._testLogoutUser();
      
      // Test error handling
      await this._testErrorHandling();
      
      this._logger.log('✅ DashboardAPI Test Suite completed');
      
    } catch (error) {
      this._logger.error('DashboardAPI Test Suite failed', error);
      this._addTestResult('DashboardAPI Test Suite', false, error.message);
    }
    
    return this._getTestResults();
  }
  
  /**
   * Test DashboardAPI initialization
   */
  async _testDashboardAPIInitialization() {
    try {
      this._logger.log('Testing DashboardAPI initialization...');
      
      const dashboardAPI = new DashboardAPI();
      const result = await dashboardAPI.initialize();
      
      if (result.success && result.endpoints && result.endpoints.length > 0) {
        this._addTestResult('DashboardAPI Initialization', true, `Initialized with ${result.endpoints.length} endpoints`);
      } else {
        throw new Error('Initialization failed or missing endpoints');
      }
      
    } catch (error) {
      this._addTestResult('DashboardAPI Initialization', false, error.message);
    }
  }
  
  /**
   * Test get user info endpoint
   */
  async _testGetUserInfo() {
    try {
      this._logger.log('Testing getUserInfo endpoint...');
      
      const testEmail = 'test@iress.com';
      const testSessionId = 'test_session_123';
      
      const result = getUserInfo(testEmail, testSessionId);
      
      if (result.success && result.user && result.user.email === testEmail) {
        this._addTestResult('Get User Info', true, `Retrieved user info for ${testEmail}`);
      } else {
        throw new Error('Failed to retrieve user info or invalid response');
      }
      
    } catch (error) {
      this._addTestResult('Get User Info', false, error.message);
    }
  }
  
  /**
   * Test get system status endpoint
   */
  async _testGetSystemStatus() {
    try {
      this._logger.log('Testing getSystemStatus endpoint...');
      
      const testEmail = 'test@iress.com';
      
      const result = getSystemStatus(testEmail);
      
      if (result.success && result.status && result.status.monitoring) {
        this._addTestResult('Get System Status', true, 'Retrieved system status successfully');
      } else {
        throw new Error('Failed to retrieve system status or invalid response');
      }
      
    } catch (error) {
      this._addTestResult('Get System Status', false, error.message);
    }
  }
  
  /**
   * Test get configuration categories endpoint
   */
  async _testGetConfigurationCategories() {
    try {
      this._logger.log('Testing getConfigurationCategories endpoint...');
      
      const testEmail = 'test@iress.com';
      
      const result = getConfigurationCategories(testEmail);
      
      if (result.success && result.categories && Object.keys(result.categories).length > 0) {
        this._addTestResult('Get Configuration Categories', true, `Retrieved ${Object.keys(result.categories).length} categories`);
      } else {
        throw new Error('Failed to retrieve configuration categories or invalid response');
      }
      
    } catch (error) {
      this._addTestResult('Get Configuration Categories', false, error.message);
    }
  }
  
  /**
   * Test get recent activity endpoint
   */
  async _testGetRecentActivity() {
    try {
      this._logger.log('Testing getRecentActivity endpoint...');
      
      const testEmail = 'test@iress.com';
      
      const result = getRecentActivity(testEmail);
      
      if (result.success && result.activities && Array.isArray(result.activities)) {
        this._addTestResult('Get Recent Activity', true, `Retrieved ${result.activities.length} activities`);
      } else {
        throw new Error('Failed to retrieve recent activity or invalid response');
      }
      
    } catch (error) {
      this._addTestResult('Get Recent Activity', false, error.message);
    }
  }
  
  /**
   * Test authenticate user endpoint
   */
  async _testAuthenticateUser() {
    try {
      this._logger.log('Testing authenticateUser endpoint...');
      
      const testEmail = 'test@iress.com';
      const testPassword = 'test_password';
      
      const result = authenticateUser(testEmail, testPassword);
      
      if (result.success && result.user && result.sessionId) {
        this._addTestResult('Authenticate User', true, `Authenticated user ${testEmail}`);
      } else {
        throw new Error('Authentication failed or invalid response');
      }
      
    } catch (error) {
      this._addTestResult('Authenticate User', false, error.message);
    }
  }
  
  /**
   * Test logout user endpoint
   */
  async _testLogoutUser() {
    try {
      this._logger.log('Testing logoutUser endpoint...');
      
      const testSessionId = 'test_session_123';
      
      const result = logoutUser(testSessionId);
      
      if (result.success && result.sessionId === testSessionId) {
        this._addTestResult('Logout User', true, `Logged out session ${testSessionId}`);
      } else {
        throw new Error('Logout failed or invalid response');
      }
      
    } catch (error) {
      this._addTestResult('Logout User', false, error.message);
    }
  }
  
  /**
   * Test error handling
   */
  async _testErrorHandling() {
    try {
      this._logger.log('Testing error handling...');
      
      // Test with invalid email
      const invalidResult = getUserInfo('invalid-email', 'test_session');
      
      if (!invalidResult.success) {
        this._addTestResult('Error Handling', true, 'Properly handled invalid input');
      } else {
        throw new Error('Error handling not working properly');
      }
      
    } catch (error) {
      this._addTestResult('Error Handling', false, error.message);
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
      log: (message) => Logger.log(`[DashboardAPITestSuite] ${message}`),
      error: (message, error) => Logger.log(`[DashboardAPITestSuite ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[DashboardAPITestSuite WARNING] ${message}`)
    };
  }
}

// Global test function
async function testDashboardAPI() {
  const testSuite = new DashboardAPITestSuite();
  const results = await testSuite.runAllTests();
  
  Logger.log('📊 DashboardAPI Test Results:');
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
