/**
 * PermissionManager - Permission and authorization logic
 * Handles permission validation, resource access control, and authorization checks
 */

class PermissionManager {
  constructor(dependencies = {}) {
    this._logger = dependencies.logger || this._createDefaultLogger();
    this._roleManager = dependencies.roleManager;
    
    // Resource definitions with required permissions
    this._resources = {
      // User management
      'users.list': { permission: 'users.manage', description: 'List all users' },
      'users.create': { permission: 'users.create', description: 'Create new users' },
      'users.update': { permission: 'users.update', description: 'Update user information' },
      'users.delete': { permission: 'users.delete', description: 'Delete users' },
      'users.suspend': { permission: 'users.suspend', description: 'Suspend user accounts' },
      'users.activate': { permission: 'users.activate', description: 'Activate user accounts' },
      
      // Configuration management
      'config.view': { permission: 'config.manage', description: 'View system configuration' },
      'config.update': { permission: 'config.update', description: 'Update system configuration' },
      'config.reset': { permission: 'config.reset', description: 'Reset configuration to defaults' },
      
      // Trigger management
      'triggers.list': { permission: 'triggers.manage', description: 'List all triggers' },
      'triggers.create': { permission: 'triggers.create', description: 'Create new triggers' },
      'triggers.update': { permission: 'triggers.update', description: 'Update existing triggers' },
      'triggers.delete': { permission: 'triggers.delete', description: 'Delete triggers' },
      
      // Notification management
      'notifications.send': { permission: 'notifications.send', description: 'Send notifications' },
      'notifications.manage': { permission: 'notifications.manage', description: 'Manage notification settings' },
      
      // Audit and logging
      'audit.view': { permission: 'audit.view', description: 'View audit logs' },
      'audit.export': { permission: 'audit.export', description: 'Export audit logs' },
      
      // Role management
      'roles.assign': { permission: 'roles.assign', description: 'Assign roles to users' },
      'roles.manage': { permission: 'roles.manage', description: 'Manage role definitions' },
      
      // System management
      'system.manage': { permission: 'system.manage', description: 'Full system management' },
      
      // User profile
      'profile.view': { permission: 'profile.view', description: 'View own profile' },
      'profile.update': { permission: 'profile.update', description: 'Update own profile' },
      
      // Dashboard and help
      'dashboard.view': { permission: 'dashboard.view', description: 'View dashboard' },
      'help.access': { permission: 'help.access', description: 'Access help documentation' }
    };
    
    this._logger.log('[PermissionManager] PermissionManager initialized');
  }
  
  /**
   * Check if user has permission for a specific resource
   * @param {string} userRole - User's role
   * @param {string} resource - Resource being accessed
   * @returns {Object} Authorization result
   */
  checkPermission(userRole, resource) {
    const result = {
      authorized: false,
      reason: null,
      requiredPermission: null,
      userPermissions: []
    };
    
    // Get resource definition
    const resourceDef = this._resources[resource];
    if (!resourceDef) {
      result.reason = 'Resource not found';
      return result;
    }
    
    result.requiredPermission = resourceDef.permission;
    
    // Get user's permissions
    if (!this._roleManager) {
      result.reason = 'RoleManager not available';
      return result;
    }
    
    result.userPermissions = this._roleManager.getRolePermissions(userRole);
    
    // Check if user has required permission
    if (result.userPermissions.includes(result.requiredPermission)) {
      result.authorized = true;
      result.reason = 'Permission granted';
    } else {
      result.reason = `Missing required permission: ${result.requiredPermission}`;
    }
    
    return result;
  }
  
  /**
   * Check if user can perform action on resource
   * @param {string} userRole - User's role
   * @param {string} action - Action being performed
   * @param {string} resource - Resource being accessed
   * @returns {boolean} True if authorized
   */
  isAuthorized(userRole, action, resource) {
    const resourceKey = `${resource}.${action}`;
    const result = this.checkPermission(userRole, resourceKey);
    return result.authorized;
  }
  
  /**
   * Get all resources user can access
   * @param {string} userRole - User's role
   * @returns {Array} Array of accessible resources
   */
  getAccessibleResources(userRole) {
    if (!this._roleManager) {
      return [];
    }
    
    const userPermissions = this._roleManager.getRolePermissions(userRole);
    const accessibleResources = [];
    
    Object.keys(this._resources).forEach(resource => {
      const resourceDef = this._resources[resource];
      if (userPermissions.includes(resourceDef.permission)) {
        accessibleResources.push({
          resource: resource,
          permission: resourceDef.permission,
          description: resourceDef.description
        });
      }
    });
    
    return accessibleResources;
  }
  
  /**
   * Get permission requirements for resource
   * @param {string} resource - Resource name
   * @returns {Object|null} Resource definition or null
   */
  getResourceRequirements(resource) {
    return this._resources[resource] || null;
  }
  
  /**
   * Validate resource access with context
   * @param {string} userRole - User's role
   * @param {string} resource - Resource being accessed
   * @param {Object} context - Additional context (user email, resource owner, etc.)
   * @returns {Object} Detailed authorization result
   */
  validateAccess(userRole, resource, context = {}) {
    const result = this.checkPermission(userRole, resource);
    
    // Add context-specific validations
    if (result.authorized) {
      // Check if user is trying to access their own profile
      if (resource.startsWith('profile.') && context.userEmail && context.targetEmail) {
        if (context.userEmail === context.targetEmail) {
          result.reason = 'Accessing own profile - allowed';
        } else {
          // Check if user has permission to access other profiles
          const otherProfileResult = this.checkPermission(userRole, 'users.manage');
          if (!otherProfileResult.authorized) {
            result.authorized = false;
            result.reason = 'Cannot access other user profiles';
          }
        }
      }
      
      // Check admin email privileges
      if (context.userEmail && this._roleManager && this._roleManager.isAdminEmail(context.userEmail)) {
        // Admin emails have elevated privileges
        result.adminPrivilege = true;
        result.reason = 'Admin email privilege granted';
      }
    }
    
    return result;
  }
  
  /**
   * Get all available resources
   * @returns {Object} All resource definitions
   */
  getAllResources() {
    return this._resources;
  }
  
  /**
   * Check if resource exists
   * @param {string} resource - Resource name
   * @returns {boolean} True if resource exists
   */
  resourceExists(resource) {
    return resource in this._resources;
  }
  
  /**
   * Get resources by permission
   * @param {string} permission - Permission name
   * @returns {Array} Array of resources requiring this permission
   */
  getResourcesByPermission(permission) {
    const resources = [];
    
    Object.keys(this._resources).forEach(resource => {
      if (this._resources[resource].permission === permission) {
        resources.push({
          resource: resource,
          description: this._resources[resource].description
        });
      }
    });
    
    return resources;
  }
  
  /**
   * Create default logger
   * @returns {Object} Logger object
   */
  _createDefaultLogger() {
    return {
      log: (message) => Logger.log(`[PermissionManager] ${message}`),
      error: (message, error) => Logger.log(`[PermissionManager ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[PermissionManager WARNING] ${message}`)
    };
  }
}
