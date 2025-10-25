/**
 * RoleManager - Core role management service
 * Handles role definitions, validation, and role-based operations
 * 
 * Roles:
 * - owner: Full system control, can manage all users and settings
 * - admin: Administrative access, can manage users and configuration
 * - user: Standard user access, can perform basic operations
 * - guest: Limited read-only access
 */

class RoleManager {
  constructor(dependencies = {}) {
    this._logger = dependencies.logger || this._createDefaultLogger();
    this._scriptProperties = dependencies.scriptProperties || PropertiesService.getScriptProperties();
    
    // Role definitions with permissions
    this._roles = {
      owner: {
        name: 'Owner',
        description: 'Full system control and management',
        permissions: [
          'system.manage',
          'users.manage',
          'users.create',
          'users.update',
          'users.delete',
          'users.suspend',
          'users.activate',
          'config.manage',
          'config.update',
          'config.reset',
          'triggers.manage',
          'triggers.create',
          'triggers.update',
          'triggers.delete',
          'notifications.send',
          'notifications.manage',
          'audit.view',
          'audit.export',
          'roles.manage',
          'roles.assign'
        ],
        level: 4
      },
      admin: {
        name: 'Administrator',
        description: 'Administrative access to manage users and configuration',
        permissions: [
          'users.manage',
          'users.create',
          'users.update',
          'users.suspend',
          'users.activate',
          'config.manage',
          'config.update',
          'config.reset',
          'triggers.manage',
          'triggers.create',
          'triggers.update',
          'notifications.send',
          'notifications.manage',
          'audit.view',
          'roles.assign'
        ],
        level: 3
      },
      user: {
        name: 'User',
        description: 'Standard user with basic operational access',
        permissions: [
          'notifications.send',
          'profile.view',
          'profile.update',
          'dashboard.view',
          'help.access'
        ],
        level: 2
      },
      guest: {
        name: 'Guest',
        description: 'Limited read-only access',
        permissions: [
          'dashboard.view',
          'help.access'
        ],
        level: 1
      }
    };
    
    this._logger.log('[RoleManager] RoleManager initialized');
  }
  
  /**
   * Get all available roles
   * @returns {Object} Role definitions
   */
  getRoles() {
    return this._roles;
  }
  
  /**
   * Get role definition by name
   * @param {string} roleName - Role name
   * @returns {Object|null} Role definition or null if not found
   */
  getRole(roleName) {
    return this._roles[roleName] || null;
  }
  
  /**
   * Check if role exists
   * @param {string} roleName - Role name
   * @returns {boolean} True if role exists
   */
  roleExists(roleName) {
    return roleName in this._roles;
  }
  
  /**
   * Get permissions for a role
   * @param {string} roleName - Role name
   * @returns {Array} Array of permissions
   */
  getRolePermissions(roleName) {
    const role = this.getRole(roleName);
    return role ? role.permissions : [];
  }
  
  /**
   * Check if role has specific permission
   * @param {string} roleName - Role name
   * @param {string} permission - Permission to check
   * @returns {boolean} True if role has permission
   */
  roleHasPermission(roleName, permission) {
    const permissions = this.getRolePermissions(roleName);
    return permissions.includes(permission);
  }
  
  /**
   * Get role level (hierarchy)
   * @param {string} roleName - Role name
   * @returns {number} Role level (higher = more privileges)
   */
  getRoleLevel(roleName) {
    const role = this.getRole(roleName);
    return role ? role.level : 0;
  }
  
  /**
   * Check if one role can manage another role
   * @param {string} managerRole - Role trying to manage
   * @param {string} targetRole - Role being managed
   * @returns {boolean} True if manager can manage target
   */
  canManageRole(managerRole, targetRole) {
    const managerLevel = this.getRoleLevel(managerRole);
    const targetLevel = this.getRoleLevel(targetRole);
    
    // Can only manage roles with lower or equal level
    return managerLevel >= targetLevel;
  }
  
  /**
   * Get admin emails from script properties
   * @returns {Array} Array of admin email addresses
   */
  getAdminEmails() {
    try {
      const adminEmailsStr = this._scriptProperties.getProperty('adminEmails');
      if (!adminEmailsStr) {
        return [];
      }
      
      return adminEmailsStr.split(',').map(email => email.trim()).filter(email => email);
    } catch (error) {
      this._logger.error('Failed to get admin emails', error);
      return [];
    }
  }
  
  /**
   * Check if email is in admin list
   * @param {string} email - Email to check
   * @returns {boolean} True if email is admin
   */
  isAdminEmail(email) {
    const adminEmails = this.getAdminEmails();
    return adminEmails.includes(email);
  }
  
  /**
   * Determine user's initial role based on email and context
   * @param {string} email - User email
   * @param {Object} context - Additional context (domain, etc.)
   * @returns {string} Initial role name
   */
  determineInitialRole(email, context = {}) {
    // Check if email is in admin list
    if (this.isAdminEmail(email)) {
      return 'admin';
    }
    
    // Check if domain is approved (SSO users)
    if (context.domain && context.isApprovedDomain) {
      return 'user'; // SSO users get standard user role
    }
    
    // Manual registration users start as guest
    return 'guest';
  }
  
  /**
   * Validate role assignment
   * @param {string} assignerRole - Role of user making assignment
   * @param {string} targetRole - Role being assigned
   * @param {string} targetEmail - Email of user receiving role
   * @returns {Object} Validation result
   */
  validateRoleAssignment(assignerRole, targetRole, targetEmail) {
    const result = {
      valid: false,
      reason: null,
      canAssign: false,
      canManage: false
    };
    
    // Check if roles exist
    if (!this.roleExists(assignerRole)) {
      result.reason = 'Assigner role does not exist';
      return result;
    }
    
    if (!this.roleExists(targetRole)) {
      result.reason = 'Target role does not exist';
      return result;
    }
    
    // Check if assigner can manage target role
    result.canManage = this.canManageRole(assignerRole, targetRole);
    
    // Check if assigner has role assignment permission
    result.canAssign = this.roleHasPermission(assignerRole, 'roles.assign');
    
    // Special case: owner role can only be assigned by owners
    if (targetRole === 'owner' && assignerRole !== 'owner') {
      result.reason = 'Only owners can assign owner role';
      return result;
    }
    
    // Special case: admin emails automatically get admin role
    if (targetRole === 'admin' && this.isAdminEmail(targetEmail)) {
      result.valid = true;
      result.reason = 'Admin email automatically gets admin role';
      return result;
    }
    
    // Check permissions
    if (!result.canAssign) {
      result.reason = 'Insufficient permissions to assign roles';
      return result;
    }
    
    if (!result.canManage) {
      result.reason = 'Cannot manage role of equal or higher level';
      return result;
    }
    
    result.valid = true;
    result.reason = 'Role assignment is valid';
    
    return result;
  }
  
  /**
   * Get role hierarchy information
   * @returns {Array} Array of roles sorted by level
   */
  getRoleHierarchy() {
    return Object.keys(this._roles)
      .map(roleName => ({
        name: roleName,
        ...this._roles[roleName]
      }))
      .sort((a, b) => b.level - a.level);
  }
  
  /**
   * Create default logger
   * @returns {Object} Logger object
   */
  _createDefaultLogger() {
    return {
      log: (message) => Logger.log(`[RoleManager] ${message}`),
      error: (message, error) => Logger.log(`[RoleManager ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[RoleManager WARNING] ${message}`)
    };
  }
}
