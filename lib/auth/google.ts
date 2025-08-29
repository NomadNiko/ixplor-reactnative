import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useMemo } from 'react';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  // Get iOS client ID from app config
  const googleConfig = Constants.expoConfig?.extra?.googleAuth;

  if (!googleConfig?.iosClientId) {
    throw new Error('iOS Google client ID not found in app config');
  }

  const iosClientId = googleConfig.iosClientId;

  // Memoize the auth request configuration to prevent recreation on every render
  const authConfig = useMemo(() => ({
    clientId: iosClientId,
    iosClientId: iosClientId,
    scopes: ['openid', 'profile', 'email'],
    // Use the iOS redirect URI that matches our client ID
    redirectUri: 'com.googleusercontent.apps.459247012471-gqobrul26a9fbg0jf1525kp7urv6ctpf:/',
  }), [iosClientId]);

  // Use Google's useIdTokenAuthRequest for iOS
  const [request, , promptAsync] = Google.useIdTokenAuthRequest(authConfig);

  // Only log once when request is ready (not on every render)
  useMemo(() => {
    if (request) {
      console.log('🔐 Google Auth initialized:', {
        clientId: iosClientId.substring(0, 12) + '...',
        redirectUri: request.redirectUri,
        ready: true,
      });
    }
  }, [request, iosClientId]);

  const signInWithGoogle = async () => {
    try {
      if (!request) {
        throw new Error('Google auth request not ready');
      }

      console.log('🚀 Starting Google authentication...');

      const result = await promptAsync();

      if (result.type === 'success') {
        // Priority 1: Try ID token first (most direct flow)
        if (result.params.id_token) {
          console.log('✅ Google auth successful (ID token)');
          return result.params.id_token;
        }

        // Priority 2: Authorization code flow (PKCE)
        if (result.params.code) {
          console.log('✅ Google auth successful (PKCE flow)');
          return {
            code: result.params.code,
            redirectUri: request.redirectUri,
            codeVerifier: request.codeVerifier,
          };
        }

        // No valid token received
        console.error('❌ No valid token in Google response:', Object.keys(result.params));
        throw new Error('No valid authentication token received from Google');
      } else if (result.type === 'cancel') {
        console.log('❌ Google sign-in cancelled by user');
        throw new Error('Google sign in was cancelled');
      } else {
        console.error('❌ Google sign-in failed:', result.type);
        throw new Error(`Google sign in failed: ${result.type}`);
      }
    } catch (error) {
      console.error('❌ Google auth error:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    isReady: !!request,
  };
};
