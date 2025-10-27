# System Log Sheet Setup ✅

## 📊 **Updated Configuration**

System logs now write to a **separate spreadsheet** to keep them isolated from the Artefact Change Log.

### **Two Separate Spreadsheets:**

1. **Artefact Change Log** (`logSheetId`)
   - Tracks actual file changes (created, modified, deleted)
   - Sheet: `Artefact Change Log`
   - Headers: Timestamp, Change Type, File/Folder Name, File/Folder ID, URL/Path, Parent Folder Name, Parent Folder ID, User Responsible, Mime Type, Notes

2. **System Logs** (`systemLogSheetId`)
   - Tracks system logs (INFO, ERROR, WARNING)
   - Sheet: `System Logs`
   - Headers: Timestamp, Level, Message, Context

---

## 🔧 **Setup Instructions**

### **Step 1: Add to Script Properties**

In Google Apps Script, run this function to set the system log sheet ID:

```javascript
function setSystemLogSheetId() {
  PropertiesService.getScriptProperties()
    .setProperty('systemLogSheetId', '1pAlv8qwW7O8am4p_X_wH3mLdljK-iEh4MLYuOyl1vb4');
  Logger.log('System log sheet ID set successfully');
}
```

Or add it to your `.env` file (if using environment setup script):
```
systemLogSheetId=1pAlv8qwW7O8am4p_X_wH3mLdljK-iEh4MLYuOyl1vb4
```

---

### **Step 2: Verify the Sheet Structure**

In your new spreadsheet (`1pAlv8qwW7O8am4p_X_wH3mLdljK-iEh4MLYuOyl1vb4`):

1. **The script will auto-create** a sheet named `System Logs` if it doesn't exist
2. **Headers will be automatically added**: `Timestamp`, `Level`, `Message`, `Context`

---

## ✅ **What Was Changed**

### **1. Updated `GoogleSheetsLogger` Constructor**
```javascript
constructor(options = {}) {
  this._sheetId = options.sheetId;
  this._systemLogSheetId = options.systemLogSheetId; // New: separate sheet ID
  this._logger = options.logger || new ConsoleLogger();
}
```

### **2. Updated `_writeToSheet()` Method**
```javascript
_writeToSheet(level, message, context) {
  // Use system log spreadsheet ID if available, otherwise use main sheet ID
  const targetSheetId = this._systemLogSheetId || this._sheetId;
  
  if (!targetSheetId) return;
  
  try {
    const ss = SpreadsheetApp.openById(targetSheetId); // Uses separate spreadsheet
    
    // Use "System Logs" sheet
    let sheet = ss.getSheetByName('System Logs');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('System Logs');
      // Set up headers for system logs
      sheet.appendRow(['Timestamp', 'Level', 'Message', 'Context']);
    }
    
    const row = [
      new Date().toISOString(),
      level,
      message,
      JSON.stringify(context)
    ];
    sheet.appendRow(row);
  } catch (error) {
    this._logger.logError('Failed to write to sheet', error);
  }
}
```

### **3. Updated `Application._createDependencies()`**
```javascript
// Get system log sheet ID from Script Properties
const scriptProps = PropertiesService.getScriptProperties();
const systemLogSheetId = scriptProps.getProperty('systemLogSheetId');

const loggingService = new GoogleSheetsLogger({
  sheetId: configuration.logSheetId,
  systemLogSheetId: systemLogSheetId, // Pass the separate sheet ID
  logger: logger
});
```

---

## 🎯 **Result**

- ✅ **System logs** → Write to `1pAlv8qwW7O8am4p_X_wH3mLdljK-iEh4MLYuOyl1vb4` in the "System Logs" sheet
- ✅ **File changes** → Write to the Artefact Change Log in the main spreadsheet
- ✅ **No more confusion** between system logs and file changes

---

## 📝 **Next Steps**

1. Set the `systemLogSheetId` script property
2. Test by triggering a drive monitoring operation
3. Check that logs appear in the new `System Logs` sheet
4. Clean up the wrong entries from the Artefact Change Log (rows 29-37 from Oct 23)
