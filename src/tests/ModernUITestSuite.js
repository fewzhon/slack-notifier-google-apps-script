/**
 * Modern UI Framework Test Suite
 * Tests the modern responsive UI components and functionality
 */

class ModernUITestSuite {
  constructor() {
    this.logger = this._createLogger();
    this.testResults = [];
  }

  /**
   * Create logger for test suite
   */
  _createLogger() {
    return {
      log: (message) => Logger.log(`[ModernUI Test] ${message}`),
      error: (message, error) => Logger.log(`[ModernUI Test ERROR] ${message}: ${error?.message || error}`),
      success: (message) => Logger.log(`[ModernUI Test SUCCESS] ${message}`)
    };
  }

  /**
   * Run all modern UI tests
   */
  async runAllTests() {
    this.logger.log('🚀 Starting Modern UI Framework Test Suite...');
    
    try {
      // Test CSS Framework
      await this.testCSSFramework();
      
      // Test JavaScript Components
      await this.testJavaScriptComponents();
      
      // Test Responsive Design
      await this.testResponsiveDesign();
      
      // Test Accessibility Features
      await this.testAccessibilityFeatures();
      
      // Test Theme System
      await this.testThemeSystem();
      
      // Test Interactive Components
      await this.testInteractiveComponents();
      
      // Test Form Validation
      await this.testFormValidation();
      
      // Test Modal System
      await this.testModalSystem();
      
      // Test Toast Notifications
      await this.testToastNotifications();
      
      // Test Dashboard Integration
      await this.testDashboardIntegration();
      
      this.logger.log('✅ Modern UI Framework Test Suite completed');
      this._printTestResults();
      
    } catch (error) {
      this.logger.error('Modern UI Test Suite failed', error);
      throw error;
    }
  }

  /**
   * Test CSS Framework
   */
  async testCSSFramework() {
    this.logger.log('🧪 Testing CSS Framework...');
    
    try {
      // Test CSS custom properties
      const testCSSProperties = () => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        const requiredProperties = [
          '--primary-color',
          '--bg-primary',
          '--text-primary',
          '--border-primary',
          '--shadow-md',
          '--space-md',
          '--radius-md',
          '--transition-normal'
        ];
        
        const missingProperties = requiredProperties.filter(prop => 
          !computedStyle.getPropertyValue(prop)
        );
        
        if (missingProperties.length > 0) {
          throw new Error(`Missing CSS properties: ${missingProperties.join(', ')}`);
        }
        
        return true;
      };

      // Test glassmorphism effects
      const testGlassmorphism = () => {
        const testElement = document.createElement('div');
        testElement.className = 'card';
        testElement.style.position = 'absolute';
        testElement.style.top = '-9999px';
        document.body.appendChild(testElement);
        
        const computedStyle = getComputedStyle(testElement);
        const hasBackdropFilter = computedStyle.backdropFilter !== 'none';
        const hasGlassBackground = computedStyle.backgroundColor.includes('rgba');
        
        document.body.removeChild(testElement);
        
        if (!hasBackdropFilter && !hasGlassBackground) {
          throw new Error('Glassmorphism effects not properly applied');
        }
        
        return true;
      };

      // Test responsive grid
      const testResponsiveGrid = () => {
        const testContainer = document.createElement('div');
        testContainer.className = 'grid grid-cols-4';
        testContainer.style.position = 'absolute';
        testContainer.style.top = '-9999px';
        testContainer.style.width = '400px';
        document.body.appendChild(testContainer);
        
        const computedStyle = getComputedStyle(testContainer);
        const hasGrid = computedStyle.display === 'grid';
        
        document.body.removeChild(testContainer);
        
        if (!hasGrid) {
          throw new Error('CSS Grid not properly configured');
        }
        
        return true;
      };

      // Run tests
      testCSSProperties();
      testGlassmorphism();
      testResponsiveGrid();
      
      this._recordTestResult('CSS Framework', true, 'All CSS properties and effects working correctly');
      
    } catch (error) {
      this._recordTestResult('CSS Framework', false, error.message);
    }
  }

  /**
   * Test JavaScript Components
   */
  async testJavaScriptComponents() {
    this.logger.log('🧪 Testing JavaScript Components...');
    
    try {
      // Test ModernUI class initialization
      if (typeof ModernUI === 'undefined') {
        throw new Error('ModernUI class not available');
      }

      // Test theme system
      const testThemeSystem = () => {
        const ui = new ModernUI();
        const initialTheme = ui.theme;
        
        ui.toggleTheme();
        const newTheme = ui.theme;
        
        if (initialTheme === newTheme) {
          throw new Error('Theme toggle not working');
        }
        
        return true;
      };

      // Test toast notifications
      const testToastSystem = () => {
        const ui = new ModernUI();
        const toastId = ui.showToast('Test message', 'info', 1000);
        
        if (!toastId) {
          throw new Error('Toast notification not created');
        }
        
        return true;
      };

      // Test modal system
      const testModalSystem = () => {
        const ui = new ModernUI();
        
        // Create test modal
        const modal = document.createElement('div');
        modal.id = 'test-modal';
        modal.className = 'modal';
        modal.innerHTML = '<div class="modal-header"><h3>Test Modal</h3></div>';
        document.body.appendChild(modal);
        
        ui.setupModal(modal);
        ui.showModal('test-modal');
        
        const isModalVisible = modal.classList.contains('show');
        
        ui.closeModal('test-modal');
        document.body.removeChild(modal);
        
        if (!isModalVisible) {
          throw new Error('Modal not showing properly');
        }
        
        return true;
      };

      // Run tests
      testThemeSystem();
      testToastSystem();
      testModalSystem();
      
      this._recordTestResult('JavaScript Components', true, 'All JavaScript components working correctly');
      
    } catch (error) {
      this._recordTestResult('JavaScript Components', false, error.message);
    }
  }

  /**
   * Test Responsive Design
   */
  async testResponsiveDesign() {
    this.logger.log('🧪 Testing Responsive Design...');
    
    try {
      // Test responsive breakpoints
      const testBreakpoints = () => {
        const breakpoints = {
          mobile: 480,
          tablet: 768,
          desktop: 1024
        };
        
        // Test mobile styles
        const testMobile = () => {
          const testElement = document.createElement('div');
          testElement.className = 'grid grid-cols-4';
          testElement.style.position = 'absolute';
          testElement.style.top = '-9999px';
          testElement.style.width = '400px'; // Mobile width
          document.body.appendChild(testElement);
          
          const computedStyle = getComputedStyle(testElement);
          const hasMobileStyles = computedStyle.gridTemplateColumns === '1fr';
          
          document.body.removeChild(testElement);
          return hasMobileStyles;
        };
        
        if (!testMobile()) {
          throw new Error('Mobile responsive styles not working');
        }
        
        return true;
      };

      // Test flexible layouts
      const testFlexibleLayouts = () => {
        const testElement = document.createElement('div');
        testElement.className = 'flex items-center justify-between';
        testElement.style.position = 'absolute';
        testElement.style.top = '-9999px';
        testElement.style.width = '200px';
        document.body.appendChild(testElement);
        
        const computedStyle = getComputedStyle(testElement);
        const hasFlex = computedStyle.display === 'flex';
        const hasJustifyBetween = computedStyle.justifyContent === 'space-between';
        
        document.body.removeChild(testElement);
        
        if (!hasFlex || !hasJustifyBetween) {
          throw new Error('Flexible layouts not working correctly');
        }
        
        return true;
      };

      // Run tests
      testBreakpoints();
      testFlexibleLayouts();
      
      this._recordTestResult('Responsive Design', true, 'Responsive design working correctly');
      
    } catch (error) {
      this._recordTestResult('Responsive Design', false, error.message);
    }
  }

  /**
   * Test Accessibility Features
   */
  async testAccessibilityFeatures() {
    this.logger.log('🧪 Testing Accessibility Features...');
    
    try {
      // Test skip links
      const testSkipLinks = () => {
        const skipLink = document.querySelector('a[href="#main-content"]');
        if (!skipLink) {
          throw new Error('Skip link not found');
        }
        
        const hasSrOnly = skipLink.classList.contains('sr-only');
        if (!hasSrOnly) {
          throw new Error('Skip link not properly hidden');
        }
        
        return true;
      };

      // Test ARIA labels
      const testAriaLabels = () => {
        const buttons = document.querySelectorAll('button');
        let hasAriaLabels = 0;
        
        buttons.forEach(button => {
          if (button.getAttribute('aria-label') || button.textContent.trim()) {
            hasAriaLabels++;
          }
        });
        
        if (hasAriaLabels === 0) {
          throw new Error('No buttons have ARIA labels or text content');
        }
        
        return true;
      };

      // Test focus management
      const testFocusManagement = () => {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) {
          throw new Error('No focusable elements found');
        }
        
        return true;
      };

      // Run tests
      testSkipLinks();
      testAriaLabels();
      testFocusManagement();
      
      this._recordTestResult('Accessibility Features', true, 'All accessibility features working correctly');
      
    } catch (error) {
      this._recordTestResult('Accessibility Features', false, error.message);
    }
  }

  /**
   * Test Theme System
   */
  async testThemeSystem() {
    this.logger.log('🧪 Testing Theme System...');
    
    try {
      // Test theme switching
      const testThemeSwitching = () => {
        const initialTheme = document.documentElement.getAttribute('data-theme');
        
        // Toggle theme
        if (window.modernUI) {
          window.modernUI.toggleTheme();
          const newTheme = document.documentElement.getAttribute('data-theme');
          
          if (initialTheme === newTheme) {
            throw new Error('Theme not switching');
          }
          
          // Toggle back
          window.modernUI.toggleTheme();
          const finalTheme = document.documentElement.getAttribute('data-theme');
          
          if (initialTheme !== finalTheme) {
            throw new Error('Theme not switching back');
          }
        } else {
          throw new Error('ModernUI not available');
        }
        
        return true;
      };

      // Test theme persistence
      const testThemePersistence = () => {
        if (window.modernUI) {
          const storedTheme = window.modernUI.getStoredTheme();
          if (storedTheme && !['light', 'dark'].includes(storedTheme)) {
            throw new Error('Invalid theme stored');
          }
        }
        
        return true;
      };

      // Run tests
      testThemeSwitching();
      testThemePersistence();
      
      this._recordTestResult('Theme System', true, 'Theme system working correctly');
      
    } catch (error) {
      this._recordTestResult('Theme System', false, error.message);
    }
  }

  /**
   * Test Interactive Components
   */
  async testInteractiveComponents() {
    this.logger.log('🧪 Testing Interactive Components...');
    
    try {
      // Test button interactions
      const testButtonInteractions = () => {
        const testButton = document.createElement('button');
        testButton.className = 'btn btn-primary';
        testButton.textContent = 'Test Button';
        testButton.style.position = 'absolute';
        testButton.style.top = '-9999px';
        document.body.appendChild(testButton);
        
        const computedStyle = getComputedStyle(testButton);
        const hasTransition = computedStyle.transition !== 'none';
        
        document.body.removeChild(testButton);
        
        if (!hasTransition) {
          throw new Error('Button transitions not configured');
        }
        
        return true;
      };

      // Test hover effects
      const testHoverEffects = () => {
        const testCard = document.createElement('div');
        testCard.className = 'card';
        testCard.style.position = 'absolute';
        testCard.style.top = '-9999px';
        document.body.appendChild(testCard);
        
        const computedStyle = getComputedStyle(testCard);
        const hasTransition = computedStyle.transition !== 'none';
        
        document.body.removeChild(testCard);
        
        if (!hasTransition) {
          throw new Error('Hover effects not configured');
        }
        
        return true;
      };

      // Run tests
      testButtonInteractions();
      testHoverEffects();
      
      this._recordTestResult('Interactive Components', true, 'Interactive components working correctly');
      
    } catch (error) {
      this._recordTestResult('Interactive Components', false, error.message);
    }
  }

  /**
   * Test Form Validation
   */
  async testFormValidation() {
    this.logger.log('🧪 Testing Form Validation...');
    
    try {
      // Test form validation system
      const testFormValidation = () => {
        if (!window.modernUI) {
          throw new Error('ModernUI not available');
        }
        
        // Create test form
        const testForm = document.createElement('form');
        testForm.className = 'needs-validation';
        
        const testInput = document.createElement('input');
        testInput.className = 'form-input';
        testInput.type = 'email';
        testInput.required = true;
        testInput.value = 'invalid-email';
        
        testForm.appendChild(testInput);
        document.body.appendChild(testForm);
        
        // Test validation
        const isValid = window.modernUI.validateField(testInput);
        
        document.body.removeChild(testForm);
        
        if (isValid) {
          throw new Error('Form validation not working');
        }
        
        return true;
      };

      // Test email validation
      const testEmailValidation = () => {
        if (!window.modernUI) {
          throw new Error('ModernUI not available');
        }
        
        const validEmail = window.modernUI.isValidEmail('test@example.com');
        const invalidEmail = window.modernUI.isValidEmail('invalid-email');
        
        if (!validEmail || invalidEmail) {
          throw new Error('Email validation not working correctly');
        }
        
        return true;
      };

      // Run tests
      testFormValidation();
      testEmailValidation();
      
      this._recordTestResult('Form Validation', true, 'Form validation working correctly');
      
    } catch (error) {
      this._recordTestResult('Form Validation', false, error.message);
    }
  }

  /**
   * Test Modal System
   */
  async testModalSystem() {
    this.logger.log('🧪 Testing Modal System...');
    
    try {
      // Test modal creation and management
      const testModalSystem = () => {
        if (!window.modernUI) {
          throw new Error('ModernUI not available');
        }
        
        // Create test modal
        const modal = document.createElement('div');
        modal.id = 'test-modal-system';
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-header">
            <h3 class="modal-title">Test Modal</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>Test modal content</p>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup and show modal
        window.modernUI.setupModal(modal);
        window.modernUI.showModal('test-modal-system');
        
        const isModalVisible = modal.classList.contains('show');
        const hasBackdrop = document.querySelector('.modal-backdrop');
        
        // Close modal
        window.modernUI.closeModal('test-modal-system');
        
        // Cleanup
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
        }, 500);
        
        if (!isModalVisible || !hasBackdrop) {
          throw new Error('Modal system not working correctly');
        }
        
        return true;
      };

      // Run tests
      testModalSystem();
      
      this._recordTestResult('Modal System', true, 'Modal system working correctly');
      
    } catch (error) {
      this._recordTestResult('Modal System', false, error.message);
    }
  }

  /**
   * Test Toast Notifications
   */
  async testToastNotifications() {
    this.logger.log('🧪 Testing Toast Notifications...');
    
    try {
      // Test toast creation
      const testToastCreation = () => {
        if (!window.modernUI) {
          throw new Error('ModernUI not available');
        }
        
        const toastId = window.modernUI.showToast('Test message', 'success', 1000);
        
        if (!toastId) {
          throw new Error('Toast not created');
        }
        
        const toast = document.getElementById(toastId);
        if (!toast) {
          throw new Error('Toast element not found');
        }
        
        const hasSuccessClass = toast.classList.contains('toast-success');
        if (!hasSuccessClass) {
          throw new Error('Toast type not applied correctly');
        }
        
        return true;
      };

      // Test toast removal
      const testToastRemoval = () => {
        if (!window.modernUI) {
          throw new Error('ModernUI not available');
        }
        
        const toastId = window.modernUI.showToast('Test message', 'info', 5000);
        window.modernUI.removeToast(toastId);
        
        const toast = document.getElementById(toastId);
        if (toast && !toast.classList.contains('show')) {
          return true;
        }
        
        throw new Error('Toast removal not working');
      };

      // Run tests
      testToastCreation();
      testToastRemoval();
      
      this._recordTestResult('Toast Notifications', true, 'Toast notifications working correctly');
      
    } catch (error) {
      this._recordTestResult('Toast Notifications', false, error.message);
    }
  }

  /**
   * Test Dashboard Integration
   */
  async testDashboardIntegration() {
    this.logger.log('🧪 Testing Dashboard Integration...');
    
    try {
      // Test dashboard elements
      const testDashboardElements = () => {
        const requiredElements = [
          '#main-content',
          '.navbar',
          '.dashboard-header',
          '.dashboard-stats',
          '#config-sections',
          '.floating-actions'
        ];
        
        const missingElements = requiredElements.filter(selector => 
          !document.querySelector(selector)
        );
        
        if (missingElements.length > 0) {
          throw new Error(`Missing dashboard elements: ${missingElements.join(', ')}`);
        }
        
        return true;
      };

      // Test responsive dashboard
      const testResponsiveDashboard = () => {
        const statsContainer = document.querySelector('.dashboard-stats');
        if (!statsContainer) {
          throw new Error('Dashboard stats container not found');
        }
        
        const computedStyle = getComputedStyle(statsContainer);
        const hasGrid = computedStyle.display === 'grid';
        
        if (!hasGrid) {
          throw new Error('Dashboard stats not using CSS Grid');
        }
        
        return true;
      };

      // Test dashboard functionality
      const testDashboardFunctionality = () => {
        // Test if dashboard functions exist
        const requiredFunctions = [
          'loadDashboard',
          'renderDashboard',
          'updateStats',
          'showSettingsModal',
          'testConfiguration'
        ];
        
        const missingFunctions = requiredFunctions.filter(funcName => 
          typeof window[funcName] !== 'function'
        );
        
        if (missingFunctions.length > 0) {
          throw new Error(`Missing dashboard functions: ${missingFunctions.join(', ')}`);
        }
        
        return true;
      };

      // Run tests
      testDashboardElements();
      testResponsiveDashboard();
      testDashboardFunctionality();
      
      this._recordTestResult('Dashboard Integration', true, 'Dashboard integration working correctly');
      
    } catch (error) {
      this._recordTestResult('Dashboard Integration', false, error.message);
    }
  }

  /**
   * Record test result
   */
  _recordTestResult(testName, success, message) {
    const result = {
      test: testName,
      success: success,
      message: message,
      timestamp: new Date()
    };
    
    this.testResults.push(result);
    
    if (success) {
      this.logger.success(`${testName}: ${message}`);
    } else {
      this.logger.error(`${testName}: ${message}`);
    }
  }

  /**
   * Print test results summary
   */
  _printTestResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    this.logger.log('📊 Modern UI Test Suite Results:');
    this.logger.log(`Total Tests: ${totalTests}`);
    this.logger.log(`Passed: ${passedTests}`);
    this.logger.log(`Failed: ${failedTests}`);
    this.logger.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      this.logger.log('❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => this.logger.error(`  - ${r.test}: ${r.message}`));
    }
    
    if (failedTests === 0) {
      this.logger.log('🎉 All Modern UI tests passed!');
    }
  }
}

// Test functions for Google Apps Script
async function testModernUIFramework() {
  const testSuite = new ModernUITestSuite();
  await testSuite.runAllTests();
}

async function testCSSFramework() {
  const testSuite = new ModernUITestSuite();
  await testSuite.testCSSFramework();
}

async function testJavaScriptComponents() {
  const testSuite = new ModernUITestSuite();
  await testSuite.testJavaScriptComponents();
}

async function testResponsiveDesign() {
  const testSuite = new ModernUITestSuite();
  await testSuite.testResponsiveDesign();
}

async function testAccessibilityFeatures() {
  const testSuite = new ModernUITestSuite();
  await testSuite.testAccessibilityFeatures();
}

async function testThemeSystem() {
  const testSuite = new ModernUITestSuite();
  await testSuite.testThemeSystem();
}

async function testInteractiveComponents() {
  const testSuite = new ModernUITestSuite();
  await testSuite.testInteractiveComponents();
}

async function testFormValidation() {
  const testSuite = new ModernUITestSuite();
  await testSuite.testFormValidation();
}

async function testModalSystem() {
  const testSuite = new ModernUITestSuite();
  await testSuite.testModalSystem();
}

async function testToastNotifications() {
  const testSuite = new ModernUITestSuite();
  await testSuite.testToastNotifications();
}

async function testDashboardIntegration() {
  const testSuite = new ModernUITestSuite();
  await testSuite.testDashboardIntegration();
}
