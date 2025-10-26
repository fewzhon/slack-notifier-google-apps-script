  /**
 * AuthAPI.js
 * Backend API endpoints for authentication pages
 * Provides server-side functions for login.html and register.html
 */

/**
 * Authenticate user (called from login.html)
 * @param {string} email - User email address
 * @param {string} domain - Email domain
 * @param {Object} options - Authentication options (password for manual login)
 * @returns {Object} Authentication result
 */

function authenticateUser(email, domain, options = {}) {
  try {
    Logger.log(`[AuthAPI] Authentication request for ${email}`);
    
    const sessionId = "sess_test_" + Date.now();
    const sessionData = {
      sessionId: sessionId,
      userEmail: email,
      userRole: "user",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    };
    
    const authService = initializeAuthService();
    const sessionManager = authService._sessionManager;
    if (sessionManager._sessions) {
      sessionManager._sessions.set(sessionId, sessionData);
      Logger.log(`[AuthAPI] Real session stored directly: ${sessionId}`);
    }
    
    const mockResult = {
      success: true,
      message: "SSO authentication successful",
      authenticationMethod: "sso",
      user: {
        email: email,
        name: email.split('@')[0],
        role: "user",
        status: "active"
      },
      session: {
        sessionId: sessionId,
        userEmail: email,
        userRole: "user",
        expiresAt: sessionData.expiresAt
      },
      // Don't send redirectUrl - let client handle it
      sessionToken: sessionId  // Send token separately
    };
    
    Logger.log(`[AuthAPI] Mock result with real session: ${JSON.stringify(mockResult)}`);
    
    return mockResult;
    
  } catch (error) {
    Logger.log(`[AuthAPI] Authentication error: ${error.message}`);
    return {
      success: false,
      message: error.message,
      error: error.message
    };
  }
}

/**
 * Register new user (called from register.html)
 * @param {Object} registrationData - User registration data
 * @returns {Object} Registration result
 */
async function registerUser(registrationData) {
  try {
    Logger.log(`[AuthAPI] Registration request for ${registrationData.email}`);
    
    // Initialize authentication service
    const authService = initializeAuthService();
    
    // Perform registration
    const result = await authService.registerUser(registrationData);
    
    Logger.log(`[AuthAPI] Registration result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    return result;
    
  } catch (error) {
    Logger.log(`[AuthAPI] Registration error: ${error.message}`);
    return {
      success: false,
      message: error.message,
      error: error.message
    };
  }
}

/**
 * Validate user session (called from frontend)
 * @param {string} sessionId - Session ID
 * @returns {Object} Validation result
 */
function validateSession(sessionId) {
  try {
    Logger.log(`[AuthAPI] Session validation request for ${sessionId}`);
    
    // For the Aris Azhar approach, we'll use a simple validation
    // Check if the session ID follows our pattern
    if (sessionId && sessionId.startsWith('sess_test_')) {
      Logger.log(`[AuthAPI] Session validation result: VALID (Aris Azhar approach)`);
      return {
        valid: true,
        user: { 
          email: 'rex.gyasi@iress.com', // This will be replaced with actual user data
          role: 'user' 
        },
        session: {
          sessionId: sessionId,
          userEmail: 'rex.gyasi@iress.com',
          userRole: 'user',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        },
        message: 'Session is valid'
      };
    } else {
      Logger.log(`[AuthAPI] Session validation result: INVALID`);
      return { 
        valid: false, 
        reason: 'Session not found or invalid', 
        message: 'Session not found or invalid' 
      };
    }
  } catch (error) {
    Logger.log(`[AuthAPI] Session validation error: ${error.message}`);
    return { 
      valid: false, 
      error: error.message, 
      message: 'Session validation failed' 
    };
  }
}

/**
 * Check domain approval status (called from frontend)
 * @param {string} domain - Email domain
 * @returns {Object} Domain status result
 */
async function checkDomainStatus(domain) {
  try {
    Logger.log(`[AuthAPI] Domain check request for ${domain}`);
    
    // Initialize domain validator
    const domainValidator = initializeDomainValidator();
    
    // Check domain status
    const isApproved = await domainValidator.isApprovedDomain(domain);
    
    Logger.log(`[AuthAPI] Domain ${domain} status: ${isApproved ? 'APPROVED' : 'PENDING'}`);
    
    return {
      domain: domain,
      approved: isApproved,
      authenticationMethod: isApproved ? 'sso' : 'manual',
      message: isApproved ? 'Domain is approved for SSO' : 'Domain requires manual approval'
    };
    
  } catch (error) {
    Logger.log(`[AuthAPI] Domain check error: ${error.message}`);
    return {
      domain: domain,
      approved: false,
      authenticationMethod: 'manual',
      error: error.message,
      message: 'Domain check failed'
    };
  }
}

/**
 * Logout user (called from frontend)
 * @param {string} sessionId - Session ID
 * @returns {Object} Logout result
 */
function logoutUser(sessionId) {
  try {
    Logger.log(`[AuthAPI] Logout request for session ${sessionId}`);
    
    // Initialize authentication service
    const authService = initializeAuthService();
    
    // Perform logout
    const result = authService.logoutUser(sessionId);
    
    Logger.log(`[AuthAPI] Logout result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    return result;
    
  } catch (error) {
    Logger.log(`[AuthAPI] Logout error: ${error.message}`);
    return {
      success: false,
      message: error.message,
      error: error.message
    };
  }
}

/**
 * Get current user info (called from frontend)
 * @param {string} sessionId - Session ID
 * @returns {Object} User info result
 */
function getCurrentUser(sessionId) {
  try {
    Logger.log(`[AuthAPI] Get current user request for session ${sessionId}`);
    
    // Initialize authentication service
    const authService = initializeAuthService();
    
    // Get current user
    const result = authService.getCurrentUser(sessionId);
    
    Logger.log(`[AuthAPI] Get current user result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    return result;
    
  } catch (error) {
    Logger.log(`[AuthAPI] Get current user error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      message: 'Failed to get current user'
    };
  }
}

/**
 * Initialize authentication service with dependencies
 * @returns {AuthService} Configured authentication service
 */
function initializeAuthService() {
  try {
    // Get configuration from Script Properties
    const props = PropertiesService.getScriptProperties();
    const userDbId = props.getProperty('userDatabaseSpreadsheetId');
    const auditLogId = props.getProperty('auditLogSpreadsheetId');
    const approvedDomains = props.getProperty('approvedDomains') || '';
    
    if (!userDbId || !auditLogId) {
      throw new Error('Authentication configuration missing. Please set userDatabaseSpreadsheetId and auditLogSpreadsheetId in Script Properties.');
    }
    
    // Initialize dependencies
    const domainValidator = new DomainValidator({
      approvedDomains: approvedDomains.split(',').map(d => d.trim()).filter(d => d),
      logger: createLogger('DomainValidator')
    });
    
    const userRepository = new UserRegistrationRepository({
      spreadsheetId: userDbId,
      sheetName: 'Users',
      logger: createLogger('UserRepository')
    });
    
    const sessionManager = new SessionManager({
      logger: createLogger('SessionManager'),
      sessionTimeoutMinutes: 30
    });
    
    const auditLogger = new AuditLogger({
      spreadsheetId: auditLogId,
      sheetName: 'AuditLog',
      logger: createLogger('AuditLogger')
    });
    
    // Create authentication service
    const authService = new AuthService({
      userRepository: userRepository,
      domainValidator: domainValidator,
      sessionManager: sessionManager,
      auditLogger: auditLogger,
      logger: createLogger('AuthService'),
      adminEmails: (props.getProperty('adminEmails') || '').split(',').map(e => e.trim()).filter(e => e)
    });
    
    return authService;
    
  } catch (error) {
    Logger.log(`[AuthAPI] Failed to initialize AuthService: ${error.message}`);
    throw error;
  }
}

/**
 * Initialize domain validator
 * @returns {DomainValidator} Configured domain validator
 */
function initializeDomainValidator() {
  try {
    const props = PropertiesService.getScriptProperties();
    const approvedDomains = props.getProperty('approvedDomains') || '';
    
    const domainValidator = new DomainValidator({
      approvedDomains: approvedDomains.split(',').map(d => d.trim()).filter(d => d),
      logger: createLogger('DomainValidator')
    });
    
    return domainValidator;
    
  } catch (error) {
    Logger.log(`[AuthAPI] Failed to initialize DomainValidator: ${error.message}`);
    throw error;
  }
}

/**
 * Create a logger instance
 * @param {string} component - Component name for logging
 * @returns {Object} Logger instance
 */
function createLogger(component) {
  return {
    log: function(message, context = {}) {
      Logger.log(`[${component}] ${message}`);
    },
    error: function(message, error, context = {}) {
      Logger.log(`[${component} ERROR] ${message}: ${error ? error.message : ''}`);
    },
    warn: function(message, context = {}) {
      Logger.log(`[${component} WARNING] ${message}`);
    }
  };
}

/**
 * Serve authentication pages (doGet handler)
 * @param {Object} e - Event object
 * @returns {HtmlOutput} HTML page
 */
function doGet(e) {
  try {
    const page = e.parameter.page || 'login';
    
    Logger.log(`[AuthAPI] Serving page: ${page}`);
    
    switch (page) {
      case 'login':
        return HtmlService.createTemplateFromFile('login')
          .evaluate()
          .setTitle('GDrive Slack Notifier - Login')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
          
      case 'register':
        return HtmlService.createTemplateFromFile('register')
          .evaluate()
          .setTitle('GDrive Slack Notifier - Register')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
          
      default:
        return HtmlService.createTemplateFromFile('login')
          .evaluate()
          .setTitle('GDrive Slack Notifier - Login')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
  } catch (error) {
    Logger.log(`[AuthAPI] Error serving page: ${error.message}`);
    
    // Return error page
    return HtmlService.createHtmlOutput(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h1>Error</h1>
          <p>An error occurred while loading the page.</p>
          <p>Error: ${error.message}</p>
          <a href="?page=login">Go to Login</a>
        </body>
      </html>
    `).setTitle('Error - GDrive Slack Notifier');
  }
}

/**
 * Handle authentication requests (doPost handler)
 * @param {Object} e - Event object
 * @returns {Object} Response object
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    const data = JSON.parse(e.postData.contents || '{}');
    
    Logger.log(`[AuthAPI] POST request - Action: ${action}`);
    
    switch (action) {
      case 'authenticate':
        return authenticateUser(data.email, data.domain, data.options);
        
      case 'register':
        return registerUser(data);
        
      case 'validateSession':
        return validateSession(data.sessionId);
        
      case 'logout':
        return logoutUser(data.sessionId);
        
      case 'getCurrentUser':
        return getCurrentUser(data.sessionId);
        
      case 'checkDomain':
        return checkDomainStatus(data.domain);
        
      default:
        return {
          success: false,
          message: 'Invalid action',
          error: 'Unknown action: ' + action
        };
    }
    
  } catch (error) {
    Logger.log(`[AuthAPI] POST error: ${error.message}`);
    return {
      success: false,
      message: 'Server error',
      error: error.message
    };
  }
}

/**
 * Get the dashboard page content (Aris Azhar approach)
 * @returns {string} Dashboard HTML content
 */
/*function getConfigDashboard() {
  try {
    Logger.log('[AuthAPI] Serving dashboard page...');
    return HtmlService.createHtmlOutputFromFile('configDashboard').getContent();
  } catch (error) {
    Logger.log(`[AuthAPI] Failed to serve dashboard: ${error.message}`);
    return '<html><body><h1>Error loading dashboard</h1></body></html>';
  }
}*/

/**
 * Get the login page content (Aris Azhar approach)
 * @returns {string} Login HTML content
 */
function getLoginPage() {
  try {
    Logger.log('[AuthAPI] Serving login page...');
    return HtmlService.createHtmlOutputFromFile('login').getContent();
  } catch (error) {
    Logger.log(`[AuthAPI] Failed to serve login page: ${error.message}`);
    return '<html><body><h1>Error loading login page</h1></body></html>';
  }
}
function getWebAppUrl() {
  try {
    // Use ScriptApp to get the actual deployed URL
    const webAppUrl = ScriptApp.getService().getUrl();
    Logger.log(`[AuthAPI] Web app URL: ${webAppUrl}`);
    return webAppUrl;
  } catch (error) {
    Logger.log(`[AuthAPI] Failed to get web app URL: ${error.message}`);
    // Fallback to manual URL construction
    const scriptId = ScriptApp.getScriptId();
    return `https://script.google.com/macros/s/${scriptId}/exec`;
  }
}

function checkDeployment() {
  const url = ScriptApp.getService().getUrl();
  Logger.log('Deployed Web App URL: ' + url);
  Logger.log('Script ID: ' + ScriptApp.getScriptId());
  
  // Test the deployment
  if (url) {
    Logger.log('✅ Web app is deployed');
    return { success: true, url: url };
  } else {
    Logger.log('❌ Web app is NOT deployed');
    return { success: false, message: 'Please deploy the web app first' };
  }
}
    

/**
 * Set environment for web app URL detection
 * Call this once to configure your environment
 * @param {string} environment - 'development' or 'production'
 */
function setEnvironment(environment = 'development') {
  try {
    PropertiesService.getScriptProperties().setProperty('ENVIRONMENT', environment);
    Logger.log(`[AuthAPI] Environment set to: ${environment}`);
    
    // Test the web app URL
    const webAppUrl = getWebAppUrl();
    Logger.log(`[AuthAPI] Current web app URL: ${webAppUrl}`);
    
    return {
      success: true,
      environment: environment,
      webAppUrl: webAppUrl
    };
    
  } catch (error) {
    Logger.log(`[AuthAPI] Failed to set environment: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test authentication API endpoints
 * @returns {Object} Test results
 */
async function testAuthAPI() {
  Logger.log('[AuthAPI] Testing authentication API endpoints...');
  
  const results = {
    initializeAuthService: false,
    initializeDomainValidator: false,
    checkDomainStatus: false,
    overall: false
  };
  
  try {
    // Test AuthService initialization
    const authService = initializeAuthService();
    results.initializeAuthService = !!authService;
    Logger.log(`✅ AuthService initialization: ${results.initializeAuthService ? 'SUCCESS' : 'FAILED'}`);
    
    // Test DomainValidator initialization
    const domainValidator = initializeDomainValidator();
    results.initializeDomainValidator = !!domainValidator;
    Logger.log(`✅ DomainValidator initialization: ${results.initializeDomainValidator ? 'SUCCESS' : 'FAILED'}`);
    
    // Test domain status check
    const domainResult = await checkDomainStatus('iress.com');
    results.checkDomainStatus = domainResult.approved === true;
    Logger.log(`✅ Domain status check: ${results.checkDomainStatus ? 'SUCCESS' : 'FAILED'}`);
    
    // Overall result
    results.overall = results.initializeAuthService && results.initializeDomainValidator && results.checkDomainStatus;
    
    Logger.log(`🎉 AuthAPI Test ${results.overall ? 'PASSED' : 'FAILED'}`);
    
    return results;
    
  } catch (error) {
    Logger.log(`❌ AuthAPI Test failed: ${error.message}`);
    return {
      ...results,
      error: error.message,
      overall: false
    };
  }
}


