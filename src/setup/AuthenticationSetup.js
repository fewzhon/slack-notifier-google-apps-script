/**
 * Authentication Setup Helper
 * Use this to quickly set up the authentication system
 */

/**
 * Quick setup for authentication system
 * @param {string} userSpreadsheetId - ID of the user database spreadsheet
 * @param {string} auditSpreadsheetId - ID of the audit log spreadsheet
 * @param {string} approvedDomains - Comma-separated list of approved domains
 * @param {string} adminEmails - Comma-separated list of admin emails (optional)
 * @returns {Object} Setup result
 */
function setupAuthenticationSystem(userSpreadsheetId, auditSpreadsheetId, approvedDomains, adminEmails = '') {
  try {
    Logger.log('🔧 Setting up Authentication System...');
    
    const props = PropertiesService.getScriptProperties();
    
    // Set required properties
    props.setProperty('userDatabaseSpreadsheetId', userSpreadsheetId);
    props.setProperty('auditLogSpreadsheetId', auditSpreadsheetId);
    props.setProperty('approvedDomains', approvedDomains);
    
    if (adminEmails) {
      props.setProperty('adminEmails', adminEmails);
    }
    
    Logger.log('✅ Script Properties configured');
    
    // Test the setup
    const testResult = testAuthenticationSetup();
    
    if (testResult.success) {
      Logger.log('🎉 Authentication system setup complete!');
      return {
        success: true,
        message: 'Authentication system configured successfully',
        properties: {
          userDatabaseSpreadsheetId: userSpreadsheetId,
          auditLogSpreadsheetId: auditSpreadsheetId,
          approvedDomains: approvedDomains,
          adminEmails: adminEmails
        }
      };
    } else {
      Logger.log('❌ Authentication system setup failed');
      return {
        success: false,
        message: 'Setup completed but tests failed',
        error: testResult.error
      };
    }
    
  } catch (error) {
    Logger.log(`❌ Setup failed: ${error.message}`);
    return {
      success: false,
      message: 'Setup failed',
      error: error.message
    };
  }
}

/**
 * Test authentication setup
 * @returns {Object} Test result
 */
function testAuthenticationSetup() {
  try {
    Logger.log('🧪 Testing Authentication Setup...');
    
    // Test 1: Check Script Properties
    const props = PropertiesService.getScriptProperties();
    const userDbId = props.getProperty('userDatabaseSpreadsheetId');
    const auditLogId = props.getProperty('auditLogSpreadsheetId');
    const approvedDomains = props.getProperty('approvedDomains');
    
    if (!userDbId || !auditLogId) {
      throw new Error('Missing required Script Properties: userDatabaseSpreadsheetId and auditLogSpreadsheetId');
    }
    
    Logger.log('✅ Script Properties: OK');
    
    // Test 2: Check Spreadsheet Access
    try {
      const userSpreadsheet = SpreadsheetApp.openById(userDbId);
      Logger.log('✅ User Database Spreadsheet: Accessible');
    } catch (error) {
      throw new Error(`User Database Spreadsheet not accessible: ${error.message}`);
    }
    
    try {
      const auditSpreadsheet = SpreadsheetApp.openById(auditLogId);
      Logger.log('✅ Audit Log Spreadsheet: Accessible');
    } catch (error) {
      throw new Error(`Audit Log Spreadsheet not accessible: ${error.message}`);
    }
    
    // Test 3: Initialize Services
    try {
      const authService = initializeAuthService();
      Logger.log('✅ AuthService: Initialized');
    } catch (error) {
      throw new Error(`AuthService initialization failed: ${error.message}`);
    }
    
    Logger.log('🎉 Authentication setup test passed!');
    
    return {
      success: true,
      message: 'All authentication components working correctly'
    };
    
  } catch (error) {
    Logger.log(`❌ Authentication setup test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create required spreadsheets (if they don't exist)
 * @returns {Object} Creation result
 */
function createAuthenticationSpreadsheets() {
  try {
    Logger.log('📊 Creating Authentication Spreadsheets...');
    
    // Create User Database Spreadsheet
    const userSpreadsheet = SpreadsheetApp.create('GDrive-Slack-Users');
    const userSheet = userSpreadsheet.getActiveSheet();
    userSheet.setName('Users');
    
    // Set up headers
    const userHeaders = ['id', 'email', 'name', 'password', 'role', 'status', 'registrationDate', 'lastLoginDate', 'organization', 'approvedBy', 'approvalDate'];
    userSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
    userSheet.setFrozenRows(1);
    
    Logger.log(`✅ User Database Spreadsheet created: ${userSpreadsheet.getId()}`);
    
    // Create Audit Log Spreadsheet
    const auditSpreadsheet = SpreadsheetApp.create('GDrive-Slack-AuditLog');
    const auditSheet = auditSpreadsheet.getActiveSheet();
    auditSheet.setName('AuditLog');
    
    // Set up headers
    const auditHeaders = ['timestamp', 'userEmail', 'eventType', 'details', 'ipAddress', 'sessionId'];
    auditSheet.getRange(1, 1, 1, auditHeaders.length).setValues([auditHeaders]);
    auditSheet.setFrozenRows(1);
    
    Logger.log(`✅ Audit Log Spreadsheet created: ${auditSpreadsheet.getId()}`);
    
    // Set Script Properties
    const props = PropertiesService.getScriptProperties();
    props.setProperty('userDatabaseSpreadsheetId', userSpreadsheet.getId());
    props.setProperty('auditLogSpreadsheetId', auditSpreadsheet.getId());
    props.setProperty('approvedDomains', 'iress.com,iress.au');
    
    Logger.log('✅ Script Properties configured');
    
    return {
      success: true,
      userSpreadsheetId: userSpreadsheet.getId(),
      auditSpreadsheetId: auditSpreadsheet.getId(),
      message: 'Spreadsheets created and configured successfully'
    };
    
  } catch (error) {
    Logger.log(`❌ Spreadsheet creation failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check current authentication configuration
 * @returns {Object} Configuration status
 */
function checkAuthenticationConfig() {
  try {
    Logger.log('🔍 Checking Authentication Configuration...');
    
    const props = PropertiesService.getScriptProperties();
    
    const config = {
      userDatabaseSpreadsheetId: props.getProperty('userDatabaseSpreadsheetId'),
      auditLogSpreadsheetId: props.getProperty('auditLogSpreadsheetId'),
      approvedDomains: props.getProperty('approvedDomains'),
      adminEmails: props.getProperty('adminEmails')
    };
    
    Logger.log('Current Configuration:');
    Logger.log(`User DB ID: ${config.userDatabaseSpreadsheetId || 'NOT SET'}`);
    Logger.log(`Audit Log ID: ${config.auditLogSpreadsheetId || 'NOT SET'}`);
    Logger.log(`Approved Domains: ${config.approvedDomains || 'NOT SET'}`);
    Logger.log(`Admin Emails: ${config.adminEmails || 'NOT SET'}`);
    
    const missing = [];
    if (!config.userDatabaseSpreadsheetId) missing.push('userDatabaseSpreadsheetId');
    if (!config.auditLogSpreadsheetId) missing.push('auditLogSpreadsheetId');
    if (!config.approvedDomains) missing.push('approvedDomains');
    
    if (missing.length > 0) {
      Logger.log(`❌ Missing required properties: ${missing.join(', ')}`);
      return {
        success: false,
        missing: missing,
        config: config
      };
    }
    
    Logger.log('✅ All required properties are set');
    
    return {
      success: true,
      config: config
    };
    
  } catch (error) {
    Logger.log(`❌ Configuration check failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Quick setup with default values
 * @returns {Object} Setup result
 */
function quickSetupAuthentication() {
  try {
    Logger.log('🚀 Quick Authentication Setup...');
    
    // Check if already configured
    const configCheck = checkAuthenticationConfig();
    if (configCheck.success) {
      Logger.log('✅ Authentication already configured');
      return {
        success: true,
        message: 'Authentication system already configured',
        config: configCheck.config
      };
    }
    
    // Create spreadsheets and configure
    const createResult = createAuthenticationSpreadsheets();
    
    if (createResult.success) {
      Logger.log('🎉 Quick setup complete!');
      return createResult;
    } else {
      throw new Error(createResult.error);
    }
    
  } catch (error) {
    Logger.log(`❌ Quick setup failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}
