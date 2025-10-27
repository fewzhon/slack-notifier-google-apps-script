/**
 * GoogleSheetsAdapter.js
 * Infrastructure adapter for Google Sheets operations
 * 
 * Provides sheet aggregation functionality for summaries
 */

/**
 * Google Sheets adapter
 * @class GoogleSheetsAdapter
 */
class GoogleSheetsAdapter {
  /**
   * Create a new GoogleSheetsAdapter instance
   * @param {Object} options - Configuration options
   * @param {string} options.logSheetId - ID of the log sheet
   * @param {Object} options.logger - Logger instance
   */
  constructor(options = {}) {
    this._logSheetId = options.logSheetId;
    this._logger = options.logger || this._createDefaultLogger();
  }

  /**
   * Create default logger
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
   * Log a file change to the Artefact Change Log sheet
   * @param {Object} changeData - Change data object
   * @param {string} changeData.timestamp - ISO timestamp
   * @param {string} changeData.changeType - 'created', 'modified', or 'deleted'
   * @param {string} changeData.name - File/folder name
   * @param {string} changeData.fileId - File/folder ID
   * @param {string} changeData.url - File URL
   * @param {string} changeData.parentName - Parent folder name
   * @param {string} changeData.parentId - Parent folder ID
   * @param {string} changeData.user - User responsible
   * @param {string} changeData.mimeType - MIME type
   * @param {string} changeData.notes - Additional notes
   * @returns {void}
   */
  logFileChange(changeData) {
    const sheet = this.getOrCreateLogSheet();
    
    // Log the change to the Artefact Change Log
    sheet.appendRow([
      changeData.timestamp || new Date().toISOString(),
      changeData.changeType || '',
      changeData.name || '',
      changeData.fileId || '',
      changeData.url || '',
      changeData.parentName || '',
      changeData.parentId || '',
      changeData.user || '',
      changeData.mimeType || '',
      changeData.notes || ''
    ]);
  }

  /**
   * Get or create the Artefact Change Log sheet
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} The log sheet
   */
  getOrCreateLogSheet() {
    const sheetName = 'Artefact Change Log';
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty('logSheetId') || this._logSheetId;
    
    if (!sheetId) {
      throw new Error('Could not open log spreadsheet. Please set the logSheetId script property.');
    }
    
    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Set up headers
      sheet.appendRow([
        'Timestamp',
        'Change Type',
        'File/Folder Name',
        'File/Folder ID',
        'URL/Path',
        'Parent Folder Name',
        'Parent Folder ID',
        'User Responsible',
        'Mime Type',
        'Notes'
      ]);
    }
    
    return sheet;
  }

  /**
   * Get the URL of the log sheet
   * @returns {string} The URL of the log sheet
   */
  getLogSheetUrl() {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty('logSheetId') || this._logSheetId;
    
    if (sheetId) {
      return 'https://docs.google.com/spreadsheets/d/' + sheetId;
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error('Could not open log spreadsheet. Please set the logSheetId script property.');
    }
    return ss.getUrl();
  }

  /**
   * Aggregate daily changes from the Artefact Change Log sheet
   * @param {string} targetDateStr - Target date in YYYY-MM-DD format
   * @returns {Object} Summary object with totals and breakdowns
   */
  aggregateDailyChangesFromSheet(targetDateStr) {
    const sheet = this.getOrCreateLogSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return { total: 0, byType: {}, byFolder: {}, rows: [] };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    let total = 0;
    const byType = {};
    const byFolder = {};
    const filteredRows = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const timestamp = row[0];
      const changeType = row[1];
      const folderName = row[5];
      const folderId = row[6];
      
      if (!timestamp || !changeType) continue;
      if (timestamp.indexOf(targetDateStr) !== 0) continue;
      
      total++;
      byType[changeType] = (byType[changeType] || 0) + 1;
      
      if (!byFolder[folderName]) {
        byFolder[folderName] = { created: 0, modified: 0, id: folderId };
      }
      
      if (changeType === 'created') byFolder[folderName].created++;
      if (changeType === 'modified') byFolder[folderName].modified++;
      
      filteredRows.push(row);
    }
    
    return { total: total, byType: byType, byFolder: byFolder, rows: filteredRows };
  }

  /**
   * Aggregate weekly changes from the Artefact Change Log sheet
   * @param {string} startDateStr - Start date in YYYY-MM-DD format
   * @param {string} endDateStr - End date in YYYY-MM-DD format
   * @returns {Object} Weekly summary with trends and breakdowns
   */
  aggregateWeeklyChangesFromSheet(startDateStr, endDateStr) {
    const sheet = this.getOrCreateLogSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return { total: 0, byType: {}, byFolder: {}, rows: [], trends: {} };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    let total = 0;
    const byType = {};
    const byFolder = {};
    const filteredRows = [];
    const dailyBreakdown = {};
    
    // Initialize daily breakdown for the week
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().slice(0, 10);
      dailyBreakdown[dayStr] = { total: 0, created: 0, modified: 0 };
    }
    
    // Process rows for the date range
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const timestamp = row[0];
      const changeType = row[1];
      const folderName = row[5];
      const folderId = row[6];
      
      if (!timestamp || !changeType) continue;
      
      // Check if timestamp falls within the date range
      const rowDateStr = timestamp.slice(0, 10);
      if (rowDateStr < startDateStr || rowDateStr > endDateStr) continue;
      
      total++;
      byType[changeType] = (byType[changeType] || 0) + 1;
      
      // Update daily breakdown
      if (dailyBreakdown[rowDateStr]) {
        dailyBreakdown[rowDateStr].total++;
        if (changeType === 'created') dailyBreakdown[rowDateStr].created++;
        if (changeType === 'modified') dailyBreakdown[rowDateStr].modified++;
      }
      
      // Update folder breakdown
      if (!byFolder[folderName]) {
        byFolder[folderName] = { created: 0, modified: 0, id: folderId };
      }
      if (changeType === 'created') byFolder[folderName].created++;
      if (changeType === 'modified') byFolder[folderName].modified++;
      
      filteredRows.push(row);
    }
    
    // Calculate weekly trends
    const trends = this._calculateWeeklyTrends(startDateStr, endDateStr, total, byType);
    
    return {
      total: total,
      byType: byType,
      byFolder: byFolder,
      rows: filteredRows,
      dailyBreakdown: dailyBreakdown,
      trends: trends,
      weekRange: { start: startDateStr, end: endDateStr }
    };
  }

  /**
   * Calculate weekly trends by comparing current week with previous week
   * @private
   * @param {string} startDateStr - Start date of current week
   * @param {string} endDateStr - End date of current week
   * @param {number} currentTotal - Total changes in current week
   * @param {Object} currentByType - Breakdown by type for current week
   * @returns {Object} Trends object with percentage changes
   */
  _calculateWeeklyTrends(startDateStr, endDateStr, currentTotal, currentByType) {
    try {
      // Calculate previous week's date range
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      // Go back 7 days to get previous week
      const prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevEndDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const prevStartStr = prevStartDate.toISOString().slice(0, 10);
      const prevEndStr = prevEndDate.toISOString().slice(0, 10);
      
      // Get previous week's data
      const prevSummary = this.aggregateDailyChangesFromSheet(prevStartStr);
      let prevTotal = 0;
      const prevByType = {};
      
      // Aggregate previous week's data
      for (let d = new Date(prevStartDate); d <= prevEndDate; d.setDate(d.getDate() + 1)) {
        const dayStr = d.toISOString().slice(0, 10);
        const daySummary = this.aggregateDailyChangesFromSheet(dayStr);
        prevTotal += daySummary.total;
        for (const type in daySummary.byType) {
          prevByType[type] = (prevByType[type] || 0) + daySummary.byType[type];
        }
      }
      
      // Calculate percentage changes
      const trends = {
        totalChange: prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : 0,
        createdChange: prevByType.created > 0 ? Math.round(((currentByType.created || 0) - prevByType.created) / prevByType.created * 100) : 0,
        modifiedChange: prevByType.modified > 0 ? Math.round(((currentByType.modified || 0) - prevByType.modified) / prevByType.modified * 100) : 0,
        previousWeek: { total: prevTotal, byType: prevByType }
      };
      
      return trends;
    } catch (e) {
      this._logger.error('Error calculating weekly trends', e);
      return { totalChange: 0, createdChange: 0, modifiedChange: 0, previousWeek: { total: 0, byType: {} } };
    }
  }
}
