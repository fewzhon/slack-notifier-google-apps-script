# Trigger System Overview ✅

## 📊 **Current Trigger Architecture**

The system has **3 separate triggers** with distinct purposes:

---

### **1. Monitor Trigger** 📁
**Purpose:** Scan folders and log file changes to the Artefact Change Log sheet

**Function:** `monitorDriveChanges()`

**Schedule:** Every N minutes (configurable, default: 30 minutes)

**What It Does:**
- ✅ Scans specified folders and subfolders
- ✅ Detects file changes (created, modified, deleted)
- ✅ **Logs changes to Artefact Change Log sheet**
- ❌ **Does NOT send Slack notifications**

**Configuration:**
- `monitoringFrequencyMinutes` - How often it runs (default: 30 minutes)

**Flow:**
```
monitorDriveChanges()
  ↓
MonitorDriveUseCase.execute()
  ↓
_monitorFolders() - Scan folders
  ↓
_logChangesToSheet() - Log to Artefact Change Log ✅
  ↓
_updateScanState() - Update scan state
```

---

### **2. Daily Summary Trigger** 📊
**Purpose:** Send daily summary to Slack

**Function:** `sendDailySummary()`

**Schedule:** Every day at 7:00 AM (configurable)

**What It Does:**
- ✅ Reads Artefact Change Log for yesterday's data
- ✅ Aggregates daily changes (total, created, modified, by folder)
- ✅ Formats as Slack Block Kit message
- ✅ **Sends to Slack**
- ✅ Stores summary data in Script Properties

**Configuration:**
- `dailySummaryTime` - Time to send (default: 07:00)
- `weeklySummaryChannel` - Channel to send to (default: #dev_sandbox)

**Flow:**
```
sendDailySummary()
  ↓
Application.sendDailySummary()
  ↓
GoogleSheetsAdapter.aggregateDailyChangesFromSheet()
  ↓
BlockKitFormatter.formatDailySummaryBlocks()
  ↓
SlackWebhookClient.sendBlockMessage() - Send to Slack ✅
```

---

### **3. Weekly Summary Trigger** 📈
**Purpose:** Send weekly summary to Slack

**Function:** `sendWeeklySummary()`

**Schedule:** Weekly on specified day at 7:00 AM (default: Monday)

**What It Does:**
- ✅ Reads Artefact Change Log for last week's data
- ✅ Aggregates weekly changes with trends
- ✅ Formats as Slack Block Kit message
- ✅ **Sends to Slack**
- ✅ Stores summary data in Script Properties

**Configuration:**
- `weeklySummaryEnabled` - Enable/disable (default: true)
- `weeklySummaryDay` - Day of week (0=Sunday, 6=Saturday, default: 1=Monday)
- `weeklySummaryChannel` - Channel to send to

**Flow:**
```
sendWeeklySummary()
  ↓
Application.sendWeeklySummary()
  ↓
GoogleSheetsAdapter.aggregateWeeklyChangesFromSheet()
  ↓
BlockKitFormatter.formatWeeklySummaryBlocks()
  ↓
SlackWebhookClient.sendBlockMessage() - Send to Slack ✅
```

---

## 🎯 **Separation of Concerns**

### **Monitor Trigger (Logging Only):**
- **Input:** Monitored folders
- **Output:** Artefact Change Log sheet
- **No Slack** notifications

### **Summary Triggers (Notifications):**
- **Input:** Artefact Change Log sheet data
- **Output:** Slack Block Kit messages
- **No scanning** of folders

---

## ✅ **File Change Logging**

The monitor trigger now properly logs file changes:

1. **Detects changes** in monitored folders
2. **Logs to Artefact Change Log sheet** (with correct columns)
3. **System logs go to System Logs sheet** (separate spreadsheet)
4. **No Slack notifications** (only logging)

This ensures:
- ✅ Artefact Change Log has ONLY file changes (created, modified, deleted)
- ✅ System Logs has ONLY system logs (INFO, ERROR, WARNING)
- ✅ No mixing of data types
- ✅ Daily/Weekly summaries read from clean data

---

## 📝 **Summary**

**3 Triggers:**
1. **Monitor** - Logs file changes (no Slack)
2. **Daily Summary** - Sends daily summary to Slack
3. **Weekly Summary** - Sends weekly summary to Slack

**3 Data Stores:**
1. **Artefact Change Log** - File changes only
2. **System Logs** - System logs only
3. **Script Properties** - Latest summary data

**Clean separation** ✅
