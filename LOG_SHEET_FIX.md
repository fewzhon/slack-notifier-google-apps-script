# Log Sheet Fix - System Logs Writing to Wrong Sheet

## 🐛 **The Problem**

As of October 23rd, 2025, system log messages (INFO, ERROR) are being written to the **Artefact Change Log** sheet instead of a dedicated **System Logs** sheet.

### **Wrong Data Being Written:**

The following types of entries were appearing in the **Change Type** column:
- ❌ `INFO` - System log messages
- ❌ `ERROR` - Error messages
- ❌ System monitoring messages

### **What Should Be in Artefact Change Log:**

The **Change Type** column should **ONLY** contain:
- ✅ `created` - New files/folders
- ✅ `modified` - Modified files
- ✅ `deleted` - Deleted files

---

## 🔍 **Root Cause**

The `GoogleSheetsLogger` class in `Application.js` was using:
```javascript
const sheet = SpreadsheetApp.openById(this._sheetId).getActiveSheet();
```

This writes to whatever sheet is **active** (which happens to be the Artefact Change Log), instead of a dedicated System Logs sheet.

---

## ✅ **The Fix**

Updated `GoogleSheetsLogger._writeToSheet()` to:

1. **Create a dedicated "System Logs" sheet** if it doesn't exist
2. **Write to "System Logs" sheet** instead of using `getActiveSheet()`
3. **Proper headers** for system logs: `Timestamp`, `Level`, `Message`, `Context`

### **Before:**
```javascript
_writeToSheet(level, message, context) {
  if (!this._sheetId) return;
  
  try {
    const sheet = SpreadsheetApp.openById(this._sheetId).getActiveSheet(); // ❌ WRONG!
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

### **After:**
```javascript
_writeToSheet(level, message, context) {
  if (!this._sheetId) return;
  
  try {
    const ss = SpreadsheetApp.openById(this._sheetId);
    
    // Use "System Logs" sheet, NOT the Artefact Change Log
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

---

## 📊 **Sheet Organization**

### **Artefact Change Log** (File Changes Only)
**Headers:**
- Timestamp
- Change Type ← Should ONLY be: created, modified, deleted
- File/Folder Name
- File/Folder ID
- URL/Path
- Parent Folder Name
- Parent Folder ID
- User Responsible
- Mime Type
- Notes

**Purpose:** Track actual file changes in monitored folders

---

### **System Logs** (System Logs Only)
**Headers:**
- Timestamp
- Level ← INFO, ERROR, WARNING
- Message
- Context

**Purpose:** Track system logs, monitoring status, errors

---

## 🧹 **Cleaning Up the Wrong Data**

You may want to delete the wrong entries (rows 29-37 from Oct 23rd) that have "INFO" and "ERROR" in the Change Type column, since they don't belong in the Artefact Change Log.

---

## ✨ **Result**

Now system logs will go to the **System Logs** sheet, and the **Artefact Change Log** will only contain actual file change events (created, modified, deleted).

**Future monitoring will log correctly:**
- ✅ File changes → Artefact Change Log
- ✅ System logs → System Logs sheet
