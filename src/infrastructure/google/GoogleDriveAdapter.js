/**
 * GoogleDriveAdapter.js
 * Infrastructure adapter for Google Drive API operations
 * 
 * This class implements the IFileRepository interface and provides
 * a clean abstraction over Google Apps Script Drive API,
 * following the Dependency Inversion Principle.
 */

/**
 * Google Drive adapter implementing IFileRepository
 * @class GoogleDriveAdapter
 */
class GoogleDriveAdapter {
  /**
   * Create a new GoogleDriveAdapter instance
   * @param {Object} options - Configuration options
   * @param {number} options.maxRetries - Maximum retry attempts
   * @param {number} options.retryDelay - Delay between retries in ms
   */
  constructor(options = {}) {
    this._maxRetries = options.maxRetries || 3;
    this._retryDelay = options.retryDelay || 1000;
    this._logger = options.logger || this._createDefaultLogger();
  }

  /**
   * Create default logger for Google Apps Script
   * @private
   * @returns {Object} Logger object
   */
  _createDefaultLogger() {
    return {
      log: function(message, context = {}) {
        Logger.log(`[INFO] ${message}`);
      },
      error: function(message, error, context = {}) {
        Logger.log(`[ERROR] ${message}: ${error ? error.message : ''}`);
      },
      warn: function(message, context = {}) {
        Logger.log(`[WARNING] ${message}`);
      }
    };
  }

  /**
   * Get file by ID
   * @param {string} fileId - The file ID
   * @returns {Promise<File>} The file object
   * @throws {Error} When file is not found or access is denied
   */
  async getFileById(fileId) {
    return this._executeWithRetry(() => {
      try {
        const file = DriveApp.getFileById(fileId);
        return this._convertToFileObject(file);
      } catch (error) {
        this._logger.error(`Failed to get file by ID ${fileId}:`, error);
        throw new Error(`File not found or access denied: ${fileId}`);
      }
    });
  }

  /**
   * Get files in folder
   * @param {string} folderId - The folder ID
   * @param {Object} options - Query options
   * @param {Date} options.modifiedSince - Only return files modified since this date
   * @param {number} options.limit - Maximum number of files to return
   * @returns {Promise<File[]>} Array of file objects
   */
  async getFilesInFolder(folderId, options = {}) {
    return this._executeWithRetry(() => {
      try {
        const folder = DriveApp.getFolderById(folderId);
        const files = folder.getFiles();
        const result = [];
        let count = 0;
        const limit = options.limit || 1000;

        while (files.hasNext() && count < limit) {
          const file = files.next();
          const fileObj = this._convertToFileObject(file);
          
          // Apply modifiedSince filter if provided
          if (options.modifiedSince && fileObj.lastModified < options.modifiedSince) {
            continue;
          }
          
          result.push(fileObj);
          count++;
        }

        return result;
      } catch (error) {
        this._logger.error(`Failed to get files in folder ${folderId}:`, error);
        throw new Error(`Failed to access folder: ${folderId}`);
      }
    });
  }

  /**
   * Get folders in folder
   * @param {string} folderId - The folder ID
   * @returns {Promise<Folder[]>} Array of folder objects
   */
  async getFoldersInFolder(folderId) {
    return this._executeWithRetry(() => {
      try {
        const folder = DriveApp.getFolderById(folderId);
        const folders = folder.getFolders();
        const result = [];

        while (folders.hasNext()) {
          const folderObj = folders.next();
          result.push(this._convertToFolderObject(folderObj));
        }

        return result;
      } catch (error) {
        this._logger.error(`Failed to get folders in folder ${folderId}:`, error);
        throw new Error(`Failed to access folder: ${folderId}`);
      }
    });
  }

  /**
   * Check if file was modified since timestamp
   * @param {string} fileId - The file ID
   * @param {Date} since - The timestamp to check against
   * @returns {Promise<boolean>} True if modified
   */
  async isFileModifiedSince(fileId, since) {
    try {
      const file = await this.getFileById(fileId);
      return file.lastModified > since;
    } catch (error) {
      this._logger.error(`Failed to check file modification: ${fileId}`, error);
      return false;
    }
  }

  /**
   * Get folder by ID
   * @param {string} folderId - The folder ID
   * @returns {Promise<Folder>} The folder object
   */
  async getFolderById(folderId) {
    return this._executeWithRetry(() => {
      try {
        const folder = DriveApp.getFolderById(folderId);
        return this._convertToFolderObject(folder);
      } catch (error) {
        this._logger.error(`Failed to get folder by ID ${folderId}:`, error);
        throw new Error(`Folder not found or access denied: ${folderId}`);
      }
    });
  }

  /**
   * Get file URL
   * @param {string} fileId - The file ID
   * @returns {Promise<string>} The file URL
   */
  async getFileUrl(fileId) {
    return this._executeWithRetry(() => {
      try {
        const file = DriveApp.getFileById(fileId);
        return file.getUrl();
      } catch (error) {
        this._logger.error(`Failed to get file URL ${fileId}:`, error);
        throw new Error(`Failed to get file URL: ${fileId}`);
      }
    });
  }

  /**
   * Get folder URL
   * @param {string} folderId - The folder ID
   * @returns {Promise<string>} The folder URL
   */
  async getFolderUrl(folderId) {
    return this._executeWithRetry(() => {
      try {
        const folder = DriveApp.getFolderById(folderId);
        return folder.getUrl();
      } catch (error) {
        this._logger.error(`Failed to get folder URL ${folderId}:`, error);
        throw new Error(`Failed to get folder URL: ${folderId}`);
      }
    });
  }

  /**
   * Convert Google Apps Script File to our File object
   * @private
   * @param {GoogleAppsScript.Drive.File} file - Google Apps Script file
   * @returns {Object} Our file object
   */
  _convertToFileObject(file) {
    return {
      id: file.getId(),
      name: file.getName(),
      size: file.getSize(),
      mimeType: file.getMimeType(),
      lastModified: file.getLastUpdated(),
      createdDate: file.getDateCreated(),
      owner: file.getOwner().getEmail(),
      url: file.getUrl(),
      downloadUrl: file.getDownloadUrl(),
      thumbnailUrl: file.getThumbnail().getBlob() ? file.getThumbnail().getUrl() : null
    };
  }

  /**
   * Convert Google Apps Script Folder to our Folder object
   * @private
   * @param {GoogleAppsScript.Drive.Folder} folder - Google Apps Script folder
   * @returns {Object} Our folder object
   */
  _convertToFolderObject(folder) {
    return {
      id: folder.getId(),
      name: folder.getName(),
      createdDate: folder.getDateCreated(),
      lastModified: folder.getLastUpdated(),
      owner: folder.getOwner().getEmail(),
      url: folder.getUrl()
    };
  }

  /**
   * Execute operation with retry logic
   * @private
   * @param {Function} operation - Operation to execute
   * @returns {Promise<*>} Operation result
   */
  async _executeWithRetry(operation) {
    let lastError;
    
    for (let attempt = 1; attempt <= this._maxRetries; attempt++) {
      try {
        return operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < this._maxRetries) {
          this._logger.warn(`Operation failed (attempt ${attempt}/${this._maxRetries}), retrying...`);
          await this._sleep(this._retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Sleep utility
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  async _sleep(ms) {
    Utilities.sleep(ms);
    return Promise.resolve();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleDriveAdapter;
}
