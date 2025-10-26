# Fixed Login Redirect Issue

## Problem Identified

From console logs:
```
Redirecting to register page: https://n-nrsy4boz47wc6owvzy6dho4rjmlb52uhxty3aai-0lu-script.googleusercontent.com/userCodeAppPanel?v=register
```

The redirect was using `window.location.origin` which pointed to the Apps Script editor URL, not the web app URL.

AuthAPI was returning the correct base URL:
```
"redirectUrl": "https://script.google.com/macros/s/AKfycbyK9o__djKQZD2FBh5zLG5VWxdt9ZEtaT8x1TRZoNQ/dev?authToken=sess_test_..."
```

But it had `?authToken=...` which we don't need for routing.

## Solution

Updated `login.html` to:

1. **Extract base URL from AuthAPI response**:
   - Use `new URL(result.redirectUrl)` to parse the URL
   - Extract `url.origin + url.pathname` to get clean base URL
   - This removes any query parameters like `?authToken=...`

2. **Build clean redirect URL**:
   - Append `?v=register` to the base URL
   - Result: `https://script.google.com/macros/s/.../dev?v=register`

## Changes Made

### File: `src/presentation/web/login.html`

**In `handleSSOSuccess()`**:
```javascript
// Get base URL - remove any existing query params from redirectUrl
let baseUrl;
if (result.redirectUrl) {
    // Extract base URL (remove ?authToken=... if present)
    const url = new URL(result.redirectUrl);
    baseUrl = url.origin + url.pathname;
} else {
    baseUrl = window.location.origin + window.location.pathname;
}

// Redirect to register page using simple routing
const registerUrl = baseUrl + '?v=register';
```

**In `handleManualSuccess()`**:
- Same logic applied for manual login

## Expected Behavior

1. User logs in successfully
2. AuthAPI returns: `https://script.google.com/macros/s/.../dev?authToken=sess_...`
3. Code extracts base URL: `https://script.google.com/macros/s/.../dev`
4. Appends routing: `?v=register`
5. Final redirect: `https://script.google.com/macros/s/.../dev?v=register`
6. WebAppService.js serves the register page

## Files to Upload to Apps Script

1. `WebAppService.js` - Already updated with simple routing
2. `login.html` - Now extracts base URL correctly
3. `register.html` - Already exists and ready

## Testing

After uploading files to Apps Script:
1. Visit web app URL
2. Click "Sign in with Google"
3. Verify redirect to register page (not blank)
4. Check URL is: `https://script.google.com/macros/s/.../dev?v=register`
