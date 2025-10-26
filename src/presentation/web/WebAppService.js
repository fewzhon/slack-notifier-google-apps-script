/**
 * Simple routing system - based on proven patterns
 */
var Route = {};
Route.path = function(route, callback) {
  Route[route] = callback;
};

/**
 * Main entry point for web app
 * Simple MVP routing based on proven patterns
 */
function doGet(e) {
  try {
    Logger.log('[doGet] ========== START ==========');
    Logger.log('[doGet] Parameters: ' + JSON.stringify(e.parameter || {}));
    
    // Get route parameter
    const route = e.parameter.v;
    Logger.log('[doGet] Route requested: ' + route);
    
    // Route to appropriate page
    if (route === 'login' || !route) {
      Logger.log('[doGet] Serving login page');
      return loadLoginPage();
    } else if (route === 'register') {
      Logger.log('[doGet] Serving register page');
      return loadRegisterPage();
    } else if (route === 'dashboard') {
      Logger.log('[doGet] Serving dashboard page');
      return loadDashboardPage();
    } else if (route === 'test') {
      Logger.log('[doGet] Serving test page');
      return loadTestPage();
    } else {
      Logger.log('[doGet] Unknown route, serving login page');
      return loadLoginPage();
    }
    
  } catch (error) {
    Logger.log('[doGet] ❌ ERROR: ' + error.message);
    Logger.log('[doGet] Stack: ' + error.stack);
    return createErrorPage('Error', error.message);
  }
}

/**
 * Load login page (default route)
 */
function loadLoginPage() {
  return render('login')
    .setTitle('Login - Slack Notifier')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Load registration page
 */
function loadRegisterPage() {
  return render('register')
    .setTitle('Register - Slack Notifier')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Load dashboard page
 */
function loadDashboardPage() {
  return render('configDashboard', {
    appName: 'Slack Notifier Configuration'
  })
    .setTitle('Dashboard - Slack Notifier')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Load test page
 */
function loadTestPage() {
  return render('testWebAppService')
    .setTitle('Test Page')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include helper - for including CSS/JS in HTML templates
 * Usage in HTML: <?!= include('filename') ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Render helper - simplified version based on proven Apps Script patterns
 * @param {string} file - HTML file to render
 * @param {Object} argsObject - Optional object with variables to pass to template
 * @returns {HtmlOutput} - The rendered HTML output
 */
function render(file, argsObject) {
  try {
    Logger.log('[render] Rendering file: ' + file);
    
    const template = HtmlService.createTemplateFromFile(file);
    
    // Add any arguments to the template
    if (argsObject) {
      const keys = Object.keys(argsObject);
      keys.forEach(function(key) {
        template[key] = argsObject[key];
      });
    }
    
    const output = template.evaluate();
    
    Logger.log('[render] ✅ Successfully rendered: ' + file);
    return output;
    
  } catch (error) {
    Logger.log('[render] ❌ Error rendering ' + file + ': ' + error.message);
    throw error;
  }
}

/**
 * Get web app URL helper
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
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
        <a href="<?= ScriptApp.getService().getUrl() ?>">Back to Login</a>
      </div>
    </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}