/**
 * Debug Functions for User Status Issue
 * Use these to debug the user status problem
 */

/**
 * Debug user creation with status
 */
async function debugUserCreation() {
  Logger.log('🔍 Debugging User Creation with Status...');
  
  try {
    // Initialize AuthService
    const authService = initializeAuthService();
    
    // Test registration data with status
    const testData = {
      firstName: 'Debug',
      lastName: 'User',
      name: 'Debug User',
      email: `debug${new Date().getTime()}@example.com`,
      organization: 'Debug Org',
      jobTitle: 'Debugger',
      reason: 'Testing status debug',
      password: 'DebugTest123!',
      status: 'active'
    };
    
    Logger.log(`Test data status: ${testData.status}`);
    
    // Register user
    const result = await authService.registerUser(testData);
    
    Logger.log(`Registration result: ${JSON.stringify(result)}`);
    
    // Try to authenticate immediately
    const authResult = await authService.authenticateUser(testData.email, 'example.com');
    
    Logger.log(`Authentication result: ${JSON.stringify(authResult)}`);
    
    return { registration: result, authentication: authResult };
    
  } catch (error) {
    Logger.log(`❌ Debug failed: ${error.message}`);
    throw error;
  }
}

/**
 * Debug user repository directly
 */
async function debugUserRepository() {
  Logger.log('🔍 Debugging UserRepository Directly...');
  
  try {
    const props = PropertiesService.getScriptProperties();
    const userDbId = props.getProperty('userDatabaseSpreadsheetId');
    
    const repository = new UserRegistrationRepository({
      spreadsheetId: userDbId,
      sheetName: 'Users',
      logger: createLogger('DebugUserRepo')
    });
    
    await repository.initialize();
    
    // Test data
    const testData = {
      email: `debugrepo${new Date().getTime()}@example.com`,
      name: 'Debug Repo User',
      organization: 'Debug Org',
      role: 'user',
      status: 'active',
      source: 'debug'
    };
    
    Logger.log(`Creating user with status: ${testData.status}`);
    
    const result = await repository.createUser(testData);
    
    Logger.log(`Repository result: ${JSON.stringify(result)}`);
    
    // Check what was actually stored
    const storedUser = await repository.getUserByEmail(testData.email);
    
    Logger.log(`Stored user status: ${storedUser.status}`);
    
    return { created: result, stored: storedUser };
    
  } catch (error) {
    Logger.log(`❌ Repository debug failed: ${error.message}`);
    throw error;
  }
}

/**
 * Debug authentication flow step by step
 */
async function debugAuthFlow() {
  Logger.log('🔍 Debugging Authentication Flow Step by Step...');
  
  try {
    const authService = initializeAuthService();
    
    // Step 1: Register user
    const testData = {
      firstName: 'Flow',
      lastName: 'Debug',
      name: 'Flow Debug User',
      email: `flowdebug${new Date().getTime()}@example.com`,
      organization: 'Flow Debug Org',
      jobTitle: 'Flow Debugger',
      reason: 'Testing auth flow',
      password: 'FlowDebug123!',
      status: 'active'
    };
    
    Logger.log('Step 1: Registering user...');
    const regResult = await authService.registerUser(testData);
    Logger.log(`Registration: ${regResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Step 2: Check user in repository
    Logger.log('Step 2: Checking user in repository...');
    const user = await authService._userRepository.getUserByEmail(testData.email);
    Logger.log(`User status: ${user.status}`);
    Logger.log(`User active: ${user.status === 'active'}`);
    
    // Step 3: Try authentication
    Logger.log('Step 3: Attempting authentication...');
    const authResult = await authService.authenticateUser(testData.email, 'example.com');
    Logger.log(`Authentication: ${authResult.success ? 'SUCCESS' : 'FAILED'}`);
    Logger.log(`Auth message: ${authResult.message}`);
    
    return { registration: regResult, user: user, authentication: authResult };
    
  } catch (error) {
    Logger.log(`❌ Auth flow debug failed: ${error.message}`);
    throw error;
  }
}
