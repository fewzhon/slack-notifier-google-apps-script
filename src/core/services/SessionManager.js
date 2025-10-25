/**
 * SessionManager.js
 * Session management service for user authentication
 * 
 * This service manages user sessions, including creation, validation,
 * timeout handling, and security features.
 */

/**
 * Session Manager Service
 * @class SessionManager
 */
class SessionManager {
  /**
   * Create a new SessionManager instance
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {number} options.timeoutMinutes - Session timeout in minutes
   */
  constructor(options = {}) {
    this._logger = options.logger || this._createDefaultLogger();
    this._timeoutMinutes = options.timeoutMinutes || 30;
    this._sessions = new Map(); // In-memory session storage
    this._cleanupInterval = null;
  }

  /**
   * Create default logger for Google Apps Script environment
   * @returns {Object} Logger instance
   */
  _createDefaultLogger() {
    return {
      log: function(message, context = {}) {
        Logger.log(`[SessionManager] ${message}`);
      },
      error: function(message, error, context = {}) {
        Logger.log(`[SessionManager ERROR] ${message}: ${error ? error.message : ''}`);
      },
      warn: function(message, context = {}) {
        Logger.log(`[SessionManager WARNING] ${message}`);
      }
    };
  }

  /**
   * Create new user session
   * @param {string} userEmail - User email address
   * @param {string} userRole - User role
   * @param {Object} options - Session options
   * @returns {Promise<Object>} Session data
   */
  async createSession(userEmail, userRole, options = {}) {
    try {
      if (!userEmail || !userRole) {
        throw new Error('User email and role are required');
      }
      
      // Generate unique session ID
      const sessionId = this._generateSessionId();
      
      // Create session data
      const session = {
        id: sessionId,
        userEmail: userEmail,
        userRole: userRole,
        createdAt: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + (this._timeoutMinutes * 60 * 1000)),
        ipAddress: options.ipAddress || 'unknown',
        userAgent: options.userAgent || 'unknown',
        isActive: true
      };
      
      // Store session
      this._sessions.set(sessionId, session);
      
      // Start cleanup if not already running
      this._startCleanup();
      
      this._logger.log(`Created session for ${userEmail}: ${sessionId}`);
      
      return {
        sessionId: sessionId,
        userEmail: userEmail,
        userRole: userRole,
        expiresAt: session.expiresAt,
        message: 'Session created successfully'
      };
      
    } catch (error) {
      this._logger.error('Failed to create session', error);
      throw error;
    }
  }

  /**
   * Validate session
   * @param {string} sessionId - Session ID to validate
   * @returns {Promise<Object|null>} Session data or null if invalid
   */
  async validateSession(sessionId) {
    try {
      if (!sessionId) {
        return null;
      }
      
      // Clean up expired sessions before validation
      this._cleanupExpiredSessions();
      
      const session = this._sessions.get(sessionId);
      
      if (!session) {
        this._logger.warn(`Session not found: ${sessionId}`);
        return null;
      }
      
      // Check if session is active
      if (!session.isActive) {
        this._logger.warn(`Session is inactive: ${sessionId}`);
        return null;
      }
      
      // Check if session has expired
      if (new Date() > session.expiresAt) {
        this._logger.warn(`Session expired: ${sessionId}`);
        this._sessions.delete(sessionId);
        return null;
      }
      
      // Update last activity
      session.lastActivity = new Date();
      
      this._logger.log(`Session validated: ${sessionId}`);
      
      return session;
      
    } catch (error) {
      this._logger.error('Session validation failed', error);
      return null;
    }
  }

  /**
   * Get session data
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} Session data or null
   */
  async getSession(sessionId) {
    try {
      if (!sessionId) {
        return null;
      }
      
      return this._sessions.get(sessionId) || null;
      
    } catch (error) {
      this._logger.error('Failed to get session', error);
      return null;
    }
  }

  /**
   * Invalidate session
   * @param {string} sessionId - Session ID to invalidate
   * @returns {Promise<boolean>} Success status
   */
  async invalidateSession(sessionId) {
    try {
      if (!sessionId) {
        return false;
      }
      
      const session = this._sessions.get(sessionId);
      
      if (session) {
        session.isActive = false;
        this._sessions.delete(sessionId);
        this._logger.log(`Session invalidated: ${sessionId}`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      this._logger.error('Failed to invalidate session', error);
      return false;
    }
  }

  /**
   * Extend session timeout
   * @param {string} sessionId - Session ID
   * @param {number} additionalMinutes - Additional minutes to extend
   * @returns {Promise<boolean>} Success status
   */
  async extendSession(sessionId, additionalMinutes = 30) {
    try {
      const session = this._sessions.get(sessionId);
      
      if (!session || !session.isActive) {
        return false;
      }
      
      // Extend expiration time
      session.expiresAt = new Date(Date.now() + (additionalMinutes * 60 * 1000));
      session.lastActivity = new Date();
      
      this._logger.log(`Extended session: ${sessionId} by ${additionalMinutes} minutes`);
      
      return true;
      
    } catch (error) {
      this._logger.error('Failed to extend session', error);
      return false;
    }
  }

  /**
   * Get all active sessions
   * @returns {Promise<Array<Object>>} List of active sessions
   */
  async getActiveSessions() {
    try {
      const activeSessions = [];
      
      for (const [sessionId, session] of this._sessions) {
        if (session.isActive && new Date() <= session.expiresAt) {
          activeSessions.push({
            sessionId: sessionId,
            userEmail: session.userEmail,
            userRole: session.userRole,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            expiresAt: session.expiresAt
          });
        }
      }
      
      return activeSessions;
      
    } catch (error) {
      this._logger.error('Failed to get active sessions', error);
      return [];
    }
  }

  /**
   * Get sessions for specific user
   * @param {string} userEmail - User email
   * @returns {Promise<Array<Object>>} User sessions
   */
  async getUserSessions(userEmail) {
    try {
      const userSessions = [];
      
      for (const [sessionId, session] of this._sessions) {
        if (session.userEmail === userEmail && session.isActive) {
          userSessions.push({
            sessionId: sessionId,
            userEmail: session.userEmail,
            userRole: session.userRole,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            expiresAt: session.expiresAt
          });
        }
      }
      
      return userSessions;
      
    } catch (error) {
      this._logger.error('Failed to get user sessions', error);
      return [];
    }
  }

  /**
   * Invalidate all sessions for user
   * @param {string} userEmail - User email
   * @returns {Promise<number>} Number of sessions invalidated
   */
  async invalidateUserSessions(userEmail) {
    try {
      let invalidatedCount = 0;
      
      for (const [sessionId, session] of this._sessions) {
        if (session.userEmail === userEmail && session.isActive) {
          session.isActive = false;
          this._sessions.delete(sessionId);
          invalidatedCount++;
        }
      }
      
      this._logger.log(`Invalidated ${invalidatedCount} sessions for ${userEmail}`);
      
      return invalidatedCount;
      
    } catch (error) {
      this._logger.error('Failed to invalidate user sessions', error);
      return 0;
    }
  }

  /**
   * Generate unique session ID
   * @returns {string} Unique session ID
   */
  _generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `sess_${timestamp}_${randomPart}`;
  }

  /**
   * Start session cleanup process
   * @returns {void}
   */
  _startCleanup() {
    if (this._cleanupInterval) {
      return; // Already running
    }
    
    // In Google Apps Script, we'll use a different approach
    // We'll clean up expired sessions on each session operation
    // instead of using setInterval which is not available
    
    this._logger.log('Session cleanup will be performed on-demand');
    
    // Mark cleanup as "started" for tracking purposes
    this._cleanupInterval = 'on-demand';
  }

  /**
   * Clean up expired sessions
   * @returns {void}
   */
  _cleanupExpiredSessions() {
    try {
      const now = new Date();
      let cleanedCount = 0;
      
      for (const [sessionId, session] of this._sessions) {
        if (now > session.expiresAt) {
          this._sessions.delete(sessionId);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        this._logger.log(`Cleaned up ${cleanedCount} expired sessions`);
      }
      
    } catch (error) {
      this._logger.error('Session cleanup failed', error);
    }
  }

  /**
   * Stop session cleanup process
   * @returns {void}
   */
  stopCleanup() {
    if (this._cleanupInterval) {
      this._cleanupInterval = null;
      this._logger.log('Stopped session cleanup process');
    }
  }

  /**
   * Get session statistics
   * @returns {Promise<Object>} Session statistics
   */
  async getSessionStats() {
    try {
      const totalSessions = this._sessions.size;
      let activeSessions = 0;
      let expiredSessions = 0;
      
      const now = new Date();
      
      for (const [sessionId, session] of this._sessions) {
        if (session.isActive) {
          if (now <= session.expiresAt) {
            activeSessions++;
          } else {
            expiredSessions++;
          }
        }
      }
      
      return {
        total: totalSessions,
        active: activeSessions,
        expired: expiredSessions,
        timeoutMinutes: this._timeoutMinutes
      };
      
    } catch (error) {
      this._logger.error('Failed to get session stats', error);
      return {
        total: 0,
        active: 0,
        expired: 0,
        timeoutMinutes: this._timeoutMinutes
      };
    }
  }

  /**
   * Initialize session manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this._logger.log('Initializing SessionManager...');
      
      // Start cleanup process
      this._startCleanup();
      
      this._logger.log('SessionManager initialized successfully');
      
    } catch (error) {
      this._logger.error('SessionManager initialization failed', error);
      throw error;
    }
  }
}

/**
 * Global session management functions
 */

/**
 * Create session (global function)
 * @param {string} userEmail - User email
 * @param {string} userRole - User role
 * @returns {Promise<Object>} Session data
 */
async function createUserSession(userEmail, userRole) {
  try {
    const sessionManager = new SessionManager();
    await sessionManager.initialize();
    
    return await sessionManager.createSession(userEmail, userRole);
    
  } catch (error) {
    Logger.log(`Session creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Validate session (global function)
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session data
 */
async function validateUserSession(sessionId) {
  try {
    const sessionManager = new SessionManager();
    await sessionManager.initialize();
    
    return await sessionManager.validateSession(sessionId);
    
  } catch (error) {
    Logger.log(`Session validation failed: ${error.message}`);
    return null;
  }
}

/**
 * Get session stats (global function)
 * @returns {Promise<Object>} Session statistics
 */
async function getSessionStats() {
  try {
    const sessionManager = new SessionManager();
    await sessionManager.initialize();
    
    return await sessionManager.getSessionStats();
    
  } catch (error) {
    Logger.log(`Failed to get session stats: ${error.message}`);
    return {
      total: 0,
      active: 0,
      expired: 0,
      timeoutMinutes: 30
    };
  }
}
