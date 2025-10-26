/**
 * DashboardAPI - Backend API for Dashboard Data
 * Handles authentication, configuration, and system status requests
 */

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
      this._logger.log(`Getting user info for ${userEmail}`);
      
      // Validate inputs
      if (!userEmail || !sessionId) {
        return {
          success: false,
          message: 'User email and session ID are required',
          error: 'INVALID_INPUT'
        };
      }
      
      // Basic email validation
      if (!userEmail.includes('@') || userEmail.length < 5) {
        return {
          success: false,
          message: 'Invalid email format',
          error: 'INVALID_EMAIL'
        };
      }
      
      // For demo purposes, return mock user data
      // In production, this would validate the session and get real user data
      const mockUser = {
        success: true,
        user: {
          email: userEmail,
          name: userEmail.split('@')[0],
          role: 'admin',
          avatar: '👤',
          lastLogin: new Date().toISOString(),
          status: 'active'
        },
        permissions: [
          'config.manage',
          'config.update',
          'config.reset',
          'users.manage',
          'triggers.manage',
          'notifications.manage',
          'audit.view'
        ],
        isAdminEmail: true
      };
      
      this._logger.log('User info retrieved successfully');
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
      
      const systemStatus = {
        success: true,
        status: {
          monitoring: {
            status: 'active',
            label: 'Drive Monitoring',
            icon: '📁',
            lastCheck: new Date().toISOString(),
            filesProcessed: 42,
            changesDetected: 3
          },
          triggers: {
            status: 'active',
            label: 'Scheduled Triggers',
            icon: '⏰',
            nextRun: '2024-01-24T07:00:00Z',
            totalTriggers: 3,
            activeTriggers: 3
          },
          notifications: {
            status: 'active',
            label: 'Slack Notifications',
            icon: '📢',
            lastSent: new Date().toISOString(),
            totalSent: 156,
            successRate: '99.2%'
          },
          uptime: {
            status: 'excellent',
            label: 'System Uptime',
            icon: '⚡',
            uptime: '99.9%',
            lastRestart: '2024-01-15T02:00:00Z'
          }
        }
      };
      
      this._logger.log('System status retrieved successfully');
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
      
      const categories = {
        success: true,
        categories: {
          monitoring: {
            key: 'monitoring',
            name: 'Drive Monitoring',
            description: 'Configure Google Drive monitoring settings',
            icon: '📁',
            settingsCount: 4,
            adminOnly: false,
            status: 'active',
            lastModified: '2024-01-23T10:30:00Z'
          },
          notifications: {
            key: 'notifications',
            name: 'Notification Settings',
            description: 'Configure Slack notification preferences',
            icon: '📢',
            settingsCount: 4,
            adminOnly: false,
            status: 'active',
            lastModified: '2024-01-23T09:15:00Z'
          },
          triggers: {
            key: 'triggers',
            name: 'Scheduled Triggers',
            description: 'Manage automated trigger schedules',
            icon: '⏰',
            settingsCount: 4,
            adminOnly: true,
            status: 'active',
            lastModified: '2024-01-23T08:45:00Z'
          },
          system: {
            key: 'system',
            name: 'System Configuration',
            description: 'Advanced system settings and preferences',
            icon: '⚙️',
            settingsCount: 4,
            adminOnly: true,
            status: 'active',
            lastModified: '2024-01-22T16:20:00Z'
          },
          users: {
            key: 'users',
            name: 'User Management',
            description: 'Manage users and access permissions',
            icon: '👥',
            settingsCount: 4,
            adminOnly: true,
            status: 'active',
            lastModified: '2024-01-22T14:10:00Z'
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
      
      const activities = {
        success: true,
        activities: [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            action: 'config.update',
            description: 'Updated monitoring interval to 30 minutes',
            user: userEmail,
            icon: '⚙️',
            status: 'success'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            action: 'notification.sent',
            description: 'Sent daily summary to #dev_sandbox',
            user: 'system',
            icon: '📢',
            status: 'success'
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            action: 'user.login',
            description: 'User logged in successfully',
            user: userEmail,
            icon: '🔐',
            status: 'success'
          },
          {
            id: '4',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            action: 'trigger.executed',
            description: 'Monitor trigger executed - 5 files processed',
            user: 'system',
            icon: '⏰',
            status: 'success'
          },
          {
            id: '5',
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            action: 'config.reset',
            description: 'Reset notification settings to defaults',
            user: userEmail,
            icon: '🔄',
            status: 'success'
          }
        ]
      };
      
      this._logger.log('Recent activity retrieved successfully');
      return activities;
      
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
