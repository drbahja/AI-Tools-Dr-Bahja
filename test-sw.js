console.log('Service Worker Loading');

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting(); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    // Become available to all pages
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
    console.log('Push received:', event.data?.text());

    const options = {
        body: 'This is a test notification',
        icon: 'images/profile.jpg',
        badge: 'images/profile.jpg',
        vibrate: [100, 50, 100]
    };

    try {
        const data = event.data.json();
        console.log('Notification data:', data);
        event.waitUntil(
            self.registration.showNotification(data.title, {
                ...options,
                body: data.body
            })
        );
    } catch (error) {
        console.error('Error showing notification:', error);
        event.waitUntil(
            self.registration.showNotification('Test Notification', options)
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked');
    event.notification.close();
});
