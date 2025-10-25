/**
 * WebAppService Test Suite
 * Tests the web app deployment and HTML service integration
 */

async function testWebAppService() {
  Logger.log('🚀 Starting WebAppService Test Suite...');
  
  try {
    // Test 1: Service Initialization
    Logger.log('🧪 Testing WebAppService Initialization...');
    await testServiceInitialization();
    Logger.log('✅ WebAppService Initialization tests completed');
    
    // Test 2: Web App Deployment
    Logger.log('🧪 Testing Web App Deployment...');
    await testWebAppDeployment();
    Logger.log('✅ Web App Deployment tests completed');
    
    // Test 3: HTML Service Integration
    Logger.log('🧪 Testing HTML Service Integration...');
    await testHTMLServiceIntegration();
    Logger.log('✅ HTML Service Integration tests completed');
    
    // Test 4: Asset Management
    Logger.log('🧪 Testing Asset Management...');
    await testAssetManagement();
    Logger.log('✅ Asset Management tests completed');
    
    // Test 5: Error Handling
    Logger.log('🧪 Testing Error Handling...');
    await testErrorHandling();
    Logger.log('✅ Error Handling tests completed');
    
    Logger.log('🎉 WebAppService Test Suite PASSED!');
    Logger.log('📊 Summary:');
    Logger.log('  - Service Initialization: ✅');
    Logger.log('  - Web App Deployment: ✅');
    Logger.log('  - HTML Service Integration: ✅');
    Logger.log('  - Asset Management: ✅');
    Logger.log('  - Error Handling: ✅');
    Logger.log('  - Overall: ✅ PASSED (5/5)');
    
  } catch (error) {
    Logger.log(`❌ WebAppService Test Suite FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test service initialization
 */
async function testServiceInitialization() {
  Logger.log('Testing WebAppService initialization...');
  
  try {
    const webAppService = new WebAppService({
      logger: {
        log: (msg) => Logger.log(`[WebAppService Test] ${msg}`),
        error: (msg, err) => Logger.log(`[WebAppService Test ERROR] ${msg}: ${err?.message || err}`)
      }
    });
    
    // Test initialization
    const initResult = await webAppService.initialize();
    if (!initResult.success) {
      throw new Error('WebAppService initialization failed');
    }
    
    // Test deployment info
    const deploymentInfo = webAppService.getDeploymentInfo();
    if (!deploymentInfo.success) {
      throw new Error('Failed to get deployment info');
    }
    
    Logger.log('WebAppService initialization working correctly');
    
  } catch (error) {
    throw new Error(`Service initialization failed: ${error.message}`);
  }
}

/**
 * Test web app deployment
 */
async function testWebAppDeployment() {
  Logger.log('Testing web app deployment...');
  
  try {
    const webAppService = new WebAppService({
      logger: {
        log: (msg) => Logger.log(`[WebAppService Test] ${msg}`),
        error: (msg, err) => Logger.log(`[WebAppService Test ERROR] ${msg}: ${err?.message || err}`)
      }
    });
    
    // Test doGet function
    const htmlOutput = webAppService.doGet();
    if (!htmlOutput) {
      throw new Error('doGet() returned null');
    }
    
    // Test web app URL
    const webAppUrl = webAppService.getWebAppUrl();
    if (!webAppUrl || !webAppUrl.includes('script.google.com')) {
      throw new Error('Invalid web app URL');
    }
    
    // Test deployment info
    const deploymentInfo = webAppService.getDeploymentInfo();
    if (!deploymentInfo.success) {
      throw new Error('Failed to get deployment info');
    }
    
    Logger.log('Web app deployment working correctly');
    Logger.log(`Web app URL: ${webAppUrl}`);
    
  } catch (error) {
    throw new Error(`Web app deployment failed: ${error.message}`);
  }
}

/**
 * Test HTML service integration
 */
async function testHTMLServiceIntegration() {
  Logger.log('Testing HTML service integration...');
  
  try {
    const webAppService = new WebAppService({
      logger: {
        log: (msg) => Logger.log(`[WebAppService Test] ${msg}`),
        error: (msg, err) => Logger.log(`[WebAppService Test ERROR] ${msg}: ${err?.message || err}`)
      }
    });
    
    // Test serving different pages
    const configDashboard = webAppService.serveConfigDashboard();
    if (!configDashboard) {
      throw new Error('Failed to serve config dashboard');
    }
    
    const loginPage = webAppService.serveLoginPage();
    if (!loginPage) {
      throw new Error('Failed to serve login page');
    }
    
    const registerPage = webAppService.serveRegisterPage();
    if (!registerPage) {
      throw new Error('Failed to serve register page');
    }
    
    Logger.log('HTML service integration working correctly');
    
  } catch (error) {
    throw new Error(`HTML service integration failed: ${error.message}`);
  }
}

/**
 * Test asset management
 */
async function testAssetManagement() {
  Logger.log('Testing asset management...');
  
  try {
    const webAppService = new WebAppService({
      logger: {
        log: (msg) => Logger.log(`[WebAppService Test] ${msg}`),
        error: (msg, err) => Logger.log(`[WebAppService Test ERROR] ${msg}: ${err?.message || err}`)
      }
    });
    
    // Test asset inclusion
    const cssAsset = webAppService.includeAsset('modern-ui-css');
    if (!cssAsset) {
      throw new Error('Failed to include CSS asset');
    }
    
    const jsAsset = webAppService.includeAsset('modern-ui-js');
    if (!jsAsset) {
      throw new Error('Failed to include JS asset');
    }
    
    Logger.log('Asset management working correctly');
    
  } catch (error) {
    throw new Error(`Asset management failed: ${error.message}`);
  }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  Logger.log('Testing error handling...');
  
  try {
    const webAppService = new WebAppService({
      logger: {
        log: (msg) => Logger.log(`[WebAppService Test] ${msg}`),
        error: (msg, err) => Logger.log(`[WebAppService Test ERROR] ${msg}: ${err?.message || err}`)
      }
    });
    
    // Test error page creation
    const errorPage = webAppService._createErrorPage('Test Error', 'This is a test error');
    if (!errorPage) {
      throw new Error('Failed to create error page');
    }
    
    // Test invalid asset inclusion
    const invalidAsset = webAppService.includeAsset('non-existent-asset');
    if (!invalidAsset.includes('Error loading')) {
      throw new Error('Error handling for invalid assets not working');
    }
    
    Logger.log('Error handling working correctly');
    
  } catch (error) {
    throw new Error(`Error handling failed: ${error.message}`);
  }
}

// Export test function
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testWebAppService };
}
