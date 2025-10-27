# Anonymous/Incognito User Handling

## ✅ Problem Identified

When accessing the dashboard in **incognito mode** or without a Google session, the user was displayed as **"authenticated-user"** instead of being handled properly.

## 🔧 Solution Implemented

### **Updated `getUserInfo()` in DashboardAPI.js**

Now the function:
1. ✅ **Attempts to get Google session email**
2. ✅ **Detects when no session is available** (incognito/anonymous)
3. ✅ **Creates an anonymous user ID** for tracking
4. ✅ **Displays "Anonymous User"** as the name
5. ✅ **Uses ghost emoji** (👻) for anonymous users
6. ✅ **Marks status as 'anonymous'**

### **Code Changes:**

```javascript
// Get ACTUAL current user from Google Apps Script session
let actualUserEmail = '';
try {
  actualUserEmail = Session.getActiveUser().getEmail();
} catch (error) {
  this._logger.log('Could not get active user email: ' + error.message);
}

// If still no email, treat as anonymous/incognito user
if (!finalUserEmail || finalUserEmail === '' || !finalUserEmail.includes('@')) {
  // Create anonymous user for incognito/anonymous access
  const anonymousId = 'anonymous-' + Date.now();
  finalUserEmail = anonymousId + '@anonymous.local';
  this._logger.log('No active user session - creating anonymous user: ' + finalUserEmail);
}

// Extract name (check if anonymous)
if (userDomain === 'anonymous.local') {
  userName = 'Anonymous User';
  avatar = '👻';
  status = 'anonymous';
}
```

---

## 🎯 User Experience

### **Incognito Mode:**

**Before:**
- Dashboard showed: "authenticated-user"
- Unclear what this meant

**After:**
- Dashboard shows: **"Anonymous User"** 👻
- Email: `anonymous-[timestamp]@anonymous.local`
- Role: **USER** (non-admin, read-only access)
- Status: **anonymous**

### **Normal Browser (Logged in):**
- Dashboard shows: **real name** (e.g., "rex.gyasi")
- Email: **real email** (e.g., "rex.gyasi@iress.com")
- Role: Admin or User (based on `adminEmails` config)
- Status: **active**

---

## 🧪 Testing

### Test Incognito Mode:
1. Open incognito/private browser window
2. Navigate to dashboard
3. **Expected:**
   - Shows "Anonymous User" 👻
   - Shows anonymous email
   - **USER** badge (not ADMIN)
   - Can view Monitoring, Triggers, Send Summary (read-only)
   - Cannot access System, Notifications, Users

### Test Normal Browser:
1. Open normal browser (logged into Google)
2. Navigate to dashboard
3. **Expected:**
   - Shows real name
   - Shows real email
   - ADMIN or USER badge based on config
   - Full access if admin

---

## 📝 Notes

### Why "anonymous.local"?
- `.local` is a reserved TLD for local network domains
- Not a valid public domain
- Clear indicator this is an anonymous/incognito user
- Example: `anonymous-1761600000000@anonymous.local`

### Why Different Avatar?
- 👻 ghost emoji = anonymous user
- 👤 person emoji = real user
- Visual distinction for quick identification

### Anonymous User Permissions:
- ✅ Can view Monitoring (read-only)
- ✅ Can view Triggers (read-only)
- ✅ Can send summaries to Slack
- ❌ Cannot edit any settings
- ❌ Cannot access System/Notifications/Users
- ❌ Cannot gain admin status

### Expected Behavior:
- In incognito mode, you get limited read-only access
- This is expected since there's no Google session to authenticate
- Anonymous users get minimal permissions for security

