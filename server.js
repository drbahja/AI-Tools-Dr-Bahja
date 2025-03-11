require('dotenv').config();
const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const schedule = require('node-schedule');
const config = require('./config');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Store subscriptions and scheduled notifications (in a real app, you'd use a database)
let subscriptions = [];
let notificationHistory = [];
let scheduledNotifications = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === config.adminUser && password === config.adminPassword) {
    const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Public endpoints
app.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  console.log('Received subscription:', subscription);
  
  // Check if subscription already exists
  const exists = subscriptions.some(sub => 
    sub.endpoint === subscription.endpoint
  );
  
  if (!exists) {
    subscriptions.push(subscription);
    console.log('New subscription added. Total subscriptions:', subscriptions.length);
  } else {
    console.log('Subscription already exists');
  }
  
  res.status(201).json({});
});

// Protected endpoints
app.get('/subscriber-count', authenticateToken, (req, res) => {
  res.json({ count: subscriptions.length });
});

app.post('/send-notification', authenticateToken, async (req, res) => {
  const { type, title, message, timestamp, schedule: scheduleTime } = req.body;
  console.log('Sending notification:', { type, title, message });
  console.log('Current subscriptions:', subscriptions.length);
  
  const notificationPayload = {
    title: title || 'Update from Dr. Bahja',
    body: message,
    icon: 'images/profile.jpg',
    badge: 'images/profile.jpg',
    data: {
      type,
      timestamp
    }
  };

  // If schedule time is provided, schedule the notification
  if (scheduleTime) {
    const scheduledTime = new Date(scheduleTime);
    if (scheduledTime > new Date()) {
      console.log('Scheduling notification for:', scheduledTime);
      const job = schedule.scheduleJob(scheduledTime, async () => {
        await sendNotificationToAll(notificationPayload);
        // Remove from scheduled notifications after sending
        scheduledNotifications = scheduledNotifications.filter(n => n.id !== job.name);
      });

      scheduledNotifications.push({
        id: job.name,
        payload: notificationPayload,
        scheduledTime,
      });

      return res.json({ 
        message: 'Notification scheduled successfully',
        scheduledTime
      });
    }
  }

  // Send immediately if no schedule time
  try {
    console.log('Sending immediate notification to all subscribers');
    const result = await sendNotificationToAll(notificationPayload);
    console.log('Notification result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Helper function to send notifications to all subscribers
async function sendNotificationToAll(payload) {
  const failedSubscriptions = [];
  let successCount = 0;
  
  console.log(`Attempting to send to ${subscriptions.length} subscribers`);
  
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      console.log('Sending to subscription:', subscription.endpoint);
      await webpush.sendNotification(
        subscription, 
        JSON.stringify(payload)
      );
      successCount++;
      console.log('Successfully sent to:', subscription.endpoint);
    } catch (error) {
      console.error('Error sending to subscription:', subscription.endpoint, error);
      failedSubscriptions.push(subscription);
    }
  }));

  // Remove failed subscriptions
  const originalCount = subscriptions.length;
  subscriptions = subscriptions.filter(
    sub => !failedSubscriptions.some(failedSub => failedSub.endpoint === sub.endpoint)
  );
  console.log(`Removed ${originalCount - subscriptions.length} invalid subscriptions`);

  // Store in history
  notificationHistory.unshift({
    ...payload,
    recipientCount: subscriptions.length,
    timestamp: new Date().toISOString()
  });
  
  if (notificationHistory.length > 50) {
    notificationHistory.pop();
  }

  return { 
    message: 'Notifications sent successfully',
    successCount: successCount,
    failureCount: failedSubscriptions.length
  };
}

// Get scheduled notifications
app.get('/scheduled-notifications', authenticateToken, (req, res) => {
  res.json(scheduledNotifications);
});

// Cancel scheduled notification
app.delete('/scheduled-notifications/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const job = schedule.scheduledJobs[id];
  
  if (job) {
    job.cancel();
    scheduledNotifications = scheduledNotifications.filter(n => n.id !== id);
    res.json({ message: 'Notification cancelled successfully' });
  } else {
    res.status(404).json({ error: 'Scheduled notification not found' });
  }
});

// Get notification history
app.get('/notification-history', authenticateToken, (req, res) => {
  res.json(notificationHistory.slice(0, 10));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
