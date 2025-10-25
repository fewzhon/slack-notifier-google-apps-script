/**
 * debugConfiguration.js
 * Debug utility to inspect current Script Properties
 */

function debugConfiguration() {
  Logger.log('=== DEBUGGING CONFIGURATION ===');
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const allProps = scriptProperties.getProperties();
    
    Logger.log('All Script Properties:');
    for (const [key, value] of Object.entries(allProps)) {
      Logger.log(`  ${key}: ${value}`);
    }
    
    // Check folderIds specifically
    const folderIdsStr = allProps.folderIds || '[]';
    Logger.log(`\nRaw folderIds string: "${folderIdsStr}"`);
    
    try {
      const folderIds = JSON.parse(folderIdsStr);
      Logger.log(`Parsed folderIds: ${JSON.stringify(folderIds)}`);
      Logger.log(`Type: ${typeof folderIds}, Length: ${folderIds.length}`);
      
      if (Array.isArray(folderIds)) {
        folderIds.forEach((id, index) => {
          Logger.log(`  folderIds[${index}]: "${id}" (type: ${typeof id}, length: ${id ? id.length : 'null'})`);
        });
      }
    } catch (parseError) {
      Logger.log(`Error parsing folderIds: ${parseError.message}`);
    }
    
    return { success: true, properties: allProps };
  } catch (error) {
    Logger.log(`[ERROR] Debug failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all folder IDs for testing
 */
function clearFolderIds() {
  Logger.log('=== CLEARING FOLDER IDs FOR TESTING ===');
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('folderIds', '[]');
    Logger.log('✅ Folder IDs cleared successfully');
    return { success: true };
  } catch (error) {
    Logger.log(`[ERROR] Failed to clear folder IDs: ${error.message}`);
    return { success: false, error: error.message };
  }
}
