/**
 * WebAppService - Google Apps Script Web App Deployment Service
 * Handles web app deployment, HTML service integration, and asset management
 */

class WebAppService {
  constructor(dependencies = {}) {
    this._logger = dependencies.logger || this._createDefaultLogger();
    this._authService = dependencies.authService;
    this._configUIService = dependencies.configUIService;
    this._accessControlService = dependencies.accessControlService;
    this._dashboardAPI = dependencies.dashboardAPI;
    
    this._logger.log('[WebAppService] WebAppService initialized');
  }
  
  /**
   * Initialize the web app service
   * @param {Object} dependencies - Service dependencies
   * @returns {Promise<Object>} Initialization result
   */
  async initialize(dependencies = {}) {
    try {
      this._logger.log('Initializing WebAppService...');
      
      // Initialize dependencies if not provided
      if (!this._authService) {
        this._authService = dependencies.authService;
      }
      
      if (!this._configUIService) {
        this._configUIService = dependencies.configUIService;
      }
      
      if (!this._accessControlService) {
        this._accessControlService = dependencies.accessControlService;
      }
      
      this._logger.log('WebAppService initialized successfully');
      
      return {
        success: true,
        message: 'WebAppService initialized successfully',
        endpoints: [
          'doGet',
          'serveConfigDashboard',
          'serveLoginPage',
          'serveRegisterPage',
          'includeAsset'
        ]
      };
      
    } catch (error) {
      this._logger.error('Failed to initialize WebAppService', error);
      throw error;
    }
  }
  
  /**
   * Main web app entry point with authentication gate
   * @param {Object} e - Event object containing query parameters
   * @returns {HtmlOutput} Main application page or login page
   */
  doGet(e = {}) {
    try {
      this._logger.log('Serving main web app with authentication gate...');
      
      // Debug: Log all parameters
      this._logger.log(`Event parameters: ${JSON.stringify(e.parameter || {})}`);
      
      // Check for page parameter to determine what to serve
      const page = e.parameter?.page;
      const authToken = e.parameter?.authToken;
      
      // Test page route
      if (page === 'test') {
        this._logger.log('Test page requested - bypassing authentication');
        return this._serveTestPage();
      }
      
      if (page === 'dashboard' && authToken) {
        this._logger.log(`Dashboard page requested with authToken: ${authToken.substring(0, 10)}...`);
        return this._serveAuthenticatedDashboard({ 
          isAuthenticated: true, 
          userEmail: 'authenticated-user',
          sessionId: authToken 
        });
      }
      
      if (authToken) {
        this._logger.log(`AuthToken provided: ${authToken.substring(0, 10)}...`);
      } else {
        this._logger.log('No authToken found in parameters');
      }
      
      // Check authentication status
      const authResult = this._checkAuthentication(authToken);
      
      if (authResult.isAuthenticated) {
        this._logger.log(`User authenticated: ${authResult.userEmail}`);
        return this._serveAuthenticatedDashboard(authResult);
      } else {
        this._logger.log('User not authenticated, redirecting to login');
        return this._serveLoginPage(authResult);
      }
      
    } catch (error) {
      this._logger.error('Failed to serve main web app', error);
      return this._createErrorPage('Application Error', 'Sorry, there was an error loading the application. Please try again later.');
    }
  }
  
  /**
   * Check if user is authenticated
   * Now relies on client-side validation since query params don't survive redirect
   * @param {string} authToken - Optional authentication token from query parameters
   * @returns {Object} Authentication result
   */
  _checkAuthentication(authToken = null) {
    try {
      // IMPORTANT: In Apps Script web apps, Session.getActiveUser() returns 'anonymous'
      // for web app users. We need to check for auth tokens in the URL or serve login page.
      
      // Check if we have an auth token in the URL (from redirect)
      if (authToken) {
        this._logger.log(`AuthToken provided: ${authToken.substring(0, 10)}...`);
        return {
          isAuthenticated: true,
          userEmail: 'token-validated', // Will be validated client-side
          userRole: 'user',
          sessionId: authToken,
          reason: 'Auth token provided - client will validate'
        };
      }
      
      // No auth token - serve login page
      this._logger.log('No auth token found - serving login page');
      return {
        isAuthenticated: false,
        userEmail: null,
        reason: 'No authentication token provided',
        redirectTo: 'login'
      };
      
    } catch (error) {
      this._logger.error('Authentication check failed', error);
      return {
        isAuthenticated: false,
        userEmail: null,
        reason: 'Authentication check failed',
        error: error.message,
        redirectTo: 'login'
      };
    }
  }
  
  /**
   * Serve authenticated dashboard
   * @param {Object} authResult - Authentication result
   * @returns {HtmlOutput} Dashboard page
   */
  _serveAuthenticatedDashboard(authResult) {
    try {
      this._logger.log('Serving authenticated dashboard...');
      
      const template = HtmlService.createTemplateFromFile('configDashboard');
      
      // Add server-side data to template
      template.appName = 'Slack Notifier Configuration';
      template.version = '1.0.0';
      template.environment = 'production';
      template.userEmail = authResult.userEmail;
      template.userRole = authResult.userRole;
      template.sessionId = authResult.sessionId;
      template.isAuthenticated = true;
      
      const htmlOutput = template.evaluate()
        .setTitle('Configuration Dashboard - Slack Notifier')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
      
      this._logger.log('Authenticated dashboard served successfully');
      return htmlOutput;
      
    } catch (error) {
      this._logger.error('Failed to serve authenticated dashboard', error);
      return this._createErrorPage('Dashboard Error', 'Failed to load dashboard. Please try again.');
    }
  }
  
  /**
   * Serve test page for debugging
   * @returns {HtmlOutput} Test page
   */
  _serveTestPage() {
    try {
      this._logger.log('Serving test page...');
      
      const template = HtmlService.createTemplateFromFile('testWebAppService');
      
      const htmlOutput = template.evaluate()
        .setTitle('WebAppService Test - Slack Notifier')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
      
      this._logger.log('Test page served successfully');
      return htmlOutput;
      
    } catch (error) {
      this._logger.error('Failed to serve test page', error);
      return this._createErrorPage('Test Page Error', 'Failed to load test page. Please try again.');
    }
  }
  
  /**
   * Serve login page
   * @param {Object} authResult - Authentication result
   * @returns {HtmlOutput} Login page
   */
  _serveLoginPage(authResult) {
    try {
      this._logger.log('Serving login page...');
      
      const template = HtmlService.createTemplateFromFile('login');
      
      // Add request data
      template.returnUrl = '';
      template.error = authResult.reason || '';
      template.message = 'Please log in to access the Slack Notifier Configuration Dashboard';
      template.isAuthenticated = false;
      
      const htmlOutput = template.evaluate()
        .setTitle('Login - Slack Notifier')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
      
      this._logger.log('Login page served successfully');
      return htmlOutput;
      
    } catch (error) {
      this._logger.error('Failed to serve login page', error);
      return this._createErrorPage('Login Error', 'Failed to load login page. Please try again.');
    }
  }
  
  /**
   * Generate a simple session ID
   * @returns {string} Session ID
   */
  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Serve configuration dashboard
   * @param {Object} request - Request parameters
   * @returns {HtmlOutput} Configuration dashboard
   */
  serveConfigDashboard(request = {}) {
    try {
      this._logger.log('Serving configuration dashboard...');
      
      const template = HtmlService.createTemplateFromFile('configDashboard');
      
      // Add request data
      template.appName = 'Slack Notifier Configuration';
      template.userEmail = request.userEmail || '';
      template.sessionId = request.sessionId || '';
      template.returnUrl = request.returnUrl || '';
      
      const htmlOutput = template.evaluate()
        .setTitle('Configuration Dashboard - Slack Notifier')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
      this._logger.log('Configuration dashboard served successfully');
      return htmlOutput;
      
    } catch (error) {
      this._logger.error('Failed to serve configuration dashboard', error);
      return this._createErrorPage('Configuration Dashboard Error', error.message);
    }
  }
  
  /**
   * Serve login page
   * @param {Object} request - Request parameters
   * @returns {HtmlOutput} Login page
   */
  serveLoginPage(request = {}) {
    try {
      this._logger.log('Serving login page...');
      
      const template = HtmlService.createTemplateFromFile('login');
      
      // Add request data
      template.returnUrl = request.returnUrl || '';
      template.error = request.error || '';
      template.message = request.message || '';
      
      const htmlOutput = template.evaluate()
        .setTitle('Login - Slack Notifier')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
      this._logger.log('Login page served successfully');
      return htmlOutput;
      
    } catch (error) {
      this._logger.error('Failed to serve login page', error);
      return this._createErrorPage('Login Page Error', error.message);
    }
  }
  
  /**
   * Serve registration page
   * @param {Object} request - Request parameters
   * @returns {HtmlOutput} Registration page
   */
  serveRegisterPage(request = {}) {
    try {
      this._logger.log('Serving registration page...');
      
      const template = HtmlService.createTemplateFromFile('register');
      
      // Add request data
      template.returnUrl = request.returnUrl || '';
      template.error = request.error || '';
      template.message = request.message || '';
      
      const htmlOutput = template.evaluate()
        .setTitle('Register - Slack Notifier')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
      this._logger.log('Registration page served successfully');
      return htmlOutput;
      
    } catch (error) {
      this._logger.error('Failed to serve registration page', error);
      return this._createErrorPage('Registration Page Error', error.message);
    }
  }
  
  // Note: includeAsset is now a standalone global function, not a class method
  
  /**
   * Get web app URL
   * @returns {string} Web app URL
   */
  getWebAppUrl() {
    try {
      const scriptId = ScriptApp.getScriptId();
      const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
      
      this._logger.log(`Web app URL: ${webAppUrl}`);
      return webAppUrl;
      
    } catch (error) {
      this._logger.error('Failed to get web app URL', error);
      return 'https://script.google.com/macros/s/[SCRIPT_ID]/exec';
    }
  }
  
  /**
   * Get deployment information
   * @returns {Object} Deployment info
   */
  getDeploymentInfo() {
    try {
      const scriptId = ScriptApp.getScriptId();
      const webAppUrl = this.getWebAppUrl();
      
      return {
        success: true,
        scriptId: scriptId,
        webAppUrl: webAppUrl,
        deploymentStatus: 'ready',
        endpoints: [
          'doGet',
          'serveConfigDashboard',
          'serveLoginPage',
          'serveRegisterPage',
          'includeAsset'
        ],
        features: [
          'Modern UI Framework',
          'Authentication System',
          'Role-Based Access Control',
          'Configuration Management',
          'Responsive Design',
          'Dark/Light Theme'
        ]
      };
      
    } catch (error) {
      this._logger.error('Failed to get deployment info', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create error page
   * @param {string} title - Error page title
   * @param {string} message - Error message
   * @returns {HtmlOutput} Error page
   */
  _createErrorPage(title, message) {
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            min-height: 100vh;
            margin: 0;
          }
          .error-container {
            max-width: 500px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          }
          .error-icon { font-size: 48px; margin-bottom: 20px; }
          .error-title { color: #1e293b; margin-bottom: 16px; }
          .error-message { color: #64748b; margin-bottom: 24px; }
          .retry-btn {
            background: #6366f1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .retry-btn:hover {
            background: #5855eb;
            transform: translateY(-1px);
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h1 class="error-title">${title}</h1>
          <p class="error-message">${message}</p>
          <button class="retry-btn" onclick="window.location.reload()">
            Try Again
          </button>
        </div>
      </body>
      </html>
    `).setTitle(title);
  }
  
  /**
   * Create default logger
   * @returns {Object} Logger object
   */
  _createDefaultLogger() {
    return {
      log: (message) => Logger.log(`[WebAppService] ${message}`),
      error: (message, error) => Logger.log(`[WebAppService ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[WebAppService WARNING] ${message}`)
    };
  }
}

// Global functions for Google Apps Script web app
function doGet(e) {
  const webAppService = new WebAppService();
  return webAppService.doGet(e);
}

/**
 * Simple standalone includeAsset function for Google Apps Script
 * This function is called by <?!= includeAsset('filename') ?> in HTML templates
 */
function includeAsset(filename) {
  // Use HtmlService to get the content
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Simple test function to verify includeAsset works
 * Call this from Apps Script editor to test: testIncludeAssetSimple()
 */
function testIncludeAssetSimple() {
  Logger.log('=== TESTING INCLUDEASSET SIMPLE ===');
  
  const filesToTest = ['dashboard', 'modern-ui-css', 'modern-ui-js', 'testWebAppService'];
  
  filesToTest.forEach(filename => {
    try {
      const result = includeAsset(filename);
      Logger.log(`✅ ${filename}: ${result.length} characters`);
    } catch (error) {
      Logger.log(`❌ ${filename}: ${error.message}`);
    }
  });
  
  Logger.log('=== TEST COMPLETE ===');
}

/**
 * Test the test page route specifically
 * Call this from Apps Script editor to test: testTestPageRoute()
 */
function testTestPageRoute() {
  Logger.log('=== TESTING TEST PAGE ROUTE ===');
  
  try {
    const result = doGet({
      parameter: {
        page: 'test'
      }
    });
    
    Logger.log(`Test page result - Title: ${result.getTitle()}`);
    Logger.log(`Test page result - Content length: ${result.getContent().length} characters`);
    Logger.log(`Test page result - Contains 'test': ${result.getContent().includes('test') ? 'YES' : 'NO'}`);
    Logger.log(`Test page result - Contains 'WebAppService': ${result.getContent().includes('WebAppService') ? 'YES' : 'NO'}`);
    
    // Show first few lines of content
    const lines = result.getContent().split('\n').slice(0, 5);
    Logger.log(`First 5 lines: ${lines.join(' | ')}`);
    
  } catch (error) {
    Logger.log(`Test page route ERROR: ${error.message}`);
  }
  
  Logger.log('=== TEST PAGE ROUTE TEST COMPLETE ===');
}

/**
 * Test function to verify asset loading
 * Call this from Apps Script editor to test: testAssetLoading()
 */
function testAssetLoading() {
  const webAppService = new WebAppService();
  
  const assetsToTest = [
    'dashboard',
    'modern-ui-css', 
    'modern-ui-js'
  ];
  
  Logger.log('=== TESTING ASSET LOADING ===');
  
  assetsToTest.forEach(asset => {
    try {
      const content = webAppService.includeAsset(asset);
      const success = !content.includes('Error loading');
      
      Logger.log(`${asset}: ${success ? 'SUCCESS' : 'FAILED'}`);
      Logger.log(`Content length: ${content.length} characters`);
      
      if (!success) {
        Logger.log(`Error content: ${content.substring(0, 200)}...`);
      } else {
        // Show first few lines of content to verify it's correct
        const lines = content.split('\n').slice(0, 3);
        Logger.log(`First 3 lines: ${lines.join(' | ')}`);
      }
      
    } catch (error) {
      Logger.log(`${asset}: ERROR - ${error.message}`);
    }
  });
  
  Logger.log('=== ASSET LOADING TEST COMPLETE ===');
}

/**
 * Test function to verify doGet() function and web app serving
 * Call this from Apps Script editor to test: testWebAppServing()
 */
function testWebAppServing() {
  Logger.log('=== TESTING WEB APP SERVING ===');
  
  const webAppService = new WebAppService();
  
  // Test 1: No parameters (should serve login page)
  Logger.log('Test 1: No parameters');
  try {
    const result1 = webAppService.doGet({});
    Logger.log(`Result 1 - Title: ${result1.getTitle()}`);
    Logger.log(`Result 1 - Content length: ${result1.getContent().length} characters`);
    Logger.log(`Result 1 - Contains login: ${result1.getContent().includes('login') ? 'YES' : 'NO'}`);
  } catch (error) {
    Logger.log(`Test 1 ERROR: ${error.message}`);
  }
  
  // Test 2: With authToken (should serve dashboard)
  Logger.log('Test 2: With authToken');
  try {
    const result2 = webAppService.doGet({
      parameter: {
        authToken: 'test_token_123',
        page: 'dashboard'
      }
    });
    Logger.log(`Result 2 - Title: ${result2.getTitle()}`);
    Logger.log(`Result 2 - Content length: ${result2.getContent().length} characters`);
    Logger.log(`Result 2 - Contains dashboard: ${result2.getContent().includes('dashboard') ? 'YES' : 'NO'}`);
    Logger.log(`Result 2 - Contains includeAsset: ${result2.getContent().includes('includeAsset') ? 'YES' : 'NO'}`);
  } catch (error) {
    Logger.log(`Test 2 ERROR: ${error.message}`);
  }
  
  Logger.log('=== WEB APP SERVING TEST COMPLETE ===');
}

/**
 * Test function to verify client-side communication
 * Call this from Apps Script editor to test: testClientSideCommunication()
 */
function testClientSideCommunication() {
  Logger.log('=== TESTING CLIENT-SIDE COMMUNICATION ===');
  
  // Test if we can call server-side functions from client
  Logger.log('Testing server-side function availability...');
  
  // These functions should be available for google.script.run calls
  const serverFunctions = [
    'logoutUser',
    'getUserInfo', 
    'getSystemStatus',
    'getConfigurationCategories',
    'getRecentActivity'
  ];
  
  serverFunctions.forEach(funcName => {
    try {
      // Check if function exists globally
      const func = eval(funcName);
      if (typeof func === 'function') {
        Logger.log(`${funcName}: AVAILABLE`);
      } else {
        Logger.log(`${funcName}: NOT AVAILABLE`);
      }
    } catch (error) {
      Logger.log(`${funcName}: ERROR - ${error.message}`);
    }
  });
  
  Logger.log('=== CLIENT-SIDE COMMUNICATION TEST COMPLETE ===');
}

/**
 * Comprehensive test function
 * Call this from Apps Script editor to test: testWebAppServiceComprehensive()
 */
function testWebAppServiceComprehensive() {
  Logger.log('=== COMPREHENSIVE WEBAPPSERVICE TEST ===');
  
  // Test 1: Asset Loading
  testAssetLoading();
  
  // Test 2: Web App Serving
  testWebAppServing();
  
  // Test 3: Client-Side Communication
  testClientSideCommunication();
  
  // Test 4: Deployment Info
  Logger.log('=== TESTING DEPLOYMENT INFO ===');
  try {
    const webAppService = new WebAppService();
    const deploymentInfo = webAppService.getDeploymentInfo();
    Logger.log(`Deployment Info: ${JSON.stringify(deploymentInfo, null, 2)}`);
  } catch (error) {
    Logger.log(`Deployment Info ERROR: ${error.message}`);
  }
  
  Logger.log('=== COMPREHENSIVE TEST COMPLETE ===');
}
