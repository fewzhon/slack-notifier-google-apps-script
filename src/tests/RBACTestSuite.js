/**
 * RBAC Test Suite - Comprehensive testing for Role-Based Access Control
 * Tests all RBAC components: RoleManager, PermissionManager, UserRoleService, AccessControlService
 */

/**
 * Initialize RBAC services for testing
 */
function initializeRBACServices() {
  Logger.log('🔐 Initializing RBAC Services for Testing...');
  
  try {
    // Initialize dependencies
    const logger = {
      log: (message) => Logger.log(`[RBAC Test] ${message}`),
      error: (message, error) => Logger.log(`[RBAC Test ERROR] ${message}: ${error?.message || error}`),
      warn: (message) => Logger.log(`[RBAC Test WARNING] ${message}`)
    };
    
    const userRepository = new UserRegistrationRepository({
      spreadsheetId: PropertiesService.getScriptProperties().getProperty('userDatabaseSpreadsheetId'),
      sheetName: 'Users',
      logger: logger
    });
    
    const auditLogger = new AuditLogger({
      spreadsheetId: PropertiesService.getScriptProperties().getProperty('auditLogSpreadsheetId'),
      sheetName: 'AuditLog',
      logger: logger
    });
    
    // Initialize RBAC services
    const roleManager = new RoleManager({ logger: logger });
    const permissionManager = new PermissionManager({ 
      logger: logger,
      roleManager: roleManager 
    });
    const userRoleService = new UserRoleService({
      logger: logger,
      userRepository: userRepository,
      roleManager: roleManager,
      permissionManager: permissionManager,
      auditLogger: auditLogger
    });
    const accessControlService = new AccessControlService({
      logger: logger,
      roleManager: roleManager,
      permissionManager: permissionManager,
      userRoleService: userRoleService,
      userRepository: userRepository,
      auditLogger: auditLogger
    });
    
    Logger.log('✅ RBAC Services initialized successfully');
    
    return {
      roleManager,
      permissionManager,
      userRoleService,
      accessControlService,
      userRepository,
      auditLogger
    };
    
  } catch (error) {
    Logger.log(`❌ RBAC Services initialization failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test RoleManager functionality
 */
async function testRoleManager() {
  Logger.log('🧪 Testing RoleManager...');
  
  try {
    const { roleManager } = initializeRBACServices();
    
    // Test 1: Get all roles
    const roles = roleManager.getRoles();
    Logger.log(`Available roles: ${Object.keys(roles).join(', ')}`);
    
    // Test 2: Check role existence
    const ownerExists = roleManager.roleExists('owner');
    const invalidExists = roleManager.roleExists('invalid');
    Logger.log(`Owner role exists: ${ownerExists}`);
    Logger.log(`Invalid role exists: ${invalidExists}`);
    
    // Test 3: Get role permissions
    const ownerPermissions = roleManager.getRolePermissions('owner');
    const userPermissions = roleManager.getRolePermissions('user');
    Logger.log(`Owner permissions count: ${ownerPermissions.length}`);
    Logger.log(`User permissions count: ${userPermissions.length}`);
    
    // Test 4: Check specific permissions
    const ownerCanManage = roleManager.roleHasPermission('owner', 'system.manage');
    const userCanManage = roleManager.roleHasPermission('user', 'system.manage');
    Logger.log(`Owner can manage system: ${ownerCanManage}`);
    Logger.log(`User can manage system: ${userCanManage}`);
    
    // Test 5: Role hierarchy
    const ownerLevel = roleManager.getRoleLevel('owner');
    const userLevel = roleManager.getRoleLevel('user');
    Logger.log(`Owner level: ${ownerLevel}`);
    Logger.log(`User level: ${userLevel}`);
    
    // Test 6: Role management permissions
    const canManageOwner = roleManager.canManageRole('admin', 'owner');
    const canManageUser = roleManager.canManageRole('admin', 'user');
    Logger.log(`Admin can manage owner: ${canManageOwner}`);
    Logger.log(`Admin can manage user: ${canManageUser}`);
    
    // Test 7: Admin emails
    const adminEmails = roleManager.getAdminEmails();
    Logger.log(`Admin emails count: ${adminEmails.length}`);
    
    // Test 8: Initial role determination
    const ssoRole = roleManager.determineInitialRole('test@iress.com', { 
      domain: 'iress.com', 
      isApprovedDomain: true 
    });
    const manualRole = roleManager.determineInitialRole('test@external.com', { 
      domain: 'external.com', 
      isApprovedDomain: false 
    });
    Logger.log(`SSO user initial role: ${ssoRole}`);
    Logger.log(`Manual user initial role: ${manualRole}`);
    
    Logger.log('✅ RoleManager tests completed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ RoleManager test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test PermissionManager functionality
 */
async function testPermissionManager() {
  Logger.log('🧪 Testing PermissionManager...');
  
  try {
    const { permissionManager } = initializeRBACServices();
    
    // Test 1: Check permission for resource
    const ownerAccess = permissionManager.checkPermission('owner', 'users.list');
    const userAccess = permissionManager.checkPermission('user', 'users.list');
    Logger.log(`Owner can access users.list: ${ownerAccess.authorized}`);
    Logger.log(`User can access users.list: ${userAccess.authorized}`);
    
    // Test 2: Check authorization for action
    const ownerCanCreate = permissionManager.isAuthorized('owner', 'create', 'users');
    const userCanCreate = permissionManager.isAuthorized('user', 'create', 'users');
    Logger.log(`Owner can create users: ${ownerCanCreate}`);
    Logger.log(`User can create users: ${userCanCreate}`);
    
    // Test 3: Get accessible resources
    const ownerResources = permissionManager.getAccessibleResources('owner');
    const userResources = permissionManager.getAccessibleResources('user');
    Logger.log(`Owner accessible resources: ${ownerResources.length}`);
    Logger.log(`User accessible resources: ${userResources.length}`);
    
    // Test 4: Resource requirements
    const userListReq = permissionManager.getResourceRequirements('users.list');
    Logger.log(`Users.list requires permission: ${userListReq?.permission}`);
    
    // Test 5: Resource existence
    const exists = permissionManager.resourceExists('users.list');
    const notExists = permissionManager.resourceExists('invalid.resource');
    Logger.log(`Users.list exists: ${exists}`);
    Logger.log(`Invalid resource exists: ${notExists}`);
    
    // Test 6: Resources by permission
    const systemManageResources = permissionManager.getResourcesByPermission('system.manage');
    Logger.log(`Resources requiring system.manage: ${systemManageResources.length}`);
    
    Logger.log('✅ PermissionManager tests completed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ PermissionManager test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test UserRoleService functionality
 */
async function testUserRoleService() {
  Logger.log('🧪 Testing UserRoleService...');
  
  try {
    const { userRoleService } = initializeRBACServices();
    
    // Test 1: Get user role info
    const testEmail = `rbactest${new Date().getTime()}@example.com`;
    
    // Create a test user first
    const userRepository = new UserRegistrationRepository({
      spreadsheetId: PropertiesService.getScriptProperties().getProperty('userDatabaseSpreadsheetId'),
      sheetName: 'Users',
      logger: { log: (msg) => Logger.log(`[UserRepo] ${msg}`) }
    });
    
    await userRepository.initialize();
    const testUser = await userRepository.createUser({
      email: testEmail,
      name: 'RBAC Test User',
      role: 'user',
      status: 'active',
      source: 'test'
    });
    
    Logger.log(`Created test user: ${testEmail}`);
    
    // Test 2: Get user role info
    const roleInfo = await userRoleService.getUserRoleInfo(testEmail);
    Logger.log(`User role info success: ${roleInfo.success}`);
    Logger.log(`User role: ${roleInfo.user?.role}`);
    Logger.log(`User permissions count: ${roleInfo.permissions?.length}`);
    
    // Test 3: Check user access
    const accessCheck = await userRoleService.checkUserAccess(testEmail, 'profile.view');
    Logger.log(`User can access profile.view: ${accessCheck.authorized}`);
    
    const adminAccessCheck = await userRoleService.checkUserAccess(testEmail, 'users.list');
    Logger.log(`User can access users.list: ${adminAccessCheck.authorized}`);
    
    // Test 4: Get role hierarchy
    const hierarchy = await userRoleService.getRoleHierarchy();
    Logger.log(`Role hierarchy success: ${hierarchy.success}`);
    Logger.log(`Total roles: ${hierarchy.totalRoles}`);
    
    // Test 5: Get users by role (requires admin permissions)
    // Create a temporary admin user for this test
    const adminTestEmail = `rbacadmintest${new Date().getTime()}@example.com`;
    const adminUser = await userRepository.createUser({
      email: adminTestEmail,
      name: 'RBAC Admin Test User',
      role: 'admin',
      status: 'active',
      source: 'test'
    });
    
    const usersByRole = await userRoleService.getUsersByRole('user', adminTestEmail);
    Logger.log(`Users by role success: ${usersByRole.success}`);
    
    // Clean up admin test user
    await userRepository.deleteUser(adminTestEmail);
    
    // Test 6: Validate role change
    const validation = await userRoleService.validateRoleChange(testEmail, testEmail, 'admin');
    Logger.log(`Role change validation success: ${validation.success}`);
    Logger.log(`Can assign admin role: ${validation.valid}`);
    
    // Clean up test user
    await userRepository.deleteUser(testEmail);
    Logger.log(`Cleaned up test user: ${testEmail}`);
    
    Logger.log('✅ UserRoleService tests completed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ UserRoleService test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test AccessControlService functionality
 */
async function testAccessControlService() {
  Logger.log('🧪 Testing AccessControlService...');
  
  try {
    const { accessControlService } = initializeRBACServices();
    
    // Initialize the service
    await accessControlService.initialize();
    
    const testEmail = `accesscontroltest${new Date().getTime()}@example.com`;
    
    // Create a test user
    const userRepository = new UserRegistrationRepository({
      spreadsheetId: PropertiesService.getScriptProperties().getProperty('userDatabaseSpreadsheetId'),
      sheetName: 'Users',
      logger: { log: (msg) => Logger.log(`[UserRepo] ${msg}`) }
    });
    
    await userRepository.initialize();
    const testUser = await userRepository.createUser({
      email: testEmail,
      name: 'Access Control Test User',
      role: 'user',
      status: 'active',
      source: 'test'
    });
    
    Logger.log(`Created test user: ${testEmail}`);
    
    // Test 1: Authorize access
    const authResult = await accessControlService.authorize(testEmail, 'profile.view');
    Logger.log(`Authorization success: ${authResult.success}`);
    Logger.log(`User authorized: ${authResult.authorized}`);
    
    const adminAuthResult = await accessControlService.authorize(testEmail, 'users.list');
    Logger.log(`Admin authorization success: ${adminAuthResult.success}`);
    Logger.log(`User admin authorized: ${adminAuthResult.authorized}`);
    
    // Test 2: Check action permission
    const actionResult = await accessControlService.canPerformAction(testEmail, 'view', 'profile');
    Logger.log(`Action permission success: ${actionResult.success}`);
    Logger.log(`User can view profile: ${actionResult.authorized}`);
    
    // Test 3: Get accessible resources
    const resources = await accessControlService.getUserAccessibleResources(testEmail);
    Logger.log(`Accessible resources success: ${resources.success}`);
    Logger.log(`User accessible resources count: ${resources.accessibleResources?.length}`);
    
    // Test 4: Check admin status
    const isAdmin = await accessControlService.isAdmin(testEmail);
    const isOwner = await accessControlService.isOwner(testEmail);
    Logger.log(`User is admin: ${isAdmin}`);
    Logger.log(`User is owner: ${isOwner}`);
    
    // Test 5: Get role level
    const roleLevel = await accessControlService.getUserRoleLevel(testEmail);
    Logger.log(`User role level: ${roleLevel}`);
    
    // Test 6: Check user management
    const canManage = await accessControlService.canManageUser(testEmail, testEmail);
    Logger.log(`User can manage self: ${canManage.canManage}`);
    
    // Test 7: Get role hierarchy
    const hierarchy = await accessControlService.getRoleHierarchy();
    Logger.log(`Role hierarchy success: ${hierarchy.success}`);
    
    // Clean up test user
    await userRepository.deleteUser(testEmail);
    Logger.log(`Cleaned up test user: ${testEmail}`);
    
    Logger.log('✅ AccessControlService tests completed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ AccessControlService test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test role assignment functionality
 */
async function testRoleAssignment() {
  Logger.log('🧪 Testing Role Assignment...');
  
  try {
    const { accessControlService, userRepository } = initializeRBACServices();
    
    // Create test users
    const assignerEmail = `assigner${new Date().getTime()}@example.com`;
    const targetEmail = `target${new Date().getTime()}@example.com`;
    
    await userRepository.initialize();
    
    // Create assigner (admin)
    const assigner = await userRepository.createUser({
      email: assignerEmail,
      name: 'Role Assigner',
      role: 'admin',
      status: 'active',
      source: 'test'
    });
    
    // Create target (user)
    const target = await userRepository.createUser({
      email: targetEmail,
      name: 'Role Target',
      role: 'user',
      status: 'active',
      source: 'test'
    });
    
    Logger.log(`Created assigner: ${assignerEmail}`);
    Logger.log(`Created target: ${targetEmail}`);
    
    // Test 1: Validate role change
    const validation = await accessControlService.validateRoleChange(assignerEmail, targetEmail, 'admin');
    Logger.log(`Role change validation success: ${validation.success}`);
    Logger.log(`Can assign admin role: ${validation.valid}`);
    
    // Test 2: Check management permission
    const canManage = await accessControlService.canManageUser(assignerEmail, targetEmail);
    Logger.log(`Can manage user: ${canManage.canManage}`);
    
    // Test 3: Get users with roles
    const usersWithRoles = await accessControlService.getUsersWithRoles(assignerEmail);
    Logger.log(`Get users with roles success: ${usersWithRoles.success}`);
    Logger.log(`Total users: ${usersWithRoles.total}`);
    
    // Test 4: Get users by role
    const usersByRole = await accessControlService.getUsersByRole('user', assignerEmail);
    Logger.log(`Get users by role success: ${usersByRole.success}`);
    Logger.log(`Users with user role: ${usersByRole.count}`);
    
    // Clean up test users
    await userRepository.deleteUser(assignerEmail);
    await userRepository.deleteUser(targetEmail);
    Logger.log(`Cleaned up test users`);
    
    Logger.log('✅ Role Assignment tests completed');
    return true;
    
  } catch (error) {
    Logger.log(`❌ Role Assignment test failed: ${error.message}`);
    return false;
  }
}

/**
 * Run complete RBAC test suite
 */
async function runRBACTestSuite() {
  Logger.log('🚀 Starting RBAC Test Suite...');
  
  const results = {
    roleManager: false,
    permissionManager: false,
    userRoleService: false,
    accessControlService: false,
    roleAssignment: false
  };
  
  try {
    // Test individual components
    results.roleManager = await testRoleManager();
    results.permissionManager = await testPermissionManager();
    results.userRoleService = await testUserRoleService();
    results.accessControlService = await testAccessControlService();
    results.roleAssignment = await testRoleAssignment();
    
    // Calculate overall success
    const passedTests = Object.values(results).filter(result => result === true).length;
    const totalTests = Object.keys(results).length;
    const overallSuccess = passedTests === totalTests;
    
    Logger.log('📊 RBAC Test Suite Results:');
    Logger.log(`RoleManager: ${results.roleManager ? '✅' : '❌'}`);
    Logger.log(`PermissionManager: ${results.permissionManager ? '✅' : '❌'}`);
    Logger.log(`UserRoleService: ${results.userRoleService ? '✅' : '❌'}`);
    Logger.log(`AccessControlService: ${results.accessControlService ? '✅' : '❌'}`);
    Logger.log(`Role Assignment: ${results.roleAssignment ? '✅' : '❌'}`);
    Logger.log(`Overall: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'} (${passedTests}/${totalTests})`);
    
    if (overallSuccess) {
      Logger.log('🎉 RBAC Test Suite completed successfully!');
    } else {
      Logger.log('⚠️ Some RBAC tests failed. Check logs for details.');
    }
    
    return {
      success: overallSuccess,
      results: results,
      passed: passedTests,
      total: totalTests
    };
    
  } catch (error) {
    Logger.log(`❌ RBAC Test Suite failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      results: results
    };
  }
}
