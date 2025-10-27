/**
 * BlockKitFormatter.js
 * Infrastructure service for formatting Slack Block Kit messages
 * 
 * Provides Block Kit formatting for daily and weekly summaries
 */

/**
 * Block Kit formatter
 * @class BlockKitFormatter
 */
class BlockKitFormatter {
  /**
   * Create a new BlockKitFormatter instance
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   */
  constructor(options = {}) {
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
   * Format a Block Kit message for the daily summary
   * @param {Object} summary - Summary object from aggregation
   * @param {string} sheetUrl - URL of the log sheet
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {Object[]} Array of Block Kit blocks
   */
  formatDailySummaryBlocks(summary, sheetUrl, dateStr) {
    const blocks = [];
    
    blocks.push({
      type: 'header',
      text: { type: 'plain_text', text: `Daily update: for ${dateStr}` }
    });
    
    // Visual separator line
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        }
      ]
    });
    
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `Below is a breakdown of all new and updated artefacts that occurred yesterday. For full details, see the linked Google Sheet.` }
    });
    
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*<${sheetUrl}|Artefact Change Summary>*` }
    });
    
    blocks.push({
      type: 'divider'
    });
    
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Total changes:*\n${summary.total}` },
        { type: 'mrkdwn', text: `*Created:*\n${summary.byType.created || 0}` },
        { type: 'mrkdwn', text: `*Modified:*\n${summary.byType.modified || 0}` },
        { type: 'mrkdwn', text: `*Deleted:*\n${summary.byType.deleted || '_Not Monitored_'}` }
      ]
    });
    
    blocks.push({
      type: 'divider'
    });
    
    const folderLines = [];
    for (const folder in summary.byFolder) {
      const c = summary.byFolder[folder].created || 0;
      const m = summary.byFolder[folder].modified || 0;
      const folderId = summary.byFolder[folder].id;
      const folderUrl = folderId ? `https://drive.google.com/drive/folders/${folderId}` : '';
      const folderDisplay = folderUrl ? `<${folderUrl}|${folder}>` : folder;
      folderLines.push(`• ${folderDisplay}: ${c} created, ${m} modified`);
    }
    
    if (folderLines.length > 0) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: '*By Folder:*\n' + folderLines.join('\n') }
      });
    }
    
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View full log in Google Sheets',
            emoji: true
          },
          url: String(sheetUrl),
          style: 'primary'
        }
      ]
    });
    
    return blocks;
  }

  /**
   * Format a Block Kit message for the weekly summary
   * @param {Object} summary - Weekly summary object with trends
   * @param {string} sheetUrl - URL of the log sheet
   * @param {Object} weekRange - Object with start and end dates
   * @returns {Object[]} Array of Block Kit blocks
   */
  formatWeeklySummaryBlocks(summary, sheetUrl, weekRange) {
    const blocks = [];
    const weekStart = new Date(weekRange.start);
    const weekEnd = new Date(weekRange.end);
    const weekDisplay = `${weekStart.toLocaleDateString('en-GB')} - ${weekEnd.toLocaleDateString('en-GB')}`;
    
    blocks.push({
      type: 'header',
      text: { type: 'plain_text', text: `📊 Weekly Artefact Summary: ${weekDisplay}` }
    });
    
    // Visual separator line
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        }
      ]
    });
    
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `Below is a breakdown of all new and updated artefacts that occurred this week. For full details, see the linked Google Sheet.` }
    });
    
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*<${sheetUrl}|Artefact Change Summary>*` }
    });
    
    blocks.push({
      type: 'divider'
    });
    
    // Weekly totals with trends
    let totalTrendText = '';
    if (summary.trends.totalChange !== 0) {
      const trendIcon = summary.trends.totalChange > 0 ? '📈' : '📉';
      const trendText = summary.trends.totalChange > 0 ? 'up' : 'down';
      totalTrendText = `\n${trendIcon} ${Math.abs(summary.trends.totalChange)}% ${trendText} from last week`;
    }
    
    let createdTrendText = '';
    if (summary.trends.createdChange !== 0) {
      const trendIcon = summary.trends.createdChange > 0 ? '📈' : '📉';
      const trendText = summary.trends.createdChange > 0 ? 'up' : 'down';
      createdTrendText = `\n${trendIcon} ${Math.abs(summary.trends.createdChange)}% ${trendText}`;
    }
    
    let modifiedTrendText = '';
    if (summary.trends.modifiedChange !== 0) {
      const trendIcon = summary.trends.modifiedChange > 0 ? '📈' : '📉';
      const trendText = summary.trends.modifiedChange > 0 ? 'up' : 'down';
      modifiedTrendText = `\n${trendIcon} ${Math.abs(summary.trends.modifiedChange)}% ${trendText}`;
    }
    
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Total changes:*\n${summary.total}${totalTrendText}` },
        { type: 'mrkdwn', text: `*Created:*\n${summary.byType.created || 0}${createdTrendText}` },
        { type: 'mrkdwn', text: `*Modified:*\n${summary.byType.modified || 0}${modifiedTrendText}` },
        { type: 'mrkdwn', text: `*Deleted:*\n${summary.byType.deleted || '_Not Monitored_'}` }
      ]
    });
    
    blocks.push({
      type: 'divider'
    });
    
    // Folder breakdown
    const folderLines = [];
    for (const folder in summary.byFolder) {
      const c = summary.byFolder[folder].created || 0;
      const m = summary.byFolder[folder].modified || 0;
      const folderId = summary.byFolder[folder].id;
      const folderUrl = folderId ? `https://drive.google.com/drive/folders/${folderId}` : '';
      const folderDisplay = folderUrl ? `<${folderUrl}|${folder}>` : folder;
      folderLines.push(`• ${folderDisplay}: ${c} created, ${m} modified`);
    }
    
    if (folderLines.length > 0) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: '*By Folder:*\n' + folderLines.join('\n') }
      });
    }
    
    // Weekly comparison
    if (summary.trends.previousWeek.total > 0) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*Weekly Comparison:*\nPrevious week: ${summary.trends.previousWeek.total} total changes (${summary.trends.previousWeek.byType.created || 0} created, ${summary.trends.previousWeek.byType.modified || 0} modified)` }
      });
    }
    
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View full log in Google Sheets',
            emoji: true
          },
          url: String(sheetUrl),
          style: 'primary'
        }
      ]
    });
    
    return blocks;
  }
}
