/**
 * AuthenticationFlowTestSuite.js
 * Test suite for the complete authentication flow from login to dashboard
 */

class AuthenticationFlowTestSuite {
  constructor() {
    this._logger = this._createDefaultLogger();
    this._testResults = [];
  }

  _createDefaultLogger() {
    return {
      log: function(message, context = {}) {
        Logger.log(`[AuthenticationFlowTestSuite] ${message}`);
      },
      error: function(message, error, context = {}) {
        Logger.log(`[AuthenticationFlowTestSuite ERROR] ${message}: ${error ? error.message : ''}`);
      }
    };
  }

  async runAllTests() {
    this._logger.log('🚀 Starting Authentication Flow Test Suite...');
    this._testResults = [];

    try {
      await this._testAuthenticationAPI();
      await this._testLoginPageRedirect();
      await this._testWebAppServiceIntegration();
      await this._testCompleteFlow();

      this._generateTestReport();
      return this._testResults;

    } catch (error) {
      this._logger.error('Test suite failed', error);
      this._addTestResult('Test Suite', false, error.message);
      return this._testResults;
    }
  }

  async _testAuthenticationAPI() {
    try {
      this._logger.log('Testing Authentication API...');
      
      // Test authenticateUser function exists
      if (typeof authenticateUser === 'function') {
        this._addTestResult('Authentication API', true, 'authenticateUser function available');
      } else {
        throw new Error('authenticateUser function not found');
      }

      // Test validateSession function exists
      if (typeof validateSession === 'function') {
        this._addTestResult('Session Validation API', true, 'validateSession function available');
      } else {
        throw new Error('validateSession function not found');
      }

    } catch (error) {
      this._addTestResult('Authentication API', false, error.message);
    }
  }

  async _testLoginPageRedirect() {
    try {
      this._logger.log('Testing Login Page Redirect Logic...');
      
      // Test that login page redirects to root URL (not non-existent file)
      const loginPageContent = this._getLoginPageContent();
      
      if (loginPageContent.includes('window.location.origin + window.location.pathname')) {
        this._addTestResult('Login Page Redirect', true, 'Login page redirects to root URL correctly');
      } else if (loginPageContent.includes('modern-config.html')) {
        this._addTestResult('Login Page Redirect', false, 'Login page still redirects to non-existent modern-config.html');
      } else {
        this._addTestResult('Login Page Redirect', false, 'No redirect logic found in login page');
      }

    } catch (error) {
      this._addTestResult('Login Page Redirect', false, error.message);
    }
  }

  async _testWebAppServiceIntegration() {
    try {
      this._logger.log('Testing WebAppService Integration...');
      
      const webAppService = new WebAppService({
        logger: this._logger
      });

      // Test authentication check
      const authResult = webAppService._checkAuthentication();
      
      if (typeof authResult === 'object' && 
          typeof authResult.isAuthenticated === 'boolean' &&
          typeof authResult.userEmail === 'string') {
        this._addTestResult('WebAppService Integration', true, 'WebAppService authentication check working');
      } else {
        throw new Error('Invalid authentication result structure');
      }

    } catch (error) {
      this._addTestResult('WebAppService Integration', false, error.message);
    }
  }

  async _testCompleteFlow() {
    try {
      this._logger.log('Testing Complete Authentication Flow...');
      
      // Test that doGet serves login page for unauthenticated users
      const webAppService = new WebAppService({
        logger: this._logger
      });

      // Mock unauthenticated user
      const originalSessionGetActiveUser = Session.getActiveUser;
      Session.getActiveUser = function() {
        return {
          getEmail: function() { return ''; }
        };
      };

      try {
        const authResult = webAppService._checkAuthentication();
        
        if (!authResult.isAuthenticated && authResult.redirectTo === 'login') {
          this._addTestResult('Complete Flow', true, 'Unauthenticated users redirected to login');
        } else {
          this._addTestResult('Complete Flow', false, 'Unauthenticated user flow not working correctly');
        }
      } finally {
        // Restore original function
        Session.getActiveUser = originalSessionGetActiveUser;
      }

    } catch (error) {
      this._addTestResult('Complete Flow', false, error.message);
    }
  }

  _getLoginPageContent() {
    try {
      // In Google Apps Script, we can't directly read HTML files from the project
      // Instead, we'll test by creating a template and checking if it evaluates
      const template = HtmlService.createTemplateFromFile('login');
      const htmlOutput = template.evaluate();
      return htmlOutput.getContent();
    } catch (error) {
      this._logger.error('Failed to read login page content', error);
      return '';
    }
  }

  _addTestResult(testName, passed, message) {
    this._testResults.push({
      test: testName,
      passed: passed,
      message: message,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅' : '❌';
    this._logger.log(`${status} ${testName}: ${message}`);
  }

  _generateTestReport() {
    const passed = this._testResults.filter(r => r.passed).length;
    const failed = this._testResults.filter(r => !r.passed).length;
    const total = this._testResults.length;
    const successRate = total > 0 ? (passed / total * 100).toFixed(1) : 0;

    this._logger.log('✅ Authentication Flow Test Suite completed');
    this._logger.log(`📊 Authentication Flow Test Results:`);
    this._logger.log(`✅ Passed: ${passed}`);
    this._logger.log(`❌ Failed: ${failed}`);
    this._logger.log(`📈 Success Rate: ${successRate}%`);
    this._logger.log(`📋 Summary: ${passed}/${total} tests passed (${successRate}%)`);
  }
}

function testAuthenticationFlow() {
  const testSuite = new AuthenticationFlowTestSuite();
  return testSuite.runAllTests();
}
