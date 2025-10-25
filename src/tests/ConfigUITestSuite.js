/**
 * ConfigUI Test Suite - Comprehensive testing for Configuration UI System
 * Tests ConfigUIService, ConfigAPI, and UI integration
 */

/**
 * Initialize ConfigUI services for testing
 */
function initializeConfigUIServices() {
  Logger.log('🔧 Initializing ConfigUI Services for Testing...');
  
  try {
    // Initialize dependencies
    const logger = {
      log: (message) => Logger.log(`[ConfigUI Test] ${message}`),
      error: (message, error) => Logger.log(`[ConfigUI Test ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[ConfigUI Test WARNING] ${message}`)
    };
    
    // Initialize RBAC services
    const roleManager = new RoleManager({ logger: logger });
    const permissionManager = new PermissionManager({ 
      logger: logger,
      roleManager: roleManager 
    });
    
    const userRepository = new UserRegistrationRepository({
      spreadsheetId: PropertiesService.getScriptProperties().getProperty('userDatabaseSpreadsheetId'),
      sheetName: 'Users',
      logger: logger
    });
    
    const auditLogger = new AuditLogger({
      spreadsheetId: PropertiesService.getScriptProperties().getProperty('auditLogSpreadsheetId'),
      sheetName: 'AuditLog',
      logger: logger
    });
    
    const userRoleService = new UserRoleService({
      logger: logger,
      userRepository: userRepository,
      roleManager: roleManager,
      permissionManager: permissionManager,
      auditLogger: auditLogger
    });
    
    const accessControlService = new AccessControlService({
      logger: logger,
      roleManager: roleManager,
      permissionManager: permissionManager,
      userRoleService: userRoleService,
      userRepository: userRepository,
      auditLogger: auditLogger
    });
    
    // Initialize AuthService
    const domainValidator = new DomainValidator(
      PropertiesService.getScriptProperties().getProperty('approvedDomains'),
      logger
    );
    
    const sessionManager = new SessionManager(
      new ScriptPropertiesRepository(logger),
      logger
    );
    
    const authService = new AuthService(
      domainValidator,
      userRepository,
      sessionManager,
      auditLogger,
      logger
    );
    
    // Initialize Application
    const application = new Application();
    
    // Initialize ConfigUI services
    const configUIService = new ConfigUIService({
      logger: logger,
      accessControlService: accessControlService,
      authService: authService,
      application: application
    });
    
    const configAPI = new ConfigAPI({
      logger: logger,
      configUIService: configUIService,
      accessControlService: accessControlService,
      authService: authService
    });
    
    Logger.log('✅ ConfigUI Services initialized successfully');
    
    return {
      configUIService,
      configAPI,
      accessControlService,
      authService,
      userRepository,
      auditLogger
    };
    
  } catch (error) {
    Logger.log(`❌ ConfigUI Services initialization failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test ConfigUIService functionality
 */
async function testConfigUIService() {
  Logger.log('🧪 Testing ConfigUIService...');
  
  try {
    const { configUIService, userRepository } = initializeConfigUIServices();
    
    // Initialize the service
    await configUIService.initialize();
    
    const testEmail = `configuitest${new Date().getTime()}@example.com`;
    
    // Create a test user
    await userRepository.initialize();
    const testUser = await userRepository.createUser({
      email: testEmail,
      name: 'ConfigUI Test User',
      role: 'admin',
      status: 'active',
      source: 'test'
    });
    
    Logger.log(`Created test user: ${testEmail}`);
    
    // Test 1: Get dashboard data
    const dashboardData = await configUIService.getDashboardData(testEmail);
    Logger.log(`Dashboard data success: ${dashboardData.success}`);
    Logger.log(`User role: ${dashboardData.user?.role}`);
    Logger.log(`Accessible categories: ${Object.keys(dashboardData.categories || {}).length}`);
    
    // Test 2: Get configuration value
    const configValue = await configUIService.getConfigValue(testEmail, 'monitoringInterval');
    Logger.log(`Config value success: ${configValue.success}`);
    Logger.log(`Monitoring interval: ${configValue.value}`);
    
    // Test 3: Update configuration value
    const updateResult = await configUIService.updateConfigValue(
      testEmail, 
      'monitoringInterval', 
      60, 
      'Test update'
    );
    Logger.log(`Config update success: ${updateResult.success}`);
    Logger.log(`Update message: ${updateResult.message}`);
    
    // Test 4: Get accessible categories
    const categories = await configUIService.getAccessibleCategories(testEmail);
    Logger.log(`Categories success: ${categories.success}`);
    Logger.log(`Total categories: ${categories.totalCategories}`);
    
    // Test 5: Reset to defaults
    const resetResult = await configUIService.resetToDefaults(testEmail, 'monitoring', 'Test reset');
    Logger.log(`Reset success: ${resetResult.success}`);
    Logger.log(`Reset settings: ${resetResult.resetSettings?.length}`);
    
    // Clean up test user
    await userRepository.deleteUser(testEmail);
    Logger.log(`Cleaned up test user: ${testEmail}`);
    
    Logger.log('✅ ConfigUIService tests completed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ ConfigUIService test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test ConfigAPI functionality
 */
async function testConfigAPI() {
  Logger.log('🧪 Testing ConfigAPI...');
  
  try {
    const { configAPI, userRepository } = initializeConfigUIServices();
    
    // Initialize the API
    await configAPI.initialize();
    
    const testEmail = `configapitest${new Date().getTime()}@example.com`;
    
    // Create a test user
    await userRepository.initialize();
    const testUser = await userRepository.createUser({
      email: testEmail,
      name: 'ConfigAPI Test User',
      role: 'admin',
      status: 'active',
      source: 'test'
    });
    
    Logger.log(`Created test user: ${testEmail}`);
    
    // Test 1: Get dashboard data
    const dashboardResult = await configAPI.getDashboardData({
      parameter: { userEmail: testEmail }
    });
    Logger.log(`API Dashboard success: ${dashboardResult.success}`);
    Logger.log(`API Dashboard data: ${!!dashboardResult.data}`);
    
    // Test 2: Get configuration value
    const configResult = await configAPI.getConfigValue({
      parameter: { 
        userEmail: testEmail,
        setting: 'monitoringInterval'
      }
    });
    Logger.log(`API Config success: ${configResult.success}`);
    Logger.log(`API Config value: ${configResult.data?.value}`);
    
    // Test 3: Update configuration value
    const updateResult = await configAPI.updateConfigValue({
      parameter: {
        userEmail: testEmail,
        setting: 'monitoringInterval',
        value: '45',
        reason: 'API test update'
      }
    });
    Logger.log(`API Update success: ${updateResult.success}`);
    Logger.log(`API Update message: ${updateResult.data?.message}`);
    
    // Test 4: Get accessible categories
    const categoriesResult = await configAPI.getAccessibleCategories({
      parameter: { userEmail: testEmail }
    });
    Logger.log(`API Categories success: ${categoriesResult.success}`);
    Logger.log(`API Categories count: ${categoriesResult.data?.totalCategories}`);
    
    // Test 5: Test configuration
    const testResult = await configAPI.testConfiguration({
      parameter: {
        userEmail: testEmail,
        setting: 'monitoringInterval'
      }
    });
    Logger.log(`API Test success: ${testResult.success}`);
    Logger.log(`API Test message: ${testResult.data?.message}`);
    
    // Clean up test user
    await userRepository.deleteUser(testEmail);
    Logger.log(`Cleaned up test user: ${testEmail}`);
    
    Logger.log('✅ ConfigAPI tests completed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ ConfigAPI test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test role-based access control in ConfigUI
 */
async function testConfigUIRBAC() {
  Logger.log('🧪 Testing ConfigUI RBAC...');
  
  try {
    const { configUIService, userRepository } = initializeConfigUIServices();
    
    await configUIService.initialize();
    
    // Create test users with different roles
    const testUsers = [
      {
        email: `configowner${new Date().getTime()}@example.com`,
        name: 'Config Owner',
        role: 'owner',
        status: 'active'
      },
      {
        email: `configadmin${new Date().getTime()}@example.com`,
        name: 'Config Admin',
        role: 'admin',
        status: 'active'
      },
      {
        email: `configuser${new Date().getTime()}@example.com`,
        name: 'Config User',
        role: 'user',
        status: 'active'
      },
      {
        email: `configguest${new Date().getTime()}@example.com`,
        name: 'Config Guest',
        role: 'guest',
        status: 'active'
      }
    ];
    
    await userRepository.initialize();
    
    // Create all test users
    for (const user of testUsers) {
      await userRepository.createUser({ ...user, source: 'test' });
      Logger.log(`Created ${user.role} user: ${user.email}`);
    }
    
    // Test access for each role
    for (const user of testUsers) {
      Logger.log(`\n--- Testing ${user.role} access ---`);
      
      // Test dashboard access
      const dashboardData = await configUIService.getDashboardData(user.email);
      Logger.log(`${user.role} dashboard access: ${dashboardData.success}`);
      Logger.log(`${user.role} accessible categories: ${Object.keys(dashboardData.categories || {}).length}`);
      
      // Test system config access (admin only)
      const systemAccess = await configUIService.getConfigValue(user.email, 'debugMode');
      Logger.log(`${user.role} system config access: ${systemAccess.success}`);
      
      // Test config update access
      const updateAccess = await configUIService.updateConfigValue(
        user.email, 
        'monitoringInterval', 
        30, 
        `${user.role} test`
      );
      Logger.log(`${user.role} config update access: ${updateAccess.success}`);
      
      // Test reset access (admin only)
      const resetAccess = await configUIService.resetToDefaults(user.email, null, `${user.role} test`);
      Logger.log(`${user.role} reset access: ${resetAccess.success}`);
    }
    
    // Clean up test users
    for (const user of testUsers) {
      await userRepository.deleteUser(user.email);
      Logger.log(`Cleaned up ${user.role} user: ${user.email}`);
    }
    
    Logger.log('✅ ConfigUI RBAC tests completed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ ConfigUI RBAC test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test configuration validation
 */
async function testConfigValidation() {
  Logger.log('🧪 Testing Configuration Validation...');
  
  try {
    const { configUIService, userRepository } = initializeConfigUIServices();
    
    await configUIService.initialize();
    
    const testEmail = `configvalidationtest${new Date().getTime()}@example.com`;
    
    // Create a test user
    await userRepository.initialize();
    const testUser = await userRepository.createUser({
      email: testEmail,
      name: 'Config Validation Test User',
      role: 'admin',
      status: 'active',
      source: 'test'
    });
    
    Logger.log(`Created test user: ${testEmail}`);
    
    // Test valid configurations
    const validTests = [
      { setting: 'monitoringInterval', value: 30, expected: true },
      { setting: 'maxFilesToProcess', value: 100, expected: true },
      { setting: 'dailySummaryTime', value: '07:00', expected: true },
      { setting: 'defaultChannel', value: '#test-channel', expected: true }
    ];
    
    for (const test of validTests) {
      const result = await configUIService.updateConfigValue(
        testEmail, 
        test.setting, 
        test.value, 
        'Validation test'
      );
      Logger.log(`Valid ${test.setting}: ${result.success} (expected: ${test.expected})`);
    }
    
    // Test invalid configurations
    const invalidTests = [
      { setting: 'monitoringInterval', value: 2, expected: false }, // Too low
      { setting: 'monitoringInterval', value: 2000, expected: false }, // Too high
      { setting: 'maxFilesToProcess', value: 0, expected: false }, // Too low
      { setting: 'maxFilesToProcess', value: 2000, expected: false }, // Too high
      { setting: 'dailySummaryTime', value: '25:00', expected: false }, // Invalid time
      { setting: 'defaultChannel', value: '', expected: false } // Empty
    ];
    
    for (const test of invalidTests) {
      const result = await configUIService.updateConfigValue(
        testEmail, 
        test.setting, 
        test.value, 
        'Invalid validation test'
      );
      Logger.log(`Invalid ${test.setting}: ${result.success} (expected: ${test.expected})`);
    }
    
    // Clean up test user
    await userRepository.deleteUser(testEmail);
    Logger.log(`Cleaned up test user: ${testEmail}`);
    
    Logger.log('✅ Configuration validation tests completed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ Configuration validation test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test UI page serving
 */
async function testConfigUIPages() {
  Logger.log('🧪 Testing ConfigUI Pages...');
  
  try {
    const { configAPI } = initializeConfigUIServices();
    
    await configAPI.initialize();
    
    // Test page serving
    const pages = ['dashboard', 'monitoring', 'notifications', 'triggers', 'system', 'users'];
    
    for (const page of pages) {
      try {
        const htmlOutput = configAPI.servePage({ parameter: { page: page } });
        Logger.log(`Page ${page}: ${htmlOutput ? 'Served successfully' : 'Failed to serve'}`);
      } catch (error) {
        Logger.log(`Page ${page}: Error - ${error.message}`);
      }
    }
    
    // Test default page
    const defaultPage = configAPI.servePage({ parameter: {} });
    Logger.log(`Default page: ${defaultPage ? 'Served successfully' : 'Failed to serve'}`);
    
    Logger.log('✅ ConfigUI Pages tests completed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ ConfigUI Pages test failed: ${error.message}`);
    return false;
  }
}

/**
 * Run complete ConfigUI test suite
 */
async function runConfigUITestSuite() {
  Logger.log('🚀 Starting ConfigUI Test Suite...');
  
  const results = {
    configUIService: false,
    configAPI: false,
    configUIRBAC: false,
    configValidation: false,
    configUIPages: false
  };
  
  try {
    // Test individual components
    results.configUIService = await testConfigUIService();
    results.configAPI = await testConfigAPI();
    results.configUIRBAC = await testConfigUIRBAC();
    results.configValidation = await testConfigValidation();
    results.configUIPages = await testConfigUIPages();
    
    // Calculate overall success
    const passedTests = Object.values(results).filter(result => result === true).length;
    const totalTests = Object.keys(results).length;
    const overallSuccess = passedTests === totalTests;
    
    Logger.log('📊 ConfigUI Test Suite Results:');
    Logger.log(`ConfigUIService: ${results.configUIService ? '✅' : '❌'}`);
    Logger.log(`ConfigAPI: ${results.configAPI ? '✅' : '❌'}`);
    Logger.log(`ConfigUI RBAC: ${results.configUIRBAC ? '✅' : '❌'}`);
    Logger.log(`Config Validation: ${results.configValidation ? '✅' : '❌'}`);
    Logger.log(`ConfigUI Pages: ${results.configUIPages ? '✅' : '❌'}`);
    Logger.log(`Overall: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'} (${passedTests}/${totalTests})`);
    
    if (overallSuccess) {
      Logger.log('🎉 ConfigUI Test Suite completed successfully!');
    } else {
      Logger.log('⚠️ Some ConfigUI tests failed. Check logs for details.');
    }
    
    return {
      success: overallSuccess,
      results: results,
      passed: passedTests,
      total: totalTests
    };
    
  } catch (error) {
    Logger.log(`❌ ConfigUI Test Suite failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      results: results
    };
  }
}
