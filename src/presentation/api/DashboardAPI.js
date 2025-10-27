/**
 * DashboardAPI - Backend API for Dashboard Data
 * Handles authentication, configuration, and system status requests
 */

/**
 * Load Configuration from Script Properties
 * @returns {Configuration} Configuration instance
 */
function loadConfigurationFromProperties() {
  try {
    const repo = new ScriptPropertiesRepository({
      logger: {
        log: function(msg) { Logger.log(msg); },
        error: function(msg, err) { Logger.log('[ERROR] ' + msg); }
      }
    });
    
    // Load configuration synchronously (Apps Script limitation)
    const config = repo._loadConfigurationData();
    return Configuration.fromObject(config);
  } catch (error) {
    Logger.log('[loadConfigurationFromProperties] Error: ' + error.message);
    // Return default configuration
    return Configuration.createDefault();
  }
}

class DashboardAPI {
  constructor() {
    this._logger = this._createDefaultLogger();
    this._authService = null;
    this._configUIService = null;
    this._accessControlService = null;
    this._application = null;
    
    this._logger.log('[DashboardAPI] DashboardAPI initialized');
  }
  
  /**
   * Initialize the dashboard API with dependencies
   * @param {Object} dependencies - Service dependencies
   * @returns {Promise<Object>} Initialization result
   */
  async initialize(dependencies = {}) {
    try {
      this._logger.log('Initializing DashboardAPI...');
      
      // Initialize dependencies
      this._authService = dependencies.authService;
      this._configUIService = dependencies.configUIService;
      this._accessControlService = dependencies.accessControlService;
      this._application = dependencies.application;
      
      this._logger.log('DashboardAPI initialized successfully');
      
      return {
        success: true,
        message: 'DashboardAPI initialized successfully',
        endpoints: [
          'getUserInfo',
          'getSystemStatus',
          'getConfigurationCategories',
          'getRecentActivity',
          'authenticateUser',
          'logoutUser'
        ]
      };
      
    } catch (error) {
      this._logger.error('Failed to initialize DashboardAPI', error);
      throw error;
    }
  }
  
  /**
   * Get user information for dashboard
   * @param {string} userEmail - User email
   * @param {string} sessionId - Session ID
   * @returns {Object} User information
   */
  getUserInfo(userEmail, sessionId) {
    try {
      // Get the ACTUAL current user from Google Apps Script session
      let actualUserEmail = '';
      try {
        actualUserEmail = Session.getActiveUser().getEmail();
      } catch (error) {
        this._logger.log('Could not get active user email: ' + error.message);
      }
      
      // Use actual user email if provided userEmail is generic/default
      let finalUserEmail = (userEmail === 'authenticated-user' || !userEmail) ? actualUserEmail : userEmail;
      
      // If still no email, treat as anonymous/incognito user
      if (!finalUserEmail || finalUserEmail === '' || !finalUserEmail.includes('@')) {
        // Create anonymous user for incognito/anonymous access
        const props = PropertiesService.getScriptProperties();
        const anonymousId = 'anonymous-' + Date.now();
        
        finalUserEmail = anonymousId + '@anonymous.local';
        this._logger.log('No active user session - creating anonymous user: ' + finalUserEmail);
      }
      
      this._logger.log(`Getting user info for ${finalUserEmail} (provided: ${userEmail})`);
      
      // Basic email validation
      if (finalUserEmail.length < 5) {
        return {
          success: false,
          message: 'Invalid email format',
          error: 'INVALID_EMAIL'
        };
      }
      
      // Check if user is admin by loading Configuration
      const config = loadConfigurationFromProperties();
      
      // Method 1: Check if email is in adminEmails configuration
      let isAdmin = config.adminEmails.includes(finalUserEmail) || config.adminEmails.length === 0;
      
      // Method 2: Cross-reference with active sessions from Script Properties
      // Allows dynamic admin status without modifying configuration
      try {
        const props = PropertiesService.getScriptProperties();
        
        // Try to get active users list from properties
        const activeUsersJson = props.getProperty('activeUsers') || '[]';
        const activeUsers = JSON.parse(activeUsersJson);
        
        // Check if current user has admin status in active sessions
        const userEntry = activeUsers.find(u => u.email === finalUserEmail);
        if (userEntry && userEntry.role === 'admin') {
          isAdmin = true;
          this._logger.log(`User ${finalUserEmail} is admin based on active users list`);
        }
      } catch (error) {
        // If active users list is not available, use configuration only
        this._logger.log('Active users list not available, using configuration only for admin check');
      }
      
      // Extract name from email (handle Google accounts, anonymous, and generic emails)
      const emailParts = finalUserEmail.split('@');
      const userDomain = emailParts[1];
      
      // Check if this is an anonymous user
      let userName;
      if (userDomain === 'anonymous.local') {
        userName = 'Anonymous User';
      } else {
        userName = emailParts[0];
      }
      
      const mockUser = {
        success: true,
        user: {
          email: finalUserEmail,
          name: userName,
          role: isAdmin ? 'admin' : 'user',
          avatar: userDomain === 'anonymous.local' ? '👻' : '👤',
          lastLogin: new Date().toISOString(),
          status: userDomain === 'anonymous.local' ? 'anonymous' : 'active'
        },
        permissions: isAdmin ? [
          'config.manage',
          'config.update',
          'config.reset',
          'users.manage',
          'triggers.manage',
          'notifications.manage',
          'audit.view'
        ] : [
          'notifications.manage',
          'audit.view'
        ],
        isAdminEmail: isAdmin
      };
      
      this._logger.log('User info retrieved successfully - isAdmin: ' + isAdmin);
      return mockUser;
      
    } catch (error) {
      this._logger.error('Failed to get user info', error);
      return {
        success: false,
        message: 'Failed to load user information',
        error: error.message
      };
    }
  }
  
  /**
   * Get system status information
   * @param {string} userEmail - User email
   * @returns {Object} System status
   */
  getSystemStatus(userEmail) {
    try {
      this._logger.log(`Getting system status for ${userEmail}`);
      
      // Load real configuration
      const config = loadConfigurationFromProperties();
      
      // Determine monitoring status based on configuration
      const monitoringStatus = config.folderIds.length > 0 ? 'active' : 'inactive';
      
      // Determine trigger status based on configuration
      const triggerStatus = config.weeklySummaryEnabled && config.maxRunsPerDay > 0 ? 'active' : 'inactive';
      
      // Determine notification status based on configuration
      const notificationStatus = config.slackWebhookUrl && config.slackWebhookUrl.length > 0 ? 'active' : 'inactive';
      
      // Calculate uptime (mock for now, could be tracked in Script Properties)
      const uptime = '99.9%';
      
      const systemStatus = {
        success: true,
        status: {
          monitoring: monitoringStatus,
          triggers: triggerStatus,
          notifications: notificationStatus,
          uptime: uptime
        }
      };
      
      this._logger.log('System status retrieved successfully');
      this._logger.log('Monitoring: ' + monitoringStatus + ', Triggers: ' + triggerStatus + ', Notifications: ' + notificationStatus);
      
      return systemStatus;
      
    } catch (error) {
      this._logger.error('Failed to get system status', error);
      return {
        success: false,
        message: 'Failed to load system status',
        error: error.message
      };
    }
  }
  
  /**
   * Get configuration categories accessible to user
   * @param {string} userEmail - User email
   * @returns {Object} Configuration categories
   */
  getConfigurationCategories(userEmail) {
    try {
      this._logger.log(`Getting configuration categories for ${userEmail}`);
      
      // Load real configuration from Script Properties
      const config = loadConfigurationFromProperties();
      
      // Check if user is admin - check both configuration and active users
      let isAdmin = config.adminEmails.includes(userEmail) || config.adminEmails.length === 0;
      
      // Cross-reference with active users from Script Properties
      try {
        const props = PropertiesService.getScriptProperties();
        const activeUsersJson = props.getProperty('activeUsers') || '[]';
        const activeUsers = JSON.parse(activeUsersJson);
        const userEntry = activeUsers.find(u => u.email === userEmail);
        if (userEntry && userEntry.role === 'admin') {
          isAdmin = true;
        }
      } catch (error) {
        // Fall back to configuration only
      }
      
      // Map Configuration entity to dashboard categories
      const categories = {
        success: true,
        categories: {
          monitoring: {
            key: 'monitoring',
            name: 'Drive Monitoring',
            description: 'Configure Google Drive monitoring settings',
            icon: '📁',
            settingsCount: 4,
            settings: [
              { key: 'folderIds', value: config.folderIds, label: 'Folder IDs' },
              { key: 'minutesThreshold', value: config.minutesThreshold, label: 'Minutes Threshold' },
              { key: 'lookbackWindowMinutes', value: config.lookbackWindowMinutes, label: 'Lookback Window' },
              { key: 'maxFilesToProcess', value: config.maxFilesToProcess, label: 'Max Files to Process' }
            ],
            adminOnly: false,
            isReadOnly: !isAdmin,
            status: 'active',
            lastModified: new Date().toISOString()
          },
          notifications: {
            key: 'notifications',
            name: 'Notification Settings',
            description: 'Configure Slack notification preferences',
            icon: '📢',
            settingsCount: 5,
            settings: [
              { key: 'slackWebhookUrl', value: config.slackWebhookUrl, label: 'Slack Webhook URL' },
              { 
                key: 'summaryType', 
                value: config.weeklySummaryEnabled ? 'weekly' : (config.dailySummaryEnabled ? 'daily' : 'weekly'),
                label: 'Summary Type',
                type: 'select',
                options: [
                  { value: 'weekly', label: 'Weekly Summary' },
                  { value: 'daily', label: 'Daily Summary' }
                ],
                info: 'Select whether to receive daily or weekly summaries'
              },
              { key: 'weeklySummaryChannel', value: config.weeklySummaryChannel, label: 'Summary Channel' },
              { key: 'weeklySummaryEnabled', value: config.weeklySummaryEnabled, label: 'Weekly Summary Enabled', hidden: true },
              { key: 'dailySummaryEnabled', value: config.dailySummaryEnabled, label: 'Daily Summary Enabled', hidden: true },
              { key: 'timezone', value: config.timezone, label: 'Timezone' }
            ],
            adminOnly: false,
            isReadOnly: !isAdmin,
            status: 'active',
            lastModified: new Date().toISOString()
          },
          triggers: {
            key: 'triggers',
            name: 'Scheduled Triggers',
            description: 'Manage automated trigger schedules - choose between time-driven or count-driven mode',
            icon: '⏰',
            settingsCount: 5,
            settings: [
              { 
                key: 'triggerMode', 
                value: config.triggerMode || 'time-driven', 
                label: 'Trigger Mode',
                type: 'select',
                options: [
                  { value: 'time-driven', label: 'Time-Driven (set time window)' },
                  { value: 'count-driven', label: 'Count-Driven (set number of runs)' }
                ],
                info: 'Time-Driven: Set window, see calculated runs. Count-Driven: Set runs, see calculated window.'
              },
              { 
                key: 'startHour', 
                value: config.startHour, 
                label: 'Start Hour (0-23)' 
              },
              { 
                key: 'stopHour', 
                value: config.stopHour, 
                label: 'Stop Hour (0-23)',
                conditional: 'triggerMode === "time-driven"',
                info: config.triggerMode === 'time-driven' ? `This will result in ${config.stopHour - config.startHour} runs per day` : ''
              },
              { 
                key: 'maxRunsPerDay', 
                value: config.maxRunsPerDay, 
                label: 'Max Runs Per Day',
                conditional: 'triggerMode === "count-driven"',
                info: config.triggerMode === 'count-driven' ? `Window will be ${config.maxRunsPerDay * 0.5} hours (from ${config.startHour}:00 to ${config.startHour + (config.maxRunsPerDay * 0.5)}:00)` : ''
              },
              { key: 'cron', value: config.cron, label: 'Cron Schedule (legacy)', hidden: true }
            ],
            adminOnly: false,
            isReadOnly: !isAdmin,
            status: 'active',
            lastModified: new Date().toISOString()
          },
          system: {
            key: 'system',
            name: 'System Configuration',
            description: 'Advanced system settings and preferences',
            icon: '⚙️',
            settingsCount: 4,
            settings: [
              { key: 'sleepBetweenRequest', value: config.sleepBetweenRequest, label: 'Sleep Between Requests (ms)' },
              { key: 'manualMode', value: config.manualMode, label: 'Manual Mode' },
              { key: 'logSheetId', value: config.logSheetId, label: 'Log Sheet ID' },
              { key: 'webhookPin', value: config.webhookPin, label: 'Webhook PIN' }
            ],
            adminOnly: true,
            isReadOnly: false,
            status: 'active',
            lastModified: new Date().toISOString()
          },
          users: {
            key: 'users',
            name: 'User Management',
            description: 'Manage users and access permissions',
            icon: '👥',
            settingsCount: 2,
            settings: [
              { key: 'adminEmails', value: config.adminEmails, label: 'Admin Emails' },
              { key: 'webhookPin', value: config.webhookPin, label: 'Webhook PIN' }
            ],
            adminOnly: true,
            isReadOnly: false,
            status: 'active',
            lastModified: new Date().toISOString()
          },
          'send-summary': {
            key: 'send-summary',
            name: 'Send Summary',
            description: 'Send daily or weekly summary to Slack now',
            icon: '📤',
            settingsCount: 0,
            isAction: true,
            adminOnly: false,
            isReadOnly: false,
            status: 'active',
            lastModified: new Date().toISOString()
          }
        }
      };
      
      this._logger.log('Configuration categories retrieved successfully');
      return categories;
      
    } catch (error) {
      this._logger.error('Failed to get configuration categories', error);
      return {
        success: false,
        message: 'Failed to load configuration categories',
        error: error.message
      };
    }
  }
  
  /**
   * Get recent activity for user
   * @param {string} userEmail - User email
   * @returns {Object} Recent activity
   */
  getRecentActivity(userEmail) {
    try {
      this._logger.log(`Getting recent activity for ${userEmail}`);
      
      // Try to load real activities from Script Properties
      let activities = [];
      try {
        const props = PropertiesService.getScriptProperties();
        const activitiesJson = props.getProperty('dashboardActivities') || '[]';
        const storedActivities = JSON.parse(activitiesJson);
        
        // Map stored activities to dashboard format
        activities = storedActivities.slice(0, 6).map(activity => {
          // Determine icon based on action type
          let icon = '⚙️';
          if (activity.action === 'config.update') icon = '⚙️';
          else if (activity.action === 'notification.sent') icon = '📢';
          else if (activity.action === 'user.login') icon = '🔐';
          else if (activity.action === 'trigger.executed') icon = '⏰';
          else if (activity.action === 'config.reset') icon = '🔄';
          
          return {
            id: activity.id || Date.now().toString(),
            timestamp: activity.timestamp || new Date().toISOString(),
            action: activity.action || 'unknown',
            description: activity.description || 'Activity logged',
            user: activity.user || userEmail,
            icon: icon,
            status: activity.status || 'success'
          };
        });
      } catch (error) {
        this._logger.log('No stored activities found, using default');
      }
      
      // If no activities found, use default mock data
      if (activities.length === 0) {
        activities = [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            action: 'dashboard.load',
            description: 'Dashboard loaded successfully',
            user: userEmail,
            icon: '📊',
            status: 'success'
          }
        ];
      }
      
      const result = {
        success: true,
        activities: activities
      };
      
      this._logger.log('Recent activity retrieved successfully');
      return result;
      
    } catch (error) {
      this._logger.error('Failed to get recent activity', error);
      return {
        success: false,
        message: 'Failed to load recent activity',
        error: error.message
      };
    }
  }
  
  /**
   * Authenticate user
   * @param {string} email - User email
   * @param {string} password - User password (optional for SSO)
   * @returns {Object} Authentication result
   */
  async authenticateUserViaAPI(email, password = null) {
    try {
      this._logger.log(`Authenticating user: ${email}`);
      
      // Use the proper AuthAPI instead of mock authentication
      const domain = email.split('@')[1];
      const options = password ? { password: password } : {};
      
      // Call the AuthService directly to avoid circular reference
      // This bypasses the global authenticateUser function that causes the loop
      const authService = initializeAuthService();
      const authResult = await authService.authenticateUser(email, domain, options);
      
      if (authResult.success) {
        this._logger.log('User authenticated successfully');
        return authResult;
      } else {
        this._logger.log(`Authentication failed: ${authResult.message}`);
        return authResult;
      }
      
    } catch (error) {
      this._logger.error('Authentication failed', error);
      return {
        success: false,
        message: 'Authentication failed',
        error: error.message
      };
    }
  }
  
  /**
   * Get latest summary information
   * @param {string} userEmail - User email
   * @returns {Object} Latest summary data
   */
  getLatestSummary(userEmail) {
    try {
      this._logger.log(`Getting latest summary for ${userEmail}`);
      
      // Get last sent summaries from Script Properties
      const props = PropertiesService.getScriptProperties();
      const lastDailyJson = props.getProperty('lastDailySummary') || '{}';
      const lastWeeklyJson = props.getProperty('lastWeeklySummary') || '{}';
      
      const lastDaily = JSON.parse(lastDailyJson);
      const lastWeekly = JSON.parse(lastWeeklyJson);
      
      // Build summary info
      const summaryInfo = {
        success: true,
        daily: {
          lastSent: lastDaily.timestamp || 'Never',
          totalChanges: lastDaily.summary?.total || 0,
          created: lastDaily.summary?.byType?.created || 0,
          modified: lastDaily.summary?.byType?.modified || 0,
          date: lastDaily.date || 'N/A',
          status: lastDaily.timestamp ? 'active' : 'inactive'
        },
        weekly: {
          lastSent: lastWeekly.timestamp || 'Never',
          totalChanges: lastWeekly.summary?.total || 0,
          created: lastWeekly.summary?.byType?.created || 0,
          modified: lastWeekly.summary?.byType?.modified || 0,
          weekRange: lastWeekly.weekRange || 'N/A',
          status: lastWeekly.timestamp ? 'active' : 'inactive'
        }
      };
      
      this._logger.log('Latest summary retrieved successfully');
      return summaryInfo;
      
    } catch (error) {
      this._logger.error('Failed to get latest summary', error);
      return {
        success: false,
        message: 'Failed to load latest summary',
        error: error.message
      };
    }
  }
  
  /**
   * Logout user
   * @param {string} sessionId - Session ID
   * @returns {Object} Logout result
   */
  logoutUser(sessionId) {
    try {
      this._logger.log(`Logging out session: ${sessionId}`);
      
      const logoutResult = {
        success: true,
        message: 'Logged out successfully',
        sessionId: sessionId
      };
      
      this._logger.log('User logged out successfully');
      return logoutResult;
      
    } catch (error) {
      this._logger.error('Logout failed', error);
      return {
        success: false,
        message: 'Logout failed',
        error: error.message
      };
    }
  }
  
  /**
   * Create default logger
   * @returns {Object} Logger object
   */
  _createDefaultLogger() {
    return {
      log: (message) => Logger.log(`[DashboardAPI] ${message}`),
      error: (message, error) => Logger.log(`[DashboardAPI ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[DashboardAPI WARNING] ${message}`)
    };
  }
}

// Global functions for Google Apps Script
function getUserInfo(userEmail, sessionId) {
  const dashboardAPI = new DashboardAPI();
  return dashboardAPI.getUserInfo(userEmail, sessionId);
}

function getSystemStatus(userEmail) {
  const dashboardAPI = new DashboardAPI();
  return dashboardAPI.getSystemStatus(userEmail);
}

function getConfigurationCategories(userEmail) {
  const dashboardAPI = new DashboardAPI();
  return dashboardAPI.getConfigurationCategories(userEmail);
}

function getRecentActivity(userEmail) {
  const dashboardAPI = new DashboardAPI();
  return dashboardAPI.getRecentActivity(userEmail);
}

// Note: authenticateUser is defined in AuthAPI.js, not here
// This prevents conflicts between the two different function signatures

function logoutUser(sessionId) {
  const dashboardAPI = new DashboardAPI();
  // Pass sessionId even if undefined - let the method handle it
  return dashboardAPI.logoutUser(sessionId || '');
}
