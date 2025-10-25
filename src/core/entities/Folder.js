/**
 * Folder.js
 * Domain entity representing a monitored folder
 * 
 * This class encapsulates all data and behavior related to folders,
 * following the Single Responsibility Principle.
 */

/**
 * Represents a monitored folder
 * @class Folder
 */
class Folder {
  /**
   * Create a new Folder instance
   * @param {Object} params - Constructor parameters
   * @param {string} params.id - The folder ID
   * @param {string} params.name - The folder name
   * @param {string} params.owner - Folder owner email
   * @param {Date} params.createdDate - When the folder was created
   * @param {Date} params.lastModified - When the folder was last modified
   * @param {string[]} params.parentIds - Array of parent folder IDs
   * @param {boolean} params.isMonitored - Whether this folder is being monitored
   */
  constructor({
    id,
    name,
    owner = '',
    createdDate = new Date(),
    lastModified = new Date(),
    parentIds = [],
    isMonitored = true
  }) {
    this._validateInputs({ id, name });

    this._id = id;
    this._name = name;
    this._owner = owner;
    this._createdDate = createdDate;
    this._lastModified = lastModified;
    this._parentIds = [...parentIds]; // Create copy to prevent external modification
    this._isMonitored = isMonitored;
  }

  /**
   * Validate constructor inputs
   * @private
   * @param {Object} inputs - Input parameters
   * @throws {Error} When validation fails
   */
  _validateInputs(inputs) {
    if (!inputs.id) {
      throw new Error('Folder: id is required');
    }
    if (!inputs.name) {
      throw new Error('Folder: name is required');
    }
  }

  // Getters following encapsulation principles
  get id() { return this._id; }
  get name() { return this._name; }
  get owner() { return this._owner; }
  get createdDate() { return this._createdDate; }
  get lastModified() { return this._lastModified; }
  get parentIds() { return [...this._parentIds]; } // Return copy
  get isMonitored() { return this._isMonitored; }

  /**
   * Set monitoring status
   * @param {boolean} monitored - Whether to monitor this folder
   */
  setMonitoringStatus(monitored) {
    this._isMonitored = monitored;
  }

  /**
   * Add parent folder ID
   * @param {string} parentId - Parent folder ID to add
   */
  addParentId(parentId) {
    if (!this._parentIds.includes(parentId)) {
      this._parentIds.push(parentId);
    }
  }

  /**
   * Remove parent folder ID
   * @param {string} parentId - Parent folder ID to remove
   */
  removeParentId(parentId) {
    const index = this._parentIds.indexOf(parentId);
    if (index > -1) {
      this._parentIds.splice(index, 1);
    }
  }

  /**
   * Check if this folder is a child of another folder
   * @param {string} parentId - Parent folder ID to check
   * @returns {boolean} True if this folder is a child
   */
  isChildOf(parentId) {
    return this._parentIds.includes(parentId);
  }

  /**
   * Get folder path (simplified - just name for now)
   * @returns {string} Folder path
   */
  getPath() {
    return this._name;
  }

  /**
   * Update last modified timestamp
   * @param {Date} timestamp - New timestamp
   */
  updateLastModified(timestamp = new Date()) {
    this._lastModified = timestamp;
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      id: this._id,
      name: this._name,
      owner: this._owner,
      createdDate: this._createdDate.toISOString(),
      lastModified: this._lastModified.toISOString(),
      parentIds: [...this._parentIds],
      isMonitored: this._isMonitored
    };
  }

  /**
   * Create Folder from plain object
   * @param {Object} obj - Plain object
   * @returns {Folder} New Folder instance
   */
  static fromObject(obj) {
    return new Folder({
      ...obj,
      createdDate: new Date(obj.createdDate),
      lastModified: new Date(obj.lastModified)
    });
  }

  /**
   * Check equality with another Folder
   * @param {Folder} other - Other Folder to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof Folder)) return false;
    
    return this._id === other._id;
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    return `Folder(${this._name} - ${this._id})`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Folder;
}
