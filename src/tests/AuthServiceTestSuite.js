/**
 * AuthServiceTestSuite.js
 * Test suite for the authentication system
 * 
 * This test suite validates all authentication components including
 * AuthService, DomainValidator, UserRegistrationRepository, SessionManager,
 * and AuditLogger.
 */

/**
 * Authentication Test Suite
 * @class AuthServiceTestSuite
 */
class AuthServiceTestSuite {
  constructor() {
    this._testResults = [];
    this._authService = null;
    this._domainValidator = null;
    this._userRepository = null;
    this._sessionManager = null;
    this._auditLogger = null;
  }

  /**
   * Run all authentication tests
   * @returns {Promise<Object>} Test results
   */
  async runAllTests() {
    Logger.log('🔐 Starting Authentication Test Suite...');
    
    try {
      // Initialize all services
      await this._initializeServices();
      
      // Run individual tests
      await this._testDomainValidator();
      await this._testUserRepository();
      await this._testSessionManager();
      await this._testAuditLogger();
      await this._testAuthService();
      await this._testAuthenticationFlow();
      
      // Generate summary
      const summary = this._generateTestSummary();
      
      Logger.log('✅ Authentication Test Suite completed');
      return summary;
      
    } catch (error) {
      Logger.log(`❌ Authentication Test Suite failed: ${error.message}`);
      return {
        success: false,
        message: `Test suite failed: ${error.message}`,
        error: error,
        results: this._testResults
      };
    }
  }

  /**
   * Initialize all authentication services
   * @private
   */
  async _initializeServices() {
    try {
      // Initialize DomainValidator
      this._domainValidator = new DomainValidator();
      await this._domainValidator.initialize();
      
      // Initialize UserRepository
      this._userRepository = new UserRegistrationRepository();
      await this._userRepository.initialize();
      
      // Initialize SessionManager
      this._sessionManager = new SessionManager();
      await this._sessionManager.initialize();
      
      // Initialize AuditLogger
      this._auditLogger = new AuditLogger();
      await this._auditLogger.initialize();
      
      // Initialize AuthService with dependencies
      this._authService = new AuthService({
        userRepository: this._userRepository,
        domainValidator: this._domainValidator,
        sessionManager: this._sessionManager,
        auditLogger: this._auditLogger
      });
      await this._authService.initialize();
      
      this._addTestResult('Service Initialization', true, 'All authentication services initialized successfully');
      
    } catch (error) {
      this._addTestResult('Service Initialization', false, `Failed to initialize services: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test DomainValidator functionality
   * @private
   */
  async _testDomainValidator() {
    try {
      // Test domain validation
      const approvedDomain = await this._domainValidator.isApprovedDomain('iress.com');
      const unapprovedDomain = await this._domainValidator.isApprovedDomain('external.com');
      
      // Test email domain extraction
      const extractedDomain = this._domainValidator.extractDomainFromEmail('test@iress.com');
      
      // Test domain validation status
      const status = await this._domainValidator.getDomainValidationStatus('test@iress.com');
      
      const allTestsPassed = approvedDomain && !unapprovedDomain && 
                            extractedDomain === 'iress.com' && 
                            status.valid && status.approved;
      
      if (allTestsPassed) {
        this._addTestResult('DomainValidator', true, 'Domain validation working correctly');
      } else {
        this._addTestResult('DomainValidator', false, 'Domain validation tests failed');
      }
      
    } catch (error) {
      this._addTestResult('DomainValidator', false, `DomainValidator test failed: ${error.message}`);
    }
  }

  /**
   * Test UserRepository functionality
   * @private
   */
  async _testUserRepository() {
    try {
      const testEmail = 'test@example.com';
      
      // Test user creation
      const userData = {
        email: testEmail,
        name: 'Test User',
        organization: 'Test Org',
        role: 'user',
        status: 'pending',
        source: 'manual'
      };
      
      const createdUser = await this._userRepository.createUser(userData);
      
      // Test user retrieval
      const retrievedUser = await this._userRepository.getUserByEmail(testEmail);
      
      // Test user update
      const updatedUser = await this._userRepository.updateUser(testEmail, {
        status: 'active',
        lastLogin: new Date()
      });
      
      const allTestsPassed = createdUser && retrievedUser && updatedUser &&
                            createdUser.email === testEmail &&
                            retrievedUser.email === testEmail &&
                            updatedUser.status === 'active';
      
      if (allTestsPassed) {
        this._addTestResult('UserRepository', true, 'User CRUD operations working correctly');
      } else {
        this._addTestResult('UserRepository', false, 'UserRepository tests failed');
      }
      
    } catch (error) {
      this._addTestResult('UserRepository', false, `UserRepository test failed: ${error.message}`);
    }
  }

  /**
   * Test SessionManager functionality
   * @private
   */
  async _testSessionManager() {
    try {
      const testEmail = 'test@example.com';
      const testRole = 'user';
      
      // Test session creation
      const session = await this._sessionManager.createSession(testEmail, testRole);
      
      // Test session validation
      const validatedSession = await this._sessionManager.validateSession(session.sessionId);
      
      // Test session stats
      const stats = await this._sessionManager.getSessionStats();
      
      // Test session invalidation
      const invalidated = await this._sessionManager.invalidateSession(session.sessionId);
      
      const allTestsPassed = session && validatedSession && stats && invalidated &&
                            session.userEmail === testEmail &&
                            validatedSession.userEmail === testEmail &&
                            stats.total >= 1;
      
      if (allTestsPassed) {
        this._addTestResult('SessionManager', true, 'Session management working correctly');
      } else {
        this._addTestResult('SessionManager', false, 'SessionManager tests failed');
      }
      
    } catch (error) {
      this._addTestResult('SessionManager', false, `SessionManager test failed: ${error.message}`);
    }
  }

  /**
   * Test AuditLogger functionality
   * @private
   */
  async _testAuditLogger() {
    try {
      const testEmail = 'test@example.com';
      
      // Test authentication success logging
      await this._auditLogger.logAuthenticationSuccess(testEmail, 'test');
      
      // Test authentication failure logging
      await this._auditLogger.logAuthenticationFailure(testEmail, 'test failure');
      
      // Test user registration logging
      await this._auditLogger.logUserRegistration(testEmail, { name: 'Test User' });
      
      // Test getting user audit logs
      const logs = await this._auditLogger.getUserAuditLogs(testEmail);
      
      const allTestsPassed = logs && logs.length >= 3;
      
      if (allTestsPassed) {
        this._addTestResult('AuditLogger', true, `Audit logging working correctly (${logs.length} logs)`);
      } else {
        this._addTestResult('AuditLogger', false, 'AuditLogger tests failed');
      }
      
    } catch (error) {
      this._addTestResult('AuditLogger', false, `AuditLogger test failed: ${error.message}`);
    }
  }

  /**
   * Test AuthService functionality
   * @private
   */
  async _testAuthService() {
    try {
      const testEmail = 'test@iress.com';
      const testDomain = 'iress.com';
      
      // Test SSO authentication
      const authResult = await this._authService.authenticateUser(testEmail, testDomain);
      
      // Test session validation
      const sessionValidation = await this._authService.validateSession(authResult.session.sessionId);
      
      // Test permission checking
      const hasPermission = await this._authService.checkPermission(testEmail, 'manual_trigger');
      
      // Test logout
      const logoutResult = await this._authService.logoutUser(authResult.session.sessionId);
      
      const allTestsPassed = authResult.success && sessionValidation.valid && 
                            hasPermission && logoutResult.success;
      
      if (allTestsPassed) {
        this._addTestResult('AuthService', true, 'Authentication service working correctly');
      } else {
        this._addTestResult('AuthService', false, 'AuthService tests failed');
      }
      
    } catch (error) {
      this._addTestResult('AuthService', false, `AuthService test failed: ${error.message}`);
    }
  }

  /**
   * Test complete authentication flow
   * @private
   */
  async _testAuthenticationFlow() {
    try {
      // Test external user registration
      const registrationData = {
        email: 'external@example.com',
        name: 'External User',
        organization: 'External Org',
        reason: 'Testing external registration'
      };
      
      const registrationResult = await this._authService.registerUser(registrationData);
      
      // Test manual authentication (should require registration)
      try {
        await this._authService.authenticateUser('external@example.com', 'example.com');
        this._addTestResult('Authentication Flow', false, 'External user authentication should have failed');
      } catch (error) {
        // This is expected - external user should require registration
        this._addTestResult('Authentication Flow', true, 'External user registration and authentication flow working correctly');
      }
      
    } catch (error) {
      this._addTestResult('Authentication Flow', false, `Authentication flow test failed: ${error.message}`);
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
        `All ${totalTests} authentication tests passed!` : 
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
 * Global test functions for authentication
 */

/**
 * Test authentication system (global function)
 * @returns {Promise<Object>} Test results
 */
async function testAuthenticationSystem() {
  const testSuite = new AuthServiceTestSuite();
  return await testSuite.runAllTests();
}

/**
 * Test domain validation (global function)
 * @param {string} email - Email to test
 * @returns {Promise<Object>} Domain validation result
 */
async function testDomainValidation(email) {
  try {
    const validator = new DomainValidator();
    await validator.initialize();
    
    const result = await validator.getDomainValidationStatus(email);
    
    Logger.log(`Domain validation for ${email}:`);
    Logger.log(`Valid: ${result.valid}`);
    Logger.log(`Domain: ${result.domain}`);
    Logger.log(`Approved: ${result.approved}`);
    Logger.log(`Method: ${result.authenticationMethod}`);
    
    return result;
    
  } catch (error) {
    Logger.log(`❌ Domain validation failed: ${error.message}`);
    return {
      valid: false,
      domain: null,
      approved: false,
      message: 'Domain validation failed',
      error: error.message
    };
  }
}

/**
 * Test user registration (global function)
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Registration result
 */
async function testUserRegistration(userData) {
  try {
    const repository = new UserRegistrationRepository();
    await repository.initialize();
    
    const result = await repository.createUser(userData);
    
    Logger.log(`✅ User registration successful: ${result.email}`);
    
    return result;
    
  } catch (error) {
    Logger.log(`❌ User registration failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test session management (global function)
 * @param {string} userEmail - User email
 * @param {string} userRole - User role
 * @returns {Promise<Object>} Session result
 */
async function testSessionManagement(userEmail, userRole) {
  try {
    const sessionManager = new SessionManager();
    await sessionManager.initialize();
    
    // Create session
    const session = await sessionManager.createSession(userEmail, userRole);
    
    // Validate session
    const validation = await sessionManager.validateSession(session.sessionId);
    
    // Get stats
    const stats = await sessionManager.getSessionStats();
    
    Logger.log(`✅ Session management test successful:`);
    Logger.log(`Session ID: ${session.sessionId}`);
    Logger.log(`Valid: ${validation ? 'Yes' : 'No'}`);
    Logger.log(`Active Sessions: ${stats.active}`);
    
    return {
      session: session,
      validation: validation,
      stats: stats
    };
    
  } catch (error) {
    Logger.log(`❌ Session management test failed: ${error.message}`);
    throw error;
  }
}
