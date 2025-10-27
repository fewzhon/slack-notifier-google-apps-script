# Block Kit Integration for Daily/Weekly Summaries

## ✅ What Was Changed

Updated `Application.js` to use **Block Kit format** from `driveMonitor.gs` instead of simple Notification messages.

---

## 📝 Changes to Application.js

### **1. Daily Summary (`sendDailySummary()`)**

**Before:**
- Used `Notification` entity with simple text message
- Called `_buildDailySummaryMessage()` to create a plain text message
- Used `notificationService.sendNotification()`

**After:**
- Uses Block Kit formatting from `driveMonitor.gs`
- Calls `aggregateDailyChangesFromSheet(dateStr)` to get actual data from log sheet
- Calls `formatDailySummaryBlockKit()` to format as Slack Block Kit
- Calls `sendDailySummaryToSlack()` to send Block Kit blocks
- Stores summary data in Script Properties for the Latest Summary panel

```javascript
async sendDailySummary() {
  await this._ensureInitialized();
  
  try {
    const config = await this.getConfiguration();
    
    // Get log sheet URL using helper from utils.gs
    const sheetUrl = getLogSheetUrl();
    
    // Calculate yesterday's date
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const dateStr = yesterday.toISOString().slice(0, 10); // YYYY-MM-DD
    
    // Aggregate daily changes using driveMonitor.gs function
    const summary = aggregateDailyChangesFromSheet(dateStr);
    
    // Format using Block Kit from driveMonitor.gs
    const blocks = formatDailySummaryBlockKit(summary, sheetUrl, dateStr);
    
    // Send using Block Kit send function
    const targetChannel = config.weeklySummaryChannel || '#dev_sandbox';
    const response = sendDailySummaryToSlack(blocks, config.slackWebhookUrl, targetChannel);
    
    // Store in Script Properties for Latest Summary panel
    const props = PropertiesService.getScriptProperties();
    props.setProperty('lastDailySummary', JSON.stringify({
      timestamp: new Date().toISOString(),
      date: dateStr,
      summary: summary
    }));
    
    Logger.log('Daily summary sent successfully');
    return {
      success: true,
      message: 'Daily summary sent successfully',
      total: summary.total
    };
    
  } catch (error) {
    Logger.log(`Daily summary failed: ${error.message}`);
    throw error;
  }
}
```

### **2. Weekly Summary (`sendWeeklySummary()`)**

**Before:**
- Used `Notification` entity with simple text message
- Called `_buildWeeklySummaryMessage()` to create a plain text message
- Used `notificationService.sendNotification()`

**After:**
- Uses Block Kit formatting from `driveMonitor.gs`
- Calculates previous Monday-Sunday range
- Calls `aggregateWeeklyChangesFromSheet(startDateStr, endDateStr)` to get actual data
- Calls `formatWeeklySummaryBlockKit()` to format as Slack Block Kit
- Calls `sendDailySummaryToSlack()` to send Block Kit blocks
- Stores summary data in Script Properties for the Latest Summary panel

```javascript
async sendWeeklySummary() {
  await this._ensureInitialized();
  
  try {
    const config = await this.getConfiguration();
    
    // Check if weekly summary is enabled
    if (!config.weeklySummaryEnabled) {
      Logger.log('Weekly summary is disabled');
      return {
        success: true,
        message: 'Weekly summary is disabled',
        skipped: true
      };
    }
    
    // Get log sheet URL using helper from utils.gs
    const sheetUrl = getLogSheetUrl();
    
    // Calculate previous Monday-Sunday range
    const today = new Date();
    const currentDay = today.getDay();
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    const lastSunday = new Date(today.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
    const lastMonday = new Date(lastSunday.getTime() - 6 * 24 * 60 * 60 * 1000);
    
    const startDateStr = lastMonday.toISOString().slice(0, 10);
    const endDateStr = lastSunday.toISOString().slice(0, 10);
    
    // Aggregate weekly changes using driveMonitor.gs function
    const summary = aggregateWeeklyChangesFromSheet(startDateStr, endDateStr);
    
    // Format using Block Kit from driveMonitor.gs
    const blocks = formatWeeklySummaryBlockKit(summary, sheetUrl, { start: startDateStr, end: endDateStr });
    
    // Send using Block Kit send function
    const targetChannel = config.weeklySummaryChannel || '#dev_sandbox';
    const response = sendDailySummaryToSlack(blocks, config.slackWebhookUrl, targetChannel);
    
    // Store in Script Properties for Latest Summary panel
    const props = PropertiesService.getScriptProperties();
    props.setProperty('lastWeeklySummary', JSON.stringify({
      timestamp: new Date().toISOString(),
      weekRange: `${startDateStr} to ${endDateStr}`,
      summary: summary
    }));
    
    Logger.log(`Weekly summary sent to ${targetChannel}. Total changes: ${summary.total}`);
    return {
      success: true,
      message: 'Weekly summary sent successfully',
      total: summary.total
    };
    
  } catch (error) {
    Logger.log(`Weekly summary failed: ${error.message}`);
    throw error;
  }
}
```

---

## 🎯 Benefits of This Change

### **1. Real Data:**
- Summaries now use **actual data** from the Artefact Change Log sheet
- Shows real counts of created/modified files per folder
- Includes links to folder IDs

### **2. Slack Block Kit:**
- Uses **Slack's Block Kit** format for rich formatting
- Better structure with headers, sections, dividers, and action buttons
- More professional appearance in Slack

### **3. Data Persistence:**
- Stores summary data in Script Properties
- Latest Summary panel can display last sent summaries
- Dashboard shows when summaries were last sent

### **4. Consistent Formatting:**
- Both Application.js and driveMonitor.gs triggers use the same Block Kit formatters
- Consistent message appearance whether triggered manually or automatically

---

## 🔗 Functions Used from driveMonitor.gs

1. **`aggregateDailyChangesFromSheet(dateStr)`** - Gets daily change data from log sheet
2. **`aggregateWeeklyChangesFromSheet(startDateStr, endDateStr)`** - Gets weekly change data
3. **`formatDailySummaryBlockKit(summary, sheetUrl, dateStr)`** - Formats daily summary as Block Kit
4. **`formatWeeklySummaryBlockKit(summary, sheetUrl, weekRange)`** - Formats weekly summary as Block Kit
5. **`sendDailySummaryToSlack(blocks, slackWebhookUrl, targetChannel)`** - Sends Block Kit to Slack

---

## 🔗 Helper Functions Used from utils.gs

1. **`getLogSheetUrl()`** - Gets the URL of the log sheet

---

## 🧪 Testing

### **Test Daily Summary:**
1. Open dashboard
2. Click "Send Summary" card
3. Select "Daily Summary"
4. Check Slack for Block Kit formatted message

### **Test Weekly Summary:**
1. Open dashboard
2. Click "Send Summary" card
3. Select "Weekly Summary"
4. Check Slack for Block Kit formatted message

---

## 📝 Notes

- Block Kit format provides better formatting than Legacy Attachments
- Summary data is now stored in Script Properties for the Latest Summary panel
- Both summaries use actual data from the Artefact Change Log sheet
- The visual separator line was NOT added to Block Kit (since it doesn't support colored borders), but the Block Kit format is rich and professional
