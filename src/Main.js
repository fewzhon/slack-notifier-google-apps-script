/**
 * Main.js
 * Main entry points for Google Apps Script
 * 
 * This file provides the main entry points that replace the existing
 * scattered functions, following Clean Architecture principles.
 */

// Global application instance
let application = null;

/**
 * Initialize the application (call this first)
 * @returns {Promise<void>}
 */
async function initializeApplication() {
  try {
    application = new Application();
    await application.initialize();
    Logger.log('Application initialized successfully');
  } catch (error) {
    Logger.log(`Application initialization failed: ${error.message}`);
    throw error;
  }
}

/**
 * Main monitoring function - replaces the old monitoring logic
 * This is the primary entry point for scheduled triggers
 * @returns {Promise<void>}
 */
async function monitorDriveChanges() {
  try {
    if (!application) {
      await initializeApplication();
    }
    
    const result = await application.monitorDrive({
      forceRun: false,
      userId: Session.getActiveUser().getEmail()
    });
    
    if (result.success) {
      Logger.log(`Monitoring completed: ${result.message}`);
      Logger.log(`Changes found: ${result.changesFound}, Notifications sent: ${result.notificationsSent}`);
    } else {
      Logger.log(`Monitoring failed: ${result.message}`);
    }
    
  } catch (error) {
    Logger.log(`Monitoring error: ${error.message}`);
    throw error;
  }
}

/**
 * Manual monitoring function - for testing and manual runs
 * @returns {Promise<void>}
 */
async function runManualMonitoring() {
  try {
    if (!application) {
      await initializeApplication();
    }
    
    const result = await application.monitorDrive({
      forceRun: true,
      userId: Session.getActiveUser().getEmail()
    });
    
    Logger.log(`Manual monitoring completed: ${result.message}`);
    return result;
    
  } catch (error) {
    Logger.log(`Manual monitoring error: ${error.message}`);
    throw error;
  }
}

/**
 * Send test notification - replaces old test functions
 * @param {string} message - Test message
 * @returns {Promise<boolean>} Success status
 */
async function sendTestNotification(message = 'Test notification from GDrive Monitor') {
  try {
    if (!application) {
      await initializeApplication();
    }
    
    const success = await application.sendTestNotification(message);
    Logger.log(`Test notification ${success ? 'sent successfully' : 'failed'}`);
    return success;
    
  } catch (error) {
    Logger.log(`Test notification error: ${error.message}`);
    return false;
  }
}

/**
 * Test webhook connection
 * @returns {Promise<boolean>} Connection status
 */
async function testWebhookConnection() {
  try {
    if (!application) {
      await initializeApplication();
    }
    
    const success = await application.testWebhookConnection();
    Logger.log(`Webhook connection test ${success ? 'passed' : 'failed'}`);
    return success;
    
  } catch (error) {
    Logger.log(`Webhook test error: ${error.message}`);
    return false;
  }
}

/**
 * Get application status
 * @returns {Promise<Object>} Application status
 */
async function getApplicationStatus() {
  try {
    if (!application) {
      await initializeApplication();
    }
    
    const status = await application.getStatus();
    Logger.log('Application status:', JSON.stringify(status, null, 2));
    return status;
    
  } catch (error) {
    Logger.log(`Status check error: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use monitorDriveChanges() instead
 */
function postUpdateToSlack() {
  Logger.log('WARNING: postUpdateToSlack() is deprecated. Use monitorDriveChanges() instead.');
  return monitorDriveChanges();
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use sendTestNotification() instead
 */
function testSlackNotification() {
  Logger.log('WARNING: testSlackNotification() is deprecated. Use sendTestNotification() instead.');
  return sendTestNotification();
}

/**
 * Setup function for new installations
 * @returns {Promise<void>}
 */
async function setupApplication() {
  try {
    Logger.log('Setting up GDrive to Slack Alert application...');
    
    // Initialize application
    await initializeApplication();
    
    // Test webhook connection
    const webhookTest = await testWebhookConnection();
    if (!webhookTest) {
      Logger.log('WARNING: Webhook connection test failed. Please check your Slack webhook URL.');
    }
    
    // Get initial status
    const status = await getApplicationStatus();
    Logger.log('Setup completed. Status:', JSON.stringify(status, null, 2));
    
    Logger.log('Setup completed successfully!');
    
  } catch (error) {
    Logger.log(`Setup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Cleanup function for application shutdown
 * @returns {Promise<void>}
 */
async function cleanupApplication() {
  try {
    Logger.log('Cleaning up application...');
    
    // Clear any pending operations
    if (application) {
      application = null;
    }
    
    Logger.log('Application cleanup completed');
    
  } catch (error) {
    Logger.log(`Cleanup error: ${error.message}`);
  }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeApplication,
    monitorDriveChanges,
    runManualMonitoring,
    sendTestNotification,
    testWebhookConnection,
    getApplicationStatus,
    setupApplication,
    cleanupApplication
  };
}
