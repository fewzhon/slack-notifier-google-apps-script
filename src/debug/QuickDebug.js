/**
 * Quick Debug Functions
 * Use these to debug the authentication issues
 */

/**
 * Debug domain status check
 */
function debugDomainCheck() {
  Logger.log('🔍 Debugging Domain Check...');
  
  const result = checkDomainStatus('iress.com');
  Logger.log(`Domain check result: ${JSON.stringify(result)}`);
  Logger.log(`Result type: ${typeof result}`);
  Logger.log(`Approved value: ${result.approved}`);
  Logger.log(`Approved type: ${typeof result.approved}`);
  Logger.log(`Approved === true: ${result.approved === true}`);
  
  return result;
}

/**
 * Debug AuthService initialization
 */
function debugAuthServiceInit() {
  Logger.log('🔍 Debugging AuthService Initialization...');
  
  try {
    const authService = initializeAuthService();
    Logger.log('✅ AuthService initialized successfully');
    return { success: true, authService: authService };
  } catch (error) {
    Logger.log(`❌ AuthService initialization failed: ${error.message}`);
    Logger.log(`Error stack: ${error.stack}`);
    return { success: false, error: error.message };
  }
}

/**
 * Quick fix for domain check test
 */
function fixDomainCheckTest() {
  Logger.log('🔧 Fixing Domain Check Test...');
  
  const result = checkDomainStatus('iress.com');
  Logger.log(`Domain check result: ${JSON.stringify(result)}`);
  
  // The issue might be that the test is too strict
  const isApproved = result.approved === true || result.approved === 'true';
  Logger.log(`Fixed check result: ${isApproved}`);
  
  return {
    original: result.approved,
    fixed: isApproved,
    success: isApproved
  };
}
