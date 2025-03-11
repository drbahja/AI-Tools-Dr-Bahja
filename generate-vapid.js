const webpush = require('web-push');
const fs = require('fs');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

// Create .env file with the keys
const envContent = `
VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"
VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"
VAPID_SUBJECT="mailto:drmohammedbahja@gmail.com"
`;

fs.writeFileSync('.env', envContent.trim());

console.log('VAPID keys have been generated and saved to .env file');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
