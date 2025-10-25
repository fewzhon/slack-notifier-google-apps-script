/**
 * DomainValidator.js
 * Domain validation service for authentication
 * 
 * This service validates email domains against approved lists
 * and manages domain-based authentication rules.
 */

/**
 * Domain Validator Service
 * @class DomainValidator
 */
class DomainValidator {
  /**
   * Create a new DomainValidator instance
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   */
  constructor(options = {}) {
    this._logger = options.logger || this._createDefaultLogger();
    this._approvedDomains = this._loadApprovedDomains();
  }

  /**
   * Create default logger for Google Apps Script environment
   * @returns {Object} Logger instance
   */
  _createDefaultLogger() {
    return {
      log: function(message, context = {}) {
        Logger.log(`[DomainValidator] ${message}`);
      },
      error: function(message, error, context = {}) {
        Logger.log(`[DomainValidator ERROR] ${message}: ${error ? error.message : ''}`);
      },
      warn: function(message, context = {}) {
        Logger.log(`[DomainValidator WARNING] ${message}`);
      }
    };
  }

  /**
   * Load approved domains from configuration
   * @returns {Array<string>} List of approved domains
   */
  _loadApprovedDomains() {
    try {
      const props = PropertiesService.getScriptProperties();
      const approvedDomainsJson = props.getProperty('approvedDomains') || '[]';
      const domains = JSON.parse(approvedDomainsJson);
      
      // Default approved domains if none configured
      if (domains.length === 0) {
        const defaultDomains = [
          'iress.com',
          'iress.au',
          'iress.co.uk',
          'iress.co.nz'
        ];
        
        // Save default domains
        props.setProperty('approvedDomains', JSON.stringify(defaultDomains));
        this._logger.log(`Set default approved domains: ${defaultDomains.join(', ')}`);
        
        return defaultDomains;
      }
      
      this._logger.log(`Loaded ${domains.length} approved domains`);
      return domains;
      
    } catch (error) {
      this._logger.error('Failed to load approved domains', error);
      return [];
    }
  }

  /**
   * Check if domain is approved for SSO authentication
   * @param {string} domain - Email domain to check
   * @returns {Promise<boolean>} True if domain is approved
   */
  async isApprovedDomain(domain) {
    try {
      if (!domain) {
        return false;
      }
      
      // Normalize domain (lowercase, trim)
      const normalizedDomain = domain.toLowerCase().trim();
      
      // Check against approved domains list
      const isApproved = this._approvedDomains.includes(normalizedDomain);
      
      this._logger.log(`Domain ${normalizedDomain} ${isApproved ? 'is' : 'is not'} approved`);
      
      return isApproved;
      
    } catch (error) {
      this._logger.error('Domain validation failed', error);
      return false;
    }
  }

  /**
   * Add domain to approved list
   * @param {string} domain - Domain to add
   * @returns {Promise<boolean>} Success status
   */
  async addApprovedDomain(domain) {
    try {
      if (!domain || !domain.includes('.')) {
        throw new Error('Invalid domain format');
      }
      
      const normalizedDomain = domain.toLowerCase().trim();
      
      if (this._approvedDomains.includes(normalizedDomain)) {
        this._logger.warn(`Domain ${normalizedDomain} is already approved`);
        return true;
      }
      
      // Add to list
      this._approvedDomains.push(normalizedDomain);
      
      // Save to Script Properties
      const props = PropertiesService.getScriptProperties();
      props.setProperty('approvedDomains', JSON.stringify(this._approvedDomains));
      
      this._logger.log(`Added approved domain: ${normalizedDomain}`);
      
      return true;
      
    } catch (error) {
      this._logger.error('Failed to add approved domain', error);
      throw error;
    }
  }

  /**
   * Remove domain from approved list
   * @param {string} domain - Domain to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeApprovedDomain(domain) {
    try {
      if (!domain) {
        throw new Error('Domain is required');
      }
      
      const normalizedDomain = domain.toLowerCase().trim();
      
      const index = this._approvedDomains.indexOf(normalizedDomain);
      if (index === -1) {
        this._logger.warn(`Domain ${normalizedDomain} is not in approved list`);
        return false;
      }
      
      // Remove from list
      this._approvedDomains.splice(index, 1);
      
      // Save to Script Properties
      const props = PropertiesService.getScriptProperties();
      props.setProperty('approvedDomains', JSON.stringify(this._approvedDomains));
      
      this._logger.log(`Removed approved domain: ${normalizedDomain}`);
      
      return true;
      
    } catch (error) {
      this._logger.error('Failed to remove approved domain', error);
      throw error;
    }
  }

  /**
   * Get list of approved domains
   * @returns {Array<string>} List of approved domains
   */
  getApprovedDomains() {
    return [...this._approvedDomains]; // Return copy to prevent modification
  }

  /**
   * Validate email domain format
   * @param {string} domain - Domain to validate
   * @returns {boolean} True if domain format is valid
   */
  isValidDomainFormat(domain) {
    if (!domain || typeof domain !== 'string') {
      return false;
    }
    
    // Basic domain validation regex
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    
    return domainRegex.test(domain);
  }

  /**
   * Extract domain from email address
   * @param {string} email - Email address
   * @returns {string|null} Domain or null if invalid
   */
  extractDomainFromEmail(email) {
    try {
      if (!email || typeof email !== 'string') {
        return null;
      }
      
      const parts = email.split('@');
      if (parts.length !== 2) {
        return null;
      }
      
      const domain = parts[1].toLowerCase().trim();
      
      if (!this.isValidDomainFormat(domain)) {
        return null;
      }
      
      return domain;
      
    } catch (error) {
      this._logger.error('Failed to extract domain from email', error);
      return null;
    }
  }

  /**
   * Get domain validation status
   * @param {string} email - Email address to check
   * @returns {Promise<Object>} Domain validation result
   */
  async getDomainValidationStatus(email) {
    try {
      const domain = this.extractDomainFromEmail(email);
      
      if (!domain) {
        return {
          valid: false,
          domain: null,
          approved: false,
          message: 'Invalid email format'
        };
      }
      
      const isApproved = await this.isApprovedDomain(domain);
      
      return {
        valid: true,
        domain: domain,
        approved: isApproved,
        message: isApproved ? 'Domain is approved for SSO' : 'Domain requires manual registration',
        authenticationMethod: isApproved ? 'sso' : 'manual'
      };
      
    } catch (error) {
      this._logger.error('Domain validation status check failed', error);
      return {
        valid: false,
        domain: null,
        approved: false,
        message: 'Domain validation failed',
        error: error.message
      };
    }
  }

  /**
   * Initialize domain validator
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this._logger.log('Initializing DomainValidator...');
      
      // Reload approved domains
      this._approvedDomains = this._loadApprovedDomains();
      
      this._logger.log(`DomainValidator initialized with ${this._approvedDomains.length} approved domains`);
      
    } catch (error) {
      this._logger.error('DomainValidator initialization failed', error);
      throw error;
    }
  }
}

/**
 * Global domain validation functions
 */

/**
 * Check if domain is approved (global function)
 * @param {string} domain - Domain to check
 * @returns {Promise<boolean>} True if approved
 */
async function isDomainApproved(domain) {
  try {
    const validator = new DomainValidator();
    await validator.initialize();
    
    return await validator.isApprovedDomain(domain);
    
  } catch (error) {
    Logger.log(`Domain approval check failed: ${error.message}`);
    return false;
  }
}

/**
 * Get domain validation status (global function)
 * @param {string} email - Email to check
 * @returns {Promise<Object>} Validation result
 */
async function getDomainStatus(email) {
  try {
    const validator = new DomainValidator();
    await validator.initialize();
    
    return await validator.getDomainValidationStatus(email);
    
  } catch (error) {
    Logger.log(`Domain status check failed: ${error.message}`);
    return {
      valid: false,
      domain: null,
      approved: false,
      message: 'Domain validation failed',
      error: error.message
    };
  }
}
