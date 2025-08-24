// Example authentication configuration file
// Copy this file to auth.config.js and replace with your actual values
// DO NOT commit auth.config.js to version control
module.exports = {
  // EAS Project ID from Expo Application Services
  easProjectId: "your-eas-project-id-here",
  
  googleAuth: {
    // Google OAuth Client IDs from Google Cloud Console
    // https://console.developers.google.com/
    webClientId: "your-web-client-id.apps.googleusercontent.com",
    iosClientId: "your-ios-client-id.apps.googleusercontent.com", 
    androidClientId: "your-android-client-id.apps.googleusercontent.com"
  },
  
  apiConfig: {
    // API base URL for your backend server
    baseUrl: "https://your-api-server.com/api"
  }
};