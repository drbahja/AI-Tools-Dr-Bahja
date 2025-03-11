require('dotenv').config();

module.exports = {
  adminUser: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'your-secure-password',
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key'
};
