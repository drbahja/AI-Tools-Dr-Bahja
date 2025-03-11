console.log('Service Worker loaded');

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
});

self.addEventListener('push', function(event) {
  console.log('Push message received:', event.data?.text());
  
  try {
    const notification = event.data.json();
    console.log('Notification data:', notification);
    
    const options = {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      data: notification.data,
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'view',
          title: 'View Update'
        }
      ]
    };

    console.log('Showing notification with options:', options);
    event.waitUntil(
      self.registration.showNotification(notification.title, options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
    // Fallback to simple notification if JSON parsing fails
    const options = {
      body: event.data.text(),
      icon: 'images/profile.jpg',
      badge: 'images/profile.jpg',
      vibrate: [100, 50, 100]
    };
    event.waitUntil(
      self.registration.showNotification('New Update', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification.title);
  event.notification.close();

  if (event.action === 'view') {
    console.log('View action clicked, opening window');
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
