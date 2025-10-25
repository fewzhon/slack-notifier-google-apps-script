/**
 * Simple Authentication Test
 * Quick test to verify authentication components work
 */

/**
 * Quick authentication test
 * @returns {Promise<Object>} Test results
 */
async function quickAuthTest() {
  Logger.log('🔐 Starting Quick Authentication Test...');
  
  const results = {
    domainValidator: false,
    userRepository: false,
    sessionManager: false,
    authService: false,
    overall: false
  };
  
  try {
    // Test DomainValidator
    Logger.log('Testing DomainValidator...');
    const validator = new DomainValidator();
    await validator.initialize();
    const domainTest = await validator.isApprovedDomain('iress.com');
    results.domainValidator = domainTest;
    Logger.log(`DomainValidator: ${domainTest ? '✅' : '❌'}`);
    
    // Test UserRepository
    Logger.log('Testing UserRepository...');
    const repository = new UserRegistrationRepository();
    await repository.initialize();
    
    // Use unique email for each test run
    const timestamp = new Date().getTime();
    const userTest = await repository.createUser({
      email: `quicktest${timestamp}@example.com`,
      name: 'Quick Test User',
      organization: 'Test Org',
      role: 'user',
      status: 'pending',
      source: 'manual'
    });
    results.userRepository = !!userTest;
    Logger.log(`UserRepository: ${results.userRepository ? '✅' : '❌'}`);
    
    // Test SessionManager
    Logger.log('Testing SessionManager...');
    const sessionManager = new SessionManager();
    await sessionManager.initialize();
    const sessionTest = await sessionManager.createSession('quicktest@example.com', 'user');
    results.sessionManager = !!sessionTest;
    Logger.log(`SessionManager: ${results.sessionManager ? '✅' : '❌'}`);
    
    // Test AuthService
    Logger.log('Testing AuthService...');
    const authService = new AuthService({
      userRepository: repository,
      domainValidator: validator,
      sessionManager: sessionManager,
      auditLogger: new AuditLogger()
    });
    await authService.initialize();
    const authTest = await authService.authenticateUser('test@iress.com', 'iress.com');
    results.authService = authTest.success;
    Logger.log(`AuthService: ${results.authService ? '✅' : '❌'}`);
    
    // Overall result
    results.overall = results.domainValidator && results.userRepository && 
                     results.sessionManager && results.authService;
    
    Logger.log(`🎉 Quick Authentication Test ${results.overall ? 'PASSED' : 'FAILED'}`);
    
    return results;
    
  } catch (error) {
    Logger.log(`❌ Quick Authentication Test failed: ${error.message}`);
    return {
      ...results,
      error: error.message,
      overall: false
    };
  }
}

/**
 * Test individual components
 */
async function testDomainValidator() {
  try {
    const validator = new DomainValidator();
    await validator.initialize();
    
    const result = await validator.getDomainValidationStatus('user@iress.com');
    
    Logger.log('Domain Validation Test:');
    Logger.log(`Email: user@iress.com`);
    Logger.log(`Valid: ${result.valid}`);
    Logger.log(`Domain: ${result.domain}`);
    Logger.log(`Approved: ${result.approved}`);
    Logger.log(`Method: ${result.authenticationMethod}`);
    
    return result;
    
  } catch (error) {
    Logger.log(`❌ Domain validation test failed: ${error.message}`);
    throw error;
  }
}

async function testUserRepository() {
  try {
    const repository = new UserRegistrationRepository();
    await repository.initialize();
    
    // Use a unique email for each test run
    const timestamp = new Date().getTime();
    const userData = {
      email: `test${timestamp}@example.com`,
      name: 'Test User',
      organization: 'Test Org',
      role: 'user',
      status: 'pending',
      source: 'manual'
    };
    
    const result = await repository.createUser(userData);
    
    Logger.log('User Repository Test:');
    Logger.log(`Created user: ${result.email}`);
    Logger.log(`Name: ${result.name}`);
    Logger.log(`Status: ${result.status}`);
    
    return result;
    
  } catch (error) {
    Logger.log(`❌ User repository test failed: ${error.message}`);
    throw error;
  }
}

async function testSessionManager() {
  try {
    const sessionManager = new SessionManager();
    await sessionManager.initialize();
    
    const session = await sessionManager.createSession('test@example.com', 'user');
    const validation = await sessionManager.validateSession(session.sessionId);
    const stats = await sessionManager.getSessionStats();
    
    Logger.log('Session Manager Test:');
    Logger.log(`Session ID: ${session.sessionId}`);
    Logger.log(`Valid: ${validation ? 'Yes' : 'No'}`);
    Logger.log(`Active Sessions: ${stats.active}`);
    
    return {
      session: session,
      validation: validation,
      stats: stats
    };
    
  } catch (error) {
    Logger.log(`❌ Session manager test failed: ${error.message}`);
    throw error;
  }
}
