import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  // Get client IDs from app config
  const googleConfig = Constants.expoConfig?.extra?.googleAuth;
  
  if (!googleConfig) {
    throw new Error('Google auth configuration not found in app config');
  }

  // Select the appropriate client ID based on platform
  const getClientId = () => {
    switch (Platform.OS) {
      case 'ios':
        return googleConfig.iosClientId;
      case 'android':
        return googleConfig.androidClientId;
      default:
        return googleConfig.webClientId;
    }
  };

  const clientId = getClientId();
  
  console.log('Google OAuth Debug:');
  console.log('Platform:', Platform.OS);
  console.log('Client ID:', clientId);
  
  // Use Google's useIdTokenAuthRequest with the correct iOS redirect URI
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: clientId,
    scopes: ['openid', 'profile', 'email'],
    // Specify the correct client ID for the platform
    iosClientId: Platform.OS === 'ios' ? clientId : undefined,
    androidClientId: Platform.OS === 'android' ? clientId : undefined,
    webClientId: Platform.OS === 'web' ? clientId : googleConfig.webClientId,
    // Force the correct iOS redirect URI format from the plist
    ...(Platform.OS === 'ios' && {
      redirectUri: 'com.googleusercontent.apps.459247012471-a043kaeklmp17h1gemhhkp533aej0mvi:/'
    }),
  });

  // Log the actual redirect URI being used
  console.log('Request object:', request);
  if (request?.redirectUri) {
    console.log('ACTUAL REDIRECT URI BEING USED:', request.redirectUri);
  }

  const signInWithGoogle = async () => {
    try {
      if (!request) {
        throw new Error('Google auth request not ready');
      }

      const result = await promptAsync();
      console.log('Google auth result:', result.type);
      
      if (result.type === 'success') {
        console.log('Auth success, checking response:', result.params);
        
        // Check if we got an ID token directly
        if (result.params.id_token) {
          console.log('Successfully received ID token');
          return result.params.id_token;
        }
        
        // Check if we got an authorization code that needs to be exchanged
        if (result.params.code) {
          console.log('Received authorization code, sending to backend');
          console.log('Authorization code:', result.params.code);
          console.log('Redirect URI used in request:', request?.redirectUri);
          console.log('Code verifier for PKCE:', request?.codeVerifier);
          
          // Return the code, redirect URI, and code verifier for PKCE
          return {
            code: result.params.code,
            redirectUri: request?.redirectUri,
            codeVerifier: request?.codeVerifier
          };
        }
        
        console.error('No ID token or authorization code in response:', result.params);
        throw new Error('No valid authentication token received from Google');
      } else if (result.type === 'cancel') {
        throw new Error('Google sign in was cancelled');
      } else {
        console.error('Google sign in failed:', result);
        throw new Error('Google sign in failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    isReady: !!request,
  };
};