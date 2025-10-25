/**
 * FileChange.js
 * Domain entity representing a file change event
 * 
 * This class encapsulates all data and behavior related to file changes,
 * following the Single Responsibility Principle.
 */

/**
 * Represents a file change event
 * @class FileChange
 */
class FileChange {
  /**
   * Create a new FileChange instance
   * @param {Object} params - Constructor parameters
   * @param {string} params.fileId - The file ID
   * @param {string} params.fileName - The file name
   * @param {string} params.folderId - The folder ID
   * @param {string} params.folderName - The folder name
   * @param {string} params.changeType - Type of change (created, modified, deleted)
   * @param {Date} params.timestamp - When the change occurred
   * @param {string} params.fileOwner - File owner email
   * @param {number} params.fileSize - File size in bytes
   * @param {string} params.fileType - MIME type of the file
   */
  constructor({
    fileId,
    fileName,
    folderId,
    folderName,
    changeType,
    timestamp,
    fileOwner,
    fileSize,
    fileType
  }) {
    this._validateInputs({
      fileId, fileName, folderId, folderName, changeType, timestamp
    });

    this._fileId = fileId;
    this._fileName = fileName;
    this._folderId = folderId;
    this._folderName = folderName;
    this._changeType = changeType;
    this._timestamp = timestamp;
    this._fileOwner = fileOwner || '';
    this._fileSize = fileSize || 0;
    this._fileType = fileType || '';
  }

  /**
   * Validate constructor inputs
   * @private
   * @param {Object} inputs - Input parameters
   * @throws {Error} When validation fails
   */
  _validateInputs(inputs) {
    const required = ['fileId', 'fileName', 'folderId', 'folderName', 'changeType', 'timestamp'];
    
    for (const field of required) {
      if (!inputs[field]) {
        throw new Error(`FileChange: ${field} is required`);
      }
    }

    if (!['created', 'modified', 'deleted'].includes(inputs.changeType)) {
      throw new Error(`FileChange: Invalid changeType '${inputs.changeType}'. Must be 'created', 'modified', or 'deleted'`);
    }

    if (!(inputs.timestamp instanceof Date)) {
      throw new Error('FileChange: timestamp must be a Date object');
    }
  }

  // Getters following encapsulation principles
  get fileId() { return this._fileId; }
  get fileName() { return this._fileName; }
  get folderId() { return this._folderId; }
  get folderName() { return this._folderName; }
  get changeType() { return this._changeType; }
  get timestamp() { return this._timestamp; }
  get fileOwner() { return this._fileOwner; }
  get fileSize() { return this._fileSize; }
  get fileType() { return this._fileType; }

  /**
   * Get formatted file size
   * @returns {string} Human-readable file size
   */
  getFormattedFileSize() {
    if (this._fileSize === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(this._fileSize) / Math.log(k));
    
    return parseFloat((this._fileSize / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get time difference from now
   * @returns {string} Human-readable time difference
   */
  getTimeDifference() {
    const now = new Date();
    const diff = (now - this._timestamp) / 1000;
    
    if (diff < 60) return Math.round(diff) + ' seconds ago';
    if (diff < 3600) return Math.round(diff / 60) + ' minutes ago';
    if (diff < 86400) return Math.round(diff / 3600) + ' hours ago';
    return Math.round(diff / 86400) + ' days ago';
  }

  /**
   * Check if this change is recent (within specified minutes)
   * @param {number} minutes - Number of minutes to check
   * @returns {boolean} True if recent
   */
  isRecent(minutes = 5) {
    const now = new Date();
    const diffMinutes = (now - this._timestamp) / (1000 * 60);
    return diffMinutes <= minutes;
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      fileId: this._fileId,
      fileName: this._fileName,
      folderId: this._folderId,
      folderName: this._folderName,
      changeType: this._changeType,
      timestamp: this._timestamp.toISOString(),
      fileOwner: this._fileOwner,
      fileSize: this._fileSize,
      fileType: this._fileType
    };
  }

  /**
   * Create FileChange from plain object
   * @param {Object} obj - Plain object
   * @returns {FileChange} New FileChange instance
   */
  static fromObject(obj) {
    return new FileChange({
      ...obj,
      timestamp: new Date(obj.timestamp)
    });
  }

  /**
   * Check equality with another FileChange
   * @param {FileChange} other - Other FileChange to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof FileChange)) return false;
    
    return this._fileId === other._fileId &&
           this._changeType === other._changeType &&
           this._timestamp.getTime() === other._timestamp.getTime();
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    return `FileChange(${this._changeType}: ${this._fileName} in ${this._folderName})`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileChange;
}
