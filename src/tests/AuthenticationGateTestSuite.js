/**
 * AuthenticationGateTestSuite.js
 * Test suite for Phase 5.4: Authentication Gate Integration
 * Tests the authentication gate functionality in WebAppService
 */

class AuthenticationGateTestSuite {
  constructor() {
    this._logger = this._createDefaultLogger();
    this._testResults = [];
    this._startTime = new Date();
  }
  
  /**
   * Create default logger for Google Apps Script environment
   * @returns {Object} Logger instance
   */
  _createDefaultLogger() {
    return {
      log: function(message, context = {}) {
        Logger.log(`[AuthenticationGateTestSuite] ${message}`);
      },
      error: function(message, error, context = {}) {
        Logger.log(`[AuthenticationGateTestSuite ERROR] ${message}: ${error?.message || error}`);
      },
      warn: function(message, context = {}) {
        Logger.log(`[AuthenticationGateTestSuite WARNING] ${message}`);
      }
    };
  }
  
  /**
   * Run all authentication gate tests
   * @returns {Object} Test results
   */
  async runAllTests() {
    try {
      this._logger.log('🚀 Starting Authentication Gate Test Suite...');
      
      // Test authentication gate functionality
      await this._testAuthenticationGate();
      await this._testAuthenticationCheck();
      await this._testAuthenticatedDashboard();
      await this._testLoginPageServing();
      await this._testSessionManagement();
      await this._testErrorHandling();
      await this._testWebAppIntegration();
      await this._testSecurityFeatures();
      
      return this._generateTestReport();
      
    } catch (error) {
      this._logger.error('Test suite failed', error);
      return {
        success: false,
        error: error.message,
        results: this._testResults
      };
    }
  }
  
  /**
   * Test authentication gate functionality
   */
  async _testAuthenticationGate() {
    try {
      this._logger.log('Testing Authentication Gate...');
      
      const webAppService = new WebAppService({
        logger: this._logger
      });
      
      // Test authentication check method
      const authResult = webAppService._checkAuthentication();
      
      if (typeof authResult === 'object' && 
          typeof authResult.isAuthenticated === 'boolean' &&
          typeof authResult.userEmail === 'string' &&
          typeof authResult.reason === 'string') {
        this._addTestResult('Authentication Gate', true, 'Authentication gate working correctly');
      } else {
        throw new Error('Invalid authentication result structure');
      }
      
    } catch (error) {
      this._addTestResult('Authentication Gate', false, error.message);
    }
  }
  
  /**
   * Test authentication check functionality
   */
  async _testAuthenticationCheck() {
    try {
      this._logger.log('Testing Authentication Check...');
      
      const webAppService = new WebAppService({
        logger: this._logger
      });
      
      // Test authentication check
      const authResult = webAppService._checkAuthentication();
      
      // Validate result structure
      const requiredFields = ['isAuthenticated', 'userEmail', 'reason'];
      const hasRequiredFields = requiredFields.every(field => field in authResult);
      
      if (!hasRequiredFields) {
        throw new Error('Missing required fields in authentication result');
      }
      
      // Test session ID generation
      const sessionId = webAppService._generateSessionId();
      if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('session_')) {
        throw new Error('Invalid session ID format');
      }
      
      this._addTestResult('Authentication Check', true, 'Authentication check working correctly');
      
    } catch (error) {
      this._addTestResult('Authentication Check', false, error.message);
    }
  }
  
  /**
   * Test authenticated dashboard serving
   */
  async _testAuthenticatedDashboard() {
    try {
      this._logger.log('Testing Authenticated Dashboard...');
      
      const webAppService = new WebAppService({
        logger: this._logger
      });
      
      // Mock authentication result
      const mockAuthResult = {
        isAuthenticated: true,
        userEmail: 'test@example.com',
        userRole: 'user',
        sessionId: 'session_test_123',
        reason: 'Test authentication'
      };
      
      // Test dashboard serving
      const dashboard = webAppService._serveAuthenticatedDashboard(mockAuthResult);
      
      if (dashboard && typeof dashboard.getContent === 'function') {
        const content = dashboard.getContent();
        // Check for HTML structure and dashboard elements
        if (content.includes('<html') && 
            content.includes('Configuration Dashboard') && 
            content.includes('Slack Notifier')) {
          this._addTestResult('Authenticated Dashboard', true, 'Authenticated dashboard serving correctly');
        } else {
          this._logger.log(`Dashboard content preview: ${content.substring(0, 200)}...`);
          throw new Error('Dashboard content missing expected elements');
        }
      } else {
        throw new Error('Invalid dashboard output');
      }
      
    } catch (error) {
      this._addTestResult('Authenticated Dashboard', false, error.message);
    }
  }
  
  /**
   * Test login page serving
   */
  async _testLoginPageServing() {
    try {
      this._logger.log('Testing Login Page Serving...');
      
      const webAppService = new WebAppService({
        logger: this._logger
      });
      
      // Mock authentication result for unauthenticated user
      const mockAuthResult = {
        isAuthenticated: false,
        userEmail: null,
        reason: 'No active user session',
        redirectTo: 'login'
      };
      
      // Test login page serving
      const loginPage = webAppService._serveLoginPage(mockAuthResult);
      
      if (loginPage && typeof loginPage.getContent === 'function') {
        const content = loginPage.getContent();
        if (content.includes('Login') && content.includes('Slack Notifier')) {
          this._addTestResult('Login Page Serving', true, 'Login page serving correctly');
        } else {
          throw new Error('Login page content missing expected elements');
        }
      } else {
        throw new Error('Invalid login page output');
      }
      
    } catch (error) {
      this._addTestResult('Login Page Serving', false, error.message);
    }
  }
  
  /**
   * Test session management
   */
  async _testSessionManagement() {
    try {
      this._logger.log('Testing Session Management...');
      
      const webAppService = new WebAppService({
        logger: this._logger
      });
      
      // Test session ID generation
      const sessionId1 = webAppService._generateSessionId();
      const sessionId2 = webAppService._generateSessionId();
      
      if (sessionId1 === sessionId2) {
        throw new Error('Session IDs should be unique');
      }
      
      if (!sessionId1.startsWith('session_') || !sessionId2.startsWith('session_')) {
        throw new Error('Session IDs should start with "session_"');
      }
      
      this._addTestResult('Session Management', true, 'Session management working correctly');
      
    } catch (error) {
      this._addTestResult('Session Management', false, error.message);
    }
  }
  
  /**
   * Test error handling
   */
  async _testErrorHandling() {
    try {
      this._logger.log('Testing Error Handling...');
      
      const webAppService = new WebAppService({
        logger: this._logger
      });
      
      // Test error page creation
      const errorPage = webAppService._createErrorPage('Test Error', 'Test error message');
      
      if (errorPage && typeof errorPage.getContent === 'function') {
        const content = errorPage.getContent();
        if (content.includes('Test Error') && content.includes('Test error message')) {
          this._addTestResult('Error Handling', true, 'Error handling working correctly');
        } else {
          throw new Error('Error page content missing expected elements');
        }
      } else {
        throw new Error('Invalid error page output');
      }
      
    } catch (error) {
      this._addTestResult('Error Handling', false, error.message);
    }
  }
  
  /**
   * Test web app integration
   */
  async _testWebAppIntegration() {
    try {
      this._logger.log('Testing Web App Integration...');
      
      const webAppService = new WebAppService({
        logger: this._logger
      });
      
      // Test web app URL generation
      const webAppUrl = webAppService.getWebAppUrl();
      if (!webAppUrl || !webAppUrl.includes('script.google.com')) {
        throw new Error('Invalid web app URL');
      }
      
      // Test deployment info
      const deploymentInfo = webAppService.getDeploymentInfo();
      if (!deploymentInfo.success || !deploymentInfo.endpoints || !deploymentInfo.features) {
        throw new Error('Invalid deployment info');
      }
      
      this._addTestResult('Web App Integration', true, 'Web app integration working correctly');
      
    } catch (error) {
      this._addTestResult('Web App Integration', false, error.message);
    }
  }
  
  /**
   * Test security features
   */
  async _testSecurityFeatures() {
    try {
      this._logger.log('Testing Security Features...');
      
      const webAppService = new WebAppService({
        logger: this._logger
      });
      
      // Test authentication check
      const authResult = webAppService._checkAuthentication();
      
      // Test that authentication check returns proper structure
      if (typeof authResult === 'object' && 
          typeof authResult.isAuthenticated === 'boolean' &&
          typeof authResult.userEmail === 'string' &&
          typeof authResult.reason === 'string') {
        
        // If user is authenticated, check that they have proper session data
        if (authResult.isAuthenticated) {
          if (authResult.userEmail && authResult.userEmail !== '') {
            this._addTestResult('Security Features', true, 'Security features working correctly - authenticated user detected');
          } else {
            throw new Error('Authenticated user missing email');
          }
        } else {
          // If user is not authenticated, check redirect behavior
          if (authResult.redirectTo === 'login') {
            this._addTestResult('Security Features', true, 'Security features working correctly - unauthenticated user redirected');
          } else {
            throw new Error('Unauthenticated user not redirected to login');
          }
        }
      } else {
        throw new Error('Invalid authentication result structure');
      }
      
    } catch (error) {
      this._addTestResult('Security Features', false, error.message);
    }
  }
  
  /**
   * Add test result
   * @param {string} testName - Name of the test
   * @param {boolean} passed - Whether the test passed
   * @param {string} message - Test result message
   */
  _addTestResult(testName, passed, message) {
    this._testResults.push({
      test: testName,
      passed: passed,
      message: message,
      timestamp: new Date()
    });
    
    const status = passed ? '✅' : '❌';
    this._logger.log(`${status} ${testName}: ${message}`);
  }
  
  /**
   * Generate test report
   * @returns {Object} Test report
   */
  _generateTestReport() {
    const endTime = new Date();
    const duration = endTime - this._startTime;
    
    const passedTests = this._testResults.filter(result => result.passed).length;
    const totalTests = this._testResults.length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    this._logger.log('✅ Authentication Gate Test Suite completed');
    this._logger.log(`📊 Authentication Gate Test Results:`);
    this._logger.log(`✅ Passed: ${passedTests}`);
    this._logger.log(`❌ Failed: ${totalTests - passedTests}`);
    this._logger.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
    this._logger.log(`📋 Summary: ${passedTests}/${totalTests} tests passed (${successRate.toFixed(1)}%)`);
    
    if (totalTests - passedTests > 0) {
      this._logger.log(`❌ Failed Tests:`);
      this._testResults
        .filter(result => !result.passed)
        .forEach(result => {
          this._logger.log(`   - ${result.test}: ${result.message}`);
        });
    }
    
    return {
      success: successRate === 100,
      passedTests: passedTests,
      totalTests: totalTests,
      successRate: successRate,
      duration: duration,
      results: this._testResults,
      summary: `${passedTests}/${totalTests} tests passed (${successRate.toFixed(1)}%)`
    };
  }
}

// Global test function
function testAuthenticationGate() {
  const testSuite = new AuthenticationGateTestSuite();
  return testSuite.runAllTests();
}
