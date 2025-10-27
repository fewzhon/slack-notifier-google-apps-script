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
    // AUTHENTICATION DISABLED - Dashboard is now the landing page
    if (route === 'register') {
      Logger.log('[doGet] Serving register page');
      return loadRegisterPage();
    } else if (route === 'test') {
      Logger.log('[doGet] Serving test page');
      return loadTestPage();
    } else {
      // Default: serve dashboard (authentication disabled)
      Logger.log('[doGet] Serving dashboard page (default landing)');
      return loadDashboardPage();
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

// ===== DASHBOARD API WRAPPER FUNCTIONS =====
// These functions expose DashboardAPI methods globally for google.script.run

/**
 * Get user information for dashboard
 * @param {string} userEmail - User email
 * @param {string} sessionId - Session ID
 * @returns {Object} User information
 */
function getUserInfo(userEmail, sessionId) {
  try {
    const api = new DashboardAPI();
    return api.getUserInfo(userEmail, sessionId);
  } catch (error) {
    Logger.log('[getUserInfo] Error: ' + error.message);
    return {
      success: false,
      message: 'Failed to get user info: ' + error.message
    };
  }
}

/**
 * Get system status for dashboard
 * @param {string} userEmail - User email
 * @returns {Object} System status
 */
function getSystemStatus(userEmail) {
  try {
    const api = new DashboardAPI();
    return api.getSystemStatus(userEmail);
  } catch (error) {
    Logger.log('[getSystemStatus] Error: ' + error.message);
    return {
      success: false,
      message: 'Failed to get system status: ' + error.message
    };
  }
}

/**
 * Get configuration categories
 * @param {string} userEmail - User email
 * @returns {Object} Configuration categories
 */
function getConfigurationCategories(userEmail) {
  try {
    const api = new DashboardAPI();
    return api.getConfigurationCategories(userEmail);
  } catch (error) {
    Logger.log('[getConfigurationCategories] Error: ' + error.message);
    return {
      success: false,
      message: 'Failed to get configuration categories: ' + error.message
    };
  }
}

/**
 * Get recent activity
 * @param {string} userEmail - User email
 * @returns {Object} Recent activity
 */
function getRecentActivity(userEmail) {
  try {
    const api = new DashboardAPI();
    return api.getRecentActivity(userEmail);
  } catch (error) {
    Logger.log('[getRecentActivity] Error: ' + error.message);
    return {
      success: false,
      message: 'Failed to get recent activity: ' + error.message
    };
  }
}

/**
 * Get latest summary information
 * @param {string} userEmail - User email
 * @returns {Object} Latest summary data
 */
function getLatestSummary(userEmail) {
  try {
    const api = new DashboardAPI();
    return api.getLatestSummary(userEmail);
  } catch (error) {
    Logger.log('[getLatestSummary] Error: ' + error.message);
    return {
      success: false,
      message: 'Failed to get latest summary: ' + error.message
    };
  }
}

/**
 * Update configuration values
 * @param {string} category - Category key (e.g., 'monitoring', 'notifications')
 * @param {Object} changes - Key-value pairs of changes to make
 * @returns {Object} Update result
 */
function updateConfiguration(category, changes) {
  try {
    Logger.log('[updateConfiguration] Updating ' + category + ':', changes);
    
    // Load current configuration
    const config = loadConfigurationFromProperties();
    
    // Convert changes to proper types and track changes for logging
    const updates = {};
    const changeDescriptions = [];
    
    for (const [key, value] of Object.entries(changes)) {
      let convertedValue = value;
      
      // Try to detect type and convert
      if (typeof value === 'string') {
        // Check if it's a number
        if (!isNaN(value) && value.trim() !== '') {
          convertedValue = Number(value);
        }
        // Check if it's a boolean
        else if (value === 'true' || value === 'false') {
          convertedValue = value === 'true';
        }
        // Check if it's an array (comma-separated)
        else if (value.includes(',')) {
          convertedValue = value.split(',').map(v => v.trim()).filter(v => v);
        }
      }
      
      // Track changes for activity log
      const oldValue = config[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(convertedValue)) {
        changeDescriptions.push(`${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(convertedValue)}`);
      }
      
      Logger.log('[updateConfiguration] Converting ' + key + ' =', convertedValue);
      updates[key] = convertedValue;
    }
    
    // Update configuration using the update method (validates internally)
    const updatedConfig = config.update(updates);
    
    // Validate the updated configuration
    const validationErrors = updatedConfig.getValidationErrors();
    if (validationErrors.length > 0) {
      Logger.log('[updateConfiguration] Validation errors: ' + validationErrors.join(', '));
      return {
        success: false,
        message: 'Validation failed: ' + validationErrors.join(', ')
      };
    }
    
    // Save updated configuration
    const repo = new ScriptPropertiesRepository({
      logger: {
        log: function(msg) { Logger.log(msg); },
        error: function(msg, err) { Logger.log('[ERROR] ' + msg); }
      }
    });
    
    repo._saveConfigurationData(updatedConfig.toObject());
    
    // Log activity
    try {
      const activityDescription = changeDescriptions.length > 0 
        ? 'Updated ' + category + ' configuration: ' + changeDescriptions.join(', ')
        : 'Updated ' + category + ' configuration';
      
      logActivity({
        action: 'config.update',
        category: category,
        description: activityDescription,
        changes: changeDescriptions,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      Logger.log('[updateConfiguration] Failed to log activity: ' + logError.message);
    }
    
    Logger.log('[updateConfiguration] Configuration saved successfully');
    
    return {
      success: true,
      message: 'Configuration updated successfully'
    };
    
  } catch (error) {
    Logger.log('[updateConfiguration] Error: ' + error.message);
    return {
      success: false,
      message: 'Failed to update configuration: ' + error.message
    };
  }
}

/**
 * Log activity to Script Properties
 * @param {Object} activity - Activity details
 */
function logActivity(activity) {
  try {
    const props = PropertiesService.getScriptProperties();
    const activitiesJson = props.getProperty('dashboardActivities') || '[]';
    const activities = JSON.parse(activitiesJson);
    
    // Add new activity
    activities.unshift({
      ...activity,
      id: Date.now().toString()
    });
    
    // Keep only last 50 activities
    if (activities.length > 50) {
      activities.splice(50);
    }
    
    // Save back to Script Properties
    props.setProperty('dashboardActivities', JSON.stringify(activities));
    Logger.log('[logActivity] Activity logged: ' + activity.description);
    
  } catch (error) {
    Logger.log('[logActivity] Error: ' + error.message);
  }
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

/**
 * Send daily summary to Slack
 */
function sendDailySummary() {
  try {
    Logger.log('[sendDailySummary] Sending daily summary...');
    
    // Check if Application class is available
    if (typeof Application === 'undefined') {
      return {
        success: false,
        message: 'Application service not available'
      };
    }
    
    // Initialize and send daily summary
    const app = new Application();
    return app.initialize().then(() => {
      return app.sendDailySummary();
    }).then(result => {
      Logger.log('[sendDailySummary] Summary sent successfully');
      return result;
    }).catch(error => {
      Logger.log('[sendDailySummary] Error: ' + error.message);
      throw error;
    });
    
  } catch (error) {
    Logger.log('[sendDailySummary] Failed: ' + error.message);
    return {
      success: false,
      message: 'Failed to send daily summary: ' + error.message
    };
  }
}

/**
 * Send weekly summary to Slack
 */
function sendWeeklySummary() {
  try {
    Logger.log('[sendWeeklySummary] Sending weekly summary...');
    
    // Check if Application class is available
    if (typeof Application === 'undefined') {
      return {
        success: false,
        message: 'Application service not available'
      };
    }
    
    // Initialize and send weekly summary
    const app = new Application();
    return app.initialize().then(() => {
      return app.sendWeeklySummary();
    }).then(result => {
      Logger.log('[sendWeeklySummary] Summary sent successfully');
      return result;
    }).catch(error => {
      Logger.log('[sendWeeklySummary] Error: ' + error.message);
      throw error;
    });
    
  } catch (error) {
    Logger.log('[sendWeeklySummary] Failed: ' + error.message);
    return {
      success: false,
      message: 'Failed to send weekly summary: ' + error.message
    };
  }
}