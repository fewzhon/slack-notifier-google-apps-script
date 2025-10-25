/**
 * UserRoleService - User-role assignment and validation
 * Handles user role assignments, role changes, and role-based user operations
 */

class UserRoleService {
  constructor(dependencies = {}) {
    this._logger = dependencies.logger || this._createDefaultLogger();
    this._userRepository = dependencies.userRepository;
    this._roleManager = dependencies.roleManager;
    this._permissionManager = dependencies.permissionManager;
    this._auditLogger = dependencies.auditLogger;
    
    this._logger.log('[UserRoleService] UserRoleService initialized');
  }
  
  /**
   * Assign role to user
   * @param {string} assignerEmail - Email of user making assignment
   * @param {string} targetEmail - Email of user receiving role
   * @param {string} newRole - Role to assign
   * @param {string} reason - Reason for role assignment
   * @returns {Object} Assignment result
   */
  async assignRole(assignerEmail, targetEmail, newRole, reason = '') {
    try {
      this._logger.log(`Assigning role '${newRole}' to ${targetEmail} by ${assignerEmail}`);
      
      // Get assigner's current role
      const assigner = await this._userRepository.getUserByEmail(assignerEmail);
      if (!assigner) {
        throw new Error('Assigner user not found');
      }
      
      // Get target user
      const targetUser = await this._userRepository.getUserByEmail(targetEmail);
      if (!targetUser) {
        throw new Error('Target user not found');
      }
      
      // Validate role assignment
      const validation = this._roleManager.validateRoleAssignment(
        assigner.role, 
        newRole, 
        targetEmail
      );
      
      if (!validation.valid) {
        throw new Error(`Role assignment validation failed: ${validation.reason}`);
      }
      
      // Update user role
      const updateData = {
        role: newRole,
        updatedAt: new Date(),
        updatedBy: assignerEmail
      };
      
      const updatedUser = await this._userRepository.updateUser(targetEmail, updateData);
      
      // Log the role assignment
      if (this._auditLogger) {
        await this._auditLogger.logRoleAssignment(
          assignerEmail,
          targetEmail,
          targetUser.role,
          newRole,
          reason
        );
      }
      
      this._logger.log(`Role '${newRole}' successfully assigned to ${targetEmail}`);
      
      return {
        success: true,
        message: `Role '${newRole}' assigned to ${targetEmail}`,
        previousRole: targetUser.role,
        newRole: newRole,
        user: updatedUser
      };
      
    } catch (error) {
      this._logger.error(`Failed to assign role to ${targetEmail}`, error);
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }
  
  /**
   * Get user's current role and permissions
   * @param {string} email - User email
   * @returns {Object} User role information
   */
  async getUserRoleInfo(email) {
    try {
      const user = await this._userRepository.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      
      const role = this._roleManager.getRole(user.role);
      const permissions = this._roleManager.getRolePermissions(user.role);
      const accessibleResources = this._permissionManager.getAccessibleResources(user.role);
      
      return {
        success: true,
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        },
        role: role,
        permissions: permissions,
        accessibleResources: accessibleResources,
        isAdminEmail: this._roleManager.isAdminEmail(email)
      };
      
    } catch (error) {
      this._logger.error(`Failed to get role info for ${email}`, error);
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }
  
  /**
   * Check if user can perform action
   * @param {string} email - User email
   * @param {string} resource - Resource being accessed
   * @param {Object} context - Additional context
   * @returns {Object} Authorization result
   */
  async checkUserAccess(email, resource, context = {}) {
    try {
      const user = await this._userRepository.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.status !== 'active') {
        return {
          authorized: false,
          reason: 'User account is not active',
          userRole: user.role
        };
      }
      
      const accessResult = this._permissionManager.validateAccess(
        user.role, 
        resource, 
        { ...context, userEmail: email }
      );
      
      return {
        authorized: accessResult.authorized,
        reason: accessResult.reason,
        userRole: user.role,
        requiredPermission: accessResult.requiredPermission,
        adminPrivilege: accessResult.adminPrivilege || false
      };
      
    } catch (error) {
      this._logger.error(`Failed to check access for ${email}`, error);
      return {
        authorized: false,
        reason: error.message,
        error: error.message
      };
    }
  }
  
  /**
   * Get all users with their roles
   * @param {string} requesterEmail - Email of user requesting the list
   * @returns {Object} Users list result
   */
  async getUsersWithRoles(requesterEmail) {
    try {
      // Check if requester has permission to view users
      const accessCheck = await this.checkUserAccess(requesterEmail, 'users.list');
      if (!accessCheck.authorized) {
        throw new Error(`Access denied: ${accessCheck.reason}`);
      }
      
      const users = await this._userRepository.getAllUsers();
      
      const usersWithRoles = users.map(user => ({
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        roleInfo: this._roleManager.getRole(user.role)
      }));
      
      return {
        success: true,
        users: usersWithRoles,
        total: usersWithRoles.length
      };
      
    } catch (error) {
      this._logger.error(`Failed to get users with roles`, error);
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }
  
  /**
   * Promote user to higher role
   * @param {string} promoterEmail - Email of user promoting
   * @param {string} targetEmail - Email of user being promoted
   * @param {string} newRole - New role to assign
   * @param {string} reason - Reason for promotion
   * @returns {Object} Promotion result
   */
  async promoteUser(promoterEmail, targetEmail, newRole, reason = '') {
    return await this.assignRole(promoterEmail, targetEmail, newRole, reason);
  }
  
  /**
   * Demote user to lower role
   * @param {string} demoterEmail - Email of user demoting
   * @param {string} targetEmail - Email of user being demoted
   * @param {string} newRole - New role to assign
   * @param {string} reason - Reason for demotion
   * @returns {Object} Demotion result
   */
  async demoteUser(demoterEmail, targetEmail, newRole, reason = '') {
    return await this.assignRole(demoterEmail, targetEmail, newRole, reason);
  }
  
  /**
   * Get role hierarchy for display
   * @returns {Object} Role hierarchy information
   */
  getRoleHierarchy() {
    try {
      const hierarchy = this._roleManager.getRoleHierarchy();
      
      return {
        success: true,
        hierarchy: hierarchy,
        totalRoles: hierarchy.length
      };
      
    } catch (error) {
      this._logger.error('Failed to get role hierarchy', error);
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }
  
  /**
   * Get users by role
   * @param {string} role - Role name
   * @param {string} requesterEmail - Email of user requesting
   * @returns {Object} Users by role result
   */
  async getUsersByRole(role, requesterEmail) {
    try {
      // Check if requester has permission
      const accessCheck = await this.checkUserAccess(requesterEmail, 'users.list');
      if (!accessCheck.authorized) {
        throw new Error(`Access denied: ${accessCheck.reason}`);
      }
      
      const users = await this._userRepository.getAllUsers();
      const usersWithRole = users.filter(user => user.role === role);
      
      return {
        success: true,
        role: role,
        users: usersWithRole,
        count: usersWithRole.length
      };
      
    } catch (error) {
      this._logger.error(`Failed to get users by role ${role}`, error);
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }
  
  /**
   * Validate role change request
   * @param {string} requesterEmail - Email of user making request
   * @param {string} targetEmail - Email of user being changed
   * @param {string} newRole - New role
   * @returns {Object} Validation result
   */
  async validateRoleChange(requesterEmail, targetEmail, newRole) {
    try {
      const requester = await this._userRepository.getUserByEmail(requesterEmail);
      if (!requester) {
        throw new Error('Requester user not found');
      }
      
      const targetUser = await this._userRepository.getUserByEmail(targetEmail);
      if (!targetUser) {
        throw new Error('Target user not found');
      }
      
      const validation = this._roleManager.validateRoleAssignment(
        requester.role,
        newRole,
        targetEmail
      );
      
      return {
        success: true,
        valid: validation.valid,
        reason: validation.reason,
        canAssign: validation.canAssign,
        canManage: validation.canManage,
        currentRole: targetUser.role,
        newRole: newRole,
        requesterRole: requester.role
      };
      
    } catch (error) {
      this._logger.error('Failed to validate role change', error);
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
      log: (message) => Logger.log(`[UserRoleService] ${message}`),
      error: (message, error) => Logger.log(`[UserRoleService ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[UserRoleService WARNING] ${message}`)
    };
  }
}
