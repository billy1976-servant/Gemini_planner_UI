# Push Notification Setup Guide

## Overview
This implementation provides comprehensive push notification support for your HiClarify app, including habit reminders, streak achievements, and relationship updates.

## KEYS

<!-- Public Key:
BPPVgwRdb1u5Gi-TUg-d36BTnyNEhZKckv7nlXBgj_bd4RbbLCcfnGZIpJe3r6NZCFPiaSn8VVmBP1nQqc28ui4

Private Key:
aPqEfiZT-r4q5UzV-gGmryd9w31vo4kV439ZoVIjiUI -->

## Database Schema

### Required Supabase Tables

1. **push_subscriptions**
```sql
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

2. **notification_preferences**
```sql
CREATE TABLE notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{
    "habitReminders": true,
    "streakAlerts": true,
    "weeklyReports": false,
    "relationshipUpdates": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

3. **notification_logs** (Optional - for tracking sent notifications)
```sql
CREATE TABLE notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  error_message TEXT
);
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Client-side environment variables (prefixed with VITE_)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here

# Server-side environment variables (no VITE_ prefix)
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_EMAIL=your-email@example.com
```

**Important Security Note**:
- The `VAPID_PRIVATE_KEY` should NEVER be exposed to the client-side code
- Only the public key should be accessible in the browser
- In Vercel, ensure the private key is only available in serverless functions/API routes

## Backend Implementation

You'll need to implement a backend service to handle the actual push notification sending. Here's an example using Node.js with web-push:

```javascript
// backend/send-notification.js
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendNotification = async (subscription, payload) => {
  try {
    const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Notification sent successfully:', result);
    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendNotification };
```

## Notification Types

### 1. Habit Reminders
- **Trigger**: When habits are due for completion
- **Timing**: Based on user's habit schedule
- **Example**: "Time to complete your 'Morning Exercise' habit!"

### 2. Streak Achievements
- **Trigger**: When reaching streak milestones (7, 14, 30, 60, 100 days)
- **Timing**: After habit completion
- **Example**: "🎉 30-day streak for 'Daily Reading'! Amazing!"

### 3. Weekly Reports
- **Trigger**: Weekly summary of progress
- **Timing**: Every Monday at 9 AM
- **Example**: "This week: 5/7 habits completed, 2 new streaks!"

### 4. Relationship Updates
- **Trigger**: When relationship tasks are due
- **Timing**: Based on campaign schedules
- **Example**: "Don't forget to call John today!"

### 5. Welcome Notifications
- **Trigger**: After first login/setup
- **Timing**: Immediately after setup
- **Example**: "Welcome to HiClarify! Let's start building better habits."

## Usage Examples

### Basic Notification
```javascript
import { sendPushNotification } from './utils/notificationService.js';

await sendPushNotification(userId, {
  title: 'Habit Reminder',
  body: 'Time for your daily exercise!',
  icon: '/icon-192x192.png',
  url: '/habits',
  type: 'habit_reminder'
});
```

### Scheduled Notifications
```javascript
// Set up a cron job or scheduled task
const cron = require('node-cron');

// Daily habit reminders at 8 AM
cron.schedule('0 8 * * *', async () => {
  await sendHabitReminders();
});

// Weekly reports every Monday at 9 AM
cron.schedule('0 9 * * 1', async () => {
  await sendWeeklyReports();
});
```

## Integration Points

### In your App.jsx
```jsx
import NotificationSettings from './components/NotificationSettings.js';

// Add to your navigation or settings
<button onClick={() => setShowNotificationSettings(true)}>
  Notification Settings
</button>

{showNotificationSettings && (
  <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
)}
```

### In your habit completion logic
```javascript
// After marking a habit as complete
const result = await sendPushNotification(user.id, {
  title: 'Habit Completed! 🎉',
  body: `Great job completing "${habit.name}"!`,
  type: 'habit_completed',
  url: '/overview'
});
```

## Testing

1. **Local Testing**: Use browser dev tools to test service worker registration
2. **Permission Testing**: Test notification permission flow
3. **Notification Testing**: Send test notifications via browser console
4. **Subscription Testing**: Verify subscriptions are stored in Supabase

## Browser Support

- ✅ Chrome 42+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Safari 16+
- ❌ Internet Explorer (not supported)

## Security Considerations

1. **VAPID Keys**: Keep private keys secure, never expose in frontend
2. **Subscription Data**: Store securely, consider encryption for sensitive data
3. **Rate Limiting**: Implement rate limiting for notification sending
4. **User Consent**: Always respect user's notification preferences

## Troubleshooting

### Common Issues:

1. **Service Worker Not Registering**: Check browser console for errors
2. **Permission Denied**: User must grant permission first
3. **Notifications Not Showing**: Check if service worker is active
4. **VAPID Keys Invalid**: Ensure keys are correctly generated

### Debugging:
```javascript
// Check service worker status
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service workers:', registrations);
});

// Check notification permission
console.log('Notification permission:', Notification.permission);

// Check push subscription
navigator.serviceWorker.ready.then(registration => {
  registration.pushManager.getSubscription().then(subscription => {
    console.log('Push subscription:', subscription);
  });
});
```

## Next Steps

1. Set up your backend notification service
2. Generate and configure VAPID keys
3. Create the required Supabase tables
4. Test the notification flow end-to-end
5. Implement scheduling for automated notifications
6. Add analytics for notification engagement
