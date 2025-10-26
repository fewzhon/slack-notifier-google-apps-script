# Google Apps Script Debug Guide

## 403 Error When Accessing Dashboard

The 403 error indicates Apps Script can't serve the dashboard. This is likely due to:

1. **Template syntax issues** - `<?=` and `<?!=` need to reference a global function
2. **Asset loading failures** - Missing files or incorrect paths
3. **Deployment issues** - Wrong execution permissions

## Test Functions Added to WebAppService.js

### 1. testDoGetWithAuthToken()
Tests if `doGet()` works with an authToken parameter:
```javascript
// Run this in Apps Script
testDoGetWithAuthToken()
```

### 2. testIncludeAssets()
Tests if asset files can be loaded:
```javascript
// Run this in Apps Script
testIncludeAssets()
```

### 3. testConfigDashboardTemplate()
Tests if configDashboard template can be evaluated:
```javascript
// Run this in Apps Script
testConfigDashboardTemplate()
```

## Recommended Debug Flow

1. **Upload all files** to Apps Script (including HTML files in assets/)
2. **Run `testIncludeAssets()`** - Verify files exist
3. **Run `testConfigDashboardTemplate()`** - Verify template works
4. **Run `testDoGetWithAuthToken()`** - Verify doGet works
5. **Check execution logs** in Apps Script
6. **Try accessing web app** with authToken

## Important Notes

- Files MUST be uploaded to Apps Script
- Paths in HTML must match uploaded filenames in Apps Script
- The `include()` function is now the standard way to include assets
- All HTML files need to be in Apps Script (including those in assets/)

## Current File Structure in Apps Script Should Be:

```
Your Script Files:
├── login
├── configDashboard  
├── modern-ui-css (or assets/css/modern-ui-css)
├── dashboard-js (or assets/js/dashboard-js)
├── modern-ui-js (or assets/js/modern-ui-js)
└── WebAppService.js

(Note: Apps Script doesn't support folders, so either flatten or name files with path prefixes)

## Changes Made

1. ✅ Changed `<?!= includeAsset()` to `<?!= include()` in configDashboard.html
2. ✅ Updated paths to use 'assets/css/' and 'assets/js/' prefixes
3. ✅ Added `include()` function with error handling
4. ✅ Added test functions for debugging
5. ✅ Fixed IIFE scope issue in login.html (exported functions to window)

## Next Steps

1. Upload these files to Apps Script with their exact names:
   - `configDashboard.html` → Upload as "configDashboard"
   - `assets/css/modern-ui-css.html` → Upload as "assets/css/modern-ui-css"
   - `assets/js/dashboard-js.html` → Upload as "assets/js/dashboard-js"
   - `assets/js/modern-ui-js.html` → Upload as "assets/js/modern-ui-js"

2. Run the test functions in Apps Script

3. Check the execution logs

4. Try accessing the web app again
