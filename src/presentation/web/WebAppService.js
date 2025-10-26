/**
 * Main entry point for web app
 * Must be a global function for Apps Script
 */
function doGet(e) {
  try {
    Logger.log('[WebApp] ========== doGet START ==========');
    Logger.log('[WebApp] Parameters: ' + JSON.stringify(e.parameter || {}));
    
    const authToken = e.parameter?.authToken;
    const page = e.parameter?.page;
    
    Logger.log('[WebApp] authToken: ' + (authToken ? 'YES (' + authToken.substring(0, 20) + '...)' : 'NO'));
    Logger.log('[WebApp] page: ' + (page || 'none'));
    
    // Test page route
    if (page === 'test') {
      Logger.log('[WebApp] Serving TEST page');
      return serveTestPage();
    }
    
    // If we have authToken, serve dashboard
    if (authToken) {
      Logger.log('[WebApp] ✅ Serving DASHBOARD');
      return serveDashboard(authToken);
    }
    
    // No authToken, serve login
    Logger.log('[WebApp] Serving LOGIN page');
    return serveLogin();
    
  } catch (error) {
    Logger.log('[WebApp] ❌ ERROR in doGet: ' + error.message);
    Logger.log('[WebApp] Stack: ' + error.stack);
    return createErrorPage('Error', error.message);
  }
}

/**
 * Serve login page
 */
function serveLogin() {
  return HtmlService.createHtmlOutputFromFile('login')
    .setTitle('Login - Slack Notifier')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Serve dashboard page
 */
function serveDashboard(authToken) {
  try {
    Logger.log('[WebApp] Creating dashboard template...');
    const template = HtmlService.createTemplateFromFile('configDashboard');
    
    // Add server-side variables
    template.appName = 'Slack Notifier Configuration';
    template.authToken = authToken;
    template.userEmail = 'authenticated-user';
    
    Logger.log('[WebApp] Evaluating dashboard template...');
    const output = template.evaluate()
      .setTitle('Dashboard - Slack Notifier')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    Logger.log('[WebApp] ✅ Dashboard ready to serve');
    return output;
    
  } catch (error) {
    Logger.log('[WebApp] ❌ Error in serveDashboard: ' + error.message);
    throw error;
  }
}

/**
 * Serve test page
 */
function serveTestPage() {
  return HtmlService.createHtmlOutputFromFile('testWebAppService')
    .setTitle('Test Page')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include asset files (CSS/JS)
 */
function includeAsset(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Create error page
 */
function createErrorPage(title, message) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .error-container {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
        }
        h1 { color: #e74c3c; margin-bottom: 16px; }
        p { color: #666; margin-bottom: 24px; }
        a {
          display: inline-block;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>⚠️ ${title}</h1>
        <p>${message}</p>
        <a href="${ScriptApp.getService().getUrl()}">Back to Login</a>
      </div>
    </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}