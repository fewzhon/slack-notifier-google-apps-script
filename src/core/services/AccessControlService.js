/**
 * AccessControlService - Main authorization service
 * Central service that coordinates all access control operations
 */

class AccessControlService {
  constructor(dependencies = {}) {
    this._logger = dependencies.logger || this._createDefaultLogger();
    this._roleManager = dependencies.roleManager;
    this._permissionManager = dependencies.permissionManager;
    this._userRoleService = dependencies.userRoleService;
    this._userRepository = dependencies.userRepository;
    this._auditLogger = dependencies.auditLogger;
    
    this._logger.log('[AccessControlService] AccessControlService initialized');
  }
  
  /**
   * Initialize the access control service
   * @param {Object} dependencies - Service dependencies
   * @returns {Promise<Object>} Initialization result
   */
  async initialize(dependencies = {}) {
    try {
      this._logger.log('Initializing AccessControlService...');
      
      // Initialize dependencies if not provided
      if (!this._roleManager) {
        this._roleManager = dependencies.roleManager || new RoleManager({ logger: this._logger });
      }
      
      if (!this._permissionManager) {
        this._permissionManager = dependencies.permissionManager || new PermissionManager({ 
          logger: this._logger,
          roleManager: this._roleManager 
        });
      }
      
      if (!this._userRoleService) {
        this._userRoleService = dependencies.userRoleService || new UserRoleService({
          logger: this._logger,
          userRepository: this._userRepository,
          roleManager: this._roleManager,
          permissionManager: this._permissionManager,
          auditLogger: this._auditLogger
        });
      }
      
      this._logger.log('AccessControlService initialized successfully');
      
      return {
        success: true,
        message: 'AccessControlService initialized successfully',
        components: {
          roleManager: !!this._roleManager,
          permissionManager: !!this._permissionManager,
          userRoleService: !!this._userRoleService
        }
      };
      
    } catch (error) {
      this._logger.error('Failed to initialize AccessControlService', error);
      throw error;
    }
  }
  
  /**
   * Authorize user access to resource
   * @param {string} email - User email
   * @param {string} resource - Resource being accessed
   * @param {Object} context - Additional context
   * @returns {Object} Authorization result
   */
  async authorize(email, resource, context = {}) {
    try {
      this._logger.log(`Authorizing access for ${email} to ${resource}`);
      
      const result = await this._userRoleService.checkUserAccess(email, resource, context);
      
      // Log authorization attempt
      if (this._auditLogger) {
        await this._auditLogger.logAuthorizationAttempt(
          email,
          resource,
          result.authorized,
          result.reason
        );
      }
      
      return {
        success: true,
        authorized: result.authorized,
        reason: result.reason,
        userRole: result.userRole,
        resource: resource,
        context: context
      };
      
    } catch (error) {
      this._logger.error(`Authorization failed for ${email}`, error);
      return {
        success: false,
        authorized: false,
        reason: error.message,
        error: error.message
      };
    }
  }
  
  /**
   * Check if user can perform action
   * @param {string} email - User email
   * @param {string} action - Action being performed
   * @param {string} resource - Resource being accessed
   * @param {Object} context - Additional context
   * @returns {Object} Authorization result
   */
  async canPerformAction(email, action, resource, context = {}) {
    const resourceKey = `${resource}.${action}`;
    return await this.authorize(email, resourceKey, context);
  }
  
  /**
   * Get user's accessible resources
   * @param {string} email - User email
   * @returns {Object} Accessible resources result
   */
  async getUserAccessibleResources(email) {
    try {
      const roleInfo = await this._userRoleService.getUserRoleInfo(email);
      
      if (!roleInfo.success) {
        throw new Error(roleInfo.message);
      }
      
      return {
        success: true,
        user: roleInfo.user,
        role: roleInfo.role,
        permissions: roleInfo.permissions,
        accessibleResources: roleInfo.accessibleResources,
        isAdminEmail: roleInfo.isAdminEmail
      };
      
    } catch (error) {
      this._logger.error(`Failed to get accessible resources for ${email}`, error);
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }
  
  /**
   * Assign role to user
   * @param {string} assignerEmail - Email of user making assignment
   * @param {string} targetEmail - Email of user receiving role
   * @param {string} newRole - Role to assign
   * @param {string} reason - Reason for assignment
   * @returns {Object} Assignment result
   */
  async assignRole(assignerEmail, targetEmail, newRole, reason = '') {
    return await this._userRoleService.assignRole(assignerEmail, targetEmail, newRole, reason);
  }
  
  /**
   * Get all users with roles (admin function)
   * @param {string} requesterEmail - Email of user requesting
   * @returns {Object} Users list result
   */
  async getUsersWithRoles(requesterEmail) {
    return await this._userRoleService.getUsersWithRoles(requesterEmail);
  }
  
  /**
   * Get role hierarchy
   * @returns {Object} Role hierarchy result
   */
  async getRoleHierarchy() {
    return await this._userRoleService.getRoleHierarchy();
  }
  
  /**
   * Get users by role
   * @param {string} role - Role name
   * @param {string} requesterEmail - Email of user requesting
   * @returns {Object} Users by role result
   */
  async getUsersByRole(role, requesterEmail) {
    return await this._userRoleService.getUsersByRole(role, requesterEmail);
  }
  
  /**
   * Validate role change
   * @param {string} requesterEmail - Email of user making request
   * @param {string} targetEmail - Email of user being changed
   * @param {string} newRole - New role
   * @returns {Object} Validation result
   */
  async validateRoleChange(requesterEmail, targetEmail, newRole) {
    return await this._userRoleService.validateRoleChange(requesterEmail, targetEmail, newRole);
  }
  
  /**
   * Check if user is admin
   * @param {string} email - User email
   * @returns {boolean} True if user is admin
   */
  async isAdmin(email) {
    try {
      const user = await this._userRepository.getUserByEmail(email);
      if (!user) {
        return false;
      }
      
      return user.role === 'admin' || user.role === 'owner' || this._roleManager.isAdminEmail(email);
    } catch (error) {
      this._logger.error(`Failed to check admin status for ${email}`, error);
      return false;
    }
  }
  
  /**
   * Check if user is owner
   * @param {string} email - User email
   * @returns {boolean} True if user is owner
   */
  async isOwner(email) {
    try {
      const user = await this._userRepository.getUserByEmail(email);
      if (!user) {
        return false;
      }
      
      return user.role === 'owner';
    } catch (error) {
      this._logger.error(`Failed to check owner status for ${email}`, error);
      return false;
    }
  }
  
  /**
   * Get user's role level
   * @param {string} email - User email
   * @returns {number} Role level (higher = more privileges)
   */
  async getUserRoleLevel(email) {
    try {
      const user = await this._userRepository.getUserByEmail(email);
      if (!user) {
        return 0;
      }
      
      return this._roleManager.getRoleLevel(user.role);
    } catch (error) {
      this._logger.error(`Failed to get role level for ${email}`, error);
      return 0;
    }
  }
  
  /**
   * Check if user can manage another user
   * @param {string} managerEmail - Email of potential manager
   * @param {string} targetEmail - Email of user being managed
   * @returns {Object} Management permission result
   */
  async canManageUser(managerEmail, targetEmail) {
    try {
      const manager = await this._userRepository.getUserByEmail(managerEmail);
      const target = await this._userRepository.getUserByEmail(targetEmail);
      
      if (!manager || !target) {
        return {
          canManage: false,
          reason: 'User not found'
        };
      }
      
      const canManageRole = this._roleManager.canManageRole(manager.role, target.role);
      const hasPermission = this._roleManager.roleHasPermission(manager.role, 'users.manage');
      
      return {
        canManage: canManageRole && hasPermission,
        reason: canManageRole && hasPermission ? 'Can manage user' : 'Insufficient permissions',
        managerRole: manager.role,
        targetRole: target.role,
        managerLevel: this._roleManager.getRoleLevel(manager.role),
        targetLevel: this._roleManager.getRoleLevel(target.role)
      };
      
    } catch (error) {
      this._logger.error(`Failed to check user management permission`, error);
      return {
        canManage: false,
        reason: error.message
      };
    }
  }
  
  /**
   * Get system access summary
   * @param {string} requesterEmail - Email of user requesting summary
   * @returns {Object} System access summary
   */
  async getSystemAccessSummary(requesterEmail) {
    try {
      // Check if requester has permission to view system summary
      const accessCheck = await this.authorize(requesterEmail, 'system.manage');
      if (!accessCheck.authorized) {
        throw new Error('Insufficient permissions to view system summary');
      }
      
      const users = await this._userRepository.getAllUsers();
      const roleHierarchy = this._roleManager.getRoleHierarchy();
      
      // Count users by role
      const usersByRole = {};
      roleHierarchy.forEach(role => {
        usersByRole[role.name] = users.filter(user => user.role === role.name).length;
      });
      
      // Get admin emails
      const adminEmails = this._roleManager.getAdminEmails();
      
      return {
        success: true,
        summary: {
          totalUsers: users.length,
          usersByRole: usersByRole,
          roleHierarchy: roleHierarchy,
          adminEmails: adminEmails,
          totalRoles: roleHierarchy.length
        }
      };
      
    } catch (error) {
      this._logger.error('Failed to get system access summary', error);
      return {
        success: false,
        message: error.message,
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
      log: (message) => Logger.log(`[AccessControlService] ${message}`),
      error: (message, error) => Logger.log(`[AccessControlService ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[AccessControlService WARNING] ${message}`)
    };
  }
}
