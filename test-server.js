const express = require('express');
const webpush = require('web-push');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();
console.log('VAPID Keys:', vapidKeys);

// Configure web-push
webpush.setVapidDetails(
  'mailto:drmohammedbahja@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

let subscription = null;

// Add endpoint to get VAPID public key
app.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/subscribe', (req, res) => {
  subscription = req.body;
  console.log('Received subscription:', subscription);
  res.status(201).json({});
});

app.post('/send', (req, res) => {
  if (!subscription) {
    return res.status(400).json({ error: 'No subscription found' });
  }

  const payload = JSON.stringify({
    title: 'Test Notification',
    body: 'This is a test notification from the server'
  });

  webpush.sendNotification(subscription, payload)
    .then(() => {
      console.log('Notification sent successfully');
      res.json({ success: true });
    })
    .catch(error => {
      console.error('Error sending notification:', error);
      res.status(500).json({ error: error.message });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Public Key:', vapidKeys.publicKey);
});
