const config = {
    development: {
        apiUrl: 'http://localhost:3000'
    },
    production: {
        apiUrl: 'https://your-notification-server.herokuapp.com' // We'll need to set this up
    }
};

// Determine environment based on URL
const isProduction = window.location.hostname !== 'localhost';
const currentConfig = isProduction ? config.production : config.development;

export default currentConfig;
